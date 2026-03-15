<script setup lang="ts">
import {
  AGE_GROUPS, CHART_YEARS, CW, CH, PAD, PLOT_W, PLOT_H,
  useAgeCancerChart,
} from '~/composables/UVInsights/useAgeCancerChart'

const {
  hiddenGroups, toggleGroup,
  ageAnnualData,
  xPos, yPos, polyline, areaPath, yTicks,
  chartHoveredIdx, chartHoveredYear,
  onChartMouseMove, onChartMouseLeave,
  chartDrawProgress,
} = useAgeCancerChart()
</script>

<template>
  <div class="flex-1 relative" style="min-height: 215px;">
    <svg
      :viewBox="`0 0 ${CW} ${CH}`"
      class="w-full h-full"
      style="overflow:visible"
      @mousemove="onChartMouseMove"
      @mouseleave="onChartMouseLeave"
    >
      <defs>
        <filter id="lineGlow" x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <!-- Left-to-right draw-on clip -->
        <clipPath id="chartReveal">
          <rect :x="PAD.l" :y="0" :width="chartDrawProgress * PLOT_W" :height="CH"/>
        </clipPath>
      </defs>

      <!-- Background tint -->
      <rect :x="PAD.l" :y="PAD.t" :width="PLOT_W" :height="PLOT_H"
        fill="rgba(255,255,255,0.012)" rx="2"/>

      <!-- Horizontal grid lines + Y-axis labels -->
      <g v-for="tick in yTicks" :key="`g-${tick}`">
        <line :x1="PAD.l" :x2="PAD.l + PLOT_W" :y1="yPos(tick)" :y2="yPos(tick)"
          stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <text :x="PAD.l - 6" :y="yPos(tick)"
          text-anchor="end" dominant-baseline="middle"
          fill="rgba(255,255,255,0.22)" font-size="8.5" font-family="monospace">
          {{ tick >= 1000 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : tick }}
        </text>
      </g>

      <!-- Area fills (clipped for draw-on animation) -->
      <g clip-path="url(#chartReveal)">
        <path
          v-for="grp in AGE_GROUPS" :key="`area-${grp.key}`"
          :d="areaPath(grp.key)"
          :fill="grp.color"
          fill-opacity="0.07"
          :style="{ opacity: hiddenGroups.includes(grp.key) ? 0 : 1, transition: 'opacity 0.35s ease' }"
        />
      </g>

      <!-- Lines at reduced opacity when hovering (clipped for draw-on) -->
      <g clip-path="url(#chartReveal)">
        <polyline
          v-for="(grp, gi) in AGE_GROUPS" :key="`line-${grp.key}`"
          :points="polyline(grp.key)"
          fill="none"
          :stroke="grp.color"
          :stroke-width="chartHoveredYear !== null && !hiddenGroups.includes(grp.key) ? 2.8 : 1.8"
          stroke-linecap="round" stroke-linejoin="round"
          filter="url(#lineGlow)"
          :style="{
            opacity: hiddenGroups.includes(grp.key) ? 0 : chartHoveredYear !== null ? 0.35 : 1,
            transition: `opacity 0.25s ease ${gi * 60}ms, stroke-width 0.15s ease`,
          }"
        />
      </g>

      <!-- Hover: highlighted lines at full opacity -->
      <template v-if="chartHoveredYear !== null">
        <polyline
          v-for="grp in AGE_GROUPS" :key="`hl-${grp.key}`"
          :points="polyline(grp.key)"
          fill="none"
          :stroke="grp.color"
          stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"
          clip-path="url(#chartReveal)"
          :style="{ opacity: hiddenGroups.includes(grp.key) ? 0 : 1, transition: 'opacity 0.15s ease' }"
        />
      </template>

      <!-- Static small dots at every data point -->
      <template v-for="grp in AGE_GROUPS" :key="`dots-${grp.key}`">
        <circle
          v-for="(yr, i) in CHART_YEARS" :key="`dp-${yr}`"
          :cx="xPos(i)"
          :cy="yPos(ageAnnualData[yr]?.[grp.key] ?? 0)"
          r="2.5"
          :fill="grp.color"
          :style="{
            opacity: hiddenGroups.includes(grp.key) ? 0 : chartHoveredYear === yr ? 0 : 0.65,
            transition: 'opacity 0.2s ease',
          }"
        />
      </template>

      <!-- Hover crosshair + enlarged dots -->
      <template v-if="chartHoveredYear !== null && chartHoveredIdx !== null">
        <line
          :x1="xPos(chartHoveredIdx)" :x2="xPos(chartHoveredIdx)"
          :y1="PAD.t" :y2="PAD.t + PLOT_H"
          stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="4 3"
        />
        <template v-for="grp in AGE_GROUPS" :key="`hd-${grp.key}`">
          <template v-if="!hiddenGroups.includes(grp.key)">
            <circle
              :cx="xPos(chartHoveredIdx)"
              :cy="yPos(ageAnnualData[chartHoveredYear]?.[grp.key] ?? 0)"
              r="7" :fill="grp.color" fill-opacity="0.15"
              :stroke="grp.color" stroke-width="1.5" stroke-opacity="0.5"
            />
            <circle
              :cx="xPos(chartHoveredIdx)"
              :cy="yPos(ageAnnualData[chartHoveredYear]?.[grp.key] ?? 0)"
              r="3" :fill="grp.color"
            />
          </template>
        </template>
      </template>

      <!-- Axes -->
      <line :x1="PAD.l" :x2="PAD.l + PLOT_W" :y1="PAD.t + PLOT_H" :y2="PAD.t + PLOT_H"
        stroke="rgba(255,255,255,0.1)"  stroke-width="1"/>
      <line :x1="PAD.l" :x2="PAD.l"           :y1="PAD.t"         :y2="PAD.t + PLOT_H"
        stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

      <!-- X-axis year labels -->
      <text
        v-for="(yr, i) in CHART_YEARS" :key="`xl-${yr}`"
        :x="xPos(i)" :y="PAD.t + PLOT_H + 16"
        text-anchor="middle"
        :fill="chartHoveredYear === yr ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)'"
        :font-size="chartHoveredYear === yr ? 10 : 9"
        :font-weight="chartHoveredYear === yr ? '700' : '400'"
        font-family="monospace"
        style="transition: fill 0.15s ease, font-size 0.15s ease;"
      >{{ yr }}</text>

      <!-- X-axis ticks -->
      <line
        v-for="(_, i) in CHART_YEARS" :key="`xt-${i}`"
        :x1="xPos(i)" :x2="xPos(i)"
        :y1="PAD.t + PLOT_H" :y2="PAD.t + PLOT_H + 4"
        stroke="rgba(255,255,255,0.12)" stroke-width="1"
      />
    </svg>

    <!-- Floating year tooltip (top-right of chart area) -->
    <Transition name="tip">
      <div
        v-if="chartHoveredYear !== null"
        class="absolute top-2 right-0 rounded-xl px-3 py-2.5 pointer-events-none z-20"
        style="background:rgba(6,13,27,0.97);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.07);min-width:158px;"
      >
        <p class="text-sm font-black text-blue-300 tracking-widest mb-2">{{ chartHoveredYear }}</p>
        <div
          v-for="grp in [...AGE_GROUPS]
            .filter(g => !hiddenGroups.includes(g.key))
            .sort((a, b) => (ageAnnualData[chartHoveredYear]?.[b.key] ?? 0) - (ageAnnualData[chartHoveredYear]?.[a.key] ?? 0))"
          :key="`tt-${grp.key}`"
          class="flex items-center justify-between gap-3 mb-1 last:mb-0"
        >
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: grp.color }"/>
            <span class="text-xs text-gray-400">{{ grp.label }}</span>
          </div>
          <span class="text-xs font-bold tabular-nums" :style="{ color: grp.color }">
            {{ (ageAnnualData[chartHoveredYear]?.[grp.key] ?? 0).toLocaleString() }}
          </span>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Clickable legend toggles -->
  <div class="flex flex-wrap gap-1.5 pt-2 pb-1 order-secondary">
    <button
      v-for="grp in AGE_GROUPS" :key="grp.key"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200"
      :style="{
        background: hiddenGroups.includes(grp.key) ? 'rgba(255,255,255,0.03)' : grp.rgba,
        border:     `1px solid ${hiddenGroups.includes(grp.key) ? 'rgba(255,255,255,0.06)' : grp.color + '55'}`,
        color:      hiddenGroups.includes(grp.key) ? '#4b5563' : grp.color,
        opacity:    hiddenGroups.includes(grp.key) ? 0.45 : 1,
      }"
      @click="toggleGroup(grp.key)"
    >
      <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200"
        :style="{ background: hiddenGroups.includes(grp.key) ? '#4b5563' : grp.color }"/>
      {{ grp.label }}
    </button>
  </div>
</template>
