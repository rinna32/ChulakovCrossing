<template>
  <!-- Основной layout для обычных страниц: общий «шелл» с отступами и шапкой-логотипом.
       Контент страницы выводится в <slot /> под шапкой. -->
  <div class="min-h-screen box-border bg-bg text-ink py-10 px-[clamp(24px,6vw,96px)]">
    <header class="text-xl font-bold tracking-[2px] mb-7">CHULAKOV CROSSING</header>
    <slot />
  </div>
</template>
