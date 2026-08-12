<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { database } from '../data/database.js'
import { DISTRICT_CATEGORIES, getProvinceDisplay } from '../data/districts.js'
import { useAuth } from '../composables/useAuth.js'
import { useDarkMode } from '../composables/useDarkMode.js'
import { useFavorites } from '../composables/useFavorites.js'
import { useWeeklyChallenge } from '../composables/useWeeklyChallenge.js'
import { useLeaderboard } from '../composables/useLeaderboard.js'
import { useI18n } from '../composables/useI18n.js'
import { Icon } from '@iconify/vue'
import html2canvas from 'html2canvas'
import MapView from '../components/MapView.vue'

const { currentUser, isLoading, isLoggedIn, spinsLeft, hasSpins, FREE_SPINS_LOGGED_IN, FREE_SPINS_GUEST, initAuth, registerWithEmail, loginWithEmail, loginWithGoogle, logout, useSpin, canSpin } = useAuth()
const { isDark, toggleDarkMode } = useDarkMode()
const { favorites, favoriteCount, toggleFavorite, isFavorite, removeFavorite, clearFavorites } = useFavorites()
const { weeklyChallenge, updateWeeklyChallenge, getWeeklyProgress } = useWeeklyChallenge()
const { updateScore, getTopPlayers, getMyRank, leaderboardCount } = useLeaderboard()
const { locale, t, toggleLocale } = useI18n()

const randomPlace = ref(null)
const isSpinning = ref(false)
const selectedDist = ref('Tất cả')
const selectedType = ref('Tất cả')
const searchQuery = ref('')
const history = ref([])
const showHistory = ref(false)
const showStats = ref(false)
const showFavorites = ref(false)
const showLeaderboard = ref(false)
const spinCount = ref(0)

// Auth modals
const showAuthModal = ref(false)
const authMode = ref('login')
const authForm = ref({ name: '', email: '', password: '' })
const authError = ref('')
const authLoading = ref(false)
const pendingSpin = ref(false)

// Donate modal
const showDonateModal = ref(false)

// Screenshot
const resultCardRef = ref(null)
const isCapturing = ref(false)

// Time filter
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

// GPS / Nearby
const userLocation = ref(null)
const nearbyPlaces = ref([])
const showNearby = ref(false)
const locationLoading = ref(false)
const locationError = ref('')

// Daily challenge
const dailyChallenge = ref({ spinsToday: 0, completed: false, date: '' })
const showChallenge = ref(false)

// Map view
const showMapView = ref(false)

onMounted(async () => {
  await initAuth()
  const saved = localStorage.getItem('be-oi-an-gi-history')
  if (saved) history.value = JSON.parse(saved)
  const savedCount = localStorage.getItem('be-oi-an-gi-spin-count')
  if (savedCount) spinCount.value = parseInt(savedCount)
  loadDailyChallenge()
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
  return database.filter((p) => {
    const matchDist = selectedDist.value === 'Tất cả' || p.dist === selectedDist.value
    const matchType = selectedType.value === 'Tất cả' || p.type === selectedType.value
    const matchSearch = !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.dish.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.addr.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (timeFilter.value === 'all') return matchDist && matchType && matchSearch
    const timeCat = getTimeCategory(p.time)
    return matchDist && matchType && matchSearch && timeCat === timeFilter.value
  })
})

const resultCount = computed(() => filteredDatabase.value.length)

const stats = computed(() => {
  const types = {}
  const dists = {}
  history.value.forEach(h => {
    types[h.type] = (types[h.type] || 0) + 1
    dists[h.dist] = (dists[h.dist] || 0) + 1
  })
  return { types, dists }
})

const wheelItems = ref([])
const wheelRotation = ref(0)
const wheelSlices = 12

const resetWheel = () => {
  const list = filteredDatabase.value
  if (list.length === 0) return
  const items = []
  for (let i = 0; i < wheelSlices; i++) {
    items.push(list[Math.floor(Math.random() * list.length)])
  }
  wheelItems.value = items
  randomPlace.value = null
}

watch(filteredDatabase, resetWheel, { immediate: true })

const pickRandom = () => {
  if (isSpinning.value) return

  // Check spins
  if (!canSpin()) {
    if (!isLoggedIn.value) {
      showAuthModal.value = true
    } else {
      showDonateModal.value = true
    }
    return
  }

  const currentList = filteredDatabase.value
  if (currentList.length === 0) return

  isSpinning.value = true
  randomPlace.value = null

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

  setTimeout(() => {
    isSpinning.value = false
    randomPlace.value = winner
    useSpin()
    spinCount.value++
    localStorage.setItem('be-oi-an-gi-spin-count', spinCount.value)
    history.value.unshift({ ...winner, timestamp: Date.now() })
    if (history.value.length > 20) history.value = history.value.slice(0, 20)
    localStorage.setItem('be-oi-an-gi-history', JSON.stringify(history.value))
    updateDailyChallenge()
    updateWeeklyChallenge()
    refreshLeaderboard()
  }, 5000)
}

