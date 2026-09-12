<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { database } from '../data/database.js'
import { DISTRICT_LOCATIONS } from '../data/locations.js'
import { useFavorites } from '../composables/useFavorites.js'
import { useI18n } from '../composables/useI18n.js'
import { useDebounce } from '../composables/useDebounce.js'
import { useHaptics } from '../composables/useHaptics.js'
import { useAppStore } from '../stores/appStore.js'
import { useChallengeStore } from '../stores/challengeStore.js'
import { useLeaderboardStore } from '../stores/leaderboardStore.js'
import { Icon } from '@iconify/vue'
import AppHeader from '../components/AppHeader.vue'
import FilterBar from '../components/FilterBar.vue'
import TimeFilter from '../components/TimeFilter.vue'
import QuickActions from '../components/QuickActions.vue'
import WheelSpin from '../components/WheelSpin.vue'
import ResultModal from '../components/ResultModal.vue'
import StatsPanel from '../components/StatsPanel.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import FavoritesPanel from '../components/FavoritesPanel.vue'
import ChallengeModal from '../components/ChallengeModal.vue'
import LeaderboardPanel from '../components/LeaderboardPanel.vue'
import MapModal from '../components/MapModal.vue'
import NearbyModal from '../components/NearbyModal.vue'
import ToastContainer from '../components/ToastContainer.vue'

const { favorites, toggleFavorite, isFavorite, favoriteCount } = useFavorites()
const { t } = useI18n()
const appStore = useAppStore()
const challengeStore = useChallengeStore()
const leaderboardStore = useLeaderboardStore()
const haptics = useHaptics()

const selectedDist = ref('Tất cả')
const selectedType = ref('Tất cả')
const searchQuery = ref('')
const debouncedSearchQuery = useDebounce(searchQuery, 300)

const timeFilter = ref('all')
const timeOptions = [
  { value: 'all', label: 'Tất cả', icon: '🍽️' },
  { value: 'morning', label: 'Sáng (5h-10h)', icon: '🌅' },
  { value: 'lunch', label: 'Trưa (10h-14h)', icon: '☀️' },
  { value: 'afternoon', label: 'Chiều (14h-17h)', icon: '🌤️' },
  { value: 'evening', label: 'Tối (17h-22h)', icon: '🌙' },
  { value: 'latenight', label: 'Đêm (22h-5h)', icon: '🌃' }
]

const getTimeCategory = (timeStr) => {
  if (!timeStr) return 'all'
  const match = timeStr.match(/(\d{1,2})[h:]/)
  if (!match) return 'all'
  const hour = parseInt(match[1])
  if (hour >= 5 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'latenight'
}

const userLocation = ref(null)
const nearbyPlaces = ref([])
const locationLoading = ref(false)
const locationError = ref('')

const spinMode = ref('all') // 'all' or 'favorites'
const wheelItems = ref([])
const wheelRotation = ref(0)
const wheelSlices = 12

onMounted(() => {
  appStore.loadFromStorage()
  challengeStore.loadDailyChallenge()
  challengeStore.loadWeeklyChallenge()
  leaderboardStore.loadLeaderboard()
  detectTimeOfDay()
})

const detectTimeOfDay = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) timeFilter.value = 'morning'
  else if (hour >= 10 && hour < 14) timeFilter.value = 'lunch'
  else if (hour >= 14 && hour < 17) timeFilter.value = 'afternoon'
  else if (hour >= 17 && hour < 22) timeFilter.value = 'evening'
  else timeFilter.value = 'latenight'
}

const typeList = computed(() => {
  const types = new Set(database.map((p) => p.type).filter(Boolean))
  return ['Tất cả', ...Array.from(types).sort()]
})

const filteredDatabase = computed(() => {
  const query = debouncedSearchQuery.value
  return database.filter((p) => {
    const matchDist = selectedDist.value === 'Tất cả' || p.dist === selectedDist.value
    const matchType = selectedType.value === 'Tất cả' || p.type === selectedType.value
    const matchSearch = !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.dish.toLowerCase().includes(query.toLowerCase()) ||
      p.addr.toLowerCase().includes(query.toLowerCase())
    if (timeFilter.value === 'all') return matchDist && matchType && matchSearch
    const timeCat = getTimeCategory(p.time)
    return matchDist && matchType && matchSearch && timeCat === timeFilter.value
  })
})

const resultCount = computed(() => filteredDatabase.value.length)

const activeList = computed(() => {
  if (spinMode.value === 'favorites' && favorites.value.length > 0) {
    return favorites.value
  }
  return filteredDatabase.value
})

const resetWheel = () => {
  const list = activeList.value
  if (list.length === 0) return
  const items = []
  for (let i = 0; i < wheelSlices; i++) {
    items.push(list[Math.floor(Math.random() * list.length)])
  }
  wheelItems.value = items
  appStore.randomPlace = null
}

