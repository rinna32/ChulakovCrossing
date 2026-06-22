<script setup lang="ts">
// Виджет лежит в app/widgets, а не в app/components, поэтому Nuxt не подхватит его
// автоматически — импортируем явно.
import GameScene from '~/widgets/game-scene/GameScene.client.vue'

// .client.vue компонент рендерится только в браузере — на сервере его вообще не существует,
// поэтому отдельный ssr:false здесь не обязателен, но не помешает для надёжности
definePageMeta({
  ssr: false,
})

// Отключаем прокрутку страницы только пока открыта игра (класс снимется при уходе со страницы)
useHead({
  bodyAttrs: { class: 'no-scroll' },
})
</script>

<template>
  <GameScene />
  <!-- Кнопка возврата в главное меню -->
  <NuxtLink to="/" class="home-btn" aria-label="На главную">←</NuxtLink>
</template>

<style scoped>
.home-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 15;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-family: sans-serif;
  color: #fff;
  text-decoration: none;
  background: rgba(20, 20, 20, 0.6);
  border-radius: 10px;
}

.home-btn:hover {
  background: rgba(243, 167, 18, 0.85);
  color: #3a2700;
}
</style>
