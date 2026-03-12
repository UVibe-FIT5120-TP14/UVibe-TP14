<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { geoMercator, geoPath, geoCentroid } from 'd3-geo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UVHistoryResponse {
  region: string
  year: number
  month: number
  uv_index: number
}

const props = defineProps<{
  data?: UVHistoryResponse[]
}>()

// ─── GeoJSON Map ──────────────────────────────────────────────────────────────

const GEOJSON_URL =
  'https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson'

const NAME_TO_CODE: Record<string, string> = {
  'Western Australia': 'WA',
  'Northern Territory': 'NT',
  'Queensland': 'QLD',
  'South Australia': 'SA',
  'New South Wales': 'NSW',
  'Australian Capital Territory': 'ACT',
  'Victoria': 'VIC',
  'Tasmania': 'TAS',
}

const LABEL_FONT: Record<string, number> = {
  ACT: 7,
  TAS: 9,
  VIC: 10,
}

interface GeoFeature {
  id: string
  name: string
  path: string
  labelX: number
  labelY: number
}

const SVG_W = 900
const SVG_H = 780
const geoFeatures = ref<GeoFeature[]>([])
const mapLoading = ref(true)
const mapError = ref<string | null>(null)

onMounted(async () => {
  try {
    const geojson = await fetch(GEOJSON_URL).then(r => {
      if (!r.ok) throw new Error('Network error')
      return r.json()
    })

    const projection = geoMercator().fitSize([SVG_W, SVG_H], geojson)
    const pathGen = geoPath(projection)

    geoFeatures.value = geojson.features
      .map((f: any) => {
        const stateName =
          f.properties?.STATE_NAME ??
          f.properties?.name ??
          f.properties?.Name ??
          ''
        const code =
          NAME_TO_CODE[stateName] ??
          f.properties?.STATE_ABBREV ??
          stateName
        const centroid = geoCentroid(f)
        const projected = projection(centroid)
        const [cx, cy] = projected ?? [0, 0]
        return {
          id: code,
          name: stateName,
          path: pathGen(f) ?? '',
          labelX: cx,
          labelY: cy,
        } as GeoFeature
      })
      .filter((f: GeoFeature) => f.path)

    mapLoading.value = false
  } catch {
    mapError.value = 'Could not load map data'
    mapLoading.value = false
  }
})

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BASE_UV: Record<string, number> = {
  NT: 12.0, QLD: 11.0, WA: 10.0, SA: 9.0,
  NSW: 8.0, ACT: 7.5, VIC: 6.0, TAS: 4.0,
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function generateMockData(): UVHistoryResponse[] {
  const rows: UVHistoryResponse[] = []
  for (let year = 2020; year <= 2025; year++) {
    const maxMonth = year === 2025 ? 6 : 12
    for (let month = 1; month <= maxMonth; month++) {
      let ri = 0
      for (const region of Object.keys(BASE_UV)) {
        const phase = ((month - 1) / 12) * 2 * Math.PI
        const seasonal = 1 + 0.46 * Math.cos(phase)
        const noise = (seededNoise(year * 1000 + month * 17 + ri * 53) - 0.5) * 2.8
        const uv = Math.max(0.5, Math.min(15, BASE_UV[region] * seasonal + noise))
        rows.push({ region, year, month, uv_index: Math.round(uv * 10) / 10 })
        ri++
      }
    }
  }
  return rows
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const allData = computed<UVHistoryResponse[]>(() =>
  props.data?.length ? props.data : generateMockData()
)

const monthsList = computed(() => {
  const s = new Set<string>()
  allData.value.forEach(d => s.add(`${d.year}-${String(d.month).padStart(2, '0')}`))
  return Array.from(s).sort()
})

const dataLookup = computed(() => {
  const map: Record<string, Record<string, number>> = {}
  allData.value.forEach(d => {
    const k = `${d.year}-${String(d.month).padStart(2, '0')}`
    if (!map[k]) map[k] = {}
    map[k][d.region] = d.uv_index
  })
  return map
})

// ─── Slider & Playback ────────────────────────────────────────────────────────

const sliderIndex = ref(0)
const isPlaying = ref(false)
const visible = ref(false)
let playTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  sliderIndex.value = monthsList.value.length - 1
  requestAnimationFrame(() => { visible.value = true })
})

