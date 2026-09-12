import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { debouncedSet } from '../composables/useLocalStorage.js'

export const useAppStore = defineStore('app', () => {
  const history = ref([])
  const spinCount = ref(0)
  const showHistory = ref(false)
  const showStats = ref(false)
  const showFavorites = ref(false)
  const showLeaderboard = ref(false)
  const showMapView = ref(false)
  const showNearby = ref(false)
  const showChallenge = ref(false)
  const isSpinning = ref(false)
  const randomPlace = ref(null)

  const historyCount = computed(() => history.value.length)

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('be-oi-an-gi-history')
      if (saved) history.value = JSON.parse(saved)
      const savedCount = localStorage.getItem('be-oi-an-gi-spin-count')
      if (savedCount) spinCount.value = parseInt(savedCount)
    } catch {}
  }

  function addHistory(entry) {
    history.value.unshift({ ...entry, timestamp: Date.now() })
    if (history.value.length > 20) history.value = history.value.slice(0, 20)
    debouncedSet('be-oi-an-gi-history', JSON.stringify(history.value))
  }

  function incrementSpin() {
    spinCount.value++
    debouncedSet('be-oi-an-gi-spin-count', spinCount.value)
  }

  function clearHistory() {
    history.value = []
    localStorage.removeItem('be-oi-an-gi-history')
  }

  return {
    history, spinCount, showHistory, showStats, showFavorites,
    showLeaderboard, showMapView, showNearby, showChallenge,
    isSpinning, randomPlace, historyCount,
    loadFromStorage, addHistory, incrementSpin, clearHistory
  }
})
