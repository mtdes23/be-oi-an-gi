<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  spinCount: { type: Number, default: 0 },
  history: { type: Array, default: () => [] },
  favoriteCount: { type: Number, default: 0 }
})

const emit = defineEmits(['close'])

const stats = computed(() => {
  const types = {}
  const dists = {}
  props.history.forEach(h => {
    types[h.type] = (types[h.type] || 0) + 1
    dists[h.dist] = (dists[h.dist] || 0) + 1
  })
  return { types, dists }
})
</script>

<template>
  <BottomSheet :show="show" title="📊 Thống kê" maxWidth="sm:max-w-2xl" @close="emit('close')">
    <template #default>
      <div class="grid grid-cols-3 gap-3 sm:gap-4">
        <div class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 text-center border border-orange-100 dark:border-orange-900/30 animate-stagger stagger-1">
          <div class="text-2xl sm:text-3xl font-bold text-orange-500 font-display animate-counter-pop">{{ spinCount }}</div>
          <div class="text-xs text-stone-400 mt-1 font-medium">Lượt quay</div>
        </div>
        <div class="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-4 text-center border border-rose-100 dark:border-rose-900/30 animate-stagger stagger-2">
          <div class="text-2xl sm:text-3xl font-bold text-rose-400 font-display animate-counter-pop">{{ history.length }}</div>
          <div class="text-xs text-stone-400 mt-1 font-medium">Đã lưu</div>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 text-center border border-amber-100 dark:border-amber-900/30 animate-stagger stagger-3">
          <div class="text-2xl sm:text-3xl font-bold text-amber-500 font-display animate-counter-pop">{{ favoriteCount }}</div>
          <div class="text-xs text-stone-400 mt-1 font-medium">Yêu thích</div>
        </div>
      </div>
      <div v-if="Object.keys(stats.types).length" class="mt-4 animate-stagger stagger-4">
        <h4 class="text-xs text-stone-400 uppercase font-bold tracking-wider mb-2">Món ăn yêu thích</h4>
        <div class="flex flex-wrap gap-2">
          <span v-for="(count, type) in stats.types" :key="type" class="px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 text-xs font-medium text-orange-600 dark:text-orange-400 transition-all hover:scale-105">
            {{ type }} ({{ count }})
          </span>
        </div>
      </div>
    </template>
  </BottomSheet>
</template>
