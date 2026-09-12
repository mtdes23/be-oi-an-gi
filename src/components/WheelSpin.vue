<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  rotation: { type: Number, default: 0 },
  isSpinning: { type: Boolean, default: false },
  hasResult: { type: Boolean, default: false }
})

const emit = defineEmits(['spin'])

const slices = 12

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
</script>

<template>
  <div class="relative mb-8 sm:mb-10">
    <!-- Pointer -->
    <div class="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20">
      <div class="w-0 h-0 border-l-[14px] sm:border-l-[18px] border-l-transparent border-r-[14px] sm:border-r-[18px] border-r-transparent border-t-[22px] sm:border-t-[26px] border-t-orange-500 drop-shadow-lg"></div>
    </div>

    <!-- Wheel ring -->
    <div class="w-56 h-56 sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] rounded-full p-2 sm:p-3 bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200 dark:from-orange-900/50 dark:via-amber-900/30 dark:to-yellow-900/40"
         :class="{ 'animate-glow-pulse': !isSpinning && hasResult }">
      <div class="w-full h-full rounded-full overflow-hidden relative bg-white dark:bg-stone-900 border-4 border-white dark:border-stone-800 card-shadow-lg">
        <svg viewBox="-50 -50 100 100"
             class="wheel-svg w-full h-full will-change-transform"
             :style="{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 1, 0.1, 1)' : 'transform 0.3s ease' }">
          <path v-for="(item, i) in items" :key="i"
                :d="getSlicePath(i, slices)"
                :fill="getSliceColor(i)"
                stroke="#fff" stroke-width="0.4" />
          <text v-for="(item, i) in items" :key="`text-${i}`"
                :transform="getTextTransform(i, slices)"
                text-anchor="middle" dominant-baseline="central"
                :fill="i % 2 === 0 ? '#ea580c' : '#92400e'" font-size="3" font-weight="700"
                class="pointer-events-none" style="font-family: 'Be Vietnam Pro', sans-serif;">
            {{ truncate(item?.name || '') }}
          </text>
        </svg>

        <!-- Center -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 border-4 border-white dark:border-stone-800 shadow-lg z-20 flex items-center justify-center transition-transform duration-300"
             :class="{ 'scale-110': !isSpinning && hasResult }">
          <span class="text-lg sm:text-xl">😋</span>
        </div>
      </div>
    </div>
  </div>
</template>
