<script setup>
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  places: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['close', 'select'])

const { t } = useI18n()

const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
</script>

<template>
  <BottomSheet :show="show" title="📍 Quán gần đây" maxWidth="sm:max-w-sm" icon="📍" icon-gradient="from-blue-400 to-cyan-400" @close="emit('close')">
    <template #default>
      <p v-if="error" class="text-xs text-red-500 dark:text-red-400 text-center mb-3">{{ error }}</p>

      <div class="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-hide">
        <div v-if="loading" class="text-center py-8">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
            <Icon icon="lucide:loader-2" class="size-5 text-blue-500 animate-spin" />
          </div>
          <p class="text-sm text-stone-400 dark:text-stone-500">Đang tìm quán gần nhất...</p>
        </div>

        <template v-else>
          <div v-for="(place, i) in places" :key="i"
               @click="emit('select', place)"
               class="bg-stone-50 dark:bg-stone-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 active:scale-[0.98] animate-slide-up"
               :style="{ animationDelay: `${i * 50}ms` }">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-sm font-bold text-orange-500 shrink-0">
              {{ formatDistance(place.distance) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ place.name }}</p>
              <p class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ place.dish }} • {{ place.dist }}</p>
            </div>
            <Icon icon="lucide:chevron-right" class="size-4 text-stone-300 dark:text-stone-600 shrink-0" />
          </div>

          <div v-if="places.length === 0" class="text-center py-6 text-stone-300 dark:text-stone-600">
            <p class="text-sm">{{ t.noNearby }}</p>
          </div>
        </template>
      </div>
    </template>
  </BottomSheet>
</template>