watch(activeList, resetWheel, { immediate: true })

const pickRandom = () => {
  if (appStore.isSpinning) return

  const currentList = activeList.value
  if (currentList.length === 0) return

  appStore.isSpinning = true
  appStore.randomPlace = null
  haptics.impact('medium')

  if (wheelItems.value.length === 0) resetWheel()

  const winner = currentList[Math.floor(Math.random() * currentList.length)]
  const winnerSliceIndex = Math.floor(Math.random() * wheelSlices)
  wheelItems.value[winnerSliceIndex] = winner

  const sliceAngle = 360 / wheelSlices
  const targetAngle = winnerSliceIndex * sliceAngle + (sliceAngle / 2)
  const spins = 6
  const currentRot = wheelRotation.value
  const normalizedCurrent = currentRot % 360
  let extraRotation = (360 * spins) + (360 - targetAngle) - normalizedCurrent
  const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.7)
  wheelRotation.value += extraRotation + randomOffset

  const wheelEl = document.querySelector('.wheel-svg')
  const onEnd = () => {
    wheelEl?.removeEventListener('transitionend', onEnd)
    clearTimeout(fallback)
    handleResult(winner)
  }
  const fallback = setTimeout(onEnd, 5500)
  wheelEl?.addEventListener('transitionend', onEnd, { once: true })
}

const handleResult = (winner) => {
  appStore.isSpinning = false
  appStore.randomPlace = winner
  appStore.incrementSpin()
  appStore.addHistory(winner)
  challengeStore.updateDailyChallenge()
  challengeStore.updateWeeklyChallenge()
  haptics.notification('success')
}

