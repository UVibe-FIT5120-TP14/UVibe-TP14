<script setup lang="ts">
defineProps<{ location: string }>()
defineEmits<{ (e: 'toggle-sidebar'): void }>()
</script>

<template>
  <header
    class="flex items-center justify-between px-4 py-3 border-b"
    style="background-color: #FFF8F3; color: #1A1A2E; border-color: rgba(26,26,46,0.1);"
  >
    <!-- Logo -->
    <NuxtLink to="/" class="text-xl font-black tracking-widest" style="color: #1A1A2E;">UVibe</NuxtLink>

    <!-- Location -->
    <div class="flex items-center gap-1 text-xs truncate max-w-[140px]" style="color: #9CA3AF;">
      <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      <span>{{ location }}</span>
    </div>

    <!-- Profile button -->
    <button
      class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      style="background-color: #F5E6D3;"
      aria-label="Open menu"
      @click="$emit('toggle-sidebar')"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style="color: #6B7280;">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </button>
  </header>
</template>
