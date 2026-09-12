<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { DISTRICT_CATEGORIES } from '../data/districts.js'
import { useI18n } from '../composables/useI18n.js'

const props = defineProps({
  selectedDist: { type: String, default: 'Tất cả' },
  selectedType: { type: String, default: 'Tất cả' },
  searchQuery: { type: String, default: '' },
  typeList: { type: Array, default: () => [] },
  resultCount: { type: Number, default: 0 },
  spinCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:selectedDist', 'update:selectedType', 'update:searchQuery', 'resetWheel'])

const { locale, t } = useI18n()
</script>

<template>
  <div class="w-full max-w-3xl mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
    <!-- Search -->
    <div class="sm:col-span-1">
      <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.search }}</label>
      <div class="relative">
        <input :value="searchQuery" @input="emit('update:searchQuery', $event.target.value)" type="text" :placeholder="t.searchPlaceholder"
          class="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 transition-all card-shadow font-medium outline-none" />
        <Icon icon="lucide:search" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
      </div>
    </div>

    <!-- District -->
    <div>
      <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.district }}</label>
      <div class="relative">
        <select :value="selectedDist" @change="emit('update:selectedDist', $event.target.value); emit('resetWheel')"
          class="w-full appearance-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 transition-all cursor-pointer card-shadow font-medium outline-none">
          <option value="Tất cả">Tất cả khu vực</option>
          <optgroup v-for="(dists, category) in DISTRICT_CATEGORIES" :key="category" :label="category.replace('_', ' ')">
            <option v-for="dist in dists" :key="dist" :value="dist">{{ dist }}</option>
          </optgroup>
        </select>
        <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
      </div>
    </div>

    <!-- Type -->
    <div>
      <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.foodType }}</label>
      <div class="relative">
        <select :value="selectedType" @change="emit('update:selectedType', $event.target.value); emit('resetWheel')"
          class="w-full appearance-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 transition-all cursor-pointer card-shadow font-medium outline-none">
          <option v-for="type in typeList" :key="type" :value="type">{{ type === 'Tất cả' ? 'Tất cả loại món' : type }}</option>
        </select>
        <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
      </div>
    </div>
  </div>
</template>
