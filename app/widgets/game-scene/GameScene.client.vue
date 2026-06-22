<script setup lang="ts">
import * as THREE from 'three'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { loadGltf } from '~/shared/lib/three/loadGltf'
import { setupLights } from '~/shared/lib/three/setupLights'
import { Character, type CharacterPlacement } from '~/entities/character/Character'
import { usePlayerMovement } from '~/features/player-movement/usePlayerMovement'
import { MISSIONS, EPILOGUE_MISSION } from '~/entities/mission/missions'
import { makeLabelSprite } from '~/shared/lib/three/makeLabelSprite'
import MissionDialogue from '~/features/mission-dialogue/MissionDialogue.vue'

// ── Константы сцены: меняй, чтобы переставить модели ──

const OFFICE_URL = '/models/office/scene.gltf'
const OFFICE_TARGET_WIDTH = 24 // ширина офиса в метрах (масштаб считается сам)

// Границы комнаты в мировых координатах — за них не выпускаем героя и камеру.
// Офис открыт с части сторон, поэтому прямоугольник задаём вручную.
const ROOM_MIN_X = -8
const ROOM_MAX_X = 8
const ROOM_MIN_Z = -4.5
const ROOM_MAX_Z = 9

// Рост персонажей в метрах (Character сам подбирает scale под это число)
const PLAYER_HEIGHT = 1.75
const NPC_HEIGHT = 1.75
const MANAGER_DESK_HEIGHT = 2.2 // это композиция «стол + спящий», а не рост

const PLAYER_START_POSITION: THREE.Vector3Tuple = [0, 0, 5.8]
const PLAYER_START_ROTATION = Math.PI // лицом вглубь офиса

// x — влево(−)/вправо(+), z — к камере(+) / вглубь офиса(−)
const NPC_PLACEMENTS: CharacterPlacement[] = [
  {
    id: 'manager_sleep',
    name: 'Manager (спит за столом)',
    url: '/models/manager_sleep/scene.gltf',
    position: [-7.7, 0, 5.7],
    rotationY: Math.PI / 2,
    targetHeight: MANAGER_DESK_HEIGHT,
    animated: true, // единственная анимированная модель (сон)
  },
  {
    id: 'lead',
    name: 'LeadFrontend',
    url: '/models/LeadFrontend/scene.gltf',
    position: [4, 0, -3],
    rotationY: -Math.PI / 4,
    targetHeight: NPC_HEIGHT,
  },
  {
    id: 'manager',
    name: 'HR (Мику)',
    url: '/models/miku/scene.gltf',
    position: [-5.1, 0, -3.9],
    rotationY: 0,
    targetHeight: NPC_HEIGHT,
  },
]

const INTERACTION_RADIUS = 2.8 // на каком расстоянии можно заговорить с NPC

const canvasRef = ref<HTMLCanvasElement | null>(null)

// ── Состояние миссий ──
const currentMissionIndex = ref(0)
const epilogueDone = ref(false)
const dialogueOpen = ref(false)
const canInteract = ref(false) // игрок рядом с нужным NPC

const allMissionsDone = computed(() => currentMissionIndex.value >= MISSIONS.length)
const gameComplete = computed(() => allMissionsDone.value && epilogueDone.value)

// Активный диалог: либо текущая миссия, либо (после всех тестов) финал у менеджера
const activeMission = computed(() => {
  if (!allMissionsDone.value) return MISSIONS[currentMissionIndex.value]
  if (!epilogueDone.value) return EPILOGUE_MISSION
  return null
})

// Связки с внутренностями сцены (назначаются в onMounted, когда всё создано).
// Назначаются в onMounted; нужны, чтобы шаблон дёргал стабильные функции
let pauseMovement: (v: boolean) => void = () => {}
let refreshQuestMarker: () => void = () => {}

function handleMissionCompleted() {
  dialogueOpen.value = false
  pauseMovement(false)
  if (currentMissionIndex.value < MISSIONS.length) {
    currentMissionIndex.value++ // следующая миссия
  } else {
    epilogueDone.value = true // прошли финал → игра завершена
  }
  refreshQuestMarker()
}
function handleDialogueClose() {
  dialogueOpen.value = false
  pauseMovement(false)
}

