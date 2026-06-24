<script setup lang="ts">
// Главный экран (меню) в стиле сайта chulakov
</script>

<template>
  <section class="px-[clamp(24px,6vw,96px)] pt-[clamp(40px,9vh,110px)] pb-20">
    <h1 class="m-0 font-bold leading-[0.98] tracking-[-0.02em] text-[clamp(44px,8vw,104px)]">
      Онбординг-игра<br />для стажёра
    </h1>

    <p class="mt-8 max-w-[680px] text-[clamp(16px,2vw,22px)] leading-[1.55] text-muted">
      Познакомься с командой студии Chulakov и пройди тесты о её ценностях —
      ответственности, прозрачности и скорости. Походи по офису, поговори с коллегами
      и узнай, как здесь принято работать.
    </p>

    <div class="mt-10 flex flex-wrap gap-[14px]">
      <NuxtLink to="/game" class="btn btn--primary">
        Играть <span class="btn__arrow">→</span>
      </NuxtLink>
      <NuxtLink
        to="/page2"
        class="btn btn--ghost bg-white text-black hover:bg-yellow-300 border border-black hover:border-transparent transition-colors duration-300 px-6 py-2 rounded-full font-medium"
      >
        О студии
      </NuxtLink>
    </div>
  </section>
</template>
