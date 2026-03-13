<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { geoMercator, geoPath, geoCentroid } from 'd3-geo'
import type { StateCancerRecord } from '~/composables/useCancerData'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UVHistoryResponse {
  region: string; year: number; month: number; uv_index: number
}

const props = defineProps<{
  data?: UVHistoryResponse[]
  cancerData?: StateCancerRecord[]
}>()

// ─── GeoJSON ─────────────────────────────────────────────────────────────────

const GEOJSON_URL = 'https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson'

const NAME_TO_CODE: Record<string, string> = {
  'Western Australia': 'WA', 'Northern Territory': 'NT', 'Queensland': 'QLD',
  'South Australia': 'SA', 'New South Wales': 'NSW', 'Australian Capital Territory': 'ACT',
  'Victoria': 'VIC', 'Tasmania': 'TAS',
}
const LABEL_FONT: Record<string, number> = { ACT: 7, TAS: 9, VIC: 10 }

interface GeoFeature { id: string; name: string; path: string; labelX: number; labelY: number }

const SVG_W = 900, SVG_H = 780
const geoFeatures = ref<GeoFeature[]>([])
const mapLoading = ref(true)
const mapError = ref<string | null>(null)

onMounted(async () => {
  try {
    const geo = await fetch(GEOJSON_URL).then(r => { if (!r.ok) throw new Error(); return r.json() })
    const proj = geoMercator().fitSize([SVG_W, SVG_H], geo)
    const pathGen = geoPath(proj)
    geoFeatures.value = geo.features.map((f: any) => {
      const name = f.properties?.STATE_NAME ?? f.properties?.name ?? f.properties?.Name ?? ''
      const code = NAME_TO_CODE[name] ?? f.properties?.STATE_ABBREV ?? name
      const [cx, cy] = proj(geoCentroid(f)) ?? [0, 0]
      return { id: code, name, path: pathGen(f) ?? '', labelX: cx, labelY: cy } as GeoFeature
    }).filter((f: GeoFeature) => f.path)
    mapLoading.value = false
  } catch { mapError.value = 'Could not load map data'; mapLoading.value = false }
})

// ─── Data ─────────────────────────────────────────────────────────────────────

const allUV     = computed<UVHistoryResponse[]>(() => props.data)
const allCancer = computed<StateCancerRecord[]>(() => props.cancerData)

// We use 2016–2019 as the shared window
const UNIFIED_YEARS = [2016, 2017, 2018, 2019]

const cancerLookup = computed(() => {
  const map: Record<number, Record<string, number>> = {}
  
  allCancer.value.forEach(d => {
    if (!map[d.year]) map[d.year] = {}
    
    // Normalize: If the backend sends "New South Wales", convert to "NSW"
    // If it's already "NSW", it remains "NSW"
    const stateKey = NAME_TO_CODE[d.state] || d.state 
    
    map[d.year][stateKey] = (map[d.year][stateKey] || 0) + (d.count || 0)
  })
  return map
})

// Annual average UV per region per year (across all 12 months)
const uvAnnualLookup = computed(() => {
  const sums: Record<number, Record<string, { sum: number; n: number }>> = {}
  allUV.value.forEach(d => {
    if (!sums[d.year]) sums[d.year] = {}
    if (!sums[d.year][d.region]) sums[d.year][d.region] = { sum: 0, n: 0 }
    sums[d.year][d.region].sum += d.uv_index
    sums[d.year][d.region].n++
  })
  const avgs: Record<number, Record<string, number>> = {}
  for (const [yr, regions] of Object.entries(sums)) {
    avgs[Number(yr)] = {}
    for (const [region, { sum, n }] of Object.entries(regions)) {
      avgs[Number(yr)][region] = Math.round((sum / n) * 10) / 10
    }
  }
  return avgs
})

// Max count within the unified year range — normalises bubble radii
const currentMaxCancerCount = computed(() => {
  let max = 0
  Object.keys(STATE_POP).forEach(id => {
    const rate = getCancerRate(id)
    if (rate > max) max = rate
  })
  return max || 1
})

// ─── Single unified slider & playback ────────────────────────────────────────

// Define the range
const START_YEAR = 2016
const END_YEAR = 2019
const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12

// The slider now moves from 0 to 47
const sliderIndex = ref(TOTAL_MONTHS - 1) 

// Derived time units
const currentYear = computed(() => START_YEAR + Math.floor(sliderIndex.value / 12))
const currentMonth = computed(() => (sliderIndex.value % 12) + 1)