// Daily challenge
const loadDailyChallenge = () => {
  const today = new Date().toISOString().split('T')[0]
  const saved = localStorage.getItem('be-oi-daily-challenge')
  if (saved) {
    const data = JSON.parse(saved)
    if (data.date === today) {
      dailyChallenge.value = data
      return
    }
  }
  dailyChallenge.value = { spinsToday: 0, completed: false, date: today }
}

const updateDailyChallenge = () => {
  const today = new Date().toISOString().split('T')[0]
  if (dailyChallenge.value.date !== today) {
    dailyChallenge.value = { spinsToday: 0, completed: false, date: today }
  }
  dailyChallenge.value.spinsToday++
  if (dailyChallenge.value.spinsToday >= 3) {
    dailyChallenge.value.completed = true
  }
  localStorage.setItem('be-oi-daily-challenge', JSON.stringify(dailyChallenge.value))
}

const shareChallenge = () => {
  const text = `${t.value.title} - ${t.value.dailyChallenge}\n✅ ${dailyChallenge.value.spinsToday}/3 ${t.value.dayProgress}!\n🎮 ${window.location.origin}`
  if (navigator.share) {
    navigator.share({ title: t.value.dailyChallenge, text })
  } else {
    navigator.clipboard.writeText(text)
    alert(t.value.copied)
  }
}

const shareWeeklyChallenge = () => {
  const progress = getWeeklyProgress()
  const daysCompleted = progress.filter(d => d.spins > 0).length
  const text = `${t.value.title} - ${t.value.weeklyChallenge}\n📅 ${daysCompleted}/7 ${t.value.thisWeek.toLowerCase()}!\n🎮 ${window.location.origin}`
  if (navigator.share) {
    navigator.share({ title: t.value.weeklyChallenge, text })
  } else {
    navigator.clipboard.writeText(text)
    alert(t.value.copied)
  }
}

const refreshLeaderboard = () => {
  if (isLoggedIn.value && currentUser.value) {
    updateScore(currentUser.value.name, dailyChallenge.value.spinsToday, weeklyChallenge.value.spinsThisWeek, favoriteCount.value)
  }
}

// Nearby / GPS
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
  showNearby.value = true
}

