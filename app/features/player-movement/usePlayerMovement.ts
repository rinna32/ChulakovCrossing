import * as THREE from 'three'

// Скорость перемещения игрока, метров в секунду
const MOVE_SPEED = 3

// ── Параметры орбитальной камеры (3-е лицо, как в реальных играх) ──
const CAMERA_DISTANCE = 6.4 // на каком расстоянии камера висит от игрока
const CAMERA_LOOK_HEIGHT = 1.2 // высота точки, на которую смотрит камера (≈ грудь героя)
const CAMERA_INITIAL_PITCH = 0.5 // стартовый наклон камеры (рад): 0 = горизонт, больше = взгляд сверху
const CAMERA_MIN_PITCH = 0.45 // нельзя опустить камеру слишком к горизонту (иначе видно "за стены")
const CAMERA_MAX_PITCH = 1.25 // нельзя задрать выше "вид почти сверху"
const MOUSE_SENSITIVITY = 0.0025 // чувствительность вращения камеры мышью
const CAMERA_SMOOTHNESS = 14 // плавность следования камеры (больше = быстрее догоняет, меньше отставание)

// ── Коллизия камеры (чтобы камера не пролезала сквозь стены, как в Genshin) ──
const CAMERA_MIN_DISTANCE = 1.2 // ближе этого камера к игроку не подъедет
const CAMERA_COLLISION_PADDING = 0.3 // на сколько отступить от стены, в которую упёрлась камера
const CAMERA_MIN_HEIGHT = 0.6 // камера не опускается ниже этой высоты (не уходит под пол)

// Границы перемещения (мировые координаты XZ). Игрок и камера не выходят за них.
export interface MovementBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// Хук управления игроком: WASD/стрелки двигают героя относительно камеры,
// мышь вращает орбитальную камеру вокруг него.
// domElement — канвас (для захвата мыши), bounds — границы комнаты,
// collider — объект офиса, об который камера будет "спотыкаться" (коллизия).
export function usePlayerMovement(
  player: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
  bounds?: MovementBounds,
  collider?: THREE.Object3D
) {
  // Состояние нажатых клавиш
  const keys = {
    forward: false, // W / ArrowUp
    backward: false, // S / ArrowDown
    left: false, // A / ArrowLeft
    right: false, // D / ArrowRight
  }

  // Углы орбитальной камеры:
  // yaw — поворот вокруг игрока по горизонтали, pitch — наклон по вертикали
  let cameraYaw = 0
  let cameraPitch = CAMERA_INITIAL_PITCH

  // ── Клавиатура ──
  function onKeyDown(event: KeyboardEvent) {
    // Если это одна из наших клавиш — гасим стандартное поведение браузера
    // (стрелки и пробел иначе прокручивают страницу, и по краям лезут белые полосы)
    if (setKeyState(event.code, true)) event.preventDefault()
  }
  function onKeyUp(event: KeyboardEvent) {
    setKeyState(event.code, false)
  }
  // Возвращает true, если клавиша относится к управлению (тогда её нужно "перехватить")
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

  // ── Мышь: зажать ЛКМ и тянуть = вращать камеру ──
  // Намеренно НЕ используем pointer lock (захват курсора): он капризен в Safari
  // и оставляет курсор невидимым после Esc. Drag-вращение работает везде и курсор виден.
  let isDragging = false

  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return // только левая кнопка
    isDragging = true
    domElement.style.cursor = 'grabbing'
  }
  function onMouseUp() {
    isDragging = false
    domElement.style.cursor = 'grab'
  }
  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return
    // movementX/Y — смещение мыши с прошлого события (работает и без pointer lock)
    cameraYaw -= event.movementX * MOUSE_SENSITIVITY
    cameraPitch += event.movementY * MOUSE_SENSITIVITY
    cameraPitch = Math.max(CAMERA_MIN_PITCH, Math.min(CAMERA_MAX_PITCH, cameraPitch))
  }

  domElement.style.cursor = 'grab' // подсказываем, что сцену можно "схватить"

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  domElement.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)

  // Двигается ли игрок прямо сейчас — по этому флагу включаем анимацию ходьбы модели
  let moving = false

  // Переиспользуемые объекты — чтобы не создавать новые каждый кадр
  const forwardDir = new THREE.Vector3()
  const rightDir = new THREE.Vector3()
  const moveDir = new THREE.Vector3()
  const lookTarget = new THREE.Vector3() // точка, на которую смотрит камера
  const desiredCameraPosition = new THREE.Vector3()
  const camDir = new THREE.Vector3() // направление от игрока к камере
  const raycaster = new THREE.Raycaster()

  // Пауза управления (включается, когда открыт диалог миссии): игрок не ходит
  let paused = false
  function setPaused(value: boolean) {
    paused = value
  }

  // Удерживаем позицию игрока внутри комнаты
  function clampToBounds(pos: THREE.Vector3) {
    if (!bounds) return
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x))
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z))
  }

  // Вызывается каждый кадр игрового цикла с delta-time (в секундах)
  function update(delta: number) {
    // Направления "вперёд"/"вправо" зависят от поворота камеры (yaw) —
    // движение всегда относительно того, куда смотрит камера, как в реальных играх.
    forwardDir.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
    rightDir.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))

    moveDir.set(0, 0, 0)
    // На паузе клавиши движения игнорируем (камера при этом продолжает следить за игроком)
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
      player.rotation.y = Math.atan2(moveDir.x, moveDir.z) // лицом по ходу движения
    }

    // Жёстко держим игрока в пределах комнаты (каждый кадр, на всякий случай)
    clampToBounds(player.position)

    // ── Желаемая позиция камеры по сферическим координатам вокруг игрока ──
    lookTarget.set(player.position.x, player.position.y + CAMERA_LOOK_HEIGHT, player.position.z)
    const horizontal = Math.cos(cameraPitch) * CAMERA_DISTANCE
    desiredCameraPosition.set(
      player.position.x + Math.sin(cameraYaw) * horizontal,
      player.position.y + Math.sin(cameraPitch) * CAMERA_DISTANCE,
      player.position.z + Math.cos(cameraYaw) * horizontal
    )

    // ── Коллизия камеры: луч от героя к желаемой позиции камеры ──
    // Если между героем и камерой есть стена — придвигаем камеру к этой стене,
    // чтобы она не пролезала наружу (поведение как в Genshin при беге на стену).
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

    // ── Не выпускаем камеру за стены комнаты и под пол ──
    clampToBounds(desiredCameraPosition)
    if (desiredCameraPosition.y < CAMERA_MIN_HEIGHT) desiredCameraPosition.y = CAMERA_MIN_HEIGHT

    // Плавно интерполируем позицию камеры к желаемой (lerp по delta-time)
    const lerpFactor = 1 - Math.exp(-CAMERA_SMOOTHNESS * delta)
    camera.position.lerp(desiredCameraPosition, lerpFactor)
    camera.lookAt(lookTarget)
  }

  // Снимаем все слушатели при размонтировании
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
