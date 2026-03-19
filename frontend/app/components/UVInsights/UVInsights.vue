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
import ContextHero      from '~/components/UVInsights/ContextHero.vue'
import InsightsBridge   from '~/components/UVInsights/InsightsBridge.vue'
import UVMapSvg         from '~/components/UVInsights/UVMapSvg.vue'
import AgePrediction    from '~/components/UVInsights/AgePrediction.vue'
import ComparisonDrawer from '~/components/UVInsights/ComparisonDrawer.vue'
import TimelineSlider   from '~/components/UVInsights/TimelineSlider.vue'

// ─── Constants ────────────────────────────────────────────────────────────────
import { COMPARE_COLORS, TOOLTIP_W } from '~/utils/uvInsights'

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

const { uvColor } = useUVColors()

const {
  currentUV,
  currentStateCancer,
  currentCancerYear,
  getCancerRate,
  cancerBubbleR,
} = useCancerData(allUV, allCancer, currentYear, currentMonth)

const {
  hoveredId, containerRef, onMouseMove,
  tooltipStyle, hoveredInfo,
  selectedStates, stateOpacity, onStateClick,
  showComparison, comparisonData,
} = useMapInteractions(
  geoFeatures, currentUV, currentStateCancer, currentCancerYear, getCancerRate,
)

// ─── Entrance animation ───────────────────────────────────────────────────────
const visible = ref(false)
onMounted(() => requestAnimationFrame(() => { visible.value = true }))
</script>

