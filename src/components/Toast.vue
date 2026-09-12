<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info, success, warning, error
  duration: { type: Number, default: 3000 },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

let timer = null

const typeConfig = {
  info: { icon: 'lucide:info', gradient: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
  success: { icon: 'lucide:check-circle', gradient: 'from-green-400 to-emerald-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400' },
  warning: { icon: 'lucide:alert-triangle', gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400' },
  error: { icon: 'lucide:x-circle', gradient: 'from-red-400 to-rose-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400' }
}

const config = () => typeConfig[props.type] || typeConfig.info

onMounted(() => {
  if (props.show && props.duration > 0) {
    timer = setTimeout(() => emit('close'), props.duration)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <transition name="toast">
    <div v-if="show"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-sm w-[calc(100%-2rem)]"
      role="alert"
      aria-live="polite">
      <div class="flex items-center gap-3 p-4 rounded-2xl border card-shadow-lg animate-bounce-in"
           :class="[config().bg, config().border]">
        <div :class="['w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0', config().gradient]">
          <Icon :icon="config().icon" class="size-4 text-white" />
        </div>
        <p :class="['text-sm font-medium flex-1', config().text]">{{ message }}</p>
        <button @click="emit('close')" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1 active:scale-90">
          <Icon icon="lucide:x" class="size-4" />
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.3s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px) scale(0.95);
}
</style>
