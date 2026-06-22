<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Mission, MissionAnswer } from '~/entities/mission/missions'

// Диалог миссии ведёт игрока по этапам: intro → question → success.
const props = defineProps<{
  mission: Mission
  index: number
  total: number
}>()

const emit = defineEmits<{
  completed: [] // тест пройден
  close: [] // закрыли, не пройдя
}>()

const phase = ref<'intro' | 'question' | 'success'>('intro')
const introIndex = ref(0)
const questionIndex = ref(0)
const wrong = ref(false)

const currentQuestion = computed(() => props.mission.questions[questionIndex.value])

// Тасуем ответы — в данных правильный всегда первый. Порядок стабилен, пока
// показан один вопрос (computed зависит только от currentQuestion).
const shuffledAnswers = computed(() =>
  [...(currentQuestion.value?.answers ?? [])].sort(() => Math.random() - 0.5)
)

const hasQuestions = computed(() => props.mission.questions.length > 0)

const badge = computed(() =>
  hasQuestions.value
    ? `Тест ${props.index + 1}/${props.total} · ${props.mission.value}`
    : props.mission.value
)

function nextIntro() {
  if (introIndex.value < props.mission.intro.length - 1) {
    introIndex.value++
  } else {
    phase.value = hasQuestions.value ? 'question' : 'success'
  }
}

function pick(answer: MissionAnswer) {
  if (!answer.correct) {
    wrong.value = true // даём попробовать ещё раз
    return
  }
  wrong.value = false
  if (questionIndex.value < props.mission.questions.length - 1) {
    questionIndex.value++
  } else {
    phase.value = 'success'
  }
}
</script>

<template>
  <!-- Фон ловит клики, чтобы они не уходили в канвас -->
  <div class="fixed inset-0 z-20 flex items-end justify-center px-4 pb-10 bg-black/40">
    <div
      class="w-full max-w-[560px] bg-white text-ink rounded-card px-7 py-[26px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
    >
      <div class="flex items-center justify-between mb-3.5">
        <span class="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{{ badge }}</span>
        <button
          class="border-0 bg-transparent text-[18px] leading-none text-muted cursor-pointer"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <p class="m-0 mb-2.5 font-bold text-[17px]">{{ mission.npcName }} · {{ mission.npcRole }}</p>

      <!-- Этап 1: реплики до вопроса -->
      <template v-if="phase === 'intro'">
        <p class="m-0 mb-5 text-[17px] leading-[1.6]">{{ mission.intro[introIndex] }}</p>
        <button class="btn btn--primary mt-1.5" @click="nextIntro()">
          Далее <span class="btn__arrow">→</span>
        </button>
      </template>

      <!-- Этап 2: вопросы с вариантами ответа -->
      <template v-else-if="phase === 'question'">
        <p class="m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Вопрос {{ questionIndex + 1 }}/{{ mission.questions.length }}
        </p>
        <p class="m-0 mb-5 text-[17px] leading-[1.6] font-semibold">{{ currentQuestion?.question }}</p>
        <div class="flex flex-col gap-2.5">
          <button
            v-for="(answer, i) in shuffledAnswers"
            :key="i"
            class="text-left px-4 py-3.5 border border-line rounded-[14px] bg-white text-ink text-base cursor-pointer transition-colors hover:border-ink hover:bg-surface"
            @click="pick(answer)"
          >
            {{ answer.text }}
          </button>
        </div>
        <p v-if="wrong" class="mt-3 text-[#c0392b] text-[15px]">Не совсем — подумай ещё раз.</p>
      </template>

      <!-- Этап 3: итог после верного ответа -->
      <template v-else>
        <p class="m-0 mb-5 text-[17px] leading-[1.6]">{{ mission.success }}</p>
        <button class="btn btn--primary mt-1.5" @click="emit('completed')">
          Готово <span class="btn__arrow">→</span>
        </button>
      </template>
    </div>
  </div>
</template>
