<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { UVHistoryResponse, StateCancerRecord } from '~/types/uvInsights'

// ─── Composables ──────────────────────────────────────────────────────────────
import { useGeoMap }           from '~/composables/UVInsights/useGeoMap'
import { useTimelinePlayback } from '~/composables/UVInsights/useTimelinePlayback'
import { useUVColors }         from '~/composables/UVInsights/useUVColors'
import { useCancerData }       from '~/composables/UVInsights/useCancerData'
import { useMapInteractions }  from '~/composables/UVInsights/useMapInteractions'

// ─── Components ───────────────────────────────────────────────────────────────
import UVMapSvg          from '~/components/UVInsights/UVMapSvg.vue'
import AgeGroupChart     from '~/components/UVInsights/AgeGroupChart.vue'
import ComparisonDrawer  from '~/components/UVInsights/ComparisonDrawer.vue'
import TimelineSlider    from '~/components/UVInsights/TimelineSlider.vue'

// ─── Props ────────────────────────────────────────────────────────────────────

const props = defineProps<{
  data?:       UVHistoryResponse[]
  cancerData?: StateCancerRecord[]
}>()

const allUV     = computed(() => props.data       ?? [])
const allCancer = computed(() => props.cancerData ?? [])

// ─── Composable wiring ────────────────────────────────────────────────────────

const { geoFeatures, mapLoading, mapError } = useGeoMap()

const {
  sliderIndex, isPlaying,
  currentYear, currentMonth,
  togglePlay,
} = useTimelinePlayback()

const { uvColor, uvColorA, interpColor } = useUVColors()

const {
  currentUV,
  currentStateCancer,
  latestStateCancer,
  currentCancerYear,
  getCancerRate,
  cancerBubbleR,
  currentMaxCancerCount,
} = useCancerData(allUV, allCancer, currentYear, currentMonth)

const {
  hoveredId, containerRef, onMouseMove,
  tooltipStyle, hoveredInfo,
  selectedStates, stateOpacity, onStateClick,
  showComparison, comparisonData,
} = useMapInteractions(
  geoFeatures,
  currentUV,
  currentStateCancer,
  currentCancerYear,
  getCancerRate,
)

// ─── Entrance animation ───────────────────────────────────────────────────────

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

