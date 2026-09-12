<script setup>
import { Icon } from '@iconify/vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  history: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'clear', 'select'])

const formatTime = (ts) => {
  const d = new Date(ts)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <BottomSheet :show="show" title="🕐 Lịch sử quay" maxWidth="sm:max-w-2xl" @close="emit('close')">
    <template #default>
      <div class="flex justify-end mb-3">
        <button v-if="history.length" @click="emit('clear')" class="text-xs text-stone-400 hover:text-rose-500 transition-colors font-medium px-3 py-2 min-h-[36px] active:scale-95">
          Xóa tất cả
        </button>
      </div>

      <div v-if="history.length === 0" class="text-center py-8 text-stone-300 dark:text-stone-600">
        <Icon icon="lucide:history" class="size-10 mx-auto mb-2 animate-float" />
        <p class="text-sm">Chưa có lịch sử</p>
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
        <div v-for="(item, i) in history" :key="i"
             class="bg-stone-50 dark:bg-stone-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 active:scale-[0.98] animate-slide-up"
             :style="{ animationDelay: `${i * 40}ms` }"
             @click="emit('select', item)">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ item.name }}</p>
            <p class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ item.dish }} • {{ item.dist }}</p>
          </div>
          <span class="text-[0.65rem] text-stone-300 dark:text-stone-600 ml-3 whitespace-nowrap">{{ formatTime(item.timestamp) }}</span>
        </div>
      </div>
    </template>
  </BottomSheet>
</template>
