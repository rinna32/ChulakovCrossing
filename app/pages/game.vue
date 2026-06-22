<script setup lang="ts">
// Виджет лежит в app/widgets, а не в app/components, поэтому Nuxt не подхватит его
// автоматически — импортируем явно.
import GameScene from '~/widgets/game-scene/GameScene.client.vue'
import GameIntroModal from '~/features/game-intro/GameIntroModal.vue'

// Приветственная модалка с правилами — показывается при каждом заходе на страницу игры
const showIntro = ref(true)

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
  <!-- Кнопка возврата в меню: круглая со стрелкой — фирменный элемент сайта Chulakov -->
  <NuxtLink
    to="/"
    aria-label="На главную"
    class="fixed top-3.5 left-3.5 z-[15] flex h-11 w-11 items-center justify-center rounded-full bg-white text-[20px] text-ink no-underline shadow-[0_2px_12px_rgba(0,0,0,0.16)] transition-colors hover:bg-ink hover:text-white"
  >
    ←
  </NuxtLink>
  <!-- Приветствие и правила при заходе в игру -->
  <GameIntroModal v-if="showIntro" @start="showIntro = false" />
</template>
