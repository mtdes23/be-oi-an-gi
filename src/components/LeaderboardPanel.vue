<script setup>
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n.js'
import { useLeaderboardStore } from '../stores/leaderboardStore.js'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const leaderboardStore = useLeaderboardStore()
</script>

<template>
  <BottomSheet :show="show" title="🏆 Bảng xếp hạng" maxWidth="sm:max-w-2xl" @close="emit('close')">
    <template #default>
      <div v-if="leaderboardStore.getTopPlayers().length === 0" class="text-center py-8 text-stone-300 dark:text-stone-600">
        <Icon icon="lucide:trophy" class="size-10 mx-auto mb-2 animate-float" />
        <p class="text-sm">{{ t.noLeaderboard }}</p>
      </div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
        <div v-for="(player, i) in leaderboardStore.getTopPlayers()" :key="player.name"
             class="rounded-xl p-3 flex items-center gap-3 transition-all border"
             :class="i < 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-900/30' : 'bg-stone-50 dark:bg-stone-700/50 border-stone-100 dark:border-stone-700'">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
               :class="i === 0 ? 'bg-amber-400 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30' : i === 1 ? 'bg-stone-300 text-stone-700' : i === 2 ? 'bg-orange-300 text-orange-700' : 'bg-stone-100 dark:bg-stone-600 text-stone-500 dark:text-stone-400'">
            {{ i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">{{ player.name }}</p>
            <p class="text-xs text-stone-400 dark:text-stone-500">{{ player.spinsToday }} {{ t.dayProgress }}</p>
          </div>
          <span class="text-sm font-bold text-amber-500">{{ player.score }} pts</span>
        </div>
      </div>
    </template>
  </BottomSheet>
</template>
