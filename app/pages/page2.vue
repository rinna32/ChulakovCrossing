<script setup lang="ts">
// Пустая страница — оформишь сама.
// Шелл и шапка «CHULAKOV CROSSING» приходят из layout'а main (app/layouts/main.vue).
definePageMeta({ layout: 'main' })
</script>

<template>
  <NuxtLink to="/" class="btn btn--ghost">
    <span class="btn__arrow">←</span> В меню
  </NuxtLink>
  <!-- Контент добавляй здесь -->
</template>
