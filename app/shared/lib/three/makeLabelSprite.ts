import * as THREE from 'three'

// Создаёт «табличку» (nametag) с именем и ролью персонажа.
// Это THREE.Sprite — он всегда повёрнут к камере, как подписи в играх.
// Текст рисуем на canvas, из него делаем текстуру.
export function makeLabelSprite(name: string, role: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 200
  const ctx = canvas.getContext('2d')!

  // Фон-плашка со скруглёнными углами
  ctx.fillStyle = 'rgba(20, 20, 20, 0.72)'
  ctx.beginPath()
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 28)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Имя — крупно, белым
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px sans-serif'
  ctx.fillText(name, canvas.width / 2, 78)

  // Роль — мельче, золотистым
  ctx.fillStyle = '#f3c057'
  ctx.font = '44px sans-serif'
  ctx.fillText(role, canvas.width / 2, 142)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // рисуем поверх сцены, чтобы табличку не загораживала геометрия
  })

  const sprite = new THREE.Sprite(material)
  // Сохраняем пропорции картинки (512×200): ширина 1.4 м → высота ~0.55 м
  sprite.scale.set(1.4, 1.4 * (canvas.height / canvas.width), 1)
  sprite.renderOrder = 999 // поверх остального
  return sprite
}
