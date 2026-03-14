<script setup lang="ts">
import type { GeoFeature } from '~/types/uvInsights'
import { BUBBLE_FILL, BUBBLE_STROKE, COMPARE_COLORS, LABEL_FONT, UV_TICKS, STATE_POP } from '~/utils/uvInsights'
import { useUVColors } from '~/composables/UVInsights/useUVColors'

const props = defineProps<{
  geoFeatures: GeoFeature[]
  mapLoading: boolean
  mapError: string | null
  currentUV: Record<string, number>
  currentStateCancer: Record<string, number>
  currentYear: number
  hoveredId: string | null
  selectedStates: string[]
  maxCancerRate: number
}>()
 
const emit = defineEmits<{
  'update:hoveredId': [id: string | null]
  'stateClick': [id: string]
}>()
 
// Pure utility — safe to call directly in any component
const { uvColor } = useUVColors()
 
// Computed locally so Vue tracks props.currentStateCancer and props.maxCancerRate
// as reactive dependencies during this component's render
function bubbleR(id: string): number {
  const count = props.currentStateCancer[id]
  const pop   = STATE_POP[id]
  if (!count || !pop) return 0
  const rate  = (count / pop) * 100_000
  const ratio = rate / props.maxCancerRate
  return 6 + Math.pow(ratio, 1.1) * 50
}
 
// Computed locally so Vue tracks props.selectedStates during render
function stateOpacity(id: string): number {
  if (props.selectedStates.length !== 2) return 1
  return props.selectedStates.includes(id) ? 1 : 0.15
}
</script>
 
