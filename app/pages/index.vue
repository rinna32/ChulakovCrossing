<script setup lang="ts">
// Виджет лежит в app/widgets, а не в app/components, поэтому Nuxt не подхватит его
// автоматически — импортируем явно.
import GameScene from '~/widgets/game-scene/GameScene.client.vue'

// .client.vue компонент рендерится только в браузере — на сервере его вообще не существует,
// поэтому отдельный ssr:false здесь не обязателен, но не помешает для надёжности
definePageMeta({
  ssr: false,
})
</script>

<template>
  <GameScene />
</template>
