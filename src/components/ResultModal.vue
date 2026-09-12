<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useFavorites } from '../composables/useFavorites.js'
import { useToast } from '../composables/useToast.js'
import { getProvinceDisplay } from '../data/districts.js'

const { success, error } = useToast()

const props = defineProps({
  place: { type: Object, required: true }
})

const emit = defineEmits(['close', 'toggleFavorite'])

const { toggleFavorite, isFavorite } = useFavorites()

const resultCardRef = ref(null)
const isCapturing = ref(false)

const getGoogleMapsLink = (place) => {
  if (!place) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.addr}, ${place.dist}`)}`
}

const openOrderLink = (place) => {
  const query = `${place.name} ${place.addr} ${place.dist}`
  window.open(`https://shopeefood.vn/search?q=${encodeURIComponent(query)}`, '_blank')
}

const openGrabFood = (place) => {
  const query = `${place.name} ${place.addr} ${place.dist}`
  window.open(`https://food.grab.com/sg/en/search?query=${encodeURIComponent(query)}`, '_blank')
}

const shareResult = (place) => {
  const oldDistNote = place.oldDist ? `\n📍 Trước đây thuộc ${place.oldDist}` : ''
  const text = `🍜 Bé ơi ăn gì đã chọn: ${place.name}\n📍 ${place.addr}, ${place.dist}${oldDistNote}\n💰 ${place.price}\n⏰ ${place.time}\n⭐ ${place.rating || 'N/A'}/5`
  if (navigator.share) {
    navigator.share({ title: 'Bé ơi ăn gì?', text })
  } else {
    navigator.clipboard.writeText(text)
    success('Đã copy vào clipboard!')
  }
}

const shareAsText = async (place) => {
  const text = `🍜 ${place.name}\n📍 ${place.addr}, ${place.dist}\n💰 ${place.price}\n⏰ ${place.time}`
  try {
    await navigator.clipboard.writeText(text)
    success('Đã copy!')
  } catch {
    error('Không thể copy')
  }
}