<template>
  <div class="relative min-w-0">
    <!-- Current year badge -->
    <div class="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg text-sm font-black tracking-widest uppercase"
      style="background:rgba(6,13,27,0.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);">
      {{ currentYear }}
    </div>
 
    <!-- Loading state -->
    <div v-if="mapLoading"
      class="flex items-center justify-center rounded-xl bg-white/[0.02]"
      style="aspect-ratio:900/780"
    >
      <div class="flex flex-col items-center gap-2 text-gray-600">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-60" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span class="text-xs tracking-widest uppercase">Loading map…</span>
      </div>
    </div>
 
    <!-- Error state -->
    <div v-else-if="mapError"
      class="flex items-center justify-center text-red-400 text-sm rounded-xl bg-white/[0.02]"
      style="aspect-ratio:900/780"
    >{{ mapError }}</div>
 
    <!-- SVG geo map -->
    <svg v-else viewBox="0 0 900 780" class="w-full cursor-pointer" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 4px 40px rgba(20,80,200,0.12))">
      <defs>
        <filter id="sg" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sgh" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="uvLegGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="rgb(109,40,217)"/>
          <stop offset="25%"  stop-color="rgb(168,85,247)"/>
          <stop offset="45%"  stop-color="rgb(239,68,68)"/>
          <stop offset="65%"  stop-color="rgb(249,115,22)"/>
          <stop offset="80%"  stop-color="rgb(234,179,8)"/>
          <stop offset="100%" stop-color="rgb(34,197,94)"/>
        </linearGradient>
      </defs>
 
      <rect width="900" height="780" fill="#060d1b"/>
 
      <!-- Layer 1: UV choropleth fills -->
      <path
        v-for="feat in geoFeatures" :key="feat.id"
        :d="feat.path"
        :fill="currentUV[feat.id] !== undefined ? uvColor(currentUV[feat.id]) : '#0f1f3d'"
        :filter="hoveredId === feat.id ? 'url(#sgh)' : 'url(#sg)'"
        stroke="#060d1b" stroke-width="1.5" stroke-linejoin="round"
        :style="{
          opacity: stateOpacity(feat.id),
          transition: 'fill 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        }"
        @mouseenter="emit('update:hoveredId', feat.id)"
        @mouseleave="emit('update:hoveredId', null)"
        @click="emit('stateClick', feat.id)"
      />
 
      <!-- Layer 2: Cancer bubbles (size = per-capita rate) -->
      <circle
        v-for="feat in geoFeatures" :key="`bubble-${feat.id}`"
        :cx="feat.labelX"
        :cy="feat.labelY"
        :r="bubbleR(feat.id)"
        :fill="BUBBLE_FILL"
        :stroke="BUBBLE_STROKE"
        stroke-width="1.5"
        pointer-events="none"
        :style="{
          opacity: currentStateCancer[feat.id] ? stateOpacity(feat.id) : 0,
          transition: 'r 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        }"
      />
 
      <!-- Layer 3: Selection rings (dashed, pulsing) -->
      <path
        v-for="(sid, idx) in selectedStates" :key="`ring-${sid}`"
        :d="geoFeatures.find(f => f.id === sid)?.path"
        fill="none"
        :stroke="COMPARE_COLORS[idx]"
        stroke-width="3" stroke-dasharray="9 5" stroke-linejoin="round"
        stroke-opacity="0.9"
        pointer-events="none"
        class="ring-pulse"
      />
 
      <!-- Layer 4: State abbreviation labels -->
      <g v-for="feat in geoFeatures" :key="`lbl-${feat.id}`" pointer-events="none">
        <text
          :x="feat.labelX" :y="feat.labelY - 7"
          text-anchor="middle" dominant-baseline="middle"
          fill="rgba(255,255,255,0.9)"
          :font-size="LABEL_FONT[feat.id] ?? 12" font-weight="700"
          font-family="'Courier New',Courier,monospace"
          :style="{ opacity: stateOpacity(feat.id), transition: 'opacity 0.25s ease' }"
        >{{ feat.id }}</text>
      </g>
 
      <!-- Embedded legend panel -->
      <g transform="translate(780, 20)">
        <rect x="0" y="0" width="110" height="460" rx="8"
          fill="rgba(6,13,27,0.88)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
 
        <!-- UV Index legend -->
        <g transform="translate(10, 20)">
          <text x="45" y="5" text-anchor="middle" fill="rgba(255,255,255,0.8)"
            font-size="12" font-weight="800" font-family="monospace" letter-spacing="2">UV INDEX</text>
          <rect x="12" y="25" width="14" height="200" rx="7" fill="url(#uvLegGrad)"/>
          <g v-for="t in UV_TICKS" :key="`svt-${t.v}`"
            :transform="`translate(0, ${25 + ((15 - t.v) / 15) * 200})`">
            <line x1="28" y1="0" x2="34" y2="0" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <text x="40" y="0" dominant-baseline="middle" fill="rgba(255,255,255,0.7)"
              font-size="11" font-weight="600" font-family="monospace">{{ t.l }}</text>
            <text v-if="t.label" x="40" y="12" dominant-baseline="middle"
              fill="rgba(255,255,255,0.4)" font-size="9" font-family="monospace">{{ t.label }}</text>
          </g>
        </g>
 
        <line x1="20" y1="270" x2="90" y2="270" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
 
        <!-- Cancer bubble size legend -->
        <g transform="translate(5, 290)">
          <text x="50" y="5" text-anchor="middle" fill="rgba(255,255,255,0.8)"
            font-size="11" font-weight="800" font-family="monospace" letter-spacing="1">CANCER CASES</text>
          <g transform="translate(50, 70)">
            <circle r="28" fill="rgba(34,211,238,0.05)" stroke="rgba(34,211,238,0.4)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle r="18" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.6)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle r="8"  fill="rgba(34,211,238,0.15)" stroke="rgba(34,211,238,0.9)" stroke-width="2"/>
          </g>
          <g font-family="monospace" text-anchor="middle">
            <text x="50" y="125" fill="rgba(255,255,255,0.5)" font-size="10" font-weight="600">Incident Density</text>
            <text x="50" y="145" fill="rgba(34,211,238,0.6)"  font-size="9">(Cases per State)</text>
          </g>
        </g>
      </g>
 
      <!-- Compass rose -->
      <g transform="translate(858,742)" opacity="0.12" fill="none" stroke="white" stroke-width="1">
        <line x1="0" y1="-16" x2="0"  y2="16"/>
        <line x1="-16" y1="0" x2="16" y2="0"/>
        <text x="0" y="-20" text-anchor="middle" font-size="9" fill="white" stroke="none" font-family="monospace">N</text>
      </g>
    </svg>
  </div>
</template>
 
<style scoped>
@keyframes ringPulse { 0%, 100% { stroke-opacity: 0.9; } 50% { stroke-opacity: 0.25; } }
.ring-pulse { animation: ringPulse 2.2s ease-in-out infinite; }
</style>