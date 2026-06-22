import * as THREE from 'three'

// Табличка с именем и ролью над головой персонажа.
// Рисуем текст на canvas и кладём как текстуру на Sprite (он всегда смотрит в камеру).
export function makeLabelSprite(name: string, role: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 200
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = 'rgba(20, 20, 20, 0.72)'
  ctx.beginPath()
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 28)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px sans-serif'
  ctx.fillText(name, canvas.width / 2, 78)

  ctx.fillStyle = '#f3c057'
  ctx.font = '44px sans-serif'
  ctx.fillText(role, canvas.width / 2, 142)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // не даём геометрии загораживать табличку
  })

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.4, 1.4 * (canvas.height / canvas.width), 1)
  sprite.renderOrder = 999
  return sprite
}
