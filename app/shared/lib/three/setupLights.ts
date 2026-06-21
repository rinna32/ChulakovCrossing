import * as THREE from 'three'

// Добавляет на сцену базовое освещение: рассеянный (ambient) + направленный (directional) свет.
// Без этого PBR-материалы из .gltf будут выглядеть полностью чёрными.
export function setupLights(scene: THREE.Scene) {
  // Рассеянный свет — освещает всё равномерно, без теней, имитирует "свет от неба"
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  // Направленный свет — имитирует солнце, даёт объём и тени
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  return { ambientLight, directionalLight }
}
