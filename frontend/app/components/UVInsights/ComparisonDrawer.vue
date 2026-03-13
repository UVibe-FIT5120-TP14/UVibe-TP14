<script setup lang="ts">
import { COMPARE_COLORS } from '~/utils/uvInsights'

defineProps<{
  comparisonData: Array<{
    id: string
    name: string
    ringColor: string
    uv: number | null
    uvLabel: string
    uvColor: string
    uvPct: number
    rate: number | null
    rateLabel: string
    ratePct: number
    count: number | null
    cancerYear: number
  }>
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="mx-4 mb-3 rounded-xl overflow-hidden"
    style="background:rgba(10,20,45,0.96);border:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(12px);">

    <!-- Header row -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
      <div class="flex items-center gap-2.5">
        <span class="text-xs text-gray-500 uppercase tracking-widest">Comparing</span>
        <span
          v-for="(d, i) in comparisonData" :key="d.id"
          class="text-xs font-bold tracking-wider px-2.5 py-1 rounded-md"
          :style="{
            background: `${COMPARE_COLORS[i]}18`,
            color:       COMPARE_COLORS[i],
            border:     `1px solid ${COMPARE_COLORS[i]}40`,
          }"
        >{{ d.id }}</span>
      </div>
      <button
        class="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none px-1 py-0"
        @click="emit('close')"
      >×</button>
    </div>

    <!-- Side-by-side state cards -->
    <div class="grid grid-cols-2 divide-x divide-white/[0.04]">
      <div v-for="d in comparisonData" :key="`cmp-${d.id}`" class="px-4 py-4 flex flex-col gap-3">

        <!-- State header -->
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ background: d.ringColor, boxShadow: `0 0 8px ${d.ringColor}` }"/>
          <span class="text-base font-black text-white tracking-wider">{{ d.id }}</span>
          <span class="text-xs text-gray-500 truncate">{{ d.name }}</span>
        </div>

        <!-- UV bar -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 uppercase tracking-widest">UV Index</span>
            <span class="text-sm font-bold" :style="{ color: d.uvColor }">
              {{ d.uv?.toFixed(1) ?? '—' }} · {{ d.uvLabel }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${d.uvPct}%`, background: d.uvColor, boxShadow: `0 0 6px ${d.uvColor}80` }"/>
          </div>
        </div>

        <!-- Cancer rate bar -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 uppercase tracking-widest">Cancer / 100k</span>
            <span class="text-sm font-bold text-cyan-400">{{ d.rate?.toFixed(1) ?? '—' }}</span>
          </div>
          <div class="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :style="{
                width:     `${d.ratePct}%`,
                background: 'rgba(34,211,238,0.8)',
                boxShadow:  '0 0 6px rgba(34,211,238,0.5)',
              }"/>
          </div>
        </div>

        <p class="text-xs text-gray-600">
          <span class="text-gray-300 font-semibold">{{ d.count?.toLocaleString() ?? '—' }}</span>
          cases ({{ d.cancerYear }})
        </p>
      </div>
    </div>
  </div>
</template>
