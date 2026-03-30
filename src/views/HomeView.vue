<script setup>
import { ref, computed, watch } from 'vue'
import { database } from '../data/database.js'
import { DISTRICT_CATEGORIES } from '../data/districts.js'
import { Icon } from '@iconify/vue'

const randomPlace = ref(null)
const isSpinning = ref(false)
const selectedDist = ref('Tất cả')
const selectedType = ref('Tất cả')
const searchQuery = ref('')

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

// === WHEEL LOGIC ===
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
  const currentList = filteredDatabase.value
  if (currentList.length === 0) return

  isSpinning.value = true
  randomPlace.value = null

  if (wheelItems.value.length === 0) resetWheel()

  // Pick winner globally from the filtered list, not just the currently displayed items
  const winner = currentList[Math.floor(Math.random() * currentList.length)]

  // Decide which slice on the wheel will land as the winner to update it visually
  const winnerSliceIndex = Math.floor(Math.random() * wheelSlices)
  wheelItems.value[winnerSliceIndex] = winner

  // Math for rotation
  const sliceAngle = 360 / wheelSlices
  // Target angle is the orientation the winning slice should be at (-90 deg offset logic: top is 0)
  const targetAngle = winnerSliceIndex * sliceAngle + (sliceAngle / 2)
  const spins = 6 // rotate 6 full cycles

  // Current absolute rotation
  const currentRot = wheelRotation.value
  const normalizedCurrent = currentRot % 360

  // We want the final rotation to land such that the targetAngle is pointing UP (0 degrees).
  // The amount we need to turn to get the targetAngle to 0 is (360 - targetAngle).
  let extraRotation = (360 * spins) + (360 - targetAngle) - normalizedCurrent

  // Add a slight random offset inside the slice so it doesn't always land perfectly in center
  const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.7)

  wheelRotation.value += extraRotation + randomOffset

  setTimeout(() => {
    isSpinning.value = false
    randomPlace.value = winner
  }, 5000)
}

// SVG helpers
const getCoord = (angle, radius) => {
  // -90 to make 0 degrees at the top
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
  const coord = getCoord(angle, 35) // Place text away from center
  return `translate(${coord.x}, ${coord.y}) rotate(${angle - 90})`
}
const getSliceColor = (i) => {
  const colors = [
    '#ffffff', // White
    '#ee4d2d', // Shopee Orange
  ]
  return colors[i % colors.length]
}

const truncate = (text) => text.length > 14 ? text.substring(0, 14) + '..' : text

