<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, onUnmounted, ref } from 'vue'
import { loadGltf } from '~/shared/lib/three/loadGltf'
import { setupLights } from '~/shared/lib/three/setupLights'
import { Character, type CharacterPlacement } from '~/entities/character/Character'
import { usePlayerMovement } from '~/features/player-movement/usePlayerMovement'

// ─────────────────────────────────────────────────────────────
// КОНСТАНТЫ — двигайте эти числа, чтобы расставить модели по-другому
// ─────────────────────────────────────────────────────────────

// Путь к модели офиса (локация)
const OFFICE_URL = '/models/office/scene.gltf'

// Желаемая ширина офиса в метрах (по самой длинной горизонтальной стороне).
// Модель офиса может быть нарисована в каких угодно "сырых" единицах —
// мы автоматически считаем коэффициент масштаба, чтобы офис стал именно такого размера.
const OFFICE_TARGET_WIDTH = 24

// Границы комнаты (мировые координаты), за которые НЕ выпускаем героя и камеру.
// Офис открыт с некоторых сторон (это "диорама"), поэтому авто-границы по
// bounding box не годятся — задаём прямоугольник вручную.
// КАК НАСТРОИТЬ: подойдите героем вплотную к каждой стене, посмотрите x/z на
// индикаторе внизу слева и впишите эти значения сюда.
const ROOM_MIN_X = -8 // левая стена
const ROOM_MAX_X = 8 // правая стена
const ROOM_MIN_Z = -4.5 // задняя стена / стойка (дальше герой не зайдёт)
const ROOM_MAX_Z = 9 // передняя стена (вход)

// Рост персонажей в метрах. У каждой модели (игрок, HR, LeadFrontend, Manager)
// свой "сырой" масштаб экспорта — Character сам подбирает scale так, чтобы
// итоговый рост совпал с этим числом, независимо от исходных единиц модели.
const PLAYER_HEIGHT = 1.75
const NPC_HEIGHT = 1.75
// Высота модели "менеджер спит за столом" (это композиция стол+персонаж, а не рост человека),
// поэтому масштабируем её отдельно. Подберите число, если стол слишком мелкий/крупный.
const MANAGER_DESK_HEIGHT = 2.2

// Позиция игрока при старте игры [x, y, z], в метрах
const PLAYER_START_POSITION: THREE.Vector3Tuple = [0, 0, 7]
// Поворот игрока при старте (рад). Math.PI = лицом вглубь офиса (−Z, к стойке и NPC)
const PLAYER_START_ROTATION = Math.PI

// Список NPC: путь к модели, позиция (метры) и поворот (рад).
// x — влево(−)/вправо(+), z — вперёд к камере(+) / вглубь офиса(−).
const NPC_PLACEMENTS: CharacterPlacement[] = [
  {
    // Стол "менеджер спит за столом" — стоит там, где был игрок (рядом с левой стеной),
    // и заменяет собой персонажа, который тут стоял
    name: 'Manager (спит за столом)',
    url: '/models/manager_sleep/scene.gltf',
    position: [-7.7, 0, 5.7], // место, где стоял гг
    rotationY: Math.PI / 2, // спиной к левой стене (−X), лицом в комнату (+X) — как стоял гг
    targetHeight: MANAGER_DESK_HEIGHT,
    animated: true, // единственная модель с включённой анимацией (сон)
  },
  {
    name: 'LeadFrontend',
    url: '/models/LeadFrontend/scene.gltf',
    position: [4, 0, -3], // оставлен на прежнем месте
    rotationY: -Math.PI / 4,
    targetHeight: NPC_HEIGHT,
  },
  {
    // Вернули обычную модель менеджера на место, где раньше был стол
    name: 'Manager',
    url: '/models/Manager/scene.gltf',
    position: [-5.1, 0, -3.9],
    rotationY: 0, // лицом к лобби/игроку
    targetHeight: NPC_HEIGHT,
  },
]

// ─────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Временный индикатор координат игрока (для удобной расстановки NPC).
// Подойдите героем к нужной точке и считайте x/z внизу экрана — это и есть
// значения для position в NPC_PLACEMENTS. Когда расстановка готова, блок можно удалить.
const playerCoords = ref('x: 0.0  z: 0.0')

let renderer: THREE.WebGLRenderer | null = null
let animationFrameId: number | null = null
let playerMovement: { update: (delta: number) => void; dispose: () => void } | null = null

