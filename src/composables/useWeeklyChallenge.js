import { ref } from 'vue'

const weeklyChallenge = ref({ spinsThisWeek: 0, completed: false, weekStart: '', dailySpins: {} })

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

function loadWeeklyChallenge() {
  try {
    const saved = localStorage.getItem('be-oi-weekly-challenge')
    if (saved) {
      const data = JSON.parse(saved)
      const currentWeek = getWeekStart()
      if (data.weekStart === currentWeek) {
        weeklyChallenge.value = data
        return
      }
    }
    resetWeeklyChallenge()
  } catch {
    resetWeeklyChallenge()
  }
}

function resetWeeklyChallenge() {
  weeklyChallenge.value = { spinsThisWeek: 0, completed: false, weekStart: getWeekStart(), dailySpins: {} }
  saveWeeklyChallenge()
}

function saveWeeklyChallenge() {
  localStorage.setItem('be-oi-weekly-challenge', JSON.stringify(weeklyChallenge.value))
}

function updateWeeklyChallenge() {
  const today = new Date().toISOString().split('T')[0]
  const currentWeek = getWeekStart()

  if (weeklyChallenge.value.weekStart !== currentWeek) {
    resetWeeklyChallenge()
  }

  if (!weeklyChallenge.value.dailySpins[today]) {
    weeklyChallenge.value.dailySpins[today] = 0
  }
  weeklyChallenge.value.dailySpins[today]++
  weeklyChallenge.value.spinsThisWeek++

  const daysWithSpins = Object.keys(weeklyChallenge.value.dailySpins).filter(
    d => weeklyChallenge.value.dailySpins[d] > 0
  ).length
  if (daysWithSpins >= 5) {
    weeklyChallenge.value.completed = true
  }

  saveWeeklyChallenge()
}

function getWeeklyProgress() {
  const today = new Date().toISOString().split('T')[0]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const currentWeek = getWeekStart()
  const start = new Date(currentWeek)

  return days.map((day, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      day,
      date: dateStr,
      spins: weeklyChallenge.value.dailySpins[dateStr] || 0,
      isToday: dateStr === today,
      isPast: dateStr < today
    }
  })
}

export function useWeeklyChallenge() {
  loadWeeklyChallenge()

  return {
    weeklyChallenge,
    updateWeeklyChallenge,
    getWeeklyProgress,
    resetWeeklyChallenge
  }
}
