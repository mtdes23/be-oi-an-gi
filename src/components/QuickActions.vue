<script setup>
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'

const props = defineProps({
  locationLoading: { type: Boolean, default: false },
  hasChallenge: { type: Boolean, default: false },
  spinMode: { type: String, default: 'all' },
  favoriteCount: { type: Number, default: 0 }
})

const emit = defineEmits(['findNearby', 'openMap', 'openChallenge', 'toggleSpinMode'])

const { t } = useI18n()
</script>

<template>
  <div class="w-full max-w-3xl mb-5 sm:mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
    <button @click="emit('findNearby')" :disabled="locationLoading"
      class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-blue-600 transition-all card-shadow disabled:opacity-50 active:scale-95 min-h-[44px]">
      <Icon :icon="locationLoading ? 'lucide:loader-2' : 'lucide:map-pin'" :class="{ 'animate-spin': locationLoading }" class="size-4" />
      {{ t.nearby }}
    </button>
    <button @click="emit('openMap')"
      class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-emerald-600 transition-all card-shadow active:scale-95 min-h-[44px]">
      <Icon icon="lucide:map" class="size-4" />
      {{ t.map }}
    </button>
    <button @click="emit('openChallenge')"
      class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-green-600 transition-all card-shadow active:scale-95 min-h-[44px]">
      <Icon icon="lucide:trophy" class="size-4" />
      {{ t.challenge }}
      <span v-if="hasChallenge" class="w-2 h-2 bg-green-400 rounded-full"></span>
    </button>
    <button v-if="favoriteCount > 0" @click="emit('toggleSpinMode')"
      class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all card-shadow active:scale-95 min-h-[44px]"
      :class="spinMode === 'favorites' ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-lg shadow-rose-200/50' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-stone-600 dark:text-stone-300 hover:text-rose-600'">
      <Icon icon="lucide:heart" class="size-4" :class="spinMode === 'favorites' ? 'fill-white' : ''" />
      {{ spinMode === 'favorites' ? '❤️ Đang quay yêu thích' : 'Quay từ yêu thích' }}
      <span class="text-xs opacity-75">({{ favoriteCount }})</span>
    </button>
  </div>
</template>
