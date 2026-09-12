import { ref, watch } from 'vue'

export function useDebounce(source, delay = 300) {
  const debounced = ref(source.value)
  let timer = null

  watch(source, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delay)
  })

  return debounced
}
