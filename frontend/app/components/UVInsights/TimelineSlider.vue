<script setup lang="ts">
import { UNIFIED_YEARS, TOTAL_MONTHS } from '~/utils/uvInsights'

const props = defineProps<{
  sliderIndex: number
  isPlaying: boolean
  currentYear: number
  currentMonth: number
}>()

const emit = defineEmits<{
  'update:sliderIndex': [value: number]
  'togglePlay': []
}>()
</script>

<template>
  <div class="pt-3 pb-1">
    <!-- Row: date display · play/pause button -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 uppercase tracking-widest">Year</span>
        <span class="text-sm font-black tracking-widest"
          style="color:rgb(147,197,253);text-shadow:0 0 14px rgba(59,130,246,0.5)">
          {{ new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short' }) }}
          {{ currentYear }}
        </span>
      </div>
    </div>

    <!-- Slider -->
    <input
      type="range"
      :value="sliderIndex"
      :min="0"
      :max="TOTAL_MONTHS - 1"
      step="1"
      class="unified-slider w-full"
      @input="emit('update:sliderIndex', Number(($event.target as HTMLInputElement).value))"
    />

    <!-- Year tick labels -->
    <div class="relative mt-2" style="height:16px">
      <span
        v-for="(yr, i) in UNIFIED_YEARS" :key="yr"
        class="absolute text-xs -translate-x-1/2 leading-none font-bold transition-colors duration-200"
        :style="{
          left: `${(i / (UNIFIED_YEARS.length - 1)) * 100}%`,
          color: currentYear === yr ? 'rgb(147,197,253)' : '#4b5563',
        }"
      >{{ yr }}</span>
    </div>
  </div>
</template>