const findNearby = () => {
  if (!navigator.geolocation) {
    locationError.value = 'Trình duyệt không hỗ trợ GPS'
    return
  }
  locationLoading.value = true
  locationError.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      calculateNearby()
      locationLoading.value = false
    },
    () => {
      locationError.value = 'Không thể lấy vị trí. Hãy cho phép truy cập GPS.'
      locationLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

const calculateNearby = () => {
  if (!userLocation.value) return
  nearbyPlaces.value = database
    .map(p => {
      const dist = getDistance(userLocation.value.lat, userLocation.value.lng, p)
      return { ...p, distance: dist }
    })
    .filter(p => p.distance !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10)
  appStore.showNearby = true
}

const getDistance = (lat, lng, place) => {
  const loc = DISTRICT_LOCATIONS[place.dist]
  if (!loc) return null
  const R = 6371
  const dLat = (loc.lat - lat) * Math.PI / 180
  const dLng = (loc.lng - lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden transition-colors duration-300">

    <!-- Background decorations -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden contain-strict">
      <div class="bg-blob absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-200/40 dark:bg-orange-900/20 rounded-full blur-[100px] will-change-transform"></div>
      <div class="bg-blob absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-[100px] will-change-transform"></div>
      <div class="bg-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-50/40 dark:bg-yellow-900/10 rounded-full blur-[120px] will-change-transform"></div>
    </div>

      <!-- Toast -->
      <ToastContainer />

    <!-- Header -->
    <AppHeader
      :resultCount="resultCount"
      :spinCount="appStore.spinCount"
      :historyCount="appStore.historyCount"
      @toggle-favorites="appStore.showFavorites = !appStore.showFavorites"
      @toggle-leaderboard="appStore.showLeaderboard = !appStore.showLeaderboard"
      @toggle-stats="appStore.showStats = !appStore.showStats"
      @toggle-history="appStore.showHistory = !appStore.showHistory"
    />

    <main class="relative z-10 flex-1 flex flex-col items-center px-4 w-full max-w-5xl mx-auto pb-8 sm:pb-16">

      <!-- Title -->
      <div class="text-center mb-6 sm:mb-8 mt-2">
        <h1 class="text-[2.25rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-3 font-display">
          <span class="bg-gradient-to-r from-orange-500 via-rose-400 to-amber-500 bg-clip-text text-transparent">{{ t.title }}</span>
        </h1>
        <p class="text-stone-400 dark:text-stone-500 text-[0.85rem] sm:text-base font-medium">
          {{ t.subtitle }}
        </p>
      </div>

      <!-- Filters -->
      <FilterBar
        v-model:selectedDist="selectedDist"
        v-model:selectedType="selectedType"
        v-model:searchQuery="searchQuery"
        :typeList="typeList"
        :resultCount="resultCount"
        :spinCount="appStore.spinCount"
        @reset-wheel="resetWheel"
      />

      <!-- Quick Actions -->
      <QuickActions
        :locationLoading="locationLoading"
        :hasChallenge="challengeStore.dailyCompleted && challengeStore.weeklyCompleted"
        :spinMode="spinMode"
        :favoriteCount="favoriteCount"
        @find-nearby="findNearby"
        @open-map="appStore.showMapView = true"
        @open-challenge="appStore.showChallenge = true"
        @toggle-spin-mode="spinMode = spinMode === 'all' ? 'favorites' : 'all'"
      />

      <!-- Time Filter -->
      <TimeFilter v-model="timeFilter" :options="timeOptions" @change="resetWheel" />

      <!-- Wheel -->
      <WheelSpin
        :items="wheelItems"
        :rotation="wheelRotation"
        :isSpinning="appStore.isSpinning"
        :hasResult="!!appStore.randomPlace"
      />

      <!-- Spin Button -->
      <div class="flex flex-col items-center mb-6 w-full">
        <button @click="pickRandom" :disabled="appStore.isSpinning || activeList.length === 0"
          class="group relative px-12 py-4 sm:px-16 sm:py-4.5 rounded-2xl font-bold text-base sm:text-lg tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto overflow-hidden card-shadow-lg active:scale-95"
          :class="appStore.isSpinning ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500' : 'bg-gradient-to-r from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500 hover:shadow-xl hover:shadow-orange-200/50'">
          <span class="relative z-10 flex items-center justify-center gap-3">
            <Icon :icon="appStore.isSpinning ? 'lucide:loader-2' : 'lucide:sparkles'" :class="{ 'animate-spin': appStore.isSpinning }" class="size-5" />
            {{ appStore.isSpinning ? t.spinning : activeList.length === 0 ? 'Không có quán nào' : spinMode === 'favorites' ? 'Quay từ yêu thích ❤️' : t.spin }}
          </span>
          <div v-if="!appStore.isSpinning" class="absolute inset-0 animate-shimmer rounded-2xl pointer-events-none"></div>
        </button>
        <p v-if="spinMode === 'favorites'" class="text-xs text-rose-400 dark:text-rose-500 mt-2 font-medium">
          Đang quay từ {{ favoriteCount }} quán yêu thích
        </p>
        <p v-else class="text-xs text-stone-400 dark:text-stone-500 mt-2 font-medium">
          {{ activeList.length }} quán khả dụng
        </p>
      </div>

      <!-- Stats Panel -->
      <StatsPanel :show="appStore.showStats" :spinCount="appStore.spinCount" :history="appStore.history" :favoriteCount="favoriteCount" @close="appStore.showStats = false" />

      <!-- Favorites Panel -->
      <FavoritesPanel :show="appStore.showFavorites" @close="appStore.showFavorites = false" @select="(item) => { appStore.randomPlace = item; appStore.showFavorites = false }" />

      <!-- Leaderboard Panel -->
      <LeaderboardPanel :show="appStore.showLeaderboard" @close="appStore.showLeaderboard = false" />

      <!-- History Panel -->
      <HistoryPanel :show="appStore.showHistory" :history="appStore.history" @close="appStore.showHistory = false" @clear="appStore.clearHistory" @select="(item) => { appStore.randomPlace = item; appStore.showHistory = false }" />

      <!-- Result Modal -->
      <ResultModal v-if="appStore.randomPlace && !appStore.isSpinning" :place="appStore.randomPlace" @close="appStore.randomPlace = null" />

      <!-- Map Modal -->
      <MapModal :show="appStore.showMapView" :places="filteredDatabase" :user-location="userLocation" @close="appStore.showMapView = false" @select="(place) => { appStore.randomPlace = place; appStore.showMapView = false }" />

      <!-- Nearby Modal -->
      <NearbyModal :show="appStore.showNearby" :places="nearbyPlaces" :loading="locationLoading" :error="locationError" @close="appStore.showNearby = false" @select="(place) => { appStore.randomPlace = place; appStore.showNearby = false }" />

      <!-- Challenge Modal -->
      <ChallengeModal :show="appStore.showChallenge" @close="appStore.showChallenge = false" />

      <!-- Footer -->
      <footer class="mt-8 sm:mt-12 text-center pb-4">
        <p class="text-[0.7rem] sm:text-xs text-stone-300 dark:text-stone-600 font-medium">
          Designed by <a href="https://www.mtdes23.id.vn" target="_blank" class="hover:text-orange-400 transition-colors">mtdes23</a> • <a href="https://www.mtdes23.id.vn" target="_blank" class="hover:text-orange-400 transition-colors">www.mtdes23.id.vn</a>
        </p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.safe-top { padding-top: env(safe-area-inset-top); }

.bg-blob { animation: bg-drift 20s ease-in-out infinite; }
.bg-blob:nth-child(2) { animation-delay: -7s; }
.bg-blob:nth-child(3) { animation-delay: -14s; }

@media (min-width: 640px) {
  .animate-bounce-in { animation-name: bounce-in-desktop; }
}
</style>
