import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// GLTFLoader в виде Promise, чтобы можно было await'ить.
export function loadGltf(url: string): Promise<GLTF> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}