const captureAndShare = async () => {
  if (!resultCardRef.value || isCapturing.value) return
  isCapturing.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
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
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity" @click.self="emit('close')">
    <div ref="resultCardRef" class="w-full sm:max-w-md bg-white dark:bg-stone-800 sm:rounded-3xl rounded-t-3xl p-5 sm:p-7 card-shadow-lg relative overflow-hidden animate-bounce-in border border-stone-100 dark:border-stone-700 max-h-[90vh] max-h-[90dvh] overflow-y-auto" @click.stop>

      <!-- Close -->
      <button @click="emit('close')" class="absolute top-3 right-3 sm:top-4 sm:right-4 text-stone-300 hover:text-stone-600 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full p-2.5 transition-all z-10 active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center">
        <Icon icon="lucide:x" class="size-5" />
      </button>

      <!-- Favorite -->
      <button @click="toggleFavorite(place)" class="absolute top-3 right-12 sm:top-4 sm:right-14 text-stone-300 hover:text-rose-500 bg-stone-100 dark:bg-stone-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full p-2.5 transition-all z-10 active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center">
        <Icon icon="lucide:heart" class="size-5 transition-transform" :class="[isFavorite(place) ? 'fill-rose-500 text-rose-500 animate-heart-pop' : '']" />
      </button>

      <!-- Capture -->
      <button @click="captureAndShare" :disabled="isCapturing" class="absolute top-3 right-[5.5rem] sm:top-4 sm:right-[5.5rem] text-stone-300 hover:text-orange-500 bg-stone-100 dark:bg-stone-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full p-2.5 transition-all z-10 disabled:opacity-50 active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center">
        <Icon :icon="isCapturing ? 'lucide:loader-2' : 'lucide:camera'" :class="{ 'animate-spin': isCapturing }" class="size-5" />
      </button>

      <!-- Badge -->
      <div class="flex justify-center mb-4 animate-stagger stagger-1">
        <span class="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800/50 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
          🎉 Kết quả
        </span>
      </div>

      <!-- Name -->
      <h2 class="text-[1.5rem] sm:text-[1.85rem] font-extrabold text-stone-800 dark:text-stone-100 text-center mb-2 leading-tight font-display animate-stagger stagger-2">{{ place.name }}</h2>

      <!-- Rating -->
      <div v-if="place.rating" class="flex justify-center mb-4 animate-stagger stagger-3">
        <div class="flex items-center gap-1">
          <template v-for="s in 5" :key="s">
            <Icon icon="lucide:star"
              :class="s <= Math.round(place.rating) ? 'text-amber-400' : 'text-stone-200 dark:text-stone-700'"
              class="size-4 fill-current transition-all"
              :style="{ animationDelay: `${s * 60}ms` }" />
          </template>
          <span class="text-xs text-stone-400 dark:text-stone-500 ml-1 font-medium">{{ place.rating }}</span>
        </div>
      </div>

      <!-- Badges -->
      <div class="flex flex-wrap justify-center gap-2 mb-5 animate-stagger stagger-3">
        <span class="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 flex items-center gap-2 text-orange-600 dark:text-orange-400 transition-all hover:scale-105">
          <Icon icon="lucide:utensils" class="size-4" />
          <span class="text-[0.8rem] font-medium">{{ place.dish }}</span>
        </span>
        <span class="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 text-amber-600 dark:text-amber-400 transition-all hover:scale-105">
          <Icon icon="lucide:tag" class="size-4" />
          <span class="text-[0.8rem] font-medium">{{ place.price }}</span>
        </span>
      </div>

      <!-- Details -->
      <div class="bg-stone-50 dark:bg-stone-700/50 rounded-2xl p-4 sm:p-5 space-y-3 border border-stone-100 dark:border-stone-700 animate-stagger stagger-4">
        <div class="flex items-start gap-3">
          <Icon icon="lucide:map-pin" class="size-5 shrink-0 text-orange-400 mt-0.5" />
          <div class="flex-1">
            <span class="text-[0.85rem] sm:text-[0.9rem] text-stone-600 dark:text-stone-300 leading-relaxed">{{ place.addr }}, {{ getProvinceDisplay(place.dist) }}</span>
            <span v-if="place.oldDist" class="block text-[0.7rem] sm:text-[0.75rem] text-stone-400 dark:text-stone-500 mt-1 italic">
              📍 Trước đây thuộc {{ place.oldDist }}
            </span>
          </div>
        </div>
        <div class="h-px bg-stone-200 dark:bg-stone-600"></div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-stone-400 dark:text-stone-500">
            <Icon icon="lucide:clock" class="size-5 shrink-0" />
            <span class="text-[0.85rem] sm:text-[0.9rem] font-medium">{{ place.time }}</span>
          </div>
          <a :href="getGoogleMapsLink(place)" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-orange-300 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-orange-600 transition-all active:scale-95 card-shadow min-h-[44px]">
            <Icon icon="lucide:navigation" class="size-4" />
            Chỉ đường
          </a>
        </div>
      </div>

      <!-- Order Online -->
      <div class="flex gap-2 mt-3 animate-stagger stagger-5">
        <button @click="openOrderLink(place)"
          class="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 rounded-xl text-xs font-semibold text-orange-600 dark:text-orange-400 transition-all active:scale-95 min-h-[44px]">
          <Icon icon="lucide:shopping-bag" class="size-3.5" />
          ShopeeFood
        </button>
        <button @click="openGrabFood(place)"
          class="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-xl text-xs font-semibold text-green-600 dark:text-green-400 transition-all active:scale-95 min-h-[44px]">
          <Icon icon="lucide:bike" class="size-3.5" />
          GrabFood
        </button>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 sm:gap-3 mt-4 pb-2 animate-stagger stagger-6">
        <button @click="toggleFavorite(place)" class="py-3.5 px-4 bg-white dark:bg-stone-700 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-400 text-rose-500 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 min-h-[48px]">
          <span class="flex items-center justify-center gap-2">
            <Icon icon="lucide:heart" class="size-4" :class="isFavorite(place) ? 'fill-rose-500' : ''" />
          </span>
        </button>
        <button @click="shareResult(place)" class="flex-1 py-3.5 bg-white dark:bg-stone-700 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 text-orange-500 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 min-h-[48px]">
          <span class="flex items-center justify-center gap-2">
            <Icon icon="lucide:share-2" class="size-4" />
            Chia sẻ
          </span>
        </button>
        <button @click="emit('close')" class="flex-1 py-3.5 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30 active:scale-95 transition-all min-h-[48px]">
          Chốt luôn 🎉
        </button>
      </div>
    </div>
  </div>
</template>
