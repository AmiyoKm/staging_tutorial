<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title?: string
  message: string
  variant?: 'default' | 'destructive'
}

const toasts = ref<Toast[]>([])

function showToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(7)
  toasts.value.push({ ...toast, id })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

function removeToast(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="cn(
        'rounded-lg border p-4 shadow-lg transition-all',
        toast.variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground border-destructive'
          : 'bg-background text-foreground border-border'
      )"
    >
      <div v-if="toast.title" class="font-semibold">{{ toast.title }}</div>
      <div class="text-sm">{{ toast.message }}</div>
    </div>
  </div>
</template>