const getGoogleMapsLink = (place) => {
  if (!place) return '#'
  const query = `${place.name} ${place.addr}, ${place.dist}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f5] text-gray-800 flex flex-col relative overflow-x-hidden selection:bg-[#ee4d2d]/20 font-sans">

    <!-- Top Navigation (Empty but keeps spacing) -->
    <header class="relative z-10 p-4 sm:p-6 flex items-center justify-between"></header>

    <main class="relative z-10 flex-1 flex flex-col items-center px-4 w-full max-w-4xl mx-auto pb-16 pt-2 sm:pt-10">

      <!-- Main Content Card -->
      <div class="w-full flex flex-col items-center p-5 sm:p-8 rounded-2xl bg-white shadow-md transition-all duration-300 relative z-10 border border-gray-100">

        <h1 class="text-[2rem] sm:text-4xl text-[#ee4d2d] font-bold tracking-tight mb-2 text-center">
          Bé ơi ăn gì?
        </h1>
        <p class="text-gray-500 mb-6 sm:mb-8 text-[0.9rem] sm:text-base max-w-md font-medium leading-relaxed text-center">
          Chỉ cần chọn khu vực và nhấn quay nha công chúa ✨
        </p>

        <!-- Filters -->
        <div class="w-full max-w-2xl mb-10 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Search -->
          <div class="relative group">
            <label class="block text-gray-500 text-[0.7rem] sm:text-xs mb-1.5 uppercase font-bold px-1">Tìm kiếm</label>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Tên quán, món ăn..."
                class="w-full bg-gray-50 border border-gray-200 hover:border-[#ee4d2d] focus:bg-white text-gray-800 rounded-lg px-4 py-3 sm:py-3.5 text-sm sm:text-base focus:outline-none focus:border-[#ee4d2d] transition-colors shadow-sm placeholder:text-gray-400 font-medium"
              />
              <Icon icon="lucide:search" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none size-4 sm:size-5" />
            </div>
          </div>

          <!-- District -->
          <div class="relative group">
            <label class="block text-gray-500 text-[0.7rem] sm:text-xs mb-1.5 uppercase font-bold px-1">Khu vực</label>
            <div class="relative">
              <select v-model="selectedDist" @change="resetWheel" class="w-full appearance-none bg-gray-50 border border-gray-200 hover:border-[#ee4d2d] focus:bg-white text-gray-800 rounded-lg px-4 py-3 sm:py-3.5 text-sm sm:text-base tracking-wide focus:outline-none focus:border-[#ee4d2d] transition-colors cursor-pointer shadow-sm font-medium">
                <option value="Tất cả">Tất cả khu vực</option>
                <optgroup v-for="(dists, category) in DISTRICT_CATEGORIES" :key="category" :label="category.replace('_', ' ')">
                  <option v-for="dist in dists" :key="dist" :value="dist">{{ dist }}</option>
                </optgroup>
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none size-4 sm:size-5 group-hover:text-[#ee4d2d] transition-colors" />
            </div>
          </div>

          <!-- Type -->
          <div class="relative group">
            <label class="block text-gray-500 text-[0.7rem] sm:text-xs mb-1.5 uppercase font-bold px-1">Loại món</label>
            <div class="relative">
              <select v-model="selectedType" @change="resetWheel" class="w-full appearance-none bg-gray-50 border border-gray-200 hover:border-[#ee4d2d] focus:bg-white text-gray-800 rounded-lg px-4 py-3 sm:py-3.5 text-sm sm:text-base tracking-wide focus:outline-none focus:border-[#ee4d2d] transition-colors cursor-pointer shadow-sm font-medium">
                <option v-for="type in typeList" :key="type" :value="type">{{ type === 'Tất cả' ? 'Tất cả loại món' : type }}</option>
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none size-4 sm:size-5 group-hover:text-[#ee4d2d] transition-colors" />
            </div>
          </div>

        </div>

        <!-- Wheel of Fortune -->
        <div class="relative w-64 h-64 sm:w-[380px] sm:h-[380px] mb-10 flex-shrink-0">

          <!-- Pointer overlay -->
          <div class="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
            <Icon icon="lucide:map-pin" class="size-10 sm:size-12 fill-[#ee4d2d] text-white stroke-[1.5] drop-shadow-[0_4px_4px_rgba(238,77,45,0.3)] animate-pulse" />
          </div>

          <!-- SVG Container with Casino styling & Win Effect -->
          <div :class="['w-full h-full rounded-full border-[6px] sm:border-8 overflow-hidden relative transition-all duration-700 bg-amber-500', (!isSpinning && randomPlace) ? 'border-amber-300 border-dotted shadow-[0_0_60px_rgba(251,191,36,0.8)] animate-pulse' : 'border-amber-400 border-dotted shadow-[0_5px_20px_rgba(0,0,0,0.15)]']">
            <svg viewBox="-50 -50 100 100"
                 class="w-full h-full will-change-transform"
                 :style="{
                   transform: `rotate(${wheelRotation}deg)`,
                   transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 1, 0.1, 1)' : 'none'
                 }">
               <path v-for="(item, i) in wheelItems" :key="i"
                     :d="getSlicePath(i, wheelSlices)"
                     :fill="getSliceColor(i)"
                     stroke="#f5f5f5" stroke-width="0.3" />
               <text v-for="(item, i) in wheelItems" :key="`text-${i}`"
                     :transform="getTextTransform(i, wheelSlices)"
                     text-anchor="middle" dominant-baseline="central"
                     :fill="i % 2 === 0 ? '#ee4d2d' : '#ffffff'" font-size="3.5" font-weight="800"
                     class="pointer-events-none tracking-wide"
                     style="text-shadow: 0px 1px 1px rgba(0,0,0,0.05)">
                  {{ truncate(item?.name || '') }}
               </text>
            </svg>

            <!-- Center Pivot -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full border-[3px] border-[#ee4d2d] shadow-[0_4px_15px_rgba(0,0,0,0.2)] z-10 flex items-center justify-center transform transition-transform duration-300" :class="{ 'scale-110': !isSpinning && randomPlace }">
              <div class="text-[#ee4d2d] font-bold text-[0.75rem] sm:text-[0.9rem] uppercase tracking-tighter">😋</div>
            </div>
          </div>
        </div>

        <!-- Actions Container (Tight Spacing) -->
        <div class="flex flex-col items-center mb-6 w-full">
          <!-- Action Button -->
          <button
            @click="pickRandom"
            :disabled="isSpinning"
            class="relative overflow-hidden px-12 py-3.5 sm:px-16 sm:py-4 rounded-xl bg-[#ee4d2d] text-white text-[1rem] sm:text-[1.125rem] font-bold tracking-widest uppercase transition-all hover:bg-[#d73f22] active:scale-95 shadow-md disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed z-20"
          >
            <span class="relative z-10 flex items-center justify-center gap-2.5">
              <Icon
                :icon="isSpinning ? 'lucide:loader-2' : 'lucide:utensils-crossed'"
                :class="{ 'animate-spin': isSpinning }"
                class="size-5 text-white"
              />
              {{ isSpinning ? 'Đang quay...' : 'Quay ngay' }}
            </span>
          </button>

          <!-- Idle Text right below button -->
          <div v-show="!isSpinning && !randomPlace" class="text-center text-[#ee4d2d]/80 text-[0.85rem] sm:text-[0.95rem] font-medium italic mt-3 h-[24px]">
            ✨ Đang chờ lệnh công chúa ạ...
          </div>
        </div>

        <!-- Result Popup Modal -->
        <transition name="fade">
          <div v-if="randomPlace && !isSpinning" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <!-- Modal Content -->
            <div class="w-full max-w-lg flex flex-col items-center transform transition-all animate-bounce-in bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border-2 border-[#ee4d2d]/20">
              
              <!-- Close Button -->
              <button @click="randomPlace = null" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                <Icon icon="lucide:x" class="size-5" />
              </button>

              <div class="text-[1.75rem] sm:text-[2.25rem] text-[#ee4d2d] font-bold tracking-tight text-center mb-6 leading-tight mt-4 px-4">
                {{ randomPlace.name }}
              </div>

              <!-- Badges -->
              <div class="flex flex-wrap justify-center gap-3 mb-8 w-full">
                <div class="px-5 py-2.5 rounded-xl bg-orange-50 border border-orange-100 shadow-sm flex items-center gap-2 text-[#ee4d2d]">
                  <Icon icon="lucide:pizza" class="size-4 sm:size-5" />
                  <span class="text-[0.85rem] sm:text-[0.95rem] tracking-wide font-medium">{{ randomPlace.dish }}</span>
                </div>
                <div class="px-5 py-2.5 rounded-xl bg-orange-50 border border-orange-100 shadow-sm flex items-center gap-2 text-[#ee4d2d]">
                  <Icon icon="lucide:tag" class="size-4 sm:size-5" />
                  <span class="text-[0.85rem] sm:text-[0.95rem] tracking-wide font-medium">{{ randomPlace.price }}</span>
                </div>
              </div>

              <!-- Location & Time Details -->
              <div class="w-full bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 flex flex-col gap-4 shadow-inner relative overflow-hidden">
                <!-- Address -->
                <div class="flex items-start justify-between gap-3 relative">
                  <div class="flex items-start gap-3 text-gray-800 w-full">
                    <Icon icon="lucide:map-pin" class="mt-0.5 size-5 shrink-0 text-[#ee4d2d]" />
                    <span class="text-[0.95rem] sm:text-[1.05rem] leading-relaxed font-medium">{{ randomPlace.addr }}, {{ randomPlace.dist }}</span>
                  </div>
                </div>

                <div class="h-[1px] w-full bg-gray-200 relative my-1"></div>

                <!-- Time & Actions -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                  <div class="flex items-center gap-3 text-gray-500">
                    <Icon icon="lucide:clock" class="size-5 shrink-0 text-gray-400" />
                    <span class="text-[0.95rem] sm:text-[1.05rem] font-medium">{{ randomPlace.time }}</span>
                  </div>
                  
                  <!-- Maps Button -->
                  <a
                    :href="getGoogleMapsLink(randomPlace)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold transition-colors shadow-sm w-full sm:w-auto active:scale-95"
                  >
                    <Icon icon="lucide:navigation" class="size-5 text-[#ee4d2d]" />
                    Chỉ đường
                  </a>
                </div>
              </div>

              <!-- Action Button (Spin again / Close) -->
              <button @click="randomPlace = null" class="w-full mt-6 py-4 bg-[#ee4d2d] hover:bg-[#d73f22] text-white rounded-xl font-bold text-lg tracking-wide shadow-md active:scale-[0.98] transition-all">
                Tuyệt vời, chốt luôn!
              </button>
            </div>
          </div>
        </transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}

@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
