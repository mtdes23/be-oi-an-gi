<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  iconGradient: { type: String, default: 'from-orange-400 to-amber-400' },
  maxWidth: { type: String, default: 'sm:max-w-sm' }
})

const emit = defineEmits(['close'])

const sheetRef = ref(null)
const dragY = ref(0)
const isDragging = ref(false)
let startY = 0

const onTouchStart = (e) => {
  startY = e.touches[0].clientY
  isDragging.value = true
}

const onTouchMove = (e) => {
  if (!isDragging.value) return
  const delta = e.touches[0].clientY - startY
  if (delta > 0) {
    dragY.value = delta
  }
}

const onTouchEnd = () => {
  isDragging.value = false
  if (dragY.value > 100) {
    emit('close')
  }
  dragY.value = 0
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

watch(() => props.show, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <transition name="modal">
    <div v-if="show"
      class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="emit('close')">
      <div
        ref="sheetRef"
        :class="[maxWidth, 'w-full bg-white dark:bg-stone-800 sm:rounded-3xl rounded-t-3xl p-5 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700 max-h-[85vh] max-h-[85dvh] overflow-y-auto focus:outline-none']"
        :style="{ transform: `translateY(${dragY}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }"
        tabindex="-1"
        @click.stop
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Drag handle (mobile) -->
        <div class="sm:hidden flex justify-center mb-3 -mt-2 cursor-grab active:cursor-grabbing">
          <div class="w-10 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 transition-colors hover:bg-stone-400 dark:hover:bg-stone-500"></div>
        </div>

        <!-- Close button -->
        <button @click="emit('close')"
          class="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10 active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Đóng">
          <Icon icon="lucide:x" class="size-4 sm:size-5" />
        </button>

        <!-- Header with icon -->
        <div v-if="icon || title" class="text-center mb-5">
          <div v-if="icon" :class="[`bg-gradient-to-br ${iconGradient}`, 'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg']">
            {{ icon }}
          </div>
          <h3 v-if="title" class="text-xl font-bold text-stone-800 dark:text-stone-100 font-display">{{ title }}</h3>
        </div>

        <!-- Content -->
        <slot />

        <!-- Footer (optional) -->
        <slot name="footer" />
      </div>
    </div>
  </transition>
</template>
