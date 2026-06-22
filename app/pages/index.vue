<script setup lang="ts">
// Главный экран (меню) в стиле сайта chulakov.ru: белый фон, крупная типографика, ч/б.
//  • «Играть» — ведёт на игровую сцену (/game)
//  • «Вторая страница» — ведёт на пустую страницу (/page2), её оформишь сама
</script>

<template>
  <div
    class="relative min-h-screen box-border flex flex-col justify-center bg-bg py-10 px-[clamp(24px,6vw,96px)]"
  >
    <div class="absolute top-9 left-[clamp(24px,6vw,96px)] text-xl font-bold tracking-[2px]">
      CHULAKOV CROSSING
    </div>

    <div>
      <h1 class="m-0 font-bold leading-[0.98] tracking-[-0.02em] text-[clamp(44px,8vw,104px)]">
        Онбординг-игра<br />для стажёра
      </h1>
      <p
        class="mt-6 mb-10 max-w-[520px] text-muted leading-[1.5] text-[clamp(16px,2vw,20px)]"
      >
        Познакомься с командой студии и пройди тесты о её ценностях:
        ответственность, прозрачность и скорость.
      </p>

      <div class="flex flex-wrap gap-[14px]">
        <NuxtLink to="/game" class="btn btn--primary">
          Играть <span class="btn__arrow">→</span>
        </NuxtLink>
        <NuxtLink to="/page2" class="btn btn--ghost">Вторая страница</NuxtLink>
      </div>
    </div>
  </div>
</template>