let renderer: THREE.WebGLRenderer | null = null
let animationFrameId: number | null = null
let playerMovement: {
  update: (delta: number) => void
  dispose: () => void
  setPaused: (v: boolean) => void
  isMoving: () => boolean
} | null = null

function handleResize(camera: THREE.PerspectiveCamera) {
  if (!renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(async () => {
  if (!canvasRef.value) return

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 3.5, 9) // сзади от точки спавна — сразу вид на стойку

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true

  setupLights(scene)

  // Свой пол не создаём — у офиса есть собственный, иначе z-fighting (дрожание).
  const officeGltf = await loadGltf(OFFICE_URL)

  const officeRawSize = new THREE.Vector3()
  new THREE.Box3().setFromObject(officeGltf.scene).getSize(officeRawSize)
  const officeScale = OFFICE_TARGET_WIDTH / Math.max(officeRawSize.x, officeRawSize.z)

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

  // ── Игрок: используем модель Manager — у неё есть готовая анимация ходьбы ──
  const player = new Character({
    name: 'Игрок',
    url: '/models/Manager/scene.gltf',
    position: PLAYER_START_POSITION,
    rotationY: PLAYER_START_ROTATION,
    targetHeight: PLAYER_HEIGHT,
    animated: true, // анимацию ходьбы крутим только при движении (см. игровой цикл)
  })
  await player.load()
  scene.add(player.object)

  // Персонажи с анимацией — их миксеры нужно обновлять каждый кадр
  const animatedCharacters: Character[] = []
  if (player.mixer) animatedCharacters.push(player)

  // Возвращает высоту "макушки" персонажа — чтобы повесить табличку над головой
  function topOf(object: THREE.Object3D): number {
    return new THREE.Box3().setFromObject(object).max.y
  }

  // ── Табличка над игроком (следует за ним каждый кадр) ──
  const playerLabel = makeLabelSprite('Стажёр', 'фронтенд')
  const playerLabelY = topOf(player.object) + 0.35
  scene.add(playerLabel)

  // Объекты NPC по их id — нужны миссиям (узнать позицию нужного NPC)
  const npcObjectsById: Record<string, THREE.Object3D> = {}

  // ── NPC ──
  for (const placement of NPC_PLACEMENTS) {
    const npc = new Character(placement)
    await npc.load()
    scene.add(npc.object)
    if (npc.mixer) animatedCharacters.push(npc)
    if (placement.id) npcObjectsById[placement.id] = npc.object

    // Табличка с именем и ролью (берём из данных миссии этого NPC)
    const mission = MISSIONS.find((m) => m.npcId === placement.id)
    if (mission) {
      const label = makeLabelSprite(mission.npcName, mission.npcRole)
      label.position.set(npc.object.position.x, topOf(npc.object) + 0.35, npc.object.position.z)
      scene.add(label)
    }
  }

  // ── Маркер задания: золотой "перевёрнутый кубик" над текущим NPC ──
  const markerGeometry = new THREE.ConeGeometry(0.22, 0.5, 4)
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc83d,
    emissive: 0x7a5300,
  })
  const questMarker = new THREE.Mesh(markerGeometry, markerMaterial)
  questMarker.rotation.x = Math.PI // остриём вниз
  scene.add(questMarker)

  // Перемещает маркер на текущего нужного NPC (или прячет, если игра пройдена)
  function updateQuestMarker() {
    const mission = activeMission.value
    const target = mission ? npcObjectsById[mission.npcId] : undefined
    if (!target) {
      questMarker.visible = false
      return
    }
    questMarker.visible = true
    questMarker.position.set(target.position.x, 2.7, target.position.z)
  }
  updateQuestMarker()

  playerMovement = usePlayerMovement(
    player.object,
    camera,
    renderer.domElement,
    movementBounds,
    officeGltf.scene // collider для коллизии камеры
  )

  // Клавиша E — начать разговор с NPC, если игрок рядом
  function tryStartDialogue() {
    if (canInteract.value && !dialogueOpen.value && activeMission.value) {
      dialogueOpen.value = true
      playerMovement?.setPaused(true)
    }
  }
  function onInteractKey(event: KeyboardEvent) {
    if (event.code === 'KeyE') tryStartDialogue()
  }
  window.addEventListener('keydown', onInteractKey)
  cleanupHandlers.push(() => window.removeEventListener('keydown', onInteractKey))

  // Связываем стабильные обработчики из шаблона с внутренними функциями сцены
  pauseMovement = (v: boolean) => playerMovement?.setPaused(v)
  refreshQuestMarker = updateQuestMarker

  // ── Игровой цикл через delta-time (THREE.Clock) ──
  const clock = new THREE.Clock()

  function animate() {
    // Ограничиваем delta — после неактивной вкладки getDelta даёт большой скачок
    const delta = Math.min(clock.getDelta(), 0.1)
    playerMovement?.update(delta)
    // Ходьбу игрока анимируем только в движении, на месте — замираем
    if (player.mixer) player.mixer.timeScale = playerMovement?.isMoving() ? 1 : 0
    for (const character of animatedCharacters) character.update(delta)

    // Табличка игрока следует за ним
    playerLabel.position.set(player.object.position.x, playerLabelY, player.object.position.z)

    // ── Маркер задания: лёгкое покачивание и вращение над текущим NPC ──
    if (questMarker.visible) {
      const t = clock.getElapsedTime()
      questMarker.position.y = 2.7 + Math.sin(t * 3) * 0.12
      questMarker.rotation.y += delta * 1.5
    }

    // ── Проверяем, рядом ли игрок с нужным NPC (можно ли начать диалог) ──
    const mission = activeMission.value
    const target = mission ? npcObjectsById[mission.npcId] : undefined
    if (target && !dialogueOpen.value) {
      const dx = player.object.position.x - target.position.x
      const dz = player.object.position.z - target.position.z
      canInteract.value = dx * dx + dz * dz < INTERACTION_RADIUS * INTERACTION_RADIUS
    } else {
      canInteract.value = false
    }

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

// Функции очистки (слушатели, dispose), заполняются в onMounted
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
  <canvas ref="canvasRef" class="block fixed top-0 left-0 w-full h-full" />
  <!-- Подсказка по управлению -->
  <div
    class="fixed left-16 top-3.5 px-4 py-[9px] text-[13px] text-ink bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12)] pointer-events-none"
  >
    WASD / стрелки — ходьба · зажмите мышь и двигайте — поворот камеры
  </div>

  <!-- Текущее задание / финал -->
  <div
    class="fixed top-3.5 right-3.5 max-w-[55vw] px-[18px] py-[9px] text-sm font-medium text-black bg-white rounded-full text-center shadow-[0_2px_12px_rgba(0,0,0,0.18)] pointer-events-none"
  >
    <template v-if="!allMissionsDone && activeMission">
      Задание {{ currentMissionIndex + 1 }}/{{ MISSIONS.length }}: поговори с
      «{{ activeMission.npcName }}» — {{ activeMission.npcRole }} ({{ activeMission.value }})
    </template>
    <template v-else-if="!gameComplete && activeMission">
      Все тесты пройдены! Вернись к «{{ activeMission.npcName }}» ({{ activeMission.npcRole }}) — она ждёт.
    </template>
    <template v-else>
      ✓ Готово! Свяжись с наставником, сообщи о прохождении и оставь отзыв.
    </template>
  </div>

  <!-- Подсказка «нажми E», когда игрок рядом с нужным NPC -->
  <div
    v-if="canInteract && !dialogueOpen"
    class="fixed bottom-16 left-1/2 -translate-x-1/2 px-5 py-2.5 text-[15px] text-ink bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.16)] pointer-events-none"
  >
    Нажми <b class="font-bold">E</b>, чтобы поговорить
  </div>

  <!-- Диалог (миссия или финал) -->
  <MissionDialogue
    v-if="dialogueOpen && activeMission"
    :mission="activeMission"
    :index="currentMissionIndex"
    :total="MISSIONS.length"
    @completed="handleMissionCompleted"
    @close="handleDialogueClose"
  />

</template>