const isPlaying   = ref(false)
const visible     = ref(false)
let playTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})
onUnmounted(() => { if (playTimer) clearInterval(playTimer) })

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (sliderIndex.value >= UNIFIED_YEARS.length - 1) sliderIndex.value = 0
    playTimer = setInterval(() => {
        if (sliderIndex.value < TOTAL_MONTHS - 1) {
            sliderIndex.value++
        } else {
            isPlaying.value = false; 
            clearInterval(playTimer!);
        }
    }, 150) // Faster interval (150ms) for smooth monthly flow
  } else {
    if (playTimer) { clearInterval(playTimer); playTimer = null }
  }
}
watch(isPlaying, v => { if (!v && playTimer) { clearInterval(playTimer); playTimer = null } })

// ─── Derived values ───────────────────────────────────────────────────────────

// UV needs to find the specific month/year
const currentUV = computed(() => {
  const yr = currentYear.value
  const mo = currentMonth.value
  const lookup: Record<string, number> = {}
  
  allUV.value.forEach(d => {
    if (d.year === yr && d.month === mo) {
      lookup[d.region] = d.uv_index
    }
  })
  return lookup
})

// Cancer remains yearly - it will only update when currentYear changes
const currentStateCancer = computed(() => cancerLookup.value[currentYear.value] ?? {})

// Keep these aliases so downstream code (tooltip, comparison) stays unchanged
const currentCancerYear  = currentYear
const latestStateCancer  = computed(() => cancerLookup.value[2019] ?? {})

// ─── Color system ─────────────────────────────────────────────────────────────

// WHO-aligned: green (Low) → yellow → orange → red → violet (Extreme)
// Distinct from the amber/teal cancer bubble color
interface ColorStop { val: number; r: number; g: number; b: number }

const UV_STOPS: ColorStop[] = [
  { val: 0,  r: 34,  g: 197, b: 94  }, // green-500   Low
  { val: 3,  r: 234, g: 179, b: 8   }, // yellow-500  Moderate
  { val: 6,  r: 249, g: 115, b: 22  }, // orange-500  High
  { val: 8,  r: 239, g: 68,  b: 68  }, // red-500     Very High
  { val: 11, r: 168, g: 85,  b: 247 }, // violet-500  Extreme
  { val: 15, r: 109, g: 40,  b: 217 }, // violet-700
]

function interpColor(stops: ColorStop[], value: number): [number, number, number] {
  const max = stops[stops.length - 1].val
  const v = Math.max(0, Math.min(max, value))
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].val && v <= stops[i + 1].val) { lo = stops[i]; hi = stops[i + 1]; break }
  }
  const t = lo.val === hi.val ? 0 : (v - lo.val) / (hi.val - lo.val)
  return [Math.round(lo.r + t * (hi.r - lo.r)), Math.round(lo.g + t * (hi.g - lo.g)), Math.round(lo.b + t * (hi.b - lo.b))]
}

function uvColor(uv: number)             { const [r,g,b] = interpColor(UV_STOPS, uv); return `rgb(${r},${g},${b})` }
function uvColorA(uv: number, a: number) { const [r,g,b] = interpColor(UV_STOPS, uv); return `rgba(${r},${g},${b},${a})` }

// Cancer bubble: bright cyan/teal — fully distinct from green→violet UV scale
const BUBBLE_STROKE = 'rgba(34, 211, 238, 0.85)'  // cyan-400
const BUBBLE_FILL   = 'rgba(34, 211, 238, 0.12)'

function getCancerRate(stateId: string): number {
  const count = currentStateCancer.value[stateId] // Use active year data
  const pop = STATE_POP[stateId]
  if (count === undefined || !pop) return null
  return (count / pop) * 100000
}

function cancerBubbleR(id: string): number {
  const rate = getCancerRate(id)
  if (!rate || rate === 0) return 0
  
  // Scaling by rate shows the "impact" per capita
  const ratio = rate / currentMaxCancerCount.value
  
  // Base 6px + up to 50px growth
  return 6 + (Math.pow(ratio, 1.1) * 50)
}

function uvLabel(uv: number) {
  if (uv < 3) return 'Low'; if (uv < 6) return 'Moderate'
  if (uv < 8) return 'High'; if (uv < 11) return 'Very High'; return 'Extreme'
}
function rateLabel(rate: number) {
  if (rate < 20) return 'Below Avg'; if (rate < 35) return 'Moderate'
  if (rate < 50) return 'Elevated';  if (rate < 65) return 'High'; return 'Very High'
}

