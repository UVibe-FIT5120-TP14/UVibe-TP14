<script setup lang="ts">
defineProps<{
  uvIndex: number
  color: string
  label: string
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Outer glow ring -->
    <div
      class="relative flex items-center justify-center rounded-full"
      :style="{
        width: '220px',
        height: '220px',
        boxShadow: `0 0 48px 8px ${color}30, 0 0 0 6px ${color}`,
        border: `6px solid ${color}`,
      }"
    >
      <!-- Inner circle -->
      <div class="flex flex-col items-center justify-center">
        <span class="text-8xl font-black leading-none" style="color: #1A1A2E;">{{ uvIndex }}</span>
        <span
          class="text-sm font-bold tracking-[0.2em] mt-2"
          :style="{ color }"
        >{{ label }}</span>
      </div>
    </div>

    <p class="text-xs tracking-widest uppercase" style="color: #9CA3AF;">UV Index</p>
  </div>
</template>
