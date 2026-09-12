import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  const show = (message, type = 'success', duration = 2500) => {
    const id = nextId++
    toasts.value.push({ id, message, type, duration, show: true })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value[idx].show = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }
  }

  const success = (msg, duration) => show(msg, 'success', duration)
  const error = (msg, duration) => show(msg, 'error', duration)
  const warning = (msg, duration) => show(msg, 'warning', duration)
  const info = (msg, duration) => show(msg, 'info', duration)

  return { toasts, show, remove, success, error, warning, info }
}