<template>
  <div
    ref="containerRef"
    class="root"
    :class="{ visible }"
    @mousemove="onMouseMove"
  >
    <!-- Decorative background blobs -->
    <div class="blob blob-a" aria-hidden="true"/>
    <div class="blob blob-b" aria-hidden="true"/>

    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <ContextHero />

    <div class="divider"/>

    <!-- ── Insights bridge ───────────────────────────────────────────── -->
    <InsightsBridge />

    <div class="divider"/>

    <!-- ── Two-panel layout ──────────────────────────────────────────── -->
    <div class="panels" data-viz-section>

      <!-- Map panel -->
      <div class="panel">
        <div class="sec-head">
          <span class="sec-tag">Live Map</span>
          <h2 class="sec-title">Confident you're safe from the sun?</h2>
          <p class="sec-desc">
            Each state is coloured by UV index — green means chill, violet means danger zone.
            Cyan circles show skin cancer case density. Tap two states to compare them.
          </p>
        </div>

        <div class="hint-row">
          <span class="hint"><em>Slide</em> to change month</span>
          <span class="hint"><em>Hover</em> for stats</span>
          <span class="hint"><em>Tap 2</em> to compare</span>
        </div>

        <div class="map-shell">
          <UVMapSvg
            :geoFeatures="geoFeatures"
            :mapLoading="mapLoading"
            :mapError="mapError"
            :currentUV="currentUV"
            :currentStateCancer="currentStateCancer"
            :currentYear="currentYear"
            :hoveredId="hoveredId"
            :selectedStates="selectedStates"
            :uvColor="uvColor"
            :cancerBubbleR="cancerBubbleR"
            :stateOpacity="stateOpacity"
            @update:hoveredId="hoveredId = $event"
            @stateClick="onStateClick"
          />
        </div>

        <TimelineSlider
          v-model:sliderIndex="sliderIndex"
          :isPlaying="isPlaying"
          :currentYear="currentYear"
          :currentMonth="currentMonth"
          @togglePlay="togglePlay"
        />
      </div>

      <div class="v-rule" aria-hidden="true"/>

      <!-- Prediction panel -->
      <div class="panel">
        <div class="sec-head">
          <span class="sec-tag">Your Future</span>
          <h2 class="sec-title">Where is your age group headed?</h2>
          <p class="sec-desc">
            Enter your age to see how skin cancer cases in your group are projected to grow
            over the next decade — and what you can do about it.
          </p>
        </div>

        <AgePrediction />
      </div>
    </div>

    <!-- ── Comparison drawer ──────────────────────────────────────────── -->
    <Transition name="compare-slide">
      <ComparisonDrawer
        v-if="showComparison"
        :comparisonData="comparisonData"
        @close="selectedStates = []"
      />
    </Transition>

    <!-- ── Attribution ───────────────────────────────────────────────── -->
    <footer class="attr">
      <span class="attr-hl">Data sources</span>
      UV: <a href="https://data.gov.au/data/organization/australian-radiation-protection-and-nuclear-safety-agency-arpansa" target="_blank">ARPANSA via data.gov.au</a>
      · Cancer: <a href="https://www.aihw.gov.au/reports/cancer/cancer-data-in-australia/contents/cancer-data-commentaries/risk-of-melanoma" target="_blank">AIHW</a>
      · <span class="attr-hl">CC BY 4.0</span>
    </footer>

    <!-- ── Mouse-following tooltip ──────────────────────────────────────── -->
    <Transition name="tip">
      <div
        v-if="hoveredInfo"
        class="tooltip"
        :style="{
          ...tooltipStyle,
          width:       `${TOOLTIP_W}px`,
          borderColor: `${hoveredInfo.uvColor}55`,
        }"
      >
        <div class="tt-head">
          <div class="tt-dot" :style="{ background: hoveredInfo.uvColor, boxShadow: `0 0 8px ${hoveredInfo.uvColor}` }"/>
          <span class="tt-id" :style="{ color: hoveredInfo.uvColor }">{{ hoveredInfo.id }}</span>
          <span
            v-if="hoveredInfo.selIdx !== -1"
            class="tt-badge"
            :style="{ background: `${COMPARE_COLORS[hoveredInfo.selIdx]}20`, color: COMPARE_COLORS[hoveredInfo.selIdx] }"
          >Selected</span>
        </div>
        <p class="tt-name">{{ hoveredInfo.name }}</p>

        <div class="tt-row">
          <span class="tt-lbl">UV Index</span>
          <div class="tt-vals">
            <span class="tt-num">{{ hoveredInfo.uv?.toFixed(1) ?? '—' }}</span>
            <span class="tt-cat" :style="{ color: hoveredInfo.uvColor }">{{ hoveredInfo.uvLabel }}</span>
          </div>
        </div>
        <div class="tt-row">
          <span class="tt-lbl">Cancer {{ hoveredInfo.cancerYear }}</span>
          <div class="tt-vals">
            <span class="tt-num">{{ hoveredInfo.rate?.toFixed(0) ?? '—' }}</span>
            <span class="tt-unit">/100k</span>
            <span class="tt-cat" style="color:#0891B2">{{ hoveredInfo.rateLabel }}</span>
          </div>
        </div>
        <div class="tt-row">
          <span class="tt-lbl">Population</span>
          <div class="tt-vals">
            <span class="tt-num">{{ hoveredInfo.population?.toLocaleString() ?? '—' }}</span>
            <span class="tt-unit">people</span>
          </div>
        </div>

        <p class="tt-tagline">{{ hoveredInfo.tagline }}</p>
        <p class="tt-action" :style="hoveredInfo.selIdx !== -1 ? `color:${COMPARE_COLORS[hoveredInfo.selIdx]}80` : 'color:#4b5563'">
          {{ hoveredInfo.selIdx !== -1 ? '✓ Click to remove' : '+ Click to compare' }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<!-- Non-scoped: load Google Fonts -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Nunito:wght@400;600;700&display=swap');
</style>

<style scoped>
/* ── Theme tokens ───────────────────────────────────────────────────────── */
.root {
  --orange: #FF6B2B;
  --yellow: #FFD166;
  --coral:  #FF9B71;
  --dark:   #1A1A2E;
  --muted:  #6B7280;
  --bg:     #FFF8F3;
  --card:   #FFFFFF;

  position: relative;
  width: 100%;
  min-height: 100%;
  background: var(--bg);
  color: var(--dark);
  font-family: 'Nunito', sans-serif;
  overflow: hidden;
  /* Entrance */
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}
.root.visible { opacity: 1; transform: none; }

/* ── Background blobs ── */
.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  opacity: 0.32;
  z-index: 0;
}
.blob-a { width: 560px; height: 560px; top: -200px; right: -120px; background: radial-gradient(circle, #FFD166 0%, transparent 70%); }
.blob-b { width: 480px; height: 480px; bottom: 80px; left: -160px; background: radial-gradient(circle, #FF9B71 0%, transparent 70%); }

/* ── Divider ── */
.divider { height: 1px; background: rgba(255,107,43,0.12); margin: 0 40px; }

/* ── Two-panel grid ── */
.panels {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  padding: 0 32px 36px;
}
.v-rule { background: rgba(255,107,43,0.1); margin: 32px 0; }
.panel  { padding: 32px 20px; min-width: 0; }

/* ── Section headings ── */
.sec-head  { margin-bottom: 16px; }
.sec-tag   {
  display: inline-block;
  font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--orange); background: rgba(255,107,43,0.09);
  border-radius: 100px; padding: 4px 12px; margin-bottom: 10px;
}
.sec-title {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 800; color: var(--dark);
  margin: 0 0 10px; line-height: 1.25;
}
.sec-desc { font-size: 14px; line-height: 1.65; color: var(--muted); margin: 0; }

/* ── Hint pills ── */
.hint-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.hint {
  font-size: 13px; font-weight: 600; color: var(--muted);
}
.hint em {
  font-style: normal;
  background: rgba(255,107,43,0.1); color: var(--orange);
  border-radius: 6px; padding: 2px 8px;
  font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
  margin-right: 3px;
}

/* ── Map shell ── */
.map-shell {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 48px rgba(26,26,46,0.2);
  margin-bottom: 4px;
}

/* ── Timeline slider override (warm orange track) ── */
:deep(.unified-slider) {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 5px; border-radius: 3px; outline: none; cursor: pointer;
  background: linear-gradient(to right, rgba(255,107,43,0.25), rgba(255,107,43,0.85));
}
:deep(.unified-slider::-webkit-slider-thumb) {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  border: 3px solid var(--orange);
  box-shadow: 0 0 0 3px rgba(255,107,43,0.2), 0 0 16px rgba(255,107,43,0.45), 0 2px 5px rgba(0,0,0,0.12);
  cursor: pointer; transition: transform 0.15s ease;
}
:deep(.unified-slider::-webkit-slider-thumb:hover) { transform: scale(1.22); }
:deep(.unified-slider::-moz-range-thumb) {
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  border: 3px solid var(--orange); box-shadow: 0 0 14px rgba(255,107,43,0.45); cursor: pointer;
}

/* ── Attribution footer ── */
.attr {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 14px 40px 20px;
  font-size: 11px; color: var(--muted);
  border-top: 1px solid rgba(255,107,43,0.08);
  position: relative; z-index: 1;
}
.attr a { color: var(--orange); text-decoration: none; font-weight: 700; }
.attr a:hover { text-decoration: underline; }
.attr-hl  { font-weight: 800; color: var(--dark); }
.attr-ver { margin-left: auto; opacity: 0.35; font-style: italic; }

/* ── Tooltip ── */
.tooltip {
  position: absolute; z-index: 50;
  border-radius: 16px; padding: 16px 18px;
  pointer-events: none;
  background: #fff;
  border: 1.5px solid; /* color set via inline :style */
  box-shadow: 0 8px 40px rgba(255,107,43,0.12), 0 2px 8px rgba(0,0,0,0.06);
}
.tt-head  { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
.tt-dot   { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.tt-id    { font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #1A1A2E; }
.tt-badge {
  margin-left: auto; font-size: 10px; font-weight: 800;
  padding: 3px 9px; border-radius: 100px; letter-spacing: 0.06em; text-transform: uppercase;
}
.tt-name    { font-size: 12px; color: #9CA3AF; font-weight: 600; margin: 0 0 12px; }
.tt-row     { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tt-lbl     { font-size: 11px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; }
.tt-vals    { display: flex; align-items: baseline; gap: 5px; }
.tt-num     { font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 900; color: #1A1A2E; line-height: 1; }
.tt-unit    { font-size: 11px; color: #9CA3AF; font-weight: 600; }
.tt-cat     { font-size: 11px; font-weight: 800; text-transform: uppercase; }
.tt-tagline { font-size: 12px; color: #6B7280; border-top: 1px solid rgba(255,107,43,0.12); padding-top: 10px; margin: 10px 0 5px; line-height: 1.5; }
.tt-action  { font-size: 11px; font-weight: 700; margin: 0; }

/* ── Transitions ── */
.tip-enter-active, .tip-leave-active   { transition: opacity 0.12s ease, transform 0.12s ease; }
.tip-enter-from,   .tip-leave-to       { opacity: 0; transform: scale(0.93); }
.compare-slide-enter-active { transition: all 0.3s  cubic-bezier(0.4,0,0.2,1); }
.compare-slide-leave-active { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
.compare-slide-enter-from,
.compare-slide-leave-to     { opacity: 0; transform: translateY(-10px); }

/* ── Responsive ── */
@media (max-width: 860px) {
  .panels  { grid-template-columns: 1fr; padding: 0 20px 28px; }
  .v-rule  { display: none; }
  .panel   { padding: 24px 8px; }
  .divider { margin: 0 20px; }
  .attr    { padding: 12px 20px 18px; }
}
</style>