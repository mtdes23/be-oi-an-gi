<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { database } from '../data/database.js'
import { DISTRICT_CATEGORIES, getProvinceDisplay } from '../data/districts.js'
import { useAuth } from '../composables/useAuth.js'
import { Icon } from '@iconify/vue'
import html2canvas from 'html2canvas'

const { currentUser, isLoading, isLoggedIn, spinsLeft, hasSpins, FREE_SPINS, initAuth, registerWithEmail, loginWithEmail, loginWithGoogle, logout, useSpin, canSpin } = useAuth()

const randomPlace = ref(null)
const isSpinning = ref(false)
const selectedDist = ref('Tất cả')
const selectedType = ref('Tất cả')
const searchQuery = ref('')
const history = ref([])
const showHistory = ref(false)
const showStats = ref(false)
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

onMounted(async () => {
  await initAuth()
  const saved = localStorage.getItem('be-oi-an-gi-history')
  if (saved) history.value = JSON.parse(saved)
  const savedCount = localStorage.getItem('be-oi-an-gi-spin-count')
  if (savedCount) spinCount.value = parseInt(savedCount)
})

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
    return matchDist && matchType && matchSearch
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

  // Check login
  if (!isLoggedIn.value) {
    pendingSpin.value = true
    authMode.value = 'login'
    showAuthModal.value = true
    return
  }

  // Check spins
  if (!canSpin()) {
    showDonateModal.value = true
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
  }, 5000)
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
  <div class="min-h-screen relative overflow-hidden">

    <!-- Background decorations -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-50/40 rounded-full blur-[120px]"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-4 sm:px-6 py-4 sm:py-5">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-orange-200">
            🍜
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-stone-800 tracking-tight font-display">BÉ ƠI ĂN GÌ</h2>
            <p v-if="isLoading" class="text-[0.65rem] sm:text-xs text-stone-300 font-medium">Đang tải...</p>
            <p v-else-if="isLoggedIn" class="text-[0.65rem] sm:text-xs text-stone-400 font-medium">
              Xin chào, {{ currentUser.name }} • Còn {{ spinsLeft }} lượt quay
            </p>
            <p v-else class="text-[0.65rem] sm:text-xs text-stone-400 font-medium">{{ resultCount }} quán • {{ spinCount }} lượt quay</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showStats = !showStats" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-orange-100 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all card-shadow">
            <Icon icon="lucide:bar-chart-3" class="size-4 sm:size-5" />
          </button>
          <button @click="showHistory = !showHistory" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-orange-100 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all card-shadow relative">
            <Icon icon="lucide:history" class="size-4 sm:size-5" />
            <span v-if="history.length" class="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center">{{ history.length }}</span>
          </button>
          <button v-if="isLoggedIn" @click="logout" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-orange-100 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all card-shadow">
            <Icon icon="lucide:log-out" class="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </header>

    <main class="relative z-10 flex-1 flex flex-col items-center px-4 w-full max-w-5xl mx-auto pb-8 sm:pb-16">

      <!-- Title -->
      <div class="text-center mb-6 sm:mb-8 mt-2">
        <h1 class="text-[2.25rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-3 font-display">
          <span class="bg-gradient-to-r from-orange-500 via-rose-400 to-amber-500 bg-clip-text text-transparent">Bé ơi ăn gì?</span>
        </h1>
        <p class="text-stone-400 text-[0.85rem] sm:text-base font-medium">
          Quay để tìm quán ngon nào ✨
        </p>
      </div>

      <!-- Filters -->
      <div class="w-full max-w-3xl mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

        <!-- Search -->
        <div class="sm:col-span-1">
          <label class="block text-stone-500 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">Tìm kiếm</label>
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="Tên quán, món ăn..."
              class="w-full bg-white border border-stone-200 hover:border-orange-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 placeholder:text-stone-300 transition-all card-shadow font-medium outline-none" />
            <Icon icon="lucide:search" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>

        <!-- District -->
        <div>
          <label class="block text-stone-500 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">Khu vực</label>
          <div class="relative">
            <select v-model="selectedDist" @change="resetWheel"
              class="w-full appearance-none bg-white border border-stone-200 hover:border-orange-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 transition-all cursor-pointer card-shadow font-medium outline-none">
              <option value="Tất cả">Tất cả khu vực</option>
              <optgroup v-for="(dists, category) in DISTRICT_CATEGORIES" :key="category" :label="category.replace('_', ' ')">
                <option v-for="dist in dists" :key="dist" :value="dist">{{ dist }}</option>
              </optgroup>
            </select>
            <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>

        <!-- Type -->
        <div>
          <label class="block text-stone-500 text-[0.65rem] sm:text-xs mb-1.5 uppercase font-bold tracking-wider px-1">Loại món</label>
          <div class="relative">
            <select v-model="selectedType" @change="resetWheel"
              class="w-full appearance-none bg-white border border-stone-200 hover:border-orange-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-stone-700 transition-all cursor-pointer card-shadow font-medium outline-none">
              <option v-for="type in typeList" :key="type" :value="type">{{ type === 'Tất cả' ? 'Tất cả loại món' : type }}</option>
            </select>
            <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none size-4 sm:size-5" />
          </div>
        </div>
      </div>

      <!-- Wheel -->
      <div class="relative mb-8 sm:mb-10">
        <!-- Pointer -->
        <div class="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20">
          <div class="w-0 h-0 border-l-[14px] sm:border-l-[18px] border-l-transparent border-r-[14px] sm:border-r-[18px] border-r-transparent border-t-[22px] sm:border-t-[26px] border-t-orange-500 drop-shadow-lg"></div>
        </div>

        <!-- Wheel ring -->
        <div class="w-56 h-56 sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] rounded-full p-2 sm:p-3 bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200"
             :class="{ 'animate-glow-pulse': !isSpinning && randomPlace }">
          <div class="w-full h-full rounded-full overflow-hidden relative bg-white border-4 border-white card-shadow-lg">
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
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 border-4 border-white shadow-lg z-20 flex items-center justify-center transition-transform duration-300"
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
          :class="isSpinning ? 'bg-stone-200 text-stone-400' : 'bg-gradient-to-r from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500 hover:shadow-xl hover:shadow-orange-200/50 active:scale-95'">
          <span class="relative z-10 flex items-center justify-center gap-3">
            <Icon :icon="isSpinning || isLoading ? 'lucide:loader-2' : 'lucide:sparkles'" :class="{ 'animate-spin': isSpinning || isLoading }" class="size-5" />
            {{ isSpinning ? 'Đang quay...' : isLoading ? 'Đang tải...' : 'Quay ngay' }}
          </span>
          <div v-if="!isSpinning && !isLoading" class="absolute inset-0 animate-shimmer rounded-2xl"></div>
        </button>
        <p v-if="isLoggedIn && !isSpinning && !randomPlace" class="text-stone-400 text-[0.8rem] sm:text-sm font-medium mt-3 italic">
          Còn {{ spinsLeft }}/{{ FREE_SPINS }} lượt quay miễn phí
        </p>
        <p v-if="!isLoggedIn && !isSpinning && !randomPlace && !isLoading" class="text-stone-400 text-[0.8rem] sm:text-sm font-medium mt-4 italic">
          ✨ Đang chờ lệnh công chúa ạ...
        </p>
      </div>

      <!-- Stats Panel -->
      <transition name="slide">
        <div v-if="showStats" class="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 font-display">📊 Thống kê</h3>
            <button @click="showStats = false" class="text-stone-300 hover:text-stone-600 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 text-center border border-orange-100">
              <div class="text-2xl sm:text-3xl font-bold text-orange-500 font-display">{{ spinCount }}</div>
              <div class="text-xs text-stone-400 mt-1 font-medium">Lượt quay</div>
            </div>
            <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 text-center border border-rose-100">
              <div class="text-2xl sm:text-3xl font-bold text-rose-400 font-display">{{ history.length }}</div>
              <div class="text-xs text-stone-400 mt-1 font-medium">Đã lưu</div>
            </div>
          </div>
          <div v-if="Object.keys(stats.types).length" class="mt-4">
            <h4 class="text-xs text-stone-400 uppercase font-bold tracking-wider mb-2">Loại hay quay</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="(count, type) in stats.types" :key="type" class="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-medium text-orange-600">
                {{ type }} ({{ count }})
              </span>
            </div>
          </div>
        </div>
      </transition>

      <!-- History Panel -->
      <transition name="slide">
        <div v-if="showHistory" class="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 mb-6 card-shadow-lg border border-stone-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-stone-800 font-display">🕐 Lịch sử quay</h3>
            <div class="flex items-center gap-2">
              <button v-if="history.length" @click="clearHistory" class="text-xs text-stone-400 hover:text-rose-500 transition-colors font-medium">Xóa tất cả</button>
              <button @click="showHistory = false" class="text-stone-300 hover:text-stone-600 transition-colors p-1"><Icon icon="lucide:x" class="size-5" /></button>
            </div>
          </div>
          <div v-if="history.length === 0" class="text-center py-8 text-stone-300">
            <Icon icon="lucide:history" class="size-10 mx-auto mb-2" />
            <p class="text-sm">Chưa có lịch sử quay</p>
          </div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div v-for="(item, i) in history" :key="i"
                 class="bg-stone-50 hover:bg-orange-50 rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer border border-transparent hover:border-orange-100"
                 @click="randomPlace = item; showHistory = false">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-stone-700 truncate">{{ item.name }}</p>
                <p class="text-xs text-stone-400 truncate">{{ item.dish }} • {{ item.dist }}</p>
              </div>
              <span class="text-[0.65rem] text-stone-300 ml-3 whitespace-nowrap">{{ formatTime(item.timestamp) }}</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- Result Modal -->
      <transition name="modal">
        <div v-if="randomPlace && !isSpinning" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" @click.self="randomPlace = null">
          <div ref="resultCardRef" class="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 card-shadow-lg relative overflow-hidden animate-bounce-in border border-stone-100" @click.stop>

            <!-- Close -->
            <button @click="randomPlace = null" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <!-- Capture -->
            <button @click="captureAndShare" :disabled="isCapturing" class="absolute top-4 right-14 text-stone-300 hover:text-orange-500 bg-stone-100 hover:bg-orange-50 rounded-full p-2 transition-all z-10 disabled:opacity-50">
              <Icon :icon="isCapturing ? 'lucide:loader-2' : 'lucide:camera'" :class="{ 'animate-spin': isCapturing }" class="size-4 sm:size-5" />
            </button>

            <!-- Badge -->
            <div class="flex justify-center mb-4">
              <span class="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 text-xs font-bold text-orange-600 uppercase tracking-widest">
                🎉 Kết quả quay
              </span>
            </div>

            <!-- Name -->
            <h2 class="text-[1.5rem] sm:text-[1.85rem] font-extrabold text-stone-800 text-center mb-2 leading-tight font-display">{{ randomPlace.name }}</h2>

            <!-- Rating -->
            <div v-if="randomPlace.rating" class="flex justify-center mb-4">
              <div class="flex items-center gap-1">
                <Icon v-for="s in 5" :key="s" icon="lucide:star"
                  :class="s <= Math.round(randomPlace.rating) ? 'text-amber-400' : 'text-stone-200'"
                  class="size-4 fill-current" />
                <span class="text-xs text-stone-400 ml-1 font-medium">{{ randomPlace.rating }}</span>
              </div>
            </div>

            <!-- Badges -->
            <div class="flex flex-wrap justify-center gap-2 mb-5">
              <span class="px-4 py-2 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2 text-orange-600">
                <Icon icon="lucide:utensils" class="size-4" />
                <span class="text-[0.8rem] font-medium">{{ randomPlace.dish }}</span>
              </span>
              <span class="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2 text-amber-600">
                <Icon icon="lucide:tag" class="size-4" />
                <span class="text-[0.8rem] font-medium">{{ randomPlace.price }}</span>
              </span>
            </div>

            <!-- Details -->
            <div class="bg-stone-50 rounded-2xl p-4 sm:p-5 space-y-3 border border-stone-100">
              <div class="flex items-start gap-3">
                <Icon icon="lucide:map-pin" class="size-5 shrink-0 text-orange-400 mt-0.5" />
                <div class="flex-1">
                  <span class="text-[0.85rem] sm:text-[0.9rem] text-stone-600 leading-relaxed">{{ randomPlace.addr }}, {{ getProvinceDisplay(randomPlace.dist) }}</span>
                  <span v-if="randomPlace.oldDist" class="block text-[0.7rem] sm:text-[0.75rem] text-stone-400 mt-1 italic">
                    📍 Trước đây thuộc {{ randomPlace.oldDist }}
                  </span>
                </div>
              </div>
              <div class="h-px bg-stone-200"></div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 text-stone-400">
                  <Icon icon="lucide:clock" class="size-5 shrink-0" />
                  <span class="text-[0.85rem] sm:text-[0.9rem] font-medium">{{ randomPlace.time }}</span>
                </div>
                <a :href="getGoogleMapsLink(randomPlace)" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:border-orange-300 rounded-xl text-sm font-semibold text-stone-600 hover:text-orange-600 transition-all active:scale-95 card-shadow">
                  <Icon icon="lucide:navigation" class="size-4" />
                  Chỉ đường
                </a>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-5">
              <button @click="shareResult(randomPlace)" class="flex-1 py-3.5 bg-white border-2 border-orange-200 hover:border-orange-400 text-orange-500 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]">
                <span class="flex items-center justify-center gap-2">
                  <Icon icon="lucide:share-2" class="size-4" />
                  Chia sẻ
                </span>
              </button>
              <button @click="randomPlace = null" class="flex-1 py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all">
                Chốt luôn! 🎉
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Auth Modal -->
      <transition name="modal">
        <div v-if="showAuthModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showAuthModal = false">
          <div class="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100" @click.stop>
            <button @click="showAuthModal = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-6">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-orange-200">
                🍜
              </div>
              <h3 class="text-xl font-bold text-stone-800 font-display">{{ authMode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}</h3>
              <p class="text-sm text-stone-400 mt-1">{{ authMode === 'login' ? 'Chào mừng bạn quay trở lại!' : 'Tạo tài khoản để nhận 10 lượt quay miễn phí' }}</p>
            </div>

            <!-- Google Login -->
            <button @click="handleGoogleLogin" :disabled="authLoading"
              class="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-stone-200 hover:border-stone-300 rounded-xl font-bold text-sm text-stone-700 transition-all active:scale-[0.98] disabled:opacity-50 mb-4">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-px bg-stone-200"></div>
              <span class="text-xs text-stone-400 font-medium">hoặc</span>
              <div class="flex-1 h-px bg-stone-200"></div>
            </div>

            <form @submit.prevent="handleAuth" class="space-y-4">
              <div v-if="authMode === 'register'">
                <label class="block text-stone-500 text-xs mb-1.5 uppercase font-bold tracking-wider">Họ tên</label>
                <input v-model="authForm.name" type="text" placeholder="Nguyễn Văn A"
                  class="w-full bg-stone-50 border border-stone-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 transition-all outline-none font-medium" />
              </div>
              <div>
                <label class="block text-stone-500 text-xs mb-1.5 uppercase font-bold tracking-wider">Email</label>
                <input v-model="authForm.email" type="email" placeholder="email@example.com"
                  class="w-full bg-stone-50 border border-stone-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 transition-all outline-none font-medium" />
              </div>
              <div>
                <label class="block text-stone-500 text-xs mb-1.5 uppercase font-bold tracking-wider">Mật khẩu</label>
                <input v-model="authForm.password" type="password" placeholder="Ít nhất 6 ký tự"
                  class="w-full bg-stone-50 border border-stone-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 transition-all outline-none font-medium" />
              </div>

              <p v-if="authError" class="text-red-500 text-xs font-medium text-center bg-red-50 rounded-lg py-2">{{ authError }}</p>

              <button type="submit" :disabled="authLoading"
                class="w-full py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all disabled:opacity-50">
                <span v-if="authLoading" class="flex items-center justify-center gap-2">
                  <Icon icon="lucide:loader-2" class="size-4 animate-spin" />
                  Đang xử lý...
                </span>
                <span v-else>{{ authMode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}</span>
              </button>
            </form>

            <p class="text-center text-xs text-stone-400 mt-4">
              {{ authMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?' }}
              <button @click="switchAuthMode" class="text-orange-500 font-bold hover:underline">
                {{ authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập' }}
              </button>
            </p>
          </div>
        </div>
      </transition>

      <!-- Donate Modal -->
      <transition name="modal">
        <div v-if="showDonateModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="showDonateModal = false">
          <div class="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 card-shadow-lg relative animate-bounce-in border border-stone-100" @click.stop>
            <button @click="showDonateModal = false" class="absolute top-4 right-4 text-stone-300 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full p-2 transition-all z-10">
              <Icon icon="lucide:x" class="size-4 sm:size-5" />
            </button>

            <div class="text-center mb-6">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-pink-200">
                💖
              </div>
              <h3 class="text-xl font-bold text-stone-800 font-display">Hết lượt quay rồi!</h3>
              <p class="text-sm text-stone-400 mt-2">Bạn đã sử dụng hết {{ FREE_SPINS }} lượt quay miễn phí. Hãy donate để nhận thêm nhé!</p>
            </div>

            <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 text-center border border-pink-100 mb-5">
              <p class="text-xs text-stone-400 uppercase font-bold tracking-wider mb-2">Donate qua MoMo</p>
              <a href="https://me.momo.vn/m8IbTzsVU1soF2FAu2tqt6" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-pink-200/50 active:scale-[0.98] transition-all">
                <Icon icon="lucide:heart" class="size-4" />
                Donate ngay
              </a>
              <p class="text-[0.7rem] text-stone-400 mt-3">Mỗi donate = 10 lượt quay thêm 🎰</p>
            </div>

            <button @click="showDonateModal = false" class="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold text-sm transition-all">
              Đóng
            </button>
          </div>
        </div>
      </transition>

      <!-- Footer -->
      <footer class="mt-8 sm:mt-12 text-center pb-4">
        <p class="text-[0.7rem] sm:text-xs text-stone-300 font-medium">
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
