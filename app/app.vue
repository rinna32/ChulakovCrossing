<template>
  <div class="min-h-screen flex flex-col bg-bg text-ink">
    <NuxtRouteAnnouncer />

    <!-- Шапка-навигация. Прячем на странице игры — там полноэкранная 3D-сцена -->
    <header v-if="!isGame" class="w-full">
      <nav class="flex items-center justify-between h-[72px] px-[clamp(24px,6vw,96px)]">
        <NuxtLink to="/" class="text-xl font-bold tracking-[2px]">CHULAKOV CROSSING</NuxtLink>

        <div class="flex items-center gap-8 text-[15px] font-medium">
          <NuxtLink to="/game" class="hover:text-muted transition-colors duration-200">Игра</NuxtLink>
          <NuxtLink to="/page2" class="hover:text-muted transition-colors duration-200">О студии</NuxtLink>
        </div>
      </nav>
    </header>

    <main class="flex-1 w-full">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isGame = computed(() => route.path === '/game')
</script>
