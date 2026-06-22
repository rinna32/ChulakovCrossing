<script setup lang="ts">
// Приветствие с правилами при заходе в игру.
const emit = defineEmits<{ start: [] }>()

const rules = [
  'WASD или стрелки — ходить по офису',
  'Зажми левую кнопку мыши и веди — поворачивать камеру',
  'Подойди к коллеге с золотым маркером над головой и нажми E — начать разговор',
  'Пройди тесты у трёх коллег, затем вернись к менеджеру за финалом',
]
</script>

<template>
  <div
    class="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/40"
  >
    <div
      class="w-full max-w-[560px] bg-white text-ink rounded-card p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
    >
      <h2 class="m-0 mb-4 text-[30px] font-bold tracking-[-0.01em] leading-[1.05]">
        Добро пожаловать в Chulakov! ♪
      </h2>

      <p class="m-0 mb-6 text-[17px] leading-[1.6]">
        Ты — стажёр-фронтендер. Прежде чем попасть в главный офис, познакомься с командой
        и пройди три небольших теста о ценностях компании: ответственность, прозрачность и скорость.
      </p>

      <p class="m-0 mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
        Как играть
      </p>
      <ul class="m-0 mb-7 pl-5 list-disc">
        <li v-for="(rule, i) in rules" :key="i" class="text-base leading-[1.55] mb-2">
          {{ rule }}
        </li>
      </ul>

      <button class="btn btn--primary w-full" @click="emit('start')">
        Поехали <span class="btn__arrow">→</span>
      </button>
    </div>
  </div>
</template>