onUnmounted(() => { if (playTimer) clearInterval(playTimer) })

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (sliderIndex.value >= monthsList.value.length - 1) sliderIndex.value = 0
    playTimer = setInterval(() => {
      if (sliderIndex.value < monthsList.value.length - 1) {
        sliderIndex.value++
      } else {
        isPlaying.value = false
        if (playTimer) clearInterval(playTimer)
      }
    }, 220)
  } else {
    if (playTimer) { clearInterval(playTimer); playTimer = null }
  }
}

watch(isPlaying, v => {
  if (!v && playTimer) { clearInterval(playTimer); playTimer = null }
})

// ─── Derived Display ──────────────────────────────────────────────────────────

const currentMonthKey = computed(() => monthsList.value[sliderIndex.value] ?? '')

const currentMonthLabel = computed(() => {
  if (!currentMonthKey.value) return ''
  const [y, m] = currentMonthKey.value.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
})

const currentUV = computed(() => dataLookup.value[currentMonthKey.value] ?? {})

const yearMarks = computed(() => {
  const total = monthsList.value.length
  return monthsList.value
    .map((m, i) => ({ i, m }))
    .filter(({ m }) => m.endsWith('-01'))
    .map(({ i, m }) => ({ pct: (i / (total - 1)) * 100, label: m.split('-')[0] }))
})

// ─── Color System ─────────────────────────────────────────────────────────────

interface Stop { uv: number; r: number; g: number; b: number }

const STOPS: Stop[] = [
  { uv: 0,  r: 30,  g: 100, b: 255 },
  { uv: 3,  r: 0,   g: 210, b: 255 },
  { uv: 6,  r: 60,  g: 255, b: 80  },
  { uv: 8,  r: 255, g: 185, b: 0   },
  { uv: 11, r: 255, g: 50,  b: 20  },
  { uv: 15, r: 200, g: 0,   b: 120 },
]

function lerp(a: number, b: number, t: number) { return Math.round(a + t * (b - a)) }

function uvToRgb(uv: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(15, uv))
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].uv && clamped <= STOPS[i + 1].uv) {
      lo = STOPS[i]; hi = STOPS[i + 1]; break
    }
  }
  const t = (clamped - lo.uv) / (hi.uv - lo.uv)
  return [lerp(lo.r, hi.r, t), lerp(lo.g, hi.g, t), lerp(lo.b, hi.b, t)]
}

function uvColor(uv: number) {
  const [r, g, b] = uvToRgb(uv)
  return `rgb(${r},${g},${b})`
}

function uvColorAlpha(uv: number, a: number) {
  const [r, g, b] = uvToRgb(uv)
  return `rgba(${r},${g},${b},${a})`
}

function regionFill(id: string) {
  const uv = currentUV.value[id]
  return uv !== undefined ? uvColor(uv) : '#0f1f3d'
}

function uvLabel(uv: number) {
  if (uv < 3) return 'Low'
  if (uv < 6) return 'Moderate'
  if (uv < 8) return 'High'
  if (uv < 11) return 'Very High'
  return 'Extreme'
}

// ─── Mouse-following Tooltip ──────────────────────────────────────────────────

const hoveredId = ref<string | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)
const containerRef = ref<HTMLElement | null>(null)

const TOOLTIP_W = 172
const TOOLTIP_H = 112
const OFFSET = 16