function handleResize(camera: THREE.PerspectiveCamera) {
  if (!renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(async () => {
  if (!canvasRef.value) return

  // ── Базовая настройка сцены, камеры и рендерера ──
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb) // голубое небо

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 3.2, 5.5)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  // Ограничиваем pixel ratio (на retina-экранах x3 и больше не нужен — только лишняя нагрузка)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true

  setupLights(scene)

  // ── Офис ──
  // Своего пола НЕ создаём: у модели офиса уже есть собственный пол.
  // Если добавить ещё одну плоскость на той же высоте y=0, два пола начинают
  // "мерцать" (z-fighting) — это и выглядит как дрожание экрана при движении.
  const officeGltf = await loadGltf(OFFICE_URL)

  // Считаем габариты офиса ДО масштабирования, чтобы понять, во сколько раз его увеличить/уменьшить
  const officeRawSize = new THREE.Vector3()
  new THREE.Box3().setFromObject(officeGltf.scene).getSize(officeRawSize)
  const officeScale = OFFICE_TARGET_WIDTH / Math.max(officeRawSize.x, officeRawSize.z)

  console.log(
    '[GameScene] office — raw size:',
    `x=${officeRawSize.x.toFixed(2)} y=${officeRawSize.y.toFixed(2)} z=${officeRawSize.z.toFixed(2)}`,
    `→ scale=${officeScale.toFixed(4)} (ширина ${OFFICE_TARGET_WIDTH}м)`
  )

  officeGltf.scene.scale.setScalar(officeScale)
  officeGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.receiveShadow = true
    }
  })
  scene.add(officeGltf.scene)

  // ── Границы комнаты (заданы вручную константами выше) ──
  const movementBounds = {
    minX: ROOM_MIN_X,
    maxX: ROOM_MAX_X,
    minZ: ROOM_MIN_Z,
    maxZ: ROOM_MAX_Z,
  }

  // ── Игрок (используем модель MainCharacter) ──
  const player = new Character({
    name: 'MainCharacter (игрок)',
    url: '/models/MainCharacter/scene.gltf',
    position: PLAYER_START_POSITION,
    rotationY: PLAYER_START_ROTATION,
    targetHeight: PLAYER_HEIGHT,
  })
  await player.load()
  scene.add(player.object)

  // Персонажи с анимацией — их миксеры нужно обновлять каждый кадр
  const animatedCharacters: Character[] = []
  if (player.mixer) animatedCharacters.push(player)

  // ── NPC ──
  for (const placement of NPC_PLACEMENTS) {
    const npc = new Character(placement)
    await npc.load()
    scene.add(npc.object)
    if (npc.mixer) animatedCharacters.push(npc)
  }

  // ── Управление игроком + орбитальная камера (мышь) + границы + коллизия камеры об офис ──
  playerMovement = usePlayerMovement(
    player.object,
    camera,
    renderer.domElement,
    movementBounds,
    officeGltf.scene
  )

  // ── Игровой цикл через delta-time (THREE.Clock) ──
  const clock = new THREE.Clock()

  function animate() {
    // Ограничиваем delta сверху — если вкладка была неактивна (или это самый первый кадр),
    // getDelta() может вернуть большой скачок, из-за которого игрок/камера дёрнутся
    const delta = Math.min(clock.getDelta(), 0.1)
    playerMovement?.update(delta)
    // Проигрываем анимации персонажей (например, "менеджер спит")
    for (const character of animatedCharacters) character.update(delta)
    // Обновляем индикатор координат и поворота игрока (временный помощник для расстановки NPC).
    // Поворот показываем в градусах; в коде rotationY задаётся в радианах (рад = град × π / 180).
    const deg = Math.round((player.object.rotation.y * 180) / Math.PI)
    playerCoords.value =
      `x: ${player.object.position.x.toFixed(1)}  z: ${player.object.position.z.toFixed(1)}  поворот: ${deg}°`
    renderer?.render(scene, camera)
    animationFrameId = requestAnimationFrame(animate)
  }
  animate()

  // ── Обработка изменения размера окна ──
  const onResize = () => handleResize(camera)
  window.addEventListener('resize', onResize)

  // Сохраняем для очистки при размонтировании
  cleanupHandlers.push(() => window.removeEventListener('resize', onResize))
  cleanupHandlers.push(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  })
})

// Список функций очистки, заполняется в onMounted (т.к. там создаются ресурсы)
const cleanupHandlers: Array<() => void> = []

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  playerMovement?.dispose()
  renderer?.dispose()
  cleanupHandlers.forEach((handler) => handler())
})
</script>

<template>
  <canvas ref="canvasRef" class="game-canvas" />
  <!-- Подсказка по управлению -->
  <div class="hint-hud">WASD / стрелки — ходьба · зажмите мышь и двигайте — поворот камеры</div>
  <!-- Временный индикатор координат игрока для расстановки NPC -->
  <div class="coords-hud">{{ playerCoords }}</div>
</template>

<style scoped>
.game-canvas {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.coords-hud {
  position: fixed;
  left: 12px;
  bottom: 12px;
  padding: 6px 10px;
  font-family: monospace;
  font-size: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  pointer-events: none;
}

.hint-hud {
  position: fixed;
  left: 12px;
  top: 12px;
  padding: 6px 10px;
  font-family: sans-serif;
  font-size: 13px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  pointer-events: none;
}
</style>
