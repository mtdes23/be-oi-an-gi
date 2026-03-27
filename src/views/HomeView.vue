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
    '#1e293b', // slate-800
    '#334155', // slate-700
    '#0f172a', // slate-900
    '#475569', // slate-600
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
  <div
    class="min-h-screen bg-[#000000] text-text-primary font-body flex flex-col relative overflow-hidden selection:bg-white/20"
  >
    <!-- Ambient glowing liquid background -->
    <div class="fixed inset-0 z-0 pointer-events-none opacity-50">
      <div
        class="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-sky/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"
      ></div>
      <div
        class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-amber/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"
        style="animation-duration: 4s; animation-delay: 1s"
      ></div>
    </div>

    <!-- Top Navigation -->
    <header class="relative z-10 p-6 flex items-center justify-between">
      <div class="flex items-center gap-4"></div>
    </header>

    <main
      class="relative z-10 flex-1 flex flex-col items-center px-4 w-full max-w-4xl mx-auto pb-16 pt-4 sm:pt-10"
    >
      <div
        class="w-full flex flex-col items-center p-6 sm:p-12 rounded-[2.5rem] border border-white/20 border-t-white/40 border-b-black/40 bg-white/5 backdrop-blur-[32px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-700"
      >
        <h1
          class="text-4xl sm:text-5xl font-display text-white font-light tracking-wider mb-2 text-center drop-shadow-lg"
        >
          Bé ơi ăn gì?
        </h1>
        <p class="text-text-dim mb-8 text-center text-base sm:text-lg max-w-md">
          Chỉ cần chọn khu vực và nhấn quay, vòng xoay may mắn sẽ chọn món ngon cho bé!
        </p>

        <!-- Filters -->
        <div class="w-full max-w-2xl mb-10 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search -->
          <div class="relative group">
            <label class="block text-text-secondary text-xs mb-2 px-2 uppercase tracking-widest font-medium text-white/50">Tìm kiếm</label>
            <div class="relative">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Tên quán, món ăn..."
                class="w-full bg-black/40 border border-white/10 hover:border-white/30 text-white rounded-2xl px-6 py-4 font-display text-base focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/50 transition-all backdrop-blur-xl shadow-lg"
              />
              <Icon icon="lucide:search" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none size-5" />
            </div>
          </div>

          <!-- District -->
          <div class="relative group">
            <label class="block text-text-secondary text-xs mb-2 px-2 uppercase tracking-widest font-medium text-white/50">Khu vực</label>
            <div class="relative">
              <select v-model="selectedDist" @change="resetWheel" class="w-full appearance-none bg-black/40 border border-white/10 hover:border-white/30 text-white rounded-2xl px-6 py-4 font-display text-base tracking-wide focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/50 transition-all cursor-pointer backdrop-blur-xl shadow-lg">
                <option value="Tất cả">Tất cả khu vực</option>
                <optgroup v-for="(dists, category) in DISTRICT_CATEGORIES" :key="category" :label="category.replace('_', ' ')">
                  <option v-for="dist in dists" :key="dist" :value="dist">{{ dist }}</option>
                </optgroup>
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none size-5 group-hover:text-white transition-colors" />
            </div>
          </div>

          <!-- Type -->
          <div class="relative group">
            <label class="block text-text-secondary text-xs mb-2 px-2 uppercase tracking-widest font-medium text-white/50">Loại món</label>
            <div class="relative">
              <select v-model="selectedType" @change="resetWheel" class="w-full appearance-none bg-black/40 border border-white/10 hover:border-white/30 text-white rounded-2xl px-6 py-4 font-display text-base tracking-wide focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/50 transition-all cursor-pointer backdrop-blur-xl shadow-lg">
                <option v-for="type in typeList" :key="type" :value="type">{{ type === 'Tất cả' ? 'Tất cả loại món' : type }}</option>
              </select>
              <Icon icon="lucide:chevron-down" class="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none size-5 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <!-- Wheel of Fortune -->
        <div class="relative w-72 h-72 sm:w-96 sm:h-96 mb-12 flex-shrink-0">
          <!-- Pointer overlay -->
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 z-20 drop-shadow-2xl">
            <Icon icon="lucide:map-pin" class="size-12 fill-accent-coral text-white stroke-2 drop-shadow-[0_4px_10px_rgba(251,113,133,0.5)] animate-bounce" style="animation-duration: 2s;" />
          </div>
          
          <!-- SVG Container -->
          <div class="w-full h-full rounded-full border-8 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.2)] bg-black/50 overflow-hidden relative">
            <svg viewBox="-50 -50 100 100" 
                 class="w-full h-full will-change-transform"
                 :style="{ 
                   transform: `rotate(${wheelRotation}deg)`, 
                   transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 1, 0.1, 1)' : 'none' 
                 }">
               <path v-for="(item, i) in wheelItems" :key="i"
                     :d="getSlicePath(i, wheelSlices)"
                     :fill="getSliceColor(i)"
                     stroke="rgba(255,255,255,0.1)" stroke-width="0.3" />
               <text v-for="(item, i) in wheelItems" :key="`text-${i}`"
                     :transform="getTextTransform(i, wheelSlices)"
                     text-anchor="middle" dominant-baseline="central"
                     fill="#e2e8f0" font-size="3.5" font-weight="500"
                     class="pointer-events-none drop-shadow-lg tracking-wider"
                     style="text-shadow: 0px 1px 3px rgba(0,0,0,0.9)">
                  {{ truncate(item?.name || '') }}
               </text>
            </svg>
            <!-- Center Pivot -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-full border-4 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.9)] z-10 flex items-center justify-center">
              <div class="w-3 h-3 rounded-full bg-accent-sky shadow-[0_0_10px_rgba(56,189,248,0.8)]"></div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <button
          @click="pickRandom"
          :disabled="isSpinning"
          class="relative group overflow-hidden px-10 py-5 rounded-full bg-gradient-to-br from-accent-sky/20 to-accent-amber/20 border border-white/20 text-white font-display text-xl tracking-widest uppercase transition-all hover:bg-white/20 hover:scale-105 active:scale-95 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),_0_15px_40px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed mb-8 z-20"
        >
          <span class="relative z-10 flex items-center gap-3">
            <Icon
              :icon="isSpinning ? 'lucide:loader-2' : 'lucide:dices'"
              :class="{ 'animate-spin': isSpinning }"
              class="size-6 text-accent-sky drop-shadow-lg"
            />
            {{ isSpinning ? 'Đang quay...' : 'Quay bánh xe' }}
          </span>
          <div
            class="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"
          ></div>
        </button>

        <!-- Result Display -->
        <div class="w-full max-w-xl flex flex-col items-center justify-center min-h-[120px]">
          <transition name="fade" mode="out-in">
            <div v-if="randomPlace && !isSpinning" :key="randomPlace.name" class="w-full flex flex-col items-center transform transition-all animate-bounce-in">
              <div class="text-3xl sm:text-4xl font-display text-accent-sky font-medium tracking-wide text-center mb-6 px-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">
                {{ randomPlace.name }}
              </div>

              <!-- Badges -->
              <div class="flex flex-wrap justify-center gap-4 mb-6">
                <div class="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner flex items-center gap-2">
                  <span class="text-accent-sky"><Icon icon="lucide:utensils" /></span>
                  <span class="text-sm tracking-wider font-medium">{{ randomPlace.dish }}</span>
                </div>
                <div class="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner flex items-center gap-2">
                  <span class="text-accent-amber"><Icon icon="lucide:tag" /></span>
                  <span class="text-sm tracking-wider font-medium">{{ randomPlace.price }}</span>
                </div>
              </div>

              <!-- Location & Time Details -->
              <div class="w-full bg-black/50 rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <!-- Address -->
                <div class="flex items-start justify-between gap-4 z-10 relative">
                  <div class="flex items-start gap-4 text-white/90 w-full">
                    <Icon icon="lucide:map-pin" class="mt-1 size-6 shrink-0 text-accent-coral" />
                    <span class="text-lg leading-relaxed">{{ randomPlace.addr }}, {{ randomPlace.dist }}</span>
                  </div>
                </div>

                <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 relative"></div>

                <!-- Time & Actions -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10 relative">
                  <div class="flex items-center gap-4 text-white/90">
                    <Icon icon="lucide:clock" class="size-6 shrink-0 text-accent-amber" />
                    <span class="text-lg">{{ randomPlace.time }}</span>
                  </div>
                  
                  <!-- Maps Button -->
                  <a
                    :href="getGoogleMapsLink(randomPlace)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-sky/20 to-accent-sky/10 hover:from-accent-sky/30 hover:to-accent-sky/20 border border-accent-sky/40 text-accent-sky rounded-xl font-display font-medium tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.2)] group w-full sm:w-auto"
                  >
                    <Icon icon="lucide:navigation" class="size-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    Chỉ đường
                  </a>
                </div>
              </div>
            </div>
            
            <div v-else-if="!isSpinning && !randomPlace" class="text-center text-text-dim text-lg sm:text-xl font-light italic">
              ✨ Bánh xe đang chờ lệnh...
            </div>
          </transition>
        </div>
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
