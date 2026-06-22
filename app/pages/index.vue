<script setup lang="ts">
// Главный экран (меню) с двумя кнопками:
//  • «Играть» — ведёт на игровую сцену (/game)
//  • «Вторая страница» — ведёт на пустую страницу (/page2), её оформишь сама
</script>

<template>
  <div class="menu">
    <div class="menu__card">
      <h1 class="menu__title">Chulakov</h1>
      <p class="menu__subtitle">Онбординг-игра для стажёра</p>

      <div class="menu__buttons">
        <NuxtLink to="/game" class="menu__btn menu__btn--primary">Играть</NuxtLink>
        <NuxtLink to="/page2" class="menu__btn">Вторая страница</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: sans-serif;
  /* Тёмный фон под цвет игры */
  background: radial-gradient(circle at 50% 30%, #2a2f3a 0%, #14171d 70%);
}

.menu__card {
  text-align: center;
  color: #fff;
}

.menu__title {
  margin: 0;
  font-size: 56px;
  font-weight: 700;
  letter-spacing: 1px;
}

.menu__subtitle {
  margin: 8px 0 36px;
  font-size: 18px;
  color: #b9c0cc;
}

.menu__buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 280px;
  margin: 0 auto;
}

.menu__btn {
  display: block;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: transform 0.08s ease, background 0.15s ease;
}

.menu__btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.menu__btn--primary {
  background: #f3a712;
  color: #3a2700;
  border-color: transparent;
}

.menu__btn--primary:hover {
  background: #ffb929;
}
</style>
