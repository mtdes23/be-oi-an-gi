import { ref, watch, onMounted } from 'vue'

const isDark = ref(false)

function loadDarkMode() {
  try {
    const saved = localStorage.getItem('be-oi-dark-mode')
    if (saved !== null) {
      isDark.value = saved === 'true'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  } catch {
    isDark.value = false
  }
}

function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function toggleDarkMode() {
  isDark.value = !isDark.value
  localStorage.setItem('be-oi-dark-mode', isDark.value)
  applyTheme()
}

export function useDarkMode() {
  onMounted(() => {
    loadDarkMode()
  })

  watch(isDark, applyTheme)

  return {
    isDark,
    toggleDarkMode
  }
}
