<script setup lang="ts">
// Пустая страница — оформишь сама.
// Оставил только ссылку «назад в меню», чтобы со страницы можно было вернуться.
</script>

<template>
  <div class="page2">
    <NuxtLink to="/" class="page2__back">← В меню</NuxtLink>
    <!-- Контент добавляй здесь -->
  </div>
</template>

<style scoped>
.page2 {
  min-height: 100vh;
  padding: 24px;
  font-family: sans-serif;
  color: #fff;
  background: #14171d;
}

.page2__back {
  color: #b9c0cc;
  text-decoration: none;
}

.page2__back:hover {
  color: #fff;
}
</style>
