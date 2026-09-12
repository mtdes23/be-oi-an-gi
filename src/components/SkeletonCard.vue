<script setup>
import Skeleton from './Skeleton.vue'
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 border border-stone-100 dark:border-stone-700 animate-pulse">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-700 shrink-0"></div>
      <div class="flex-1">
        <Skeleton width="70%" height="16px" class="mb-2" />
        <Skeleton width="50%" height="12px" />
      </div>
    </div>
  </div>
</template>
