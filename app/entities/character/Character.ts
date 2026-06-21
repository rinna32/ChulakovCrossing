import * as THREE from 'three'
import { loadGltf } from '~/shared/lib/three/loadGltf'

// Описание того, как разместить персонажа на сцене.
export interface CharacterPlacement {
  url: string // путь к scene.gltf
  position: THREE.Vector3Tuple // [x, y, z], в метрах
  rotationY: number // поворот вокруг вертикальной оси, в радианах
  // Модели приходят из разных источников и могут быть "нарисованы" в совершенно разных
  // условных единицах (одна модель — это десятки юнитов, другая — доли юнита).
  // Поэтому вместо ручного scale мы указываем ЖЕЛАЕМЫЙ РОСТ персонажа в метрах,
  // а реальный scale считаем автоматически по bounding box модели после загрузки.
  targetHeight: number
  name?: string // для console.log при дебаге
}

// Персонаж (NPC или игрок) — загруженная модель + её Object3D на сцене.
export class Character {
  public object: THREE.Object3D = new THREE.Group()
  public placement: CharacterPlacement

  constructor(placement: CharacterPlacement) {
    this.placement = placement
  }

  // Загружает gltf-модель, автоматически подбирает масштаб по targetHeight,
  // применяет позицию/поворот и выводит итоговые габариты в консоль
  async load(): Promise<THREE.Object3D> {
    const gltf = await loadGltf(this.placement.url)
    const model = gltf.scene

    // Считаем "сырой" bounding box модели — ДО какого-либо масштабирования.
    // Именно высота (y) этого бокса определяет, во сколько раз нужно
    // увеличить/уменьшить модель, чтобы она стала ростом targetHeight метров.
    const rawSize = new THREE.Vector3()
    new THREE.Box3().setFromObject(model).getSize(rawSize)

    const scale = this.placement.targetHeight / rawSize.y
    model.scale.setScalar(scale)

    model.position.set(...this.placement.position)
    model.rotation.y = this.placement.rotationY

    // Тени: модель отбрасывает и принимает тени от directional light
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    console.log(
      `[Character] ${this.placement.name ?? this.placement.url} — raw size:`,
      `x=${rawSize.x.toFixed(2)} y=${rawSize.y.toFixed(2)} z=${rawSize.z.toFixed(2)}`,
      `→ scale=${scale.toFixed(4)} (рост ${this.placement.targetHeight}м)`
    )

    this.object = model
    return model
  }
}
