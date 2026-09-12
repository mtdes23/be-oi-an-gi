<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'
import { useChallengeStore } from '../stores/challengeStore.js'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const challengeStore = useChallengeStore()

const weeklyProgress = computed(() => challengeStore.getWeeklyProgress())

const shareChallenge = () => {
  const text = `${t.value.title} - ${t.value.dailyChallenge}\n✅ ${challengeStore.dailyChallenge.spinsToday}/3 ${t.value.dayProgress}!\n🎮 ${window.location.origin}`
  if (navigator.share) {
    navigator.share({ title: t.value.dailyChallenge, text })
  } else {
    navigator.clipboard.writeText(text)
    alert(t.value.copied)
  }
}

const shareWeeklyChallenge = () => {
  const daysCompleted = weeklyProgress.value.filter(d => d.spins > 0).length
  const text = `${t.value.title} - ${t.value.weeklyChallenge}\n📅 ${daysCompleted}/7 ${t.value.thisWeek.toLowerCase()}!\n🎮 ${window.location.origin}`
  if (navigator.share) {
    navigator.share({ title: t.value.weeklyChallenge, text })
  } else {
    navigator.clipboard.writeText(text)
    alert(t.value.copied)
  }
}
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
      <div class="w-full sm:max-w-sm bg-white dark:bg-stone-800 sm:rounded-3xl rounded-t-3xl p-5 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700 max-h-[85vh] max-h-[85dvh] overflow-y-auto" @click.stop>
        <button @click="emit('close')" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
          <Icon icon="lucide:x" class="size-4 sm:size-5" />
        </button>

        <!-- Tabs -->
        <div class="flex gap-2 mb-5">
          <button class="flex-1 py-2 rounded-xl text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50">
            {{ t.today }}
          </button>
          <button class="flex-1 py-2 rounded-xl text-sm font-bold bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-600">
            {{ t.thisWeek }}
          </button>
        </div>

        <div class="text-center mb-5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-green-200 dark:shadow-green-900/30">
            🏆
          </div>
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">{{ t.dailyChallenge }}</h3>
          <p class="text-sm text-stone-400 dark:text-stone-500 mt-1">{{ t.spin3times }}</p>
        </div>

        <!-- Daily Progress -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 text-center border border-green-100 dark:border-green-900/30 mb-4">
          <div class="flex justify-center gap-2 mb-3">
            <div v-for="i in 3" :key="i"
              class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all"
              :class="i <= challengeStore.dailyChallenge.spinsToday ? 'bg-green-400 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30' : 'bg-white dark:bg-stone-700 border-2 border-green-200 dark:border-green-800 text-green-300 dark:text-green-700'">
              <Icon v-if="i <= challengeStore.dailyChallenge.spinsToday" icon="lucide:check" class="size-5" />
              <span v-else>{{ i }}</span>
            </div>
          </div>
          <p class="text-sm font-semibold" :class="challengeStore.dailyCompleted ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'">
            {{ challengeStore.dailyChallenge.spinsToday }}/3 {{ t.dayProgress }}
          </p>
          <p v-if="challengeStore.dailyCompleted" class="text-xs text-green-500 dark:text-green-400 mt-1 font-medium">🎉 {{ t.completed }}</p>
        </div>

        <!-- Weekly Progress -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 mb-4">
          <p class="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 text-center uppercase tracking-wider">{{ t.thisWeek }}</p>
          <div class="grid grid-cols-7 gap-1.5">
            <div v-for="day in weeklyProgress" :key="day.date" class="text-center">
              <p class="text-[0.6rem] text-stone-400 dark:text-stone-500 mb-1">{{ day.day }}</p>
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto transition-all"
                   :class="day.spins > 0 ? 'bg-green-400 text-white' : day.isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 border border-blue-300 dark:border-blue-700' : 'bg-stone-100 dark:bg-stone-700 text-stone-400'">
                <Icon v-if="day.spins > 0" icon="lucide:check" class="size-3.5" />
                <span v-else>{{ day.spins }}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-blue-500 dark:text-blue-400 mt-3 text-center font-medium">
            {{ weeklyProgress.filter(d => d.spins > 0).length }}/7 {{ t.thisWeek.toLowerCase() }}
          </p>
        </div>

        <button v-if="challengeStore.dailyCompleted" @click="shareChallenge"
          class="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-green-200/50 dark:shadow-green-900/30 active:scale-[0.98] transition-all mb-3">
          <span class="flex items-center justify-center gap-2">
            <Icon icon="lucide:share-2" class="size-4" />
            {{ t.share }}
          </span>
        </button>

        <button @click="emit('close')" class="w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-all">
          {{ t.close }}
        </button>
      </div>
    </div>
  </transition>
</template>
