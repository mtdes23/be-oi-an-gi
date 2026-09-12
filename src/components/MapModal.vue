<script setup>
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'
import MapView from './MapView.vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  places: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null }
})

const emit = defineEmits(['close', 'select'])

const { t } = useI18n()
</script>

<template>
  <BottomSheet :show="show" title="🗺️ Bản đồ quán ăn" maxWidth="sm:max-w-2xl" icon="🗺️" icon-gradient="from-emerald-400 to-teal-400" @close="emit('close')">
    <template #default>
      <p class="text-xs text-stone-400 dark:text-stone-500 text-center mb-3">{{ places.length }} quán trên bản đồ</p>
      <MapView :places="places" :user-location="userLocation" @select="(place) => emit('select', place)" />
    </template>
    <template #footer>
      <button @click="emit('close')" class="w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-all mt-4 active:scale-[0.98]">
        {{ t.close }}
      </button>
    </template>
  </BottomSheet>
</template>
