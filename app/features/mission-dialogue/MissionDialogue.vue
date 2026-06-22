<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Mission, MissionAnswer } from '~/entities/mission/missions'

// Окно диалога одной миссии. Само ведёт игрока по этапам:
// intro (реплики) → question (вопрос) → success (итог).
const props = defineProps<{
  mission: Mission
  index: number // номер текущей миссии (с 0)
  total: number // всего миссий
}>()

const emit = defineEmits<{
  completed: [] // тест пройден (дали верный ответ и нажали «Готово»)
  close: [] // игрок закрыл диалог, не пройдя тест
}>()

// Этап диалога
const phase = ref<'intro' | 'question' | 'success'>('intro')
// Какую реплику intro показываем
const introIndex = ref(0)
// Какой вопрос теста сейчас показываем
const questionIndex = ref(0)
// Был ли только что выбран неверный ответ (чтобы показать подсказку)
const wrong = ref(false)

// Текущий вопрос
const currentQuestion = computed(() => props.mission.questions[questionIndex.value])

// Варианты ответа в перемешанном порядке (в данных правильный всегда первый —
// тасуем, чтобы его нельзя было угадать по позиции). computed зависит только от
// currentQuestion, поэтому порядок стабилен, пока показан один и тот же вопрос.
const shuffledAnswers = computed(() =>
  [...(currentQuestion.value?.answers ?? [])].sort(() => Math.random() - 0.5)
)

// Есть ли вообще тест (у эпилога вопросов нет)
const hasQuestions = computed(() => props.mission.questions.length > 0)

// Текст бейджа: для теста — номер и ценность, для диалога без теста — просто ценность
const badge = computed(() =>
  hasQuestions.value
    ? `Тест ${props.index + 1}/${props.total} · ${props.mission.value}`
    : props.mission.value
)

// Кнопка «Далее» в репликах: следующая реплика, затем вопросы (или сразу итог, если теста нет)
function nextIntro() {
  if (introIndex.value < props.mission.intro.length - 1) {
    introIndex.value++
  } else {
    phase.value = hasQuestions.value ? 'question' : 'success'
  }
}

// Выбор варианта ответа
function pick(answer: MissionAnswer) {
  if (!answer.correct) {
    wrong.value = true // неверно — даём попробовать ещё раз
    return
  }
  wrong.value = false
  // Верно: либо следующий вопрос, либо итог теста
  if (questionIndex.value < props.mission.questions.length - 1) {
    questionIndex.value++
  } else {
    phase.value = 'success'
  }
}
</script>

<template>
  <!-- Затемнённый фон перекрывает сцену и ловит клики, чтобы они не уходили в канвас -->
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
            v-for="(answer, i) in currentQuestion?.answers ?? []"
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