// ─── Constants re-exported for inline template use ────────────────────────────
import { COMPARE_COLORS, UV_STOPS, TOOLTIP_W } from '~/utils/uvInsights'
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full bg-[#060d1b] text-white overflow-hidden select-none font-mono"
    :style="{
      opacity:   visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }"
    @mousemove="onMouseMove"
  >
    <!-- Atmospheric background -->
    <div class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 80% 50% at 45% 40%, rgba(30,100,255,0.05) 0%, transparent 70%)"/>
    <div class="absolute inset-0 pointer-events-none opacity-[0.02]"
      style="background-image: linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px); background-size: 40px 40px;"/>

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="relative px-5 pt-5 pb-3 flex items-center gap-3">
      <div class="flex flex-col gap-[3px]">
        <div class="h-0.5 w-6 rounded-full bg-blue-400"/>
        <div class="h-0.5 w-4 rounded-full bg-blue-600"/>
        <div class="h-0.5 w-5 rounded-full bg-blue-500"/>
      </div>
      <div>
        <h3 class="text-base font-bold tracking-[0.18em] uppercase text-blue-300 leading-none">UV Insights</h3>
        <p class="text-xs text-gray-500 tracking-widest uppercase mt-0.5">Historical · Australia · 2016–2019</p>
      </div>
    </div>

    <!-- ── Two-panel layout ────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row gap-0 px-4 pb-2">

      <!-- ═══ Panel 1: Map ══════════════════════════════════════════════════ -->
      <div class="w-full md:flex-1 flex flex-col gap-2 md:pr-3 md:min-w-0">

        <div class="pb-2 border-b border-white/[0.06]">
          <h3 class="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase">
            UV Heatmap &amp; Cancer Incident
          </h3>
          <p class="text-[11px] text-gray-400 mt-1.5 leading-relaxed italic">
            Each state is colour-coded by UV index (green = low, violet = extreme).
            Cyan circles show skin cancer incident density — larger means higher cases.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.03]">
          <div class="space-y-1">
            <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Interface Controls</p>
            <p class="text-[10px] text-gray-400 leading-snug">
              <span class="text-blue-300">Slide</span> to change month/year.<br>
              <span class="text-blue-300">Hover</span> for metrics.<br>
              <span class="text-blue-300">Select</span> two states to compare.
            </p>
          </div>
        </div>

        <!-- Map -->
        <UVMapSvg
          :geoFeatures="geoFeatures"
          :mapLoading="mapLoading"
          :mapError="mapError"
          :currentUV="currentUV"
          :currentStateCancer="currentStateCancer"
          :currentYear="currentYear"
          :hoveredId="hoveredId"
          :selectedStates="selectedStates"
          :maxCancerRate="currentMaxCancerCount"
          @update:hoveredId="hoveredId = $event"
          @stateClick="onStateClick"
        />

        <!-- Slider -->
        <TimelineSlider
          v-model:sliderIndex="sliderIndex"
          :isPlaying="isPlaying"
          :currentYear="currentYear"
          :currentMonth="currentMonth"
          @togglePlay="togglePlay"
        />
      </div>
      <!-- end Panel 1 -->

      <!-- Vertical divider (desktop only) -->
      <div class="hidden md:block w-px bg-white/[0.05] self-stretch"/>

      <!-- ═══ Panel 2: Age-group chart ══════════════════════════════════════ -->
      <div class="w-full md:flex-1 flex flex-col gap-1 md:pl-3 md:min-w-0 mt-4 md:mt-0">

        <div class="pb-2 border-b border-white/[0.06]">
          <h3 class="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase">
            Skin Cancer Incidents by Age Group
          </h3>
          <p class="text-[11px] text-gray-400 mt-1.5 leading-relaxed italic">
            Annual skin cancer case counts broken down by age group across Australia (2016–2019),
            combining melanoma and non-melanoma types.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.03]">
          <div class="space-y-1">
            <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Interface Controls</p>
            <p class="text-[10px] text-gray-400 leading-snug">
              <span class="text-blue-300">Click</span> a legend pill to toggle a line.<br>
              <span class="text-blue-300">Hover</span> to compare values across groups.
            </p>
          </div>
        </div>

        <AgeGroupChart />

        <!-- Attribution footer -->
        <div class="mt-auto pt-4 flex flex-col gap-1 border-t border-white/[0.05]">
          <div class="flex items-center justify-between text-[10px] tracking-wider uppercase font-bold text-gray-600">
            <span>Data Attribution</span>
            <span class="text-[9px] font-normal lowercase opacity-50 italic">v1.0.4-stable</span>
          </div>
          <p class="text-[10px] leading-relaxed text-gray-500">
            UV Index data sourced from
            <a href="https://data.gov.au/data/organization/australian-radiation-protection-and-nuclear-safety-agency-arpansa"
              target="_blank" class="text-blue-400/60 hover:text-blue-400 underline decoration-dotted">data.gov.au</a>.
            Cancer statistics provided by
            <a href="https://www.aihw.gov.au/reports/cancer/cancer-data-in-australia/contents/cancer-data-commentaries/risk-of-melanoma"
              target="_blank" class="text-blue-400/60 hover:text-blue-400 underline decoration-dotted">AIHW</a>.
            Distributed under <span class="text-gray-400">CC BY 4.0</span> license.
          </p>
        </div>
      </div>
      <!-- end Panel 2 -->
    </div>

    <!-- ── Comparison drawer ──────────────────────────────────────────────── -->
    <Transition name="compare-slide">
      <ComparisonDrawer
        v-if="showComparison"
        :comparisonData="comparisonData"
        @close="selectedStates = []"
      />
    </Transition>

    <!-- ── Mouse-following tooltip (Reality Card) ─────────────────────────── -->
    <Transition name="tip">
      <div v-if="hoveredInfo"
        class="absolute z-50 rounded-xl px-4 py-3 pointer-events-none"
        :style="{
          ...tooltipStyle,
          background:       'rgba(6,13,27,0.97)',
          backdropFilter:   'blur(16px)',
          width:            `${TOOLTIP_W}px`,
          border:           `1px solid ${hoveredInfo.glow}`,
          boxShadow:        `0 0 32px ${hoveredInfo.glow}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
        }"
      >
        <div class="flex items-center gap-2 mb-1">
          <div class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ background: hoveredInfo.uvColor, boxShadow: `0 0 8px ${hoveredInfo.uvColor}` }"/>
          <span class="text-sm font-black tracking-widest uppercase" :style="{ color: hoveredInfo.uvColor }">
            {{ hoveredInfo.id }}
          </span>
          <span v-if="hoveredInfo.selIdx !== -1"
            class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
            :style="{
              background: `${COMPARE_COLORS[hoveredInfo.selIdx]}20`,
              color:       COMPARE_COLORS[hoveredInfo.selIdx],
            }">Selected</span>
        </div>
        <p class="text-xs text-gray-500 leading-none mb-3 truncate">{{ hoveredInfo.name }}</p>

        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-gray-500 uppercase tracking-widest">UV Index</span>
          <div class="flex items-center gap-1.5">
            <span class="text-lg font-black text-white leading-none">{{ hoveredInfo.uv?.toFixed(1) ?? '—' }}</span>
            <span class="text-xs font-bold uppercase" :style="{ color: hoveredInfo.uvColor }">{{ hoveredInfo.uvLabel }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-gray-500 uppercase tracking-widest">Cancer {{ hoveredInfo.cancerYear }}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-lg font-black text-white leading-none">{{ hoveredInfo.rate?.toFixed(0) ?? '—' }}</span>
            <span class="text-xs text-gray-500">/100k</span>
            <span class="text-xs font-bold uppercase text-cyan-400">{{ hoveredInfo.rateLabel }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-gray-500 uppercase tracking-widest">Estimated Population</span>
          <div class="flex items-center gap-1.5">
            <span class="text-lg font-black text-white leading-none">{{ hoveredInfo.population?.toLocaleString() ?? '—' }}</span>
            <span class="text-xs text-gray-500">people</span>
          </div>
        </div>

        <p class="text-xs text-gray-500 leading-snug border-t border-white/[0.05] pt-2 mb-1.5">
          {{ hoveredInfo.tagline }}
        </p>
        <p class="text-xs"
          :style="hoveredInfo.selIdx !== -1 ? `color:${COMPARE_COLORS[hoveredInfo.selIdx]}80` : 'color:#4b5563'">
          {{ hoveredInfo.selIdx !== -1 ? '✓ Click to remove' : '+ Click to compare' }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Unified timeline slider ─────────────────────────────────────────── */
.unified-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 5px; border-radius: 3px; outline: none; cursor: pointer;
  background: linear-gradient(to right, rgba(59,130,246,0.4), rgba(147,197,253,0.9));
}
.unified-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  border: 3px solid rgb(147,197,253);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2), 0 0 16px rgba(59,130,246,0.6), 0 2px 5px rgba(0,0,0,0.5);
  cursor: pointer; transition: transform 0.15s ease;
}
.unified-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
.unified-slider::-moz-range-thumb {
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  border: 3px solid rgb(147,197,253);
  box-shadow: 0 0 14px rgba(59,130,246,0.6); cursor: pointer;
}

/* ── Selection ring pulse ────────────────────────────────────────────── */
@keyframes ringPulse { 0%, 100% { stroke-opacity: 0.9; } 50% { stroke-opacity: 0.25; } }
.ring-pulse { animation: ringPulse 2.2s ease-in-out infinite; }

/* ── Transitions ─────────────────────────────────────────────────────── */
.tip-enter-active, .tip-leave-active   { transition: opacity 0.12s ease, transform 0.12s ease; }
.tip-enter-from,   .tip-leave-to       { opacity: 0; transform: scale(0.94); }

.compare-slide-enter-active            { transition: all 0.3s  cubic-bezier(0.4,0,0.2,1); }
.compare-slide-leave-active            { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
.compare-slide-enter-from,
.compare-slide-leave-to                { opacity: 0; transform: translateY(-8px); }
</style>