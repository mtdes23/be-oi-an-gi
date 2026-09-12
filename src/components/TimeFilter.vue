<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  options: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'change'])
</script>

<template>
  <div class="w-full max-w-3xl mb-5 sm:mb-8">
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      <button v-for="opt in options" :key="opt.value" @click="emit('update:modelValue', opt.value); emit('change')"
        class="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 min-h-[40px]"
        :class="modelValue === opt.value ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg shadow-orange-200/50' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-orange-300 hover:text-orange-500'">
        {{ opt.icon }} {{ opt.label }}
      </button>
    </div>
  </div>
</template>
