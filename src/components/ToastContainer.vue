<script setup>
import { useToast } from '../composables/useToast.js'
import Toast from './Toast.vue'

const { toasts, remove } = useToast()
</script>

<template>
  <Toast
    v-for="toast in toasts"
    :key="toast.id"
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    :duration="toast.duration"
    @close="remove(toast.id)"
  />
</template>
