<script setup>
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'
import { useDarkMode } from '../composables/useDarkMode.js'
import { useFavorites } from '../composables/useFavorites.js'

const props = defineProps({
  resultCount: { type: Number, default: 0 },
  spinCount: { type: Number, default: 0 },
  historyCount: { type: Number, default: 0 }
})

const emit = defineEmits(['toggleFavorites', 'toggleLeaderboard', 'toggleStats', 'toggleHistory'])

const { locale, t, toggleLocale } = useI18n()
const { isDark, toggleDarkMode } = useDarkMode()
const { favoriteCount } = useFavorites()
</script>

<template>
  <header class="relative z-10 px-3 sm:px-6 py-3 sm:py-5 safe-top">
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 shrink-0 no-select transition-transform hover:scale-105 active:scale-95">
          🍜
        </div>
        <div class="min-w-0">
          <h2 class="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100 tracking-tight font-display truncate">{{ t.appName }}</h2>
          <p class="text-[0.6rem] sm:text-xs text-stone-400 dark:text-stone-500 font-medium truncate">{{ resultCount }} quán • {{ spinCount }} lượt quay</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
        <button @click="emit('toggleFavorites')"
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all group relative"
          :aria-label="`${favoriteCount} yêu thích`">
          <Icon icon="lucide:heart" class="size-4 sm:size-5 transition-all group-hover:scale-110" :class="favoriteCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-stone-400 group-hover:text-rose-500'" />
          <span v-if="favoriteCount" class="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center shadow-sm">{{ favoriteCount }}</span>
        </button>
        <button @click="emit('toggleLeaderboard')" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all group" aria-label="Bảng xếp hạng">
          <Icon icon="lucide:trophy" class="size-4 sm:size-5 text-stone-400 group-hover:text-amber-500 transition-all group-hover:scale-110" />
        </button>
        <button @click="emit('toggleStats')" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all group" aria-label="Thống kê">
          <Icon icon="lucide:bar-chart-3" class="size-4 sm:size-5 text-stone-400 group-hover:text-orange-500 transition-all group-hover:scale-110" />
        </button>
        <button @click="emit('toggleHistory')" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all group relative" aria-label="Lịch sử">
          <Icon icon="lucide:history" class="size-4 sm:size-5 text-stone-400 group-hover:text-orange-500 transition-all group-hover:scale-110" />
          <span v-if="historyCount" class="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center shadow-sm">{{ historyCount }}</span>
        </button>
        <div class="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-0.5"></div>
        <button @click="toggleLocale" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all text-xs font-bold text-stone-400 hover:text-violet-500" :aria-label="locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'">
          {{ locale === 'vi' ? 'EN' : 'VI' }}
        </button>
        <button @click="toggleDarkMode" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 active:scale-95 transition-all group" :aria-label="isDark ? 'Chế độ sáng' : 'Chế độ tối'">
          <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="size-4 sm:size-5 text-stone-400 group-hover:text-amber-500 transition-all group-hover:scale-110" :class="{ 'animate-spin-slow': isDark }" />
        </button>
      </div>
    </div>
  </header>
</template>
