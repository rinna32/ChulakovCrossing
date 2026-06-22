<script setup lang="ts">
// Виджет из app/widgets Nuxt сам не импортит — подключаем явно
import GameScene from '~/widgets/game-scene/GameScene.client.vue'
import GameIntroModal from '~/features/game-intro/GameIntroModal.vue'

const showIntro = ref(true)

// Сцена только для браузера — Three.js не должен исполняться на сервере
definePageMeta({
  ssr: false,
})

// Прокрутку отключаем только на странице игры
useHead({
  bodyAttrs: { class: 'no-scroll' },
})
</script>

<template>
  <GameScene />
  <!-- Кнопка возврата в меню -->
  <NuxtLink
    to="/"
    aria-label="На главную"
    class="bg-white text-black hover:bg-yellow-300 border border-black hover:border-transparent transition-colors duration-300 font-medium fixed top-3.5 left-3.5 z-[15] flex h-11 w-11 items-center justify-center rounded-full text-[20px] text-ink no-underline shadow-[0_2px_12px_rgba(0,0,0,0.16)] hover:bg-ink hover:text-white"
  >
    ←
  </NuxtLink>
  <!-- Приветствие и правила при заходе в игру -->
  <GameIntroModal v-if="showIntro" @start="showIntro = false" />
</template>