const getDistance = (lat, lng, place) => {
  const locationMap = {
    'Quận 1': { lat: 10.7721, lng: 106.7019 },
    'Quận 2': { lat: 10.7870, lng: 106.7450 },
    'Quận 3': { lat: 10.7830, lng: 106.6940 },
    'Quận 4': { lat: 10.7600, lng: 106.7060 },
    'Quận 5': { lat: 10.7570, lng: 106.6660 },
    'Quận 7': { lat: 10.7300, lng: 106.7250 },
    'Quận 10': { lat: 10.7730, lng: 106.6700 },
    'Bình Thạnh': { lat: 10.8010, lng: 106.7100 },
    'Phú Nhuận': { lat: 10.7950, lng: 106.6850 },
    'Tân Bình': { lat: 10.8020, lng: 106.6520 },
    'Thủ Đức': { lat: 10.8500, lng: 106.7500 },
    'Gò Vấp': { lat: 10.8380, lng: 106.6650 },
    'Tân Phú': { lat: 10.7910, lng: 106.6290 },
    'Bình Tân': { lat: 10.7720, lng: 106.6080 },
    'Nhà Bè': { lat: 10.6960, lng: 106.7200 },
    'Cần Giờ': { lat: 10.4110, lng: 106.9530 },
  }
  const loc = locationMap[place.dist]
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

const openOrderLink = (place) => {
  const query = `${place.name} ${place.addr} ${place.dist}`
  window.open(`https://shopeefood.vn/search?q=${encodeURIComponent(query)}`, '_blank')
}

const openGrabFood = (place) => {
  const query = `${place.name} ${place.addr} ${place.dist}`
  window.open(`https://food.grab.com/sg/en/search?query=${encodeURIComponent(query)}`, '_blank')
}

const getCoord = (angle, radius) => {
  const rad = (angle - 90) * Math.PI / 180
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) }
}
const getSlicePath = (i, N) => {
  const start = getCoord(i * 360 / N, 50)
  const end = getCoord((i + 1) * 360 / N, 50)
  const largeArcFlag = 360 / N > 180 ? 1 : 0
  return `M 0 0 L ${start.x} ${start.y} A 50 50 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}
const getTextTransform = (i, N) => {
  const angle = i * (360 / N) + (360 / N / 2)
  const coord = getCoord(angle, 35)
  return `translate(${coord.x}, ${coord.y}) rotate(${angle - 90})`
}
const getSliceColor = (i) => {
  const colors = ['#fff7ed', '#fed7aa']
  return colors[i % colors.length]
}
const truncate = (text) => text.length > 14 ? text.substring(0, 14) + '..' : text

const getGoogleMapsLink = (place) => {
  if (!place) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.addr}, ${place.dist}`)}`
}

const shareResult = (place) => {
  const oldDistNote = place.oldDist ? `\n📍 Trước đây thuộc ${place.oldDist}` : ''
  const text = `🍜 Bé ơi ăn gì đã chọn: ${place.name}\n📍 ${place.addr}, ${place.dist}${oldDistNote}\n💰 ${place.price}\n⏰ ${place.time}`
  if (navigator.share) {
    navigator.share({ title: 'Bé ơi ăn gì?', text })
  } else {
    navigator.clipboard.writeText(text)
    alert('Đã copy vào clipboard!')
  }
}

const captureAndShare = async () => {
  if (!resultCardRef.value || isCapturing.value) return
  isCapturing.value = true
  try {
    const canvas = await html2canvas(resultCardRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    })
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'be-oi-an-gi.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: 'Bé ơi ăn gì?', files: [file] })
        } catch {
          downloadImage(canvas)
        }
      } else {
        downloadImage(canvas)
      }
      isCapturing.value = false
    }, 'image/png')
  } catch {
    isCapturing.value = false
  }
}

const downloadImage = (canvas) => {
  const link = document.createElement('a')
  link.download = 'be-oi-an-gi.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const clearHistory = () => {
  history.value = []
  localStorage.removeItem('be-oi-an-gi-history')
}

const formatTime = (ts) => {
  const d = new Date(ts)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const handleAuth = async () => {
  authError.value = ''
  authLoading.value = true
  let result
  if (authMode.value === 'register') {
    result = await registerWithEmail(authForm.value.name, authForm.value.email, authForm.value.password)
  } else {
    result = await loginWithEmail(authForm.value.email, authForm.value.password)
  }
  authLoading.value = false
  if (result.ok) {
    showAuthModal.value = false
    authForm.value = { name: '', email: '', password: '' }
    if (pendingSpin.value) {
      pendingSpin.value = false
      setTimeout(() => pickRandom(), 300)
    }
  } else {
    authError.value = result.msg
  }
}

const handleGoogleLogin = async () => {
  authError.value = ''
  authLoading.value = true
  const result = await loginWithGoogle()
  authLoading.value = false
  if (result.ok) {
    showAuthModal.value = false
    if (pendingSpin.value) {
      pendingSpin.value = false
      setTimeout(() => pickRandom(), 300)
    }
  } else if (result.msg) {
    authError.value = result.msg
  }
}

const switchAuthMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
}
</script>

<template>
  <div :class="isDark ? 'dark' : ''" class="min-h-screen relative overflow-hidden transition-colors duration-300">

    <!-- Background decorations -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-200/40 dark:bg-orange-900/20 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-50/40 dark:bg-yellow-900/10 rounded-full blur-[120px]"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-4 sm:px-6 py-4 sm:py-5">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
            🍜
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100 tracking-tight font-display">{{ t.appName }}</h2>
            <p v-if="isLoading" class="text-[0.65rem] sm:text-xs text-stone-300 dark:text-stone-500 font-medium">{{ t.loading }}</p>
            <p v-else-if="isLoggedIn" class="text-[0.65rem] sm:text-xs text-stone-400 dark:text-stone-400 font-medium">
              Xin chào, {{ currentUser.name }} • {{ t.remaining }} {{ spinsLeft }} {{ t.freeSpins }}
            </p>
            <p v-else class="text-[0.65rem] sm:text-xs text-stone-400 dark:text-stone-400 font-medium">{{ resultCount }} quán • {{ spinCount }} lượt quay</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showFavorites = !showFavorites" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-md transition-all card-shadow relative">
            <Icon icon="lucide:heart" class="size-4 sm:size-5" :class="favoriteCount > 0 ? 'fill-rose-400 text-rose-400' : ''" />
            <span v-if="favoriteCount" class="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center">{{ favoriteCount }}</span>
          </button>
          <button @click="showLeaderboard = !showLeaderboard" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-md transition-all card-shadow relative">
            <Icon icon="lucide:trophy" class="size-4 sm:size-5" />
          </button>
          <button @click="showStats = !showStats" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md transition-all card-shadow">
            <Icon icon="lucide:bar-chart-3" class="size-4 sm:size-5" />
          </button>
          <button @click="showHistory = !showHistory" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md transition-all card-shadow relative">
            <Icon icon="lucide:history" class="size-4 sm:size-5" />
            <span v-if="history.length" class="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center">{{ history.length }}</span>
          </button>
          <button @click="toggleLocale" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-violet-500 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md transition-all card-shadow text-xs font-bold">
            {{ locale === 'vi' ? 'EN' : 'VI' }}
          </button>
          <button @click="toggleDarkMode" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-md transition-all card-shadow">
            <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="size-4 sm:size-5" />
          </button>
          <button v-if="isLoggedIn" @click="logout" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-orange-100 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md transition-all card-shadow">
            <Icon icon="lucide:log-out" class="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </header>

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
      <div class="w-full max-w-3xl mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

        <!-- Search -->
        <div class="sm:col-span-1">
          <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.search }}</label>
          <div class="relative">
            <input v-model="searchQuery" type="text" :placeholder="t.searchPlaceholder"
              class="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 transition-all card-shadow font-medium outline-none" />
            <Icon icon="lucide:search" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>

        <!-- District -->
        <div>
          <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.district }}</label>
          <div class="relative">
            <select v-model="selectedDist" @change="resetWheel"
              class="w-full appearance-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 transition-all cursor-pointer card-shadow font-medium outline-none">
              <option value="Tất cả">Tất cả khu vực</option>
              <optgroup v-for="(dists, category) in DISTRICT_CATEGORIES" :key="category" :label="category.replace('_', ' ')">
                <option v-for="dist in dists" :key="dist" :value="dist">{{ dist }}</option>
              </optgroup>
            </select>
            <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>

        <!-- Type -->
        <div>
          <label class="block text-stone-500 dark:text-stone-400 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">{{ t.foodType }}</label>
          <div class="relative">
            <select v-model="selectedType" @change="resetWheel"
              class="w-full appearance-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 dark:text-stone-200 transition-all cursor-pointer card-shadow font-medium outline-none">
              <option v-for="type in typeList" :key="type" :value="type">{{ type === 'Tất cả' ? 'Tất cả loại món' : type }}</option>
            </select>
            <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="w-full max-w-3xl mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button @click="findNearby" :disabled="locationLoading"
          class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-blue-600 transition-all card-shadow disabled:opacity-50">
          <Icon :icon="locationLoading ? 'lucide:loader-2' : 'lucide:map-pin'" :class="{ 'animate-spin': locationLoading }" class="size-4" />
          {{ t.nearby }}
        </button>
        <button @click="showMapView = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-emerald-600 transition-all card-shadow">
          <Icon icon="lucide:map" class="size-4" />
          {{ t.map }}
        </button>
        <button @click="showChallenge = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-green-600 transition-all card-shadow">
          <Icon icon="lucide:trophy" class="size-4" />
          {{ t.challenge }}
          <span v-if="dailyChallenge.completed && weeklyChallenge.completed" class="w-2 h-2 bg-green-400 rounded-full"></span>
        </button>
      </div>

      <!-- Time Filter -->
      <div class="w-full max-w-3xl mb-6 sm:mb-8">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button v-for="opt in timeOptions" :key="opt.value" @click="timeFilter = opt.value; resetWheel()"
            class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            :class="timeFilter === opt.value ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg shadow-orange-200/50' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-orange-300 hover:text-orange-500'">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Wheel -->
      <div class="relative mb-8 sm:mb-10">
        <!-- Pointer -->
        <div class="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20">
          <div class="w-0 h-0 border-l-[14px] sm:border-l-[18px] border-l-transparent border-r-[14px] sm:border-r-[18px] border-r-transparent border-t-[22px] sm:border-t-[26px] border-t-orange-500 drop-shadow-lg"></div>
        </div>

        <!-- Wheel ring -->
        <div class="w-56 h-56 sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] rounded-full p-2 sm:p-3 bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200 dark:from-orange-900/50 dark:via-amber-900/30 dark:to-yellow-900/40"
             :class="{ 'animate-glow-pulse': !isSpinning && randomPlace }">
          <div class="w-full h-full rounded-full overflow-hidden relative bg-white dark:bg-stone-900 border-4 border-white dark:border-stone-800 card-shadow-lg">
            <svg viewBox="-50 -50 100 100"
                 class="w-full h-full will-change-transform"
                 :style="{ transform: `rotate(${wheelRotation}deg)`, transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 1, 0.1, 1)' : 'none' }">
              <path v-for="(item, i) in wheelItems" :key="i"
                    :d="getSlicePath(i, wheelSlices)"
                    :fill="getSliceColor(i)"
                    stroke="#fff" stroke-width="0.4" />
              <text v-for="(item, i) in wheelItems" :key="`text-${i}`"
                    :transform="getTextTransform(i, wheelSlices)"
                    text-anchor="middle" dominant-baseline="central"
                    :fill="i % 2 === 0 ? '#ea580c' : '#92400e'" font-size="3" font-weight="700"
                    class="pointer-events-none" style="font-family: 'Be Vietnam Pro', sans-serif;">
                {{ truncate(item?.name || '') }}
              </text>
            </svg>

            <!-- Center -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 border-4 border-white dark:border-stone-800 shadow-lg z-20 flex items-center justify-center transition-transform duration-300"
                 :class="{ 'scale-110': !isSpinning && randomPlace }">
              <span class="text-lg sm:text-xl">😋</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Spin Button -->
      <div class="flex flex-col items-center mb-6 w-full">
        <button @click="pickRandom" :disabled="isSpinning || isLoading"
          class="group relative px-12 py-4 sm:px-16 sm:py-4.5 rounded-2xl font-bold text-base sm:text-lg tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto overflow-hidden card-shadow-lg"
          :class="isSpinning ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500' : 'bg-gradient-to-r from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500 hover:shadow-xl hover:shadow-orange-200/50 active:scale-95'">
          <span class="relative z-10 flex items-center justify-center gap-3">
            <Icon :icon="isSpinning || isLoading ? 'lucide:loader-2' : 'lucide:sparkles'" :class="{ 'animate-spin': isSpinning || isLoading }" class="size-5" />
            {{ isSpinning ? t.spinning : isLoading ? t.loading : t.spin }}
          </span>
          <div v-if="!isSpinning && !isLoading" class="absolute inset-0 animate-shimmer rounded-2xl"></div>
        </button>
        <p v-if="!isSpinning && !randomPlace && !isLoading" class="text-stone-400 dark:text-stone-500 text-[0.8rem] sm:text-sm font-medium mt-3 italic">
          <template v-if="isLoggedIn">
            {{ t.remaining }} {{ spinsLeft }}/{{ FREE_SPINS_LOGGED_IN }} {{ t.freeSpins }}
          </template>
          <template v-else-if="spinsLeft > 0">
            {{ t.remaining }} {{ spinsLeft }}/{{ FREE_SPINS_GUEST }} {{ t.freeSpins }} • <button @click="showAuthModal = true" class="text-orange-500 font-bold hover:underline">{{ t.loginToSpin }}</button>
          </template>
          <template v-else>
            {{ t.noSpins }} • <button @click="showAuthModal = true" class="text-orange-500 font-bold hover:underline">{{ t.loginToSpin }}</button>
          </template>
        </p>
      </div>

      <!-- Stats Panel -->
      <transition name="slide">
        <div v-if="showStats" class="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100 dark:border-stone-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">📊 {{ t.stats }}</h3>
            <button @click="showStats = false" class="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 text-center border border-orange-100 dark:border-orange-900/30">
              <div class="text-2xl sm:text-3xl font-bold text-orange-500 font-display">{{ spinCount }}</div>
              <div class="text-xs text-stone-400 mt-1 font-medium">{{ t.totalSpins }}</div>
            </div>
            <div class="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-4 text-center border border-rose-100 dark:border-rose-900/30">
              <div class="text-2xl sm:text-3xl font-bold text-rose-400 font-display">{{ history.length }}</div>
              <div class="text-xs text-stone-400 mt-1 font-medium">{{ t.saved }}</div>
            </div>
            <div class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 text-center border border-amber-100 dark:border-amber-900/30">
              <div class="text-2xl sm:text-3xl font-bold text-amber-500 font-display">{{ favoriteCount }}</div>
              <div class="text-xs text-stone-400 mt-1 font-medium">{{ t.favorited }}</div>
            </div>
          </div>
          <div v-if="Object.keys(stats.types).length" class="mt-4">
            <h4 class="text-xs text-stone-400 uppercase font-bold tracking-wider mb-2">{{ t.topFoodTypes }}</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="(count, type) in stats.types" :key="type" class="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 text-xs font-medium text-orange-600 dark:text-orange-400">
                {{ type }} ({{ count }})
              </span>
            </div>
          </div>
        </div>
      </transition>

      <!-- Favorites Panel -->
      <transition name="slide">
        <div v-if="showFavorites" class="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100 dark:border-stone-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">❤️ {{ t.favorites }}</h3>
            <div class="flex items-center gap-2">
              <button v-if="favorites.length" @click="clearFavorites" class="text-xs text-stone-400 hover:text-rose-500 transition-colors font-medium">{{ t.clearAll }}</button>
              <button @click="showFavorites = false" class="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
            </div>
          </div>
          <div v-if="favorites.length === 0" class="text-center py-8 text-stone-300 dark:text-stone-600">
            <Icon icon="lucide:heart" class="size-10 mx-auto mb-2" />
            <p class="text-sm">{{ t.noFavorites }}</p>
            <p class="text-xs text-stone-300 dark:text-stone-600 mt-1">{{ t.noFavoritesHint }}</p>
          </div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div v-for="(item, i) in favorites" :key="i"
                 class="bg-stone-50 dark:bg-stone-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30"
                 @click="randomPlace = item; showFavorites = false">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ item.name }}</p>
                <p class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ item.dish }} • {{ item.dist }}</p>
              </div>
              <button @click.stop="removeFavorite(i)" class="text-stone-300 hover:text-rose-500 transition-colors p-1">
                <Icon icon="lucide:x" class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Leaderboard Panel -->
      <transition name="slide">
        <div v-if="showLeaderboard" class="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100 dark:border-stone-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">🏆 {{ t.leaderboard }}</h3>
            <button @click="showLeaderboard = false" class="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
          </div>

          <!-- My Rank -->
          <div v-if="isLoggedIn && currentUser" class="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 mb-4 border border-amber-100 dark:border-amber-900/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-200/50">
                  {{ getMyRank(currentUser.name)?.rank || '-' }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-stone-700 dark:text-stone-200">{{ currentUser.name }}</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500">{{ t.score }}: {{ getMyRank(currentUser.name)?.score || 0 }}</p>
                </div>
              </div>
              <button @click="refreshLeaderboard" class="text-xs text-amber-500 hover:text-amber-600 font-medium">
                <Icon icon="lucide:refresh-cw" class="size-4" />
              </button>
            </div>
          </div>

          <!-- Top Players -->
          <div v-if="getTopPlayers().length === 0" class="text-center py-8 text-stone-300 dark:text-stone-600">
            <Icon icon="lucide:trophy" class="size-10 mx-auto mb-2" />
            <p class="text-sm">{{ t.noLeaderboard }}</p>
          </div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div v-for="(player, i) in getTopPlayers()" :key="player.name"
                 class="rounded-xl p-3 flex items-center gap-3 transition-colors border"
                 :class="i < 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-900/30' : 'bg-stone-50 dark:bg-stone-700/50 border-stone-100 dark:border-stone-700'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                   :class="i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-stone-300 text-stone-700' : i === 2 ? 'bg-orange-300 text-orange-700' : 'bg-stone-100 dark:bg-stone-600 text-stone-500 dark:text-stone-400'">
                {{ i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ player.name }}</p>
                <p class="text-xs text-stone-400 dark:text-stone-500">{{ player.spinsToday }} {{ t.dayProgress }} today</p>
              </div>
              <span class="text-sm font-bold text-amber-500">{{ player.score }} pts</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- History Panel -->
      <transition name="slide">
        <div v-if="showHistory" class="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100 dark:border-stone-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">🕐 {{ t.history }}</h3>
            <div class="flex items-center gap-2">
              <button v-if="history.length" @click="clearHistory" class="text-xs text-stone-400 hover:text-rose-500 transition-colors font-medium">{{ t.clearAll }}</button>
              <button @click="showHistory = false" class="text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
            </div>
          </div>
          <div v-if="history.length === 0" class="text-center py-8 text-stone-300 dark:text-stone-600">
            <Icon icon="lucide:history" class="size-10 mx-auto mb-2" />
            <p class="text-sm">{{ t.noHistory }}</p>
          </div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div v-for="(item, i) in history" :key="i"
                 class="bg-stone-50 dark:bg-stone-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30"
                 @click="randomPlace = item; showHistory = false">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ item.name }}</p>
                <p class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ item.dish }} • {{ item.dist }}</p>
              </div>
              <span class="text-[0.65rem] text-stone-300 dark:text-stone-600 ml-3 whitespace-nowrap">{{ formatTime(item.timestamp) }}</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- Result Modal -->
      <transition name="modal">
        <div v-if="randomPlace && !isSpinning" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm" @click.self="randomPlace = null">
          <div ref="resultCardRef" class="w-full max-w-md bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative overflow-hidden animate-bounce-in border border-stone-100 dark:border-stone-700" @click.stop>

            <!-- Close -->
            <button @click="randomPlace = null" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <!-- Favorite -->
            <button @click="toggleFavorite(randomPlace)" class="absolute top-4 right-14 text-stone-300 hover:text-rose-500 bg-stone-100 dark:bg-stone-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:heart" class="size-4 sm:size-5" :class="isFavorite(randomPlace) ? 'fill-rose-500 text-rose-500' : ''" />
            </button>

            <!-- Capture -->
            <button @click="captureAndShare" :disabled="isCapturing" class="absolute top-4 right-24 text-stone-300 hover:text-orange-500 bg-stone-100 dark:bg-stone-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full p-2 transition-all z-10 disabled:opacity-50">
              <Icon :icon="isCapturing ? 'lucide:loader-2' : 'lucide:camera'" :class="{ 'animate-spin': isCapturing }" class="size-4 sm:size-5" />
            </button>

            <!-- Badge -->
            <div class="flex justify-center mb-4">
              <span class="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800/50 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                🎉 {{ t.result }}
              </span>
            </div>

            <!-- Name -->
            <h2 class="text-[1.5rem] sm:text-[1.85rem] font-extrabold text-stone-800 dark:text-stone-100 text-center mb-2 leading-tight font-display">{{ randomPlace.name }}</h2>

            <!-- Rating -->
            <div v-if="randomPlace.rating" class="flex justify-center mb-4">
              <div class="flex items-center gap-1">
                <Icon v-for="s in 5" :key="s" icon="lucide:star"
                  :class="s <= Math.round(randomPlace.rating) ? 'text-amber-400' : 'text-stone-200 dark:text-stone-700'"
                  class="size-4 fill-current" />
                <span class="text-xs text-stone-400 dark:text-stone-500 ml-1 font-medium">{{ randomPlace.rating }}</span>
              </div>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap justify-center gap-2 mb-5">
              <span class="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Icon icon="lucide:utensils" class="size-4" />
                <span class="text-[0.8rem] font-medium">{{ randomPlace.dish }}</span>
              </span>
              <span class="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Icon icon="lucide:tag" class="size-4" />
                <span class="text-[0.8rem] font-medium">{{ randomPlace.price }}</span>
              </span>
            </div>

            <!-- Details -->
            <div class="bg-stone-50 dark:bg-stone-700/50 rounded-2xl p-4 sm:p-5 space-y-3 border border-stone-100 dark:border-stone-700">
              <div class="flex items-start gap-3">
                <Icon icon="lucide:map-pin" class="size-5 shrink-0 text-orange-400 mt-0.5" />
                <div class="flex-1">
                  <span class="text-[0.85rem] sm:text-[0.9rem] text-stone-600 dark:text-stone-300 leading-relaxed">{{ randomPlace.addr }}, {{ getProvinceDisplay(randomPlace.dist) }}</span>
                  <span v-if="randomPlace.oldDist" class="block text-[0.7rem] sm:text-[0.75rem] text-stone-400 dark:text-stone-500 mt-1 italic">
                    📍 Trước đây thuộc {{ randomPlace.oldDist }}
                  </span>
                </div>
              </div>
              <div class="h-px bg-stone-200 dark:bg-stone-600"></div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 text-stone-400 dark:text-stone-500">
                  <Icon icon="lucide:clock" class="size-5 shrink-0" />
                  <span class="text-[0.85rem] sm:text-[0.9rem] font-medium">{{ randomPlace.time }}</span>
                </div>
                <a :href="getGoogleMapsLink(randomPlace)" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-orange-300 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-all active:scale-95 card-shadow">
                  <Icon icon="lucide:navigation" class="size-4" />
                  {{ t.directions }}
                </a>
              </div>
            </div>

            <!-- Order Online -->
            <div class="flex gap-2 mt-3">
              <button @click="openOrderLink(randomPlace)"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-xl text-xs font-semibold text-orange-600 dark:text-orange-400 transition-all">
                <Icon icon="lucide:shopping-bag" class="size-3.5" />
                ShopeeFood
              </button>
              <button @click="openGrabFood(randomPlace)"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-xl text-xs font-semibold text-green-600 dark:text-green-400 transition-all">
                <Icon icon="lucide:bike" class="size-3.5" />
                GrabFood
              </button>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-4">
              <button @click="toggleFavorite(randomPlace)" class="py-3.5 px-4 bg-white dark:bg-stone-700 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-400 text-rose-500 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]">
                <span class="flex items-center justify-center gap-2">
                  <Icon icon="lucide:heart" class="size-4" :class="isFavorite(randomPlace) ? 'fill-rose-500' : ''" />
                </span>
              </button>
              <button @click="shareResult(randomPlace)" class="flex-1 py-3.5 bg-white dark:bg-stone-700 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 text-orange-500 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]">
                <span class="flex items-center justify-center gap-2">
                  <Icon icon="lucide:share-2" class="size-4" />
                  {{ t.share }}
                </span>
              </button>
              <button @click="randomPlace = null" class="flex-1 py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30 active:scale-[0.98] transition-all">
                {{ t.confirm }} 🎉
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Map View Modal -->
      <transition name="modal">
        <div v-if="showMapView" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showMapView = false">
          <div class="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700" @click.stop>
            <button @click="showMapView = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-xl mx-auto mb-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                🗺️
              </div>
              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">{{ t.mapTitle }}</h3>
              <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">{{ t.mapHint }} • {{ filteredDatabase.length }} {{ locale === 'vi' ? 'quán' : '' }}</p>
            </div>

            <MapView :places="filteredDatabase" :user-location="userLocation" @select="(place) => { randomPlace = place; showMapView = false }" />

            <button @click="showMapView = false" class="w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-all mt-4">
              {{ t.close }}
            </button>
          </div>
        </div>
      </transition>

      <!-- Nearby Modal -->
      <transition name="modal">
        <div v-if="showNearby" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showNearby = false">
          <div class="w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700 max-h-[80vh] overflow-hidden flex flex-col" @click.stop>
            <button @click="showNearby = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-xl mx-auto mb-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                📍
              </div>
              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">{{ t.nearbyTitle }}</h3>
              <p v-if="locationError" class="text-xs text-red-500 mt-1">{{ locationError }}</p>
            </div>

            <div class="space-y-2 overflow-y-auto flex-1 pr-1">
              <div v-for="place in nearbyPlaces" :key="place.name"
                @click="randomPlace = place; showNearby = false"
                class="bg-stone-50 dark:bg-stone-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-sm font-bold text-orange-500 shrink-0">
                  {{ formatDistance(place.distance) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ place.name }}</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500 truncate">{{ place.dish }} • {{ place.dist }}</p>
                </div>
                <Icon icon="lucide:chevron-right" class="size-4 text-stone-300 dark:text-stone-600 shrink-0" />
              </div>
              <div v-if="nearbyPlaces.length === 0 && !locationLoading" class="text-center py-6 text-stone-300 dark:text-stone-600">
                <p class="text-sm">{{ t.noNearby }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Daily Challenge Modal -->
      <transition name="modal">
        <div v-if="showChallenge" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showChallenge = false">
          <div class="w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700" @click.stop>
            <button @click="showChallenge = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <!-- Tabs -->
            <div class="flex gap-2 mb-5">
              <button class="flex-1 py-2 rounded-xl text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                {{ t.today }}
              </button>
              <button class="flex-1 py-2 rounded-xl text-sm font-bold bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-600">
                {{ t.thisWeek }}
              </button>
            </div>

            <div class="text-center mb-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-green-200 dark:shadow-green-900/30">
                🏆
              </div>
              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 font-display">{{ t.dailyChallenge }}</h3>
              <p class="text-sm text-stone-400 dark:text-stone-500 mt-1">{{ t.spin3times }}</p>
            </div>

            <!-- Daily Progress -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 text-center border border-green-100 dark:border-green-900/30 mb-4">
              <div class="flex justify-center gap-2 mb-3">
                <div v-for="i in 3" :key="i"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all"
                  :class="i <= dailyChallenge.spinsToday ? 'bg-green-400 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30' : 'bg-white dark:bg-stone-700 border-2 border-green-200 dark:border-green-800 text-green-300 dark:text-green-700'">
                  <Icon v-if="i <= dailyChallenge.spinsToday" icon="lucide:check" class="size-5" />
                  <span v-else>{{ i }}</span>
                </div>
              </div>
              <p class="text-sm font-semibold" :class="dailyChallenge.completed ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'">
                {{ dailyChallenge.spinsToday }}/3 {{ t.dayProgress }}
              </p>
              <p v-if="dailyChallenge.completed" class="text-xs text-green-500 dark:text-green-400 mt-1 font-medium">🎉 {{ t.completed }}</p>
            </div>

            <button v-if="dailyChallenge.completed" @click="shareChallenge"
              class="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-green-200/50 dark:shadow-green-900/30 active:scale-[0.98] transition-all mb-3">
              <span class="flex items-center justify-center gap-2">
                <Icon icon="lucide:share-2" class="size-4" />
                {{ t.share }}
              </span>
            </button>

            <button @click="showChallenge = false" class="w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-all">
              {{ t.close }}
            </button>
          </div>
        </div>
      </transition>

      <!-- Auth Modal -->
      <transition name="modal">
        <div v-if="showAuthModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showAuthModal = false">
          <div class="w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700" @click.stop>
            <button @click="showAuthModal = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-6">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                🍜
              </div>
              <h3 class="text-xl font-bold text-stone-800 dark:text-stone-100 font-display">{{ authMode === 'login' ? t.login : t.register }}</h3>
              <p class="text-sm text-stone-400 dark:text-stone-500 mt-1">{{ authMode === 'login' ? t.loginDesc : t.registerDesc }}</p>
            </div>

            <!-- Google Login -->
            <button @click="handleGoogleLogin" :disabled="authLoading"
              class="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-200 transition-all active:scale-[0.98] disabled:opacity-50 mb-4">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {{ t.loginGoogle }}
            </button>

            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-px bg-stone-200 dark:bg-stone-600"></div>
              <span class="text-xs text-stone-400 dark:text-stone-500 font-medium">{{ t.or }}</span>
              <div class="flex-1 h-px bg-stone-200 dark:bg-stone-600"></div>
            </div>

            <form @submit.prevent="handleAuth" class="space-y-4">
              <div v-if="authMode === 'register'">
                <label class="block text-stone-500 dark:text-stone-400 text-xs mb-1.5 uppercase font-bold tracking-wider">{{ t.name }}</label>
                <input v-model="authForm.name" type="text" :placeholder="t.namePlaceholder"
                  class="w-full bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-500 transition-all outline-none font-medium" />
              </div>
              <div>
                <label class="block text-stone-500 dark:text-stone-400 text-xs mb-1.5 uppercase font-bold tracking-wider">{{ t.email }}</label>
                <input v-model="authForm.email" type="email" :placeholder="t.emailPlaceholder"
                  class="w-full bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-500 transition-all outline-none font-medium" />
              </div>
              <div>
                <label class="block text-stone-500 dark:text-stone-400 text-xs mb-1.5 uppercase font-bold tracking-wider">{{ t.password }}</label>
                <input v-model="authForm.password" type="password" :placeholder="t.passwordPlaceholder"
                  class="w-full bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 rounded-xl px-4 py-3 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-500 transition-all outline-none font-medium" />
              </div>

              <p v-if="authError" class="text-red-500 text-xs font-medium text-center bg-red-50 dark:bg-red-900/20 rounded-lg py-2">{{ authError }}</p>

              <button type="submit" :disabled="authLoading"
                class="w-full py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30 active:scale-[0.98] transition-all disabled:opacity-50">
                <span v-if="authLoading" class="flex items-center justify-center gap-2">
                  <Icon icon="lucide:loader-2" class="size-4 animate-spin" />
                  {{ t.processing }}
                </span>
                <span v-else>{{ authMode === 'login' ? t.login : t.register }}</span>
              </button>
            </form>

            <p class="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
              {{ authMode === 'login' ? t.noAccount : t.hasAccount }}
              <button @click="switchAuthMode" class="text-orange-500 font-bold hover:underline">
                {{ authMode === 'login' ? t.registerNow : t.loginNow }}
              </button>
            </p>
          </div>
        </div>
      </transition>

      <!-- Donate Modal -->
      <transition name="modal">
        <div v-if="showDonateModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showDonateModal = false">
          <div class="w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100 dark:border-stone-700" @click.stop>
            <button @click="showDonateModal = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-6">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
                💖
              </div>
              <h3 class="text-xl font-bold text-stone-800 dark:text-stone-100 font-display">{{ t.noSpinsTitle }}</h3>
              <p class="text-sm text-stone-400 dark:text-stone-500 mt-2">{{ t.noSpinsDesc }}</p>
            </div>

            <div class="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-5 text-center border border-pink-100 dark:border-pink-900/30 mb-5">
              <p class="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wider mb-2">{{ t.donateMoMo }}</p>
              <a href="https://me.momo.vn/m8IbTzsVU1soF2FAu2tqt6" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30 active:scale-[0.98] transition-all">
                <Icon icon="lucide:heart" class="size-4" />
                {{ t.donateNow }}
              </a>
              <p class="text-[0.7rem] text-stone-400 dark:text-stone-500 mt-3">{{ t.donateDesc }}</p>
            </div>

            <button @click="showDonateModal = false" class="w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-all">
              {{ t.close }}
            </button>
          </div>
        </div>
      </transition>

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
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  60% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
