import * as THREE from 'three'
import { loadGltf } from '~/shared/lib/three/loadGltf'

export interface CharacterPlacement {
  id?: string // id NPC — миссии по нему находят, к кому подходить
  url: string
  position: THREE.Vector3Tuple
  rotationY: number
  // Желаемый рост в метрах. Реальный scale считаем сами по bounding box,
  // т.к. модели из разных источников нарисованы в разных единицах.
  targetHeight: number
  animated?: boolean // проигрывать ли встроенную анимацию модели
  name?: string
}

// Персонаж (NPC или игрок): загруженная модель + её Object3D на сцене.
export class Character {
  public object: THREE.Object3D = new THREE.Group()
  public placement: CharacterPlacement
  public mixer: THREE.AnimationMixer | null = null

  constructor(placement: CharacterPlacement) {
    this.placement = placement
  }

  async load(): Promise<THREE.Object3D> {
    const gltf = await loadGltf(this.placement.url)
    const model = gltf.scene

    // Масштаб подбираем по высоте «сырого» bounding box, чтобы получить targetHeight метров.
    const rawSize = new THREE.Vector3()
    new THREE.Box3().setFromObject(model).getSize(rawSize)
    const scale = this.placement.targetHeight / rawSize.y
    model.scale.setScalar(scale)

    model.position.set(...this.placement.position)
    model.rotation.y = this.placement.rotationY

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Анимацию заводим только по флагу — у статичных моделей клип в файле игнорируем.
    if (this.placement.animated && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model)
      for (const clip of gltf.animations) {
        this.mixer.clipAction(clip).play()
      }
    }

    this.object = model
    return model
  }

  update(delta: number) {
    this.mixer?.update(delta)
  }
}
