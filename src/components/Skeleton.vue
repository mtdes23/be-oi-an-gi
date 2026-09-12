<script setup>
const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '20px' },
  rounded: { type: String, default: 'rounded-lg' },
  lines: { type: Number, default: 1 }
})
</script>

<template>
  <div>
    <template v-if="lines > 1">
      <div
        v-for="i in lines"
        :key="i"
        :class="[rounded, 'skeleton mb-2']"
        :style="{ width: i === lines ? '60%' : width, height }"
      />
    </template>
    <template v-else>
      <div
        :class="[rounded, 'skeleton']"
        :style="{ width, height }"
      />
    </template>
  </div>
</template>