const STATE_TAGLINES: Record<string, string> = {
  QLD: 'Highest UV & melanoma rates nationally',
  NT:  'Year-round extreme UV exposure',
  WA:  'Vast coastal UV exposure zones',
  NSW: 'Largest absolute case volume nationally',
  SA:  'Moderate UV, significant cumulative risk',
  ACT: 'Urban UV — consistent year-round',
  VIC: 'Cooler climate, still significant risk',
  TAS: 'Lowest UV in Australia — still significant',
}

const STATE_POP: Record<string, number> = {
  NSW: 8600000, VIC: 7100000, QLD: 5700000, SA: 1900000,
  WA: 3000000, TAS: 570000, NT: 250000, ACT: 470000,
}

// ─── Hover & state dimming ────────────────────────────────────────────────────

const hoveredId = ref<string | null>(null)
const mouseX    = ref(0)
const mouseY    = ref(0)
const containerRef = ref<HTMLElement | null>(null)

function onMouseMove(e: MouseEvent) {
  if (!containerRef.value) return
  const r = containerRef.value.getBoundingClientRect()
  mouseX.value = e.clientX - r.left
  mouseY.value = e.clientY - r.top
}

// Dim non-selected states whenever exactly 2 states are selected.
// Clears automatically when selectedStates is emptied.
const dimActive = computed(() => selectedStates.value.length === 2)

function stateOpacity(id: string): number {
  if (!dimActive.value) return 1
  return selectedStates.value.includes(id) ? 1 : 0.15
}

// ─── Tooltip (Reality Card) ───────────────────────────────────────────────────

const TOOLTIP_W = 216, TOOLTIP_H = 178, OFFSET = 16

const tooltipStyle = computed(() => {
  if (!containerRef.value) return {}
  const w = containerRef.value.offsetWidth, h = containerRef.value.offsetHeight
  const flipX = mouseX.value + OFFSET + TOOLTIP_W > w
  const flipY = mouseY.value + OFFSET + TOOLTIP_H > h
  return {
    left: flipX ? `${mouseX.value - TOOLTIP_W - OFFSET}px` : `${mouseX.value + OFFSET}px`,
    top:  flipY ? `${mouseY.value - TOOLTIP_H - OFFSET}px` : `${mouseY.value + OFFSET}px`,
  }
})

const hoveredInfo = computed(() => {
  if (!hoveredId.value) return null
  const feat = geoFeatures.value.find(f => f.id === hoveredId.value)
  if (!feat) return null
  const id   = hoveredId.value
  const uv   = currentUV.value[id]
  const rate = getCancerRate(id)
  const count = currentStateCancer.value[id]
  const [mr, mg, mb] = interpColor(UV_STOPS, uv ?? 0)
  return {
    id, name: feat.name,
    uv,    uvLabel:   uv   !== undefined ? uvLabel(uv)     : '—',
    uvColor:  uv !== undefined ? uvColor(uv) : '#6b7280',
    uvGlow:   uv !== undefined ? uvColorA(uv, 0.55) : 'rgba(107,114,128,0.4)',
    rate,  rateLabel: rate !== null       ? rateLabel(rate) : '—',
    count, cancerYear: currentCancerYear.value,
    tagline: STATE_TAGLINES[id] ?? '',
    glow: `rgba(${mr},${mg},${mb},0.5)`,
    selIdx: selectedStates.value.indexOf(id),
  }
})

// ─── State comparison ─────────────────────────────────────────────────────────

const selectedStates = ref<string[]>([])
const COMPARE_COLORS = ['#3B82F6', '#F59E0B']
const COMPARE_GLOW   = ['rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)']

function onStateClick(id: string) {
  const idx = selectedStates.value.indexOf(id)
  if (idx !== -1) {
    selectedStates.value = selectedStates.value.filter(s => s !== id)
  } else if (selectedStates.value.length < 2) {
    selectedStates.value = [...selectedStates.value, id]
  } else {
    selectedStates.value = [selectedStates.value[1], id]
  }
}

const showComparison = computed(() => selectedStates.value.length === 2)

const comparisonData = computed(() =>
  selectedStates.value.map((id, i) => {
    const feat  = geoFeatures.value.find(f => f.id === id)
    const uv    = currentUV.value[id] ?? null
    const rate  = getCancerRate(id, latestStateCancer.value)
    const count = currentStateCancer.value[id] ?? null
    return {
      id, name: feat?.name ?? id,
      ringColor: COMPARE_COLORS[i],
      uv,    uvLabel:   uv   !== null ? uvLabel(uv)     : '—', uvColor:   uv   !== null ? uvColor(uv)  : '#6b7280', uvPct:   uv   !== null ? (uv / 15) * 100                : 0,
      rate,  rateLabel: rate !== null ? rateLabel(rate) : '—', rateColor: '#22d3ee', ratePct: rate !== null ? Math.min((rate / 80) * 100, 100) : 0,
      count, cancerYear: currentCancerYear.value,
    }
  })
)

