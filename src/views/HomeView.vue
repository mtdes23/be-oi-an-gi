<script setup>
import { ref, computed, watch } from 'vue'
import { database } from '../data/database.js'
import { Icon } from '@iconify/vue'

const randomPlace = ref(null)
const isSpinning = ref(false)
const selectedDist = ref('Tất cả')

const distList = computed(() => {
  const dists = new Set(database.map((p) => p.dist).filter(Boolean))
  return ['Tất cả', ...Array.from(dists).sort()]
})

const filteredDatabase = computed(() => {
  if (selectedDist.value === 'Tất cả') return database
  return database.filter((p) => p.dist === selectedDist.value)
})

watch(filteredDatabase, () => {
  randomPlace.value = null
})

const pickRandom = () => {
  if (isSpinning.value) return
  const currentList = filteredDatabase.value
  if (currentList.length === 0) return

  isSpinning.value = true
  randomPlace.value = null

  const winner = currentList[Math.floor(Math.random() * currentList.length)]

  setTimeout(() => {
    isSpinning.value = false
    randomPlace.value = winner
  }, 3000)
}

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
          Chỉ cần chọn khu vực và nhấn sẽ chọn món ngon cho bé!
        </p>

        <!-- Filters -->
        <div class="w-full max-w-sm mb-10 relative z-20">
          <label
            class="block text-text-secondary text-sm mb-3 px-2 text-center uppercase tracking-widest font-medium text-white/70"
            >Bé muốn ăn ở khu vực nào?</label
          >
          <div class="relative group">
            <select
              v-model="selectedDist"
              @change="resetWheel"
              class="w-full appearance-none bg-black/40 border border-white/10 hover:border-white/30 text-white rounded-2xl px-6 py-4 font-display text-lg tracking-wide focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/50 transition-all cursor-pointer backdrop-blur-xl shadow-lg"
            >
              <option
                v-for="dist in distList"
                :key="dist"
                :value="dist"
                class="bg-gray-900 text-white py-2"
              >
                {{ dist }}
              </option>
            </select>
            <Icon
              icon="lucide:chevron-down"
              class="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none size-5 group-hover:text-white transition-colors"
            />
          </div>
        </div>

        <!-- Cooking Animation Container -->
        <div
          class="relative mb-12 flex-shrink-0 flex items-center justify-center min-h-[120px]"
        >
          <Icon
            :icon="isSpinning ? 'fluent-emoji:pot-of-food' : 'fluent-emoji:shallow-pan-of-food'"
            :class="{
              'animate-wiggle': isSpinning,
              'animate-pulse': !isSpinning && !randomPlace,
            }"
            class="relative z-10 w-20 h-20 sm:w-28 sm:h-28 drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)] transition-all duration-300"
          />

          <!-- Glowing backdrop for the pot (only visible when spinning) -->
          <div
            class="absolute w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-accent-amber/40 to-accent-coral/20 rounded-full mix-blend-screen filter blur-[20px] z-0 transition-opacity duration-500"
            :class="{ 'opacity-100 animate-pulse': isSpinning, 'opacity-0': !isSpinning }"
          ></div>
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
            {{ isSpinning ? 'Đang chọn món...' : 'Bé Chọn Nha' }}
          </span>
          <div
            class="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"
          ></div>
        </button>

        <!-- Result Display -->
        <div class="w-full max-w-xl flex flex-col items-center justify-center min-h-[120px]">
          <transition name="fade" mode="out-in">
            <div
              v-if="randomPlace && !isSpinning"
              :key="randomPlace.name"
              class="w-full flex flex-col items-center transform transition-all animate-bounce-in"
            >
              <div
                class="text-3xl sm:text-4xl font-display text-accent-sky font-medium tracking-wide text-center mb-6 px-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]"
              >
                {{ randomPlace.name }}
              </div>

              <!-- Badges -->
              <div class="flex flex-wrap justify-center gap-4 mb-6">
                <div
                  class="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner flex items-center gap-2"
                >
                  <span class="text-accent-sky"><Icon icon="lucide:utensils" /></span>
                  <span class="text-sm tracking-wider font-medium">{{ randomPlace.dish }}</span>
                </div>
                <div
                  class="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner flex items-center gap-2"
                >
                  <span class="text-accent-amber"><Icon icon="lucide:tag" /></span>
                  <span class="text-sm tracking-wider font-medium">{{ randomPlace.price }}</span>
                </div>
              </div>

              <!-- Location & Time Details -->
              <div
                class="w-full bg-black/50 rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
              >
                <!-- Address -->
                <div class="flex items-start justify-between gap-4 z-10 relative">
                  <div class="flex items-start gap-4 text-white/90 w-full">
                    <Icon icon="lucide:map-pin" class="mt-1 size-6 shrink-0 text-accent-coral" />
                    <span class="text-lg leading-relaxed"
                      >{{ randomPlace.addr }}, {{ randomPlace.dist }}</span
                    >
                  </div>
                </div>

                <div
                  class="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 relative"
                ></div>

                <!-- Time & Actions -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10 relative"
                >
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
                    <Icon
                      icon="lucide:navigation"
                      class="size-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
                    />
                    Chỉ đường
                  </a>
                </div>
              </div>
            </div>

            <div
              v-else-if="!isSpinning && !randomPlace"
              class="text-center text-text-dim text-lg sm:text-xl font-light italic"
            >
              ✨ Đang chờ lệnh của công chúa...
            </div>
          </transition>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="relative z-10 w-full pb-8 pt-4 flex flex-col items-center justify-center text-white/40 text-sm font-light tracking-wide gap-1"
    >
      <p>Designed by mtdes23</p>
      <a
        href="https://www.mtdes23.id.vn"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-white transition-colors cursor-pointer"
        >www.mtdes23.id.vn</a
      >
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(-10deg) scale(1.1);
  }
  50% {
    transform: rotate(10deg) scale(1.1);
  }
}
.animate-wiggle {
  animation: wiggle 0.4s ease-in-out infinite;
}
.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
