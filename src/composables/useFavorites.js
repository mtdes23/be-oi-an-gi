import { ref, computed } from 'vue'
import { debouncedSet } from './useLocalStorage.js'

const favorites = ref([])

function loadFavorites() {
  try {
    const saved = localStorage.getItem('be-oi-favorites')
    if (saved) favorites.value = JSON.parse(saved)
  } catch {
    favorites.value = []
  }
}

function saveFavorites() {
  debouncedSet('be-oi-favorites', JSON.stringify(favorites.value))
}

function toggleFavorite(restaurant) {
  const index = favorites.value.findIndex(f => f.name === restaurant.name && f.dist === restaurant.dist)
  if (index >= 0) {
    favorites.value.splice(index, 1)
  } else {
    favorites.value.unshift({ ...restaurant, addedAt: Date.now() })
  }
  saveFavorites()
}

function isFavorite(restaurant) {
  return favorites.value.some(f => f.name === restaurant.name && f.dist === restaurant.dist)
}

function removeFavorite(index) {
  favorites.value.splice(index, 1)
  saveFavorites()
}

function clearFavorites() {
  favorites.value = []
  saveFavorites()
}

const favoriteCount = computed(() => favorites.value.length)

export function useFavorites() {
  loadFavorites()

  return {
    favorites,
    favoriteCount,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    clearFavorites
  }
}
