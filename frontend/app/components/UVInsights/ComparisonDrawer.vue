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
  <div class="drawer">

    <!-- Header -->
    <div class="drawer-header">
      <div class="header-left">
        <span class="comparing-label">Comparing</span>
        <span
          v-for="(d, i) in comparisonData" :key="d.id"
          class="state-badge"
          :style="{
            background: `${COMPARE_COLORS[i]}14`,
            color:       COMPARE_COLORS[i],
            border:     `1.5px solid ${COMPARE_COLORS[i]}50`,
          }"
        >{{ d.id }}</span>
      </div>
      <button class="close-btn" @click="emit('close')">×</button>
    </div>

    <!-- Side-by-side state cards -->
    <div class="cards-grid">
      <div v-for="d in comparisonData" :key="`cmp-${d.id}`" class="state-card">

        <!-- State header -->
        <div class="state-title-row">
          <div class="ring-dot" :style="{ background: d.ringColor, boxShadow: `0 0 8px ${d.ringColor}60` }"/>
          <span class="state-id">{{ d.id }}</span>
          <span class="state-name">{{ d.name }}</span>
        </div>

        <!-- UV bar -->
        <div class="metric-block">
          <div class="metric-header">
            <span class="metric-label">UV Index</span>
            <span class="metric-value" :style="{ color: d.uvColor }">
              {{ d.uv?.toFixed(1) ?? '—' }} · {{ d.uvLabel }}
            </span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: `${d.uvPct}%`, background: d.uvColor }"/>
          </div>
        </div>

        <!-- Cancer rate bar -->
        <div class="metric-block">
          <div class="metric-header">
            <span class="metric-label">Cancer / 100k</span>
            <span class="metric-value" style="color:#0891B2">{{ d.rate?.toFixed(1) ?? '—' }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="background:rgba(8,145,178,0.75)"
              :style="{ width: `${d.ratePct}%` }"/>
          </div>
        </div>

        <p class="cases-line">
          <span class="cases-count">{{ d.count?.toLocaleString() ?? '—' }}</span>
          cases ({{ d.cancerYear }})
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer {
  margin: 0 32px 20px;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  border: 1.5px solid rgba(255,107,43,0.18);
  box-shadow: 0 8px 40px rgba(255,107,43,0.1);
}

/* Header */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,107,43,0.1);
  background: rgba(255,248,243,0.8);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.comparing-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.state-badge {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 12px;
  border-radius: 100px;
}
.close-btn {
  font-size: 22px;
  line-height: 1;
  color: #9CA3AF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.15s ease;
}
.close-btn:hover { color: #1A1A2E; }

/* Cards grid */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  divide: solid;
}
.state-card {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-right: 1px solid rgba(255,107,43,0.08);
}
.state-card:last-child { border-right: none; }

/* State title */
.state-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.ring-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.state-id {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 900;
  color: #1A1A2E;
  letter-spacing: 0.06em;
}
.state-name {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Metrics */
.metric-block { display: flex; flex-direction: column; gap: 7px; }
.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #9CA3AF;
}
.metric-value {
  font-size: 14px;
  font-weight: 800;
}

/* Progress bar */
.bar-track {
  height: 7px;
  border-radius: 100px;
  background: rgba(255,107,43,0.08);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
}

/* Cases footnote */
.cases-line {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
}
.cases-count {
  font-weight: 800;
  color: #1A1A2E;
}

@media (max-width: 520px) {
  .drawer { margin: 0 16px 16px; }
  .cards-grid { grid-template-columns: 1fr; }
  .state-card { border-right: none; border-bottom: 1px solid rgba(255,107,43,0.08); }
  .state-card:last-child { border-bottom: none; }
}
</style>