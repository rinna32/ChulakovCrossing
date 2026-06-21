import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Обёртка над GLTFLoader, которая возвращает Promise вместо callback-ов.
// Это удобно, чтобы писать await loadGltf(url) внутри async-функций.
export function loadGltf(url: string): Promise<GLTF> {
  const loader = new GLTFLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined, // прогресс загрузки нам не нужен
      (error) => reject(error)
    )
  })
}