// ─── UV legend ticks ──────────────────────────────────────────────────────────

const LEGEND_H_VERT = 200  // vertical legend height in px (desktop)
const UV_TICKS = [
  { v: 15, l: '15', label: 'Extreme'   },
  { v: 11, l: '11', label: 'Very High' },
  { v: 8,  l: '8',  label: 'High'      },
  { v: 6,  l: '6',  label: 'Moderate'  },
  { v: 3,  l: '3',  label: 'Low'       },
  { v: 0,  l: '0',  label: ''          },
]
function uvTickY(v: number) { return ((15 - v) / 15) * LEGEND_H_VERT }
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full bg-[#060d1b] text-white overflow-hidden select-none font-mono"
    :style="{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }"
    @mousemove="onMouseMove"
  >
    <!-- Atmospheric background -->
    <div class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 80% 50% at 45% 40%, rgba(30,100,255,0.05) 0%, transparent 70%)" />
    <div class="absolute inset-0 pointer-events-none opacity-[0.02]"
      style="background-image: linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px); background-size: 40px 40px;" />

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="relative px-4 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="flex flex-col gap-[3px]">
          <div class="h-0.5 w-6 rounded-full bg-blue-400" />
          <div class="h-0.5 w-4 rounded-full bg-blue-600" />
          <div class="h-0.5 w-5 rounded-full bg-blue-500" />
        </div>
        <div>
          <h3 class="text-sm font-bold tracking-[0.18em] uppercase text-blue-300 leading-none">UV Insights</h3>
          <p class="text-[10px] text-gray-600 tracking-widest uppercase mt-0.5">Historical · Australia</p>
        </div>
      </div>

      <!-- Legend key (inline, always visible) -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- UV key -->
        <div class="flex items-center gap-1.5">
          <div class="w-16 h-2.5 rounded-full" style="background: linear-gradient(to right, rgb(34,197,94), rgb(234,179,8), rgb(249,115,22), rgb(239,68,68), rgb(168,85,247))" />
          <span class="text-[9px] text-gray-500 uppercase tracking-wider">UV Index</span>
        </div>
        <!-- Cancer bubble key -->
        <div class="flex items-center gap-1.5">
          <div class="flex items-center gap-0.5">
            <div class="rounded-full border border-cyan-400/70 bg-cyan-400/10" style="width:8px;height:8px" />
            <div class="rounded-full border border-cyan-400/70 bg-cyan-400/10" style="width:13px;height:13px" />
            <div class="rounded-full border border-cyan-400/70 bg-cyan-400/10" style="width:18px;height:18px" />
          </div>
          <span class="text-[9px] text-gray-500 uppercase tracking-wider">Cancer Cases</span>
        </div>
      </div>

      <!-- Animate -->
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200"
        :style="isPlaying
          ? 'background:rgba(255,50,20,0.15);border:1px solid rgba(255,50,20,0.4);color:rgb(255,100,80);box-shadow:0 0 12px rgba(255,50,20,0.2);'
          : 'background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:rgb(147,197,253);box-shadow:0 0 12px rgba(59,130,246,0.15);'"
        @click="togglePlay"
      >
        <svg v-if="!isPlaying" viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><polygon points="2,1 11,6 2,11"/></svg>
        <svg v-else viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
          <rect x="1.5" y="1" width="3.5" height="10" rx="1"/><rect x="7" y="1" width="3.5" height="10" rx="1"/>
        </svg>
        {{ isPlaying ? 'Pause' : 'Animate' }}
      </button>
    </div>

    <!-- ── Two-panel layout ────────────────────────────────────────────────── -->
    <!-- Mobile: stacks vertically. Desktop (md+): side by side. -->
    <div class="flex flex-col md:flex-row gap-0 px-4 pb-2">

      <!-- ═══ Panel 1: Choropleth + cancer bubbles ═══════════════════════════ -->
      <div class="w-full md:flex-1 flex flex-col gap-1 md:pr-3 md:min-w-0">
        <p class="text-[9px] text-gray-600 tracking-widest uppercase pb-1 border-b border-white/[0.04]">
          UV Heatmap + Cancer Incidents <span class="text-gray-700">· {{ currentYear }}</span>
        </p>

        <!-- Comparison hint -->
        <p class="text-[9px] pt-0.5 pb-0.5 tracking-wide transition-colors duration-200"
          :style="selectedStates.length === 0 ? 'color:#374151'
            : selectedStates.length === 1 ? `color:${COMPARE_COLORS[0]}70`
            : 'color:#374151'">
          <template v-if="selectedStates.length === 0">Click any state to compare &nbsp;·&nbsp; hover for details</template>
          <template v-else-if="selectedStates.length === 1">
            <span :style="{ color: COMPARE_COLORS[0] }">{{ selectedStates[0] }}</span> — click another to compare
          </template>
          <template v-else>
            Comparing <span :style="{ color: COMPARE_COLORS[0] }">{{ selectedStates[0] }}</span> vs
            <span :style="{ color: COMPARE_COLORS[1] }">{{ selectedStates[1] }}</span>
          </template>
        </p>

        <!-- Map area -->
        <!-- Desktop: map + vertical legend side-by-side -->
        <!-- Mobile:  map full width, horizontal legend strip below -->
        <div class="flex gap-2 items-stretch">
          <div class="flex-1 relative min-w-0">
            <div class="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase"
              style="background:rgba(6,13,27,0.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.45);">
              {{ currentYear }}
            </div>

            <!-- Loading -->
            <div v-if="mapLoading" class="flex items-center justify-center rounded-xl bg-white/[0.02]" style="aspect-ratio:900/780">
              <div class="flex flex-col items-center gap-2 text-gray-700">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-60" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span class="text-[10px] tracking-widest uppercase">Loading map…</span>
              </div>
            </div>

            <!-- Error -->
            <div v-else-if="mapError"
              class="flex items-center justify-center text-red-500 text-xs rounded-xl bg-white/[0.02]"
              style="aspect-ratio:900/780">{{ mapError }}</div>

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
              </defs>

              <rect width="900" height="780" fill="#060d1b"/>

              <!-- ── Layer 1: UV choropleth fills ── -->
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
                @mouseenter="hoveredId = feat.id"
                @mouseleave="hoveredId = null"
                @click="onStateClick(feat.id)"
              />

              <!-- ── Layer 2: Cancer bubbles (cyan, size = case count) ── -->
              <circle
                v-for="feat in geoFeatures" 
                :key="`bubble-${feat.id}`"
                :cx="feat.labelX" 
                :cy="feat.labelY"
                :r="cancerBubbleR(feat.id)"
                :fill="BUBBLE_FILL"
                :stroke="BUBBLE_STROKE"
                stroke-width="1.5"
                pointer-events="none"
                :style="{
                    opacity: currentStateCancer[feat.id] ? stateOpacity(feat.id) : 0,
                    transition: 'r 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    visibility: currentStateCancer[feat.id] ? 'visible' : 'hidden'
                }"
              />

              <!-- ── Layer 3: Selection rings ── -->
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

              <!-- ── Layer 4: Text labels ── -->
              <g v-for="feat in geoFeatures" :key="`lbl-${feat.id}`" pointer-events="none">
                <text :x="feat.labelX" :y="feat.labelY - 7"
                  text-anchor="middle" dominant-baseline="middle"
                  fill="rgba(255,255,255,0.9)"
                  :font-size="LABEL_FONT[feat.id] ?? 12" font-weight="700"
                  font-family="'Courier New',Courier,monospace"
                  :style="{ opacity: stateOpacity(feat.id), transition: 'opacity 0.25s ease' }"
                >{{ feat.id }}</text>
                <text v-if="feat.id !== 'ACT' && currentUV[feat.id] !== undefined"
                  :x="feat.labelX" :y="feat.labelY + 9"
                  text-anchor="middle" dominant-baseline="middle"
                  fill="rgba(255,255,255,0.45)"
                  :font-size="(LABEL_FONT[feat.id] ?? 10) - 1"
                  font-family="'Courier New',Courier,monospace"
                  :style="{ transition: 'all 0.55s ease' }"
                >{{ currentUV[feat.id]?.toFixed(1) }}</text>
              </g>

              <!-- Compass -->
              <g transform="translate(858,742)" opacity="0.12" fill="none" stroke="white" stroke-width="1">
                <line x1="0" y1="-16" x2="0" y2="16"/><line x1="-16" y1="0" x2="16" y2="0"/>
                <text x="0" y="-20" text-anchor="middle" font-size="9" fill="white" stroke="none" font-family="monospace">N</text>
              </g>
            </svg>
          </div>

          <!-- Vertical UV legend — hidden on mobile (horizontal strip used instead) -->
          <div class="hidden md:flex flex-col items-center py-2 gap-1" style="min-width:52px">
            <p class="text-[8px] text-gray-600 uppercase tracking-widest mb-1">UV</p>
            <div class="relative flex gap-1.5 items-start" :style="{ height: `${LEGEND_H_VERT}px` }">
              <div class="w-4 rounded-full flex-shrink-0" :style="{
                height: `${LEGEND_H_VERT}px`,
                background: 'linear-gradient(to bottom,rgb(109,40,217),rgb(168,85,247),rgb(239,68,68),rgb(249,115,22),rgb(234,179,8),rgb(34,197,94))',
                boxShadow: '0 0 10px rgba(100,150,255,0.08)',
              }"/>
              <div class="relative" :style="{ height: `${LEGEND_H_VERT}px`, width: '38px' }">
                <div v-for="t in UV_TICKS" :key="t.v" class="absolute flex items-center gap-1"
                  :style="{ top: `${uvTickY(t.v)}px`, transform: 'translateY(-50%)' }">
                  <div class="w-1 h-px bg-gray-700"/>
                  <span class="text-[7px] text-gray-500 leading-none whitespace-nowrap">{{ t.l }}<span v-if="t.label" class="text-gray-700"> {{ t.label }}</span></span>
                </div>
              </div>
            </div>
            <p class="text-[7px] text-gray-700 uppercase tracking-wider mt-1">Lo↑Hi</p>
          </div>
        </div>

        <!-- Mobile horizontal UV legend strip (shown only on mobile) -->
        <div class="md:hidden flex items-center gap-2 py-2 px-1 mt-1">
          <span class="text-[8px] text-gray-600 uppercase tracking-widest shrink-0">UV</span>
          <div class="flex-1 h-3 rounded-full" style="background:linear-gradient(to right,rgb(34,197,94),rgb(234,179,8),rgb(249,115,22),rgb(239,68,68),rgb(168,85,247),rgb(109,40,217))"/>
          <div class="flex justify-between text-[7px] text-gray-600 w-full absolute" style="max-width:calc(100% - 4rem)">
          </div>
          <div class="flex gap-2 shrink-0">
            <span class="text-[7px] text-green-500">Low</span>
            <span class="text-[7px] text-yellow-500">Mod</span>
            <span class="text-[7px] text-orange-500">High</span>
            <span class="text-[7px] text-red-500">VHigh</span>
            <span class="text-[7px] text-violet-400">Ext</span>
          </div>
        </div>
      </div>

      <!-- Vertical divider (desktop only) -->
      <div class="hidden md:block w-px bg-white/[0.05] self-stretch"/>

      <!-- ═══ Panel 2: Cancer trends placeholder ═════════════════════════════ -->
      <div class="w-full md:flex-1 flex flex-col gap-1 md:pl-3 md:min-w-0 mt-4 md:mt-0">
        <p class="text-[9px] text-gray-600 tracking-widest uppercase pb-1 border-b border-white/[0.04]">
          Skin Cancer · Incidence &amp; Mortality
        </p>
        <div class="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl mt-1"
          style="min-height:280px;background:rgba(255,255,255,0.012);border:1px dashed rgba(255,255,255,0.06);">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
            style="background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.13);">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
              stroke="rgba(59,130,246,0.45)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="text-center px-6">
            <p class="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1.5">Coming Soon</p>
            <p class="text-[10px] text-gray-700 leading-relaxed">
              Trend lines for cancer incident counts and deaths per region will appear here.
            </p>
          </div>
          <!-- Ghost skeleton -->
          <div class="w-full px-5 mt-1" aria-hidden="true">
            <div class="flex gap-3 mb-2 justify-center">
              <div class="flex items-center gap-1.5"><div class="w-5 h-0.5 rounded-full bg-blue-900"/><span class="text-[8px] text-gray-800">Incidents</span></div>
              <div class="flex items-center gap-1.5"><div class="w-5 h-0.5 rounded-full bg-red-900"/><span class="text-[8px] text-gray-800">Deaths</span></div>
            </div>
            <div class="flex items-end gap-[3px] h-16">
              <div v-for="(p, i) in [[40,18],[52,22],[48,20],[63,27],[55,23],[71,30],[60,26],[78,33],[65,28],[82,35],[70,30],[74,32]]"
                :key="i" class="flex-1 flex flex-col-reverse items-center gap-[2px]">
                <div class="w-full rounded-sm" :style="{ height:`${p[0]}%`, background:'rgba(59,130,246,0.1)' }"/>
                <div class="w-full rounded-sm" :style="{ height:`${p[1]}%`, background:'rgba(239,68,68,0.08)' }"/>
              </div>
            </div>
            <div class="h-px w-full bg-white/[0.05] mt-1 mb-1.5"/>
            <div class="flex justify-between">
              <span v-for="yr in ['2015','2017','2019','2021','2023','2025']" :key="yr" class="text-[7px] text-gray-800">{{ yr }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Comparison drawer ────────────────────────────────────────────────── -->
    <Transition name="compare-slide">
      <div v-if="showComparison" class="mx-4 mb-3 rounded-xl overflow-hidden"
        style="background:rgba(10,20,45,0.96);border:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(12px);">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
          <div class="flex items-center gap-2.5">
            <span class="text-[10px] text-gray-500 uppercase tracking-widest">Comparing</span>
            <span v-for="(d, i) in comparisonData" :key="d.id"
              class="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md"
              :style="{ background:`${COMPARE_COLORS[i]}18`, color:COMPARE_COLORS[i], border:`1px solid ${COMPARE_COLORS[i]}40` }">
              {{ d.id }}
            </span>
          </div>
          <button class="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none px-1 py-0"
            @click="selectedStates = []">×</button>
        </div>
        <div class="grid grid-cols-2 divide-x divide-white/[0.04]">
          <div v-for="d in comparisonData" :key="`cmp-${d.id}`" class="px-4 py-3 flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :style="{ background:d.ringColor, boxShadow:`0 0 8px ${d.ringColor}` }"/>
              <span class="text-sm font-black text-white tracking-wider">{{ d.id }}</span>
              <span class="text-[10px] text-gray-600 truncate">{{ d.name }}</span>
            </div>
            <!-- UV bar -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-[9px] text-gray-600 uppercase tracking-widest">UV Index</span>
                <span class="text-[10px] font-bold" :style="{ color:d.uvColor }">{{ d.uv?.toFixed(1) ?? '—' }} · {{ d.uvLabel }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :style="{ width:`${d.uvPct}%`, background:d.uvColor, boxShadow:`0 0 6px ${d.uvColor}80` }"/>
              </div>
            </div>
            <!-- Cancer bar -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-[9px] text-gray-600 uppercase tracking-widest">Cancer/100k · 2019</span>
                <span class="text-[10px] font-bold text-cyan-400">{{ d.rate?.toFixed(1) ?? '—' }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :style="{ width:`${d.ratePct}%`, background:'rgba(34,211,238,0.8)', boxShadow:'0 0 6px rgba(34,211,238,0.5)' }"/>
              </div>
            </div>
            <p class="text-[9px] text-gray-700">
              <span class="text-gray-400 font-semibold">{{ d.count?.toLocaleString() ?? '—' }}</span> cases ({{ d.cancerYear }})
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Unified timeline slider (2016–2019) ─────────────────────────────── -->
    <div class="relative px-4 py-4">
      <div class="h-px w-full bg-white/[0.04] mb-4"/>

      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
            <span class="text-sm font-black tracking-widest text-blue-300">
                {{ new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }) }}
                {{ currentYear }}
            </span>
        </div>
      </div>

      <input
        type="range"
        v-model.number="sliderIndex"
        :min="0"
        :max="TOTAL_MONTHS - 1"
        step="1"
        class="unified-slider w-full"
        />

      <!-- Year labels under the 4 stops -->
      <div class="relative mt-2" style="height:14px">
        <span
          v-for="(yr, i) in UNIFIED_YEARS" :key="yr"
          class="absolute text-[9px] -translate-x-1/2 leading-none font-bold transition-colors duration-200"
          :style="{
            left: `${(i / (UNIFIED_YEARS.length - 1)) * 100}%`,
            color: sliderIndex === i ? 'rgb(147,197,253)' : '#374151',
          }"
        >{{ yr }}</span>
      </div>
    </div>

    <!-- ── Mouse-following Reality Card ───────────────────────────────────── -->
    <Transition name="tip">
      <div v-if="hoveredInfo" class="absolute z-50 rounded-xl px-4 py-3 pointer-events-none"
        :style="{
          ...tooltipStyle,
          background:'rgba(6,13,27,0.97)',
          backdropFilter:'blur(16px)',
          width:`${TOOLTIP_W}px`,
          border:`1px solid ${hoveredInfo.glow}`,
          boxShadow:`0 0 32px ${hoveredInfo.glow}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
        }"
      >
        <div class="flex items-center gap-2 mb-0.5">
          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ background:hoveredInfo.uvColor, boxShadow:`0 0 8px ${hoveredInfo.uvColor}` }"/>
          <span class="text-[11px] font-black tracking-widest uppercase" :style="{ color:hoveredInfo.uvColor }">{{ hoveredInfo.id }}</span>
          <span v-if="hoveredInfo.selIdx !== -1"
            class="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
            :style="{ background:`${COMPARE_COLORS[hoveredInfo.selIdx]}20`, color:COMPARE_COLORS[hoveredInfo.selIdx] }">Selected</span>
        </div>
        <p class="text-[10px] text-gray-500 leading-none mb-2.5 truncate">{{ hoveredInfo.name }}</p>

        <!-- UV -->
        <div class="flex items-center justify-between mb-1">
          <span class="text-[9px] text-gray-600 uppercase tracking-widest">UV Index</span>
          <div class="flex items-center gap-1.5">
            <span class="text-base font-black text-white leading-none">{{ hoveredInfo.uv?.toFixed(1) ?? '—' }}</span>
            <span class="text-[9px] font-bold uppercase" :style="{ color:hoveredInfo.uvColor }">{{ hoveredInfo.uvLabel }}</span>
          </div>
        </div>

        <!-- Cancer rate -->
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-[9px] text-gray-600 uppercase tracking-widest">Cancer {{ hoveredInfo.cancerYear }}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-base font-black text-white leading-none">{{ hoveredInfo.rate?.toFixed(0) ?? '—' }}</span>
            <span class="text-[9px] text-gray-500">/100k</span>
            <span class="text-[9px] font-bold uppercase text-cyan-400">{{ hoveredInfo.rateLabel }}</span>
          </div>
        </div>

        <p class="text-[9px] text-gray-600 leading-snug border-t border-white/[0.05] pt-2 mb-1.5">{{ hoveredInfo.tagline }}</p>
        <p class="text-[9px]" :style="hoveredInfo.selIdx !== -1 ? `color:${COMPARE_COLORS[hoveredInfo.selIdx]}80` : 'color:#374151'">
          {{ hoveredInfo.selIdx !== -1 ? '✓ Click to remove' : '+ Click to compare' }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Sliders ─────────────────────────────────────────────────────────────────── */
.timeline-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 5px; border-radius: 3px; outline: none; cursor: pointer;
}
.timeline-slider.uv-slider {
  background: linear-gradient(to right, rgb(34,197,94), rgb(234,179,8), rgb(249,115,22), rgb(239,68,68), rgb(168,85,247));
}
.timeline-slider.cancer-slider {
  background: linear-gradient(to right, rgba(34,211,238,0.2), rgba(34,211,238,0.7), rgba(34,211,238,1));
}
.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 18px; height: 18px; border-radius: 50%; background: #fff;
  cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.timeline-slider.uv-slider::-webkit-slider-thumb {
  border: 3px solid rgb(134,239,172);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.2), 0 0 14px rgba(34,197,94,0.6), 0 2px 5px rgba(0,0,0,0.5);
}
.timeline-slider.cancer-slider::-webkit-slider-thumb {
  border: 3px solid rgb(34,211,238);
  box-shadow: 0 0 0 3px rgba(34,211,238,0.2), 0 0 14px rgba(34,211,238,0.6), 0 2px 5px rgba(0,0,0,0.5);
}
.timeline-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
.timeline-slider::-moz-range-thumb {
  width: 18px; height: 18px; border-radius: 50%; background: #fff; cursor: pointer;
}
.timeline-slider.uv-slider::-moz-range-thumb     { border: 3px solid rgb(134,239,172); box-shadow: 0 0 12px rgba(34,197,94,0.5); }
.timeline-slider.cancer-slider::-moz-range-thumb  { border: 3px solid rgb(34,211,238);  box-shadow: 0 0 12px rgba(34,211,238,0.5); }

/* ── Selection ring pulse ────────────────────────────────────────────────────── */
@keyframes ringPulse { 0%, 100% { stroke-opacity: 0.9; } 50% { stroke-opacity: 0.25; } }
.ring-pulse { animation: ringPulse 2.2s ease-in-out infinite; }

/* ── Transitions ─────────────────────────────────────────────────────────────── */
.tip-enter-active, .tip-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: scale(0.94); }

.compare-slide-enter-active { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
.compare-slide-leave-active { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
.compare-slide-enter-from, .compare-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>