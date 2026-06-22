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
  <div class="dialogue-backdrop">
    <div class="dialogue-panel">
      <div class="dialogue-head">
        <span class="dialogue-badge">{{ badge }}</span>
        <button class="dialogue-close" aria-label="Закрыть" @click="emit('close')">✕</button>
      </div>

      <p class="dialogue-npc">{{ mission.npcName }} · {{ mission.npcRole }}</p>

      <!-- Этап 1: реплики до вопроса -->
      <template v-if="phase === 'intro'">
        <p class="dialogue-text">{{ mission.intro[introIndex] }}</p>
        <button class="dialogue-primary" @click="nextIntro()">Далее</button>
      </template>

      <!-- Этап 2: вопросы с вариантами ответа -->
      <template v-else-if="phase === 'question'">
        <p class="dialogue-progress">Вопрос {{ questionIndex + 1 }}/{{ mission.questions.length }}</p>
        <p class="dialogue-text dialogue-question">{{ currentQuestion.question }}</p>
        <div class="dialogue-answers">
          <button
            v-for="(answer, i) in currentQuestion.answers"
            :key="i"
            class="dialogue-answer"
            @click="pick(answer)"
          >
            {{ answer.text }}
          </button>
        </div>
        <p v-if="wrong" class="dialogue-hint">Не совсем — подумай ещё раз.</p>
      </template>

      <!-- Этап 3: итог после верного ответа -->
      <template v-else>
        <p class="dialogue-text">{{ mission.success }}</p>
        <button class="dialogue-primary" @click="emit('completed')">Готово</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dialogue-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 16px 40px;
  background: rgba(0, 0, 0, 0.45);
}

.dialogue-panel {
  width: 100%;
  max-width: 560px;
  background: #fffdf7;
  color: #2b2b2b;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  font-family: sans-serif;
}

.dialogue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dialogue-badge {
  font-size: 13px;
  font-weight: 600;
  color: #b06a00;
  background: #fff0d6;
  padding: 4px 10px;
  border-radius: 999px;
}

.dialogue-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: #888;
  cursor: pointer;
}

.dialogue-npc {
  margin: 0 0 6px;
  font-weight: 600;
  font-size: 15px;
}

.dialogue-text {
  margin: 0 0 16px;
  font-size: 16px;
  line-height: 1.5;
}

.dialogue-progress {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #b06a00;
}

.dialogue-question {
  font-weight: 600;
}

.dialogue-answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialogue-answer {
  text-align: left;
  padding: 12px 14px;
  border: 1px solid #e2d8c4;
  border-radius: 10px;
  background: #fff;
  color: #2b2b2b;
  font-size: 15px;
  cursor: pointer;
}

.dialogue-answer:hover {
  border-color: #f3a712;
  background: #fff8ec;
}

.dialogue-primary {
  margin-top: 4px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #f3a712;
  color: #3a2700;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.dialogue-hint {
  margin: 10px 0 0;
  color: #c0392b;
  font-size: 14px;
}
</style>
