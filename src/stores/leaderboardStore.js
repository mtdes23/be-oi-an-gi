import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { debouncedSet } from '../composables/useLocalStorage.js'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const leaderboard = ref([])
  const currentRank = ref(null)

  const leaderboardCount = computed(() => leaderboard.value.length)

  function loadLeaderboard() {
    try {
      const saved = localStorage.getItem('be-oi-leaderboard')
      if (saved) {
        leaderboard.value = JSON.parse(saved)
        sortLeaderboard()
      }
    } catch {
      leaderboard.value = []
    }
  }

  function saveLeaderboard() {
    debouncedSet('be-oi-leaderboard', JSON.stringify(leaderboard.value))
  }

  function sortLeaderboard() {
    leaderboard.value.sort((a, b) => b.score - a.score)
    leaderboard.value = leaderboard.value.slice(0, 50)
  }

  function updateScore(userName, spinsToday, weeklySpins, favoritesCount) {
    const score = spinsToday * 10 + weeklySpins * 5 + favoritesCount * 2

    const existing = leaderboard.value.find(e => e.name === userName)
    if (existing) {
      existing.score = score
      existing.spinsToday = spinsToday
      existing.weeklySpins = weeklySpins
      existing.favoritesCount = favoritesCount
      existing.lastUpdate = Date.now()
    } else {
      leaderboard.value.push({
        name: userName,
        score,
        spinsToday,
        weeklySpins,
        favoritesCount,
        lastUpdate: Date.now()
      })
    }

    sortLeaderboard()
    saveLeaderboard()
    updateCurrentRank(userName)
  }

  function updateCurrentRank(userName) {
    const index = leaderboard.value.findIndex(e => e.name === userName)
    currentRank.value = index >= 0 ? index + 1 : null
  }

  function getTopPlayers(count = 10) {
    return leaderboard.value.slice(0, count)
  }

  function getMyRank(userName) {
    const index = leaderboard.value.findIndex(e => e.name === userName)
    if (index < 0) return null
    return { rank: index + 1, ...leaderboard.value[index] }
  }

  return {
    leaderboard, currentRank, leaderboardCount,
    loadLeaderboard, updateScore, getTopPlayers, getMyRank, sortLeaderboard
  }
})