function onMouseMove(e: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

// Flip when near right/bottom edges so tooltip stays in view
const tooltipStyle = computed(() => {
  if (!containerRef.value) return {}
  const w = containerRef.value.offsetWidth
  const h = containerRef.value.offsetHeight
  const flipX = mouseX.value + OFFSET + TOOLTIP_W > w
  const flipY = mouseY.value + OFFSET + TOOLTIP_H > h
  return {
    left: flipX
      ? `${mouseX.value - TOOLTIP_W - OFFSET}px`
      : `${mouseX.value + OFFSET}px`,
    top: flipY
      ? `${mouseY.value - TOOLTIP_H - OFFSET}px`
      : `${mouseY.value + OFFSET}px`,
  }
})

const hoveredInfo = computed(() => {
  if (!hoveredId.value) return null
  const feat = geoFeatures.value.find(f => f.id === hoveredId.value)
  if (!feat) return null
  const uv = currentUV.value[hoveredId.value]
  return {
    id: feat.id,
    name: feat.name,
    uv,
    color: uv !== undefined ? uvColor(uv) : '#fff',
    glow: uv !== undefined ? uvColorAlpha(uv, 0.5) : 'rgba(255,255,255,0.25)',
    label: uv !== undefined ? uvLabel(uv) : '—',
  }
})

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND_H = 220
const LEGEND_TICKS = [
  { uv: 15, label: '15' },
  { uv: 11, label: '11' },
  { uv: 8,  label: '8'  },
  { uv: 6,  label: '6'  },
  { uv: 3,  label: '3'  },
  { uv: 0,  label: '0'  },
]

function legendTickY(uv: number) {
  return ((15 - uv) / 15) * LEGEND_H
}
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
    <!-- Atmospheric glow -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 80% 50% at 45% 40%, rgba(30,100,255,0.06) 0%, transparent 70%)"
    />
    <!-- Subtle grid -->
    <div
      class="absolute inset-0 pointer-events-none opacity-[0.025]"
      style="background-image: linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px); background-size: 40px 40px;"
    />

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="relative px-5 pt-5 pb-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex flex-col gap-[3px]">
          <div class="h-0.5 w-6 rounded-full bg-blue-400" />
          <div class="h-0.5 w-4 rounded-full bg-blue-600" />
          <div class="h-0.5 w-5 rounded-full bg-blue-500" />
        </div>
        <div>
          <h3 class="text-base font-bold tracking-[0.18em] uppercase text-blue-300 leading-none">
            UV Insights
          </h3>
          <p class="text-[10px] text-gray-600 tracking-widest uppercase mt-0.5">
            Historical · Australia
          </p>
        </div>
      </div>

      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200"
        :style="{
          background: isPlaying ? 'rgba(255,50,20,0.15)' : 'rgba(59,130,246,0.12)',
          border: isPlaying ? '1px solid rgba(255,50,20,0.4)' : '1px solid rgba(59,130,246,0.3)',
          color: isPlaying ? 'rgb(255,100,80)' : 'rgb(147,197,253)',
          boxShadow: isPlaying ? '0 0 12px rgba(255,50,20,0.2)' : '0 0 12px rgba(59,130,246,0.15)',
        }"
        @click="togglePlay"
      >
        <svg v-if="!isPlaying" viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
          <polygon points="2,1 11,6 2,11" />
        </svg>
        <svg v-else viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
          <rect x="1.5" y="1" width="3.5" height="10" rx="1" />
          <rect x="7" y="1" width="3.5" height="10" rx="1" />
        </svg>
        {{ isPlaying ? 'Pause' : 'Animate' }}
      </button>
    </div>

    <!-- ── Two-panel layout ────────────────────────────────────────────────── -->
    <div class="flex gap-0 px-4 pb-2">

      <!-- ═══ Panel 1: UV Heatmap ════════════════════════════════════════════ -->
      <div class="flex-1 flex flex-col gap-1 min-w-0 pr-3">
        <p class="text-[9px] text-gray-600 tracking-widest uppercase pb-1 border-b border-white/[0.04]">
          UV Index · Regional Heatmap
        </p>

        <div class="flex gap-2 items-stretch pt-1">
          <!-- Map -->
          <div class="flex-1 relative">
            <!-- Month floating label -->
            <div
              class="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase"
              style="background: rgba(6,13,27,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.5);"
            >
              {{ currentMonthLabel }}
            </div>

            <!-- Loading -->
            <div
              v-if="mapLoading"
              class="flex items-center justify-center rounded-xl bg-white/[0.02]"
              style="aspect-ratio: 900/780"
            >
              <div class="flex flex-col items-center gap-2 text-gray-700">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-60" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span class="text-[10px] tracking-widest uppercase">Loading map…</span>
              </div>
            </div>

            <!-- Error -->
            <div
              v-else-if="mapError"
              class="flex items-center justify-center text-red-500 text-xs rounded-xl bg-white/[0.02]"
              style="aspect-ratio: 900/780"
            >
              {{ mapError }}
            </div>

            <!-- Real SVG geo map -->
            <svg
              v-else
              viewBox="0 0 900 780"
              class="w-full"
              xmlns="http://www.w3.org/2000/svg"
              style="filter: drop-shadow(0 4px 40px rgba(20,80,200,0.14))"
            >
              <defs>
                <filter id="sg" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="sgh" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="16" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width="900" height="780" fill="#060d1b" />

              <g v-for="feat in geoFeatures" :key="feat.id">
                <path
                  :d="feat.path"
                  :fill="regionFill(feat.id)"
                  :filter="hoveredId === feat.id ? 'url(#sgh)' : 'url(#sg)'"
                  stroke="#060d1b"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  class="cursor-pointer"
                  :style="{
                    opacity: hoveredId && hoveredId !== feat.id ? 0.5 : 1,
                    transition: 'fill 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
                  }"
                  @mouseenter="hoveredId = feat.id"
                  @mouseleave="hoveredId = null"
                />
                <!-- State code label -->
                <text
                  :x="feat.labelX"
                  :y="feat.labelY - 7"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="rgba(255,255,255,0.9)"
                  :font-size="LABEL_FONT[feat.id] ?? 12"
                  font-weight="700"
                  font-family="'Courier New', Courier, monospace"
                  pointer-events="none"
                >{{ feat.id }}</text>
                <!-- UV value -->
                <text
                  v-if="feat.id !== 'ACT' && currentUV[feat.id] !== undefined"
                  :x="feat.labelX"
                  :y="feat.labelY + 9"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="rgba(255,255,255,0.5)"
                  :font-size="(LABEL_FONT[feat.id] ?? 10) - 1"
                  font-family="'Courier New', Courier, monospace"
                  pointer-events="none"
                  :style="{ transition: 'all 0.6s ease' }"
                >{{ currentUV[feat.id]?.toFixed(1) }}</text>
              </g>

              <!-- Compass -->
              <g transform="translate(858,742)" opacity="0.14" fill="none" stroke="white" stroke-width="1">
                <line x1="0" y1="-16" x2="0" y2="16" />
                <line x1="-16" y1="0" x2="16" y2="0" />
                <text x="0" y="-20" text-anchor="middle" font-size="9" fill="white" stroke="none" font-family="monospace">N</text>
              </g>
            </svg>
          </div>

          <!-- UV legend -->
          <div class="flex flex-col items-center py-2 gap-1" style="min-width: 44px;">
            <p class="text-[8px] text-gray-600 uppercase tracking-widest mb-1">UV</p>
            <div class="relative flex gap-1.5 items-start" :style="{ height: `${LEGEND_H}px` }">
              <div
                class="w-4 rounded-full flex-shrink-0"
                :style="{
                  height: `${LEGEND_H}px`,
                  background:
                    'linear-gradient(to bottom,' +
                    'rgb(200,0,120),' +
                    'rgb(255,50,20),' +
                    'rgb(255,185,0),' +
                    'rgb(60,255,80),' +
                    'rgb(0,210,255),' +
                    'rgb(30,100,255))',
                  boxShadow: '0 0 10px rgba(100,150,255,0.1)',
                }"
              />
              <div class="relative" :style="{ height: `${LEGEND_H}px`, width: '24px' }">
                <div
                  v-for="tick in LEGEND_TICKS"
                  :key="tick.uv"
                  class="absolute flex items-center gap-1"
                  :style="{ top: `${legendTickY(tick.uv)}px`, transform: 'translateY(-50%)' }"
                >
                  <div class="w-1 h-px bg-gray-700" />
                  <span class="text-[8px] text-gray-500 leading-none">{{ tick.label }}</span>
                </div>
              </div>
            </div>
            <p class="text-[7px] text-gray-700 uppercase tracking-wider mt-1">Lo↑Hi</p>
          </div>
        </div>
      </div>

      <!-- Vertical divider -->
      <div class="w-px bg-white/[0.05] self-stretch" />

      <!-- ═══ Panel 2: Cancer Trends (placeholder) ═══════════════════════════ -->
      <div class="flex-1 flex flex-col gap-1 min-w-0 pl-3">
        <p class="text-[9px] text-gray-600 tracking-widest uppercase pb-1 border-b border-white/[0.04]">
          Skin Cancer · Incidence &amp; Mortality
        </p>

        <div
          class="flex-1 flex flex-col items-center justify-center gap-5 rounded-xl mt-1"
          style="
            min-height: 340px;
            background: rgba(255,255,255,0.012);
            border: 1px dashed rgba(255,255,255,0.06);
          "
        >
          <!-- Icon -->
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center"
            style="background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.13);"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
              stroke="rgba(59,130,246,0.45)" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>

          <div class="text-center px-8">
            <p class="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">
              Coming Soon
            </p>
            <p class="text-[10px] text-gray-700 leading-relaxed">
              Trend lines for cancer incident counts and deaths per region will appear here.
            </p>
          </div>

          <!-- Ghost chart skeleton -->
          <div class="w-full px-6 mt-1" aria-hidden="true">
            <!-- Legend pills -->
            <div class="flex gap-3 mb-3 justify-center">
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-0.5 rounded-full bg-blue-900" />
                <span class="text-[8px] text-gray-800">Incidents</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-0.5 rounded-full bg-red-900" />
                <span class="text-[8px] text-gray-800">Deaths</span>
              </div>
            </div>
            <!-- Bars -->
            <div class="flex items-end gap-[3px] h-20">
              <div
                v-for="(pair, i) in [[40,18],[52,22],[48,20],[63,27],[55,23],[71,30],[60,26],[78,33],[65,28],[82,35],[70,30],[74,32]]"
                :key="i"
                class="flex-1 flex flex-col-reverse items-center gap-[2px]"
              >
                <div class="w-full rounded-sm" :style="{ height: `${pair[0]}%`, background: 'rgba(59,130,246,0.1)' }" />
                <div class="w-full rounded-sm" :style="{ height: `${pair[1]}%`, background: 'rgba(239,68,68,0.08)' }" />
              </div>
            </div>
            <div class="h-px w-full bg-white/[0.05] mt-1 mb-1.5" />
            <div class="flex justify-between">
              <span v-for="yr in ['2015','2017','2019','2021','2023','2025']" :key="yr"
                class="text-[7px] text-gray-800">{{ yr }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Timeline Slider ──────────────────────────────────────────────────── -->
    <div class="relative px-5 py-4">
      <div class="h-px w-full bg-white/[0.04] mb-4" />
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] text-gray-600 uppercase tracking-widest">Timeline</span>
        <span
          class="text-xs font-bold tracking-wider"
          style="color: rgb(147,197,253); text-shadow: 0 0 10px rgba(59,130,246,0.5)"
        >{{ currentMonthLabel }}</span>
      </div>
      <input
        type="range"
        v-model.number="sliderIndex"
        :min="0"
        :max="monthsList.length - 1"
        step="1"
        class="uv-timeline-slider w-full"
      />
      <div class="relative mt-1.5" style="height: 14px;">
        <span
          v-for="mark in yearMarks"
          :key="mark.label"
          class="absolute text-[9px] text-gray-700 -translate-x-1/2 leading-none"
          :style="{ left: `${mark.pct}%` }"
        >{{ mark.label }}</span>
      </div>
    </div>

    <!-- ── Mouse-following tooltip (rendered at container level) ───────────── -->
    <Transition name="tip">
      <div
        v-if="hoveredInfo"
        class="absolute z-50 rounded-xl px-4 py-3 pointer-events-none"
        :style="{
          ...tooltipStyle,
          background: 'rgba(6,13,27,0.95)',
          backdropFilter: 'blur(14px)',
          width: `${TOOLTIP_W}px`,
          border: `1px solid ${hoveredInfo.glow}`,
          boxShadow: `0 0 28px ${hoveredInfo.glow}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
        }"
      >
        <div class="flex items-center gap-2 mb-1">
          <div
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ background: hoveredInfo.color, boxShadow: `0 0 8px ${hoveredInfo.color}` }"
          />
          <span class="text-[10px] font-bold tracking-widest uppercase" :style="{ color: hoveredInfo.color }">
            {{ hoveredInfo.id }}
          </span>
        </div>
        <p class="text-[10px] text-gray-500 leading-none mb-2 truncate">{{ hoveredInfo.name }}</p>
        <div class="flex items-baseline gap-1.5">
          <span class="text-3xl font-black text-white leading-none">
            {{ hoveredInfo.uv?.toFixed(1) ?? '—' }}
          </span>
          <span class="text-xs text-gray-500 pb-0.5">UV</span>
        </div>
        <p class="text-[10px] font-bold tracking-widest uppercase mt-1.5" :style="{ color: hoveredInfo.color }">
          {{ hoveredInfo.label }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.uv-timeline-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #1E3A8A, #3B82F6 35%, #7C3AED 65%, #DC2626);
  outline: none;
  cursor: pointer;
}
.uv-timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #3B82F6;
  cursor: pointer;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 0 16px rgba(59,130,246,0.7), 0 2px 6px rgba(0,0,0,0.6);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.uv-timeline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 0 24px rgba(59,130,246,1), 0 2px 8px rgba(0,0,0,0.6);
}
.uv-timeline-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #3B82F6;
  cursor: pointer;
  box-shadow: 0 0 14px rgba(59,130,246,0.7);
}
.tip-enter-active, .tip-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.tip-enter-from, .tip-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>