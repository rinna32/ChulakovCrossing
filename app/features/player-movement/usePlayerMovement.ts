import * as THREE from 'three'

const MOVE_SPEED = 3 // м/с

// Орбитальная камера от 3-го лица
const CAMERA_DISTANCE = 6.4
const CAMERA_LOOK_HEIGHT = 1.2 // точка, на которую смотрит камера (≈ грудь героя)
const CAMERA_INITIAL_PITCH = 0.5
const CAMERA_MIN_PITCH = 0.45 // ниже — видно «за стены»
const CAMERA_MAX_PITCH = 1.25
const MOUSE_SENSITIVITY = 0.0025
const CAMERA_SMOOTHNESS = 14

// Коллизия камеры (как в Genshin: не пролезает сквозь стены)
const CAMERA_MIN_DISTANCE = 1.2
const CAMERA_COLLISION_PADDING = 0.3
const CAMERA_MIN_HEIGHT = 0.6

export interface MovementBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// WASD/стрелки двигают героя относительно камеры, мышь (зажатая ЛКМ) вращает камеру.
// collider — офис, об который «спотыкается» камера.
export function usePlayerMovement(
  player: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
  bounds?: MovementBounds,
  collider?: THREE.Object3D
) {
  const keys = { forward: false, backward: false, left: false, right: false }

  let cameraYaw = 0
  let cameraPitch = CAMERA_INITIAL_PITCH

  function onKeyDown(event: KeyboardEvent) {
    // preventDefault, чтобы стрелки/пробел не скроллили страницу
    if (setKeyState(event.code, true)) event.preventDefault()
  }
  function onKeyUp(event: KeyboardEvent) {
    setKeyState(event.code, false)
  }
  // Возвращает true, если клавиша — управляющая
  function setKeyState(code: string, isPressed: boolean): boolean {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = isPressed
        return true
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = isPressed
        return true
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = isPressed
        return true
      case 'KeyD':
      case 'ArrowRight':
        keys.right = isPressed
        return true
      default:
        return false
    }
  }

  // Вращение камеры через drag, а не pointer lock: pointer lock капризен в Safari
  // и прячет курсор после Esc.
  let isDragging = false
  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return
    isDragging = true
    domElement.style.cursor = 'grabbing'
  }
  function onMouseUp() {
    isDragging = false
    domElement.style.cursor = 'grab'
  }
  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return
    cameraYaw -= event.movementX * MOUSE_SENSITIVITY
    cameraPitch += event.movementY * MOUSE_SENSITIVITY
    cameraPitch = Math.max(CAMERA_MIN_PITCH, Math.min(CAMERA_MAX_PITCH, cameraPitch))
  }

  domElement.style.cursor = 'grab'
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  domElement.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)

  let moving = false // для анимации ходьбы

  // Переиспользуем векторы, чтобы не аллоцировать каждый кадр
  const forwardDir = new THREE.Vector3()
  const rightDir = new THREE.Vector3()
  const moveDir = new THREE.Vector3()
  const lookTarget = new THREE.Vector3()
  const desiredCameraPosition = new THREE.Vector3()
  const camDir = new THREE.Vector3()
  const raycaster = new THREE.Raycaster()

  let paused = false // на время диалога
  function setPaused(value: boolean) {
    paused = value
  }

  function clampToBounds(pos: THREE.Vector3) {
    if (!bounds) return
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x))
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z))
  }

  function update(delta: number) {
    // «Вперёд»/«вправо» зависят от поворота камеры — движение относительно неё
    forwardDir.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
    rightDir.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))

    moveDir.set(0, 0, 0)
    if (!paused) {
      if (keys.forward) moveDir.add(forwardDir)
      if (keys.backward) moveDir.sub(forwardDir)
      if (keys.right) moveDir.add(rightDir)
      if (keys.left) moveDir.sub(rightDir)
    }

    moving = moveDir.lengthSq() > 0
    if (moving) {
      moveDir.normalize() // чтобы по диагонали не было быстрее
      player.position.x += moveDir.x * MOVE_SPEED * delta
      player.position.z += moveDir.z * MOVE_SPEED * delta
      player.rotation.y = Math.atan2(moveDir.x, moveDir.z) // лицом по ходу
    }

    clampToBounds(player.position)

    // Желаемая позиция камеры по сфере вокруг игрока
    lookTarget.set(player.position.x, player.position.y + CAMERA_LOOK_HEIGHT, player.position.z)
    const horizontal = Math.cos(cameraPitch) * CAMERA_DISTANCE
    desiredCameraPosition.set(
      player.position.x + Math.sin(cameraYaw) * horizontal,
      player.position.y + Math.sin(cameraPitch) * CAMERA_DISTANCE,
      player.position.z + Math.cos(cameraYaw) * horizontal
    )

    // Если между героем и камерой стена — придвигаем камеру к ней
    if (collider) {
      camDir.copy(desiredCameraPosition).sub(lookTarget)
      const fullDist = camDir.length()
      camDir.normalize()
      raycaster.set(lookTarget, camDir)
      raycaster.far = fullDist
      const hits = raycaster.intersectObject(collider, true)
      if (hits.length > 0) {
        const safeDist = Math.max(hits[0].distance - CAMERA_COLLISION_PADDING, CAMERA_MIN_DISTANCE)
        desiredCameraPosition.copy(lookTarget).addScaledVector(camDir, safeDist)
      }
    }

    clampToBounds(desiredCameraPosition)
    if (desiredCameraPosition.y < CAMERA_MIN_HEIGHT) desiredCameraPosition.y = CAMERA_MIN_HEIGHT

    const lerpFactor = 1 - Math.exp(-CAMERA_SMOOTHNESS * delta)
    camera.position.lerp(desiredCameraPosition, lerpFactor)
    camera.lookAt(lookTarget)
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    domElement.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('mousemove', onMouseMove)
    domElement.style.cursor = ''
  }

  return { update, dispose, setPaused, isMoving: () => moving }
}
