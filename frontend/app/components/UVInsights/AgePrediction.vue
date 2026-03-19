<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Milestone { year: number; count: number; isProjected: boolean }
interface AgeGroup {
  key: string; label: string; ageRange: string
  range: [number, number]; emoji: string; color: string
  milestones: Milestone[]
}

const GROUPS: AgeGroup[] = [
  {
    key: 'children', label: 'Kids', ageRange: '0–14', emoji: '🧒',
    range: [0, 14], color: '#0891B2',
    milestones: [
      { year: 2019, count: 29,    isProjected: false },
      { year: 2024, count: 34,    isProjected: true  },
      { year: 2029, count: 40,    isProjected: true  },
      { year: 2034, count: 47,    isProjected: true  },
    ],
  },
  {
    key: 'young', label: 'Young Adults', ageRange: '15–29', emoji: '🏄',
    range: [15, 29], color: '#FF6B2B',
    milestones: [
      { year: 2019, count: 521,   isProjected: false },
      { year: 2024, count: 610,   isProjected: true  },
      { year: 2029, count: 715,   isProjected: true  },
      { year: 2034, count: 838,   isProjected: true  },
    ],
  },
  {
    key: 'adults', label: 'Adults', ageRange: '30–59', emoji: '💼',
    range: [30, 59], color: '#CA8A04',
    milestones: [
      { year: 2019, count: 8581,  isProjected: false },
      { year: 2024, count: 9770,  isProjected: true  },
      { year: 2029, count: 11127, isProjected: true  },
      { year: 2034, count: 12680, isProjected: true  },
    ],
  },
  {
    key: 'older', label: 'Seniors', ageRange: '60–79', emoji: '🌴',
    range: [60, 79], color: '#EA580C',
    milestones: [
      { year: 2019, count: 10609, isProjected: false },
      { year: 2024, count: 12094, isProjected: true  },
      { year: 2029, count: 13781, isProjected: true  },
      { year: 2034, count: 15703, isProjected: true  },
    ],
  },
  {
    key: 'elderly', label: 'Elderly', ageRange: '80+', emoji: '🏡',
    range: [80, 120], color: '#7C3AED',
    milestones: [
      { year: 2019, count: 3362,  isProjected: false },
      { year: 2024, count: 3843,  isProjected: true  },
      { year: 2029, count: 4393,  isProjected: true  },
      { year: 2034, count: 5023,  isProjected: true  },
    ],
  },
]

// ─── State ────────────────────────────────────────────────────────────────────

const userAge   = ref('')
const barsReady = ref(false)
const displayCounts = ref([0, 0, 0, 0])

const activeGroup = computed<AgeGroup>(() => {
  const age = parseInt(userAge.value)
  if (!isNaN(age) && age >= 0 && age <= 120)
    return GROUPS.find(g => age >= g.range[0] && age <= g.range[1]) ?? GROUPS[1]
  return GROUPS[1] // default: young adults (most relatable for target audience)
})

const maxCount  = computed(() => Math.max(...activeGroup.value.milestones.map(m => m.count)))
const growthPct = computed(() => {
  const ms = activeGroup.value.milestones
  return Math.round(((ms[3].count - ms[0].count) / ms[0].count) * 100)
})

// Derive a light rgba from a hex color string
function hexAlpha(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// ─── Animation ────────────────────────────────────────────────────────────────

function runAnimation() {
  barsReady.value = false
  displayCounts.value = [0, 0, 0, 0]
  // Tiny delay so the bars can collapse before growing again
  setTimeout(() => {
    barsReady.value = true
    activeGroup.value.milestones.forEach((m, idx) => {
      const duration = 700 + idx * 180
      const start = performance.now()
      ;(function tick(now: number) {
        const t = Math.min((now - start) / duration, 1)
        displayCounts.value[idx] = Math.round(m.count * (1 - Math.pow(1 - t, 3)))
        if (t < 1) requestAnimationFrame(tick)
      })(performance.now())
    })
  }, 60)
}

watch(activeGroup, runAnimation)
onMounted(() => setTimeout(runAnimation, 350))
</script>

<template>
  <div class="pred">
    <!-- ── Age input ──────────────────────────────────────────────────── -->
    <div class="input-area">
      <label class="input-lbl">How old are you?</label>
      <div class="input-row">
        <input
          v-model="userAge"
          type="number" min="0" max="120"
          placeholder="e.g. 21"
          class="age-input"
        />
        <Transition name="chip-pop">
          <div
            v-if="userAge"
            class="group-chip"
            :style="{
              background:   hexAlpha(activeGroup.color, 0.1),
              borderColor:  activeGroup.color,
              color:        activeGroup.color,
            }"
          >
            {{ activeGroup.emoji }}
            You're a <strong>{{ activeGroup.label }} ({{ activeGroup.ageRange }})</strong>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── Milestone cards ───────────────────────────────────────────── -->
    <div class="cards">
      <div
        v-for="(m, i) in activeGroup.milestones"
        :key="`${activeGroup.key}-${m.year}`"
        class="card"
        :class="{ last: i === 3, revealed: barsReady }"
        :style="{ '--c': activeGroup.color, '--delay': `${i * 85}ms` }"
      >
        <!-- Year label -->
        <div class="card-year">{{ m.year }}</div>

        <!-- Animated count -->
        <div class="card-count">{{ displayCounts[i].toLocaleString() }}</div>
        <div class="card-unit">cases</div>

        <!-- Proportional fill bar -->
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              height:          barsReady ? `${(m.count / maxCount) * 100}%` : '0%',
              background:      activeGroup.color,
              opacity:         m.isProjected ? 0.65 : 1,
              transitionDelay: barsReady ? `${i * 120}ms` : '0ms',
            }"
          />
        </div>

        <!-- Type badge -->
        <div
          class="card-tag"
          :class="i === 3 ? 'tag-proj' : m.isProjected ? 'tag-est' : 'tag-actual'"
          :style="i === 3 ? { background: activeGroup.color } : {}"
        >
          {{ i === 3 ? 'PROJECTED' : m.isProjected ? 'EST.' : 'ACTUAL' }}
        </div>

        <!-- Growth % only on last card -->
        <div
          v-if="i === 3"
          class="growth-chip"
          :style="{ color: activeGroup.color }"
        >↑ +{{ growthPct }}%</div>
      </div>
    </div>

    <!-- ── Insight strip ─────────────────────────────────────────────── -->
    <div
      class="insight"
      :style="{ borderLeftColor: activeGroup.color }"
    >
      <span class="insight-pct" :style="{ color: activeGroup.color }">+{{ growthPct }}%</span>
      <p class="insight-text">
        more skin cancer cases projected for
        <strong>{{ activeGroup.label }} ({{ activeGroup.ageRange }})</strong> by 2034.
        The good news? <strong>95% of cases are preventable</strong> with sunscreen, protective clothing, and shade. 🧴
      </p>
    </div>

    <p class="footnote">
      * 2019 figures from AIHW. 2024–2034 projections apply estimated 2–3% annual growth based on population trends and UV exposure patterns. Not a clinical forecast.
    </p>
  </div>
</template>

<style scoped>
.pred { display: flex; flex-direction: column; gap: 24px; }

/* ── Age input ── */
.input-lbl {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 14px;
}
.input-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

.age-input {
  width: 96px;
  padding: 12px 14px;
  font-size: 24px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  border: 2.5px solid #E5E7EB;
  border-radius: 14px;
  outline: none;
  color: #1A1A2E;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  /* Hide number spinners */
  -moz-appearance: textfield;
}
.age-input::-webkit-outer-spin-button,
.age-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.age-input:focus {
  border-color: #FF6B2B;
  box-shadow: 0 0 0 3px rgba(255,107,43,0.15);
}

.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 100px;
  border: 2px solid;
  font-size: 15px;
  font-weight: 600;
}
.group-chip strong { font-weight: 800; }

.chip-pop-enter-active { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.chip-pop-leave-active { transition: all 0.18s ease; }
.chip-pop-enter-from, .chip-pop-leave-to { opacity: 0; transform: scale(0.85); }

/* ── Milestone cards ── */
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.card {
  background: #fff;
  border-radius: 18px;
  padding: 18px 14px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  min-height: 230px;
  position: relative;
  /* Entrance animation */
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity  0.42s ease var(--delay),
    transform 0.42s cubic-bezier(0.34,1.56,0.64,1) var(--delay);
}
.card.revealed { opacity: 1; transform: none; }
.card.last {
  border: 2px solid var(--c);
  box-shadow: 0 8px 40px rgba(0,0,0,0.1);
}

.card-year {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #9CA3AF;
  margin-bottom: 8px;
}
.card.last .card-year { color: var(--c); font-size: 13px; }

.card-count {
  font-family: 'Poppins', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #1A1A2E;
  line-height: 1;
  transition: color 0.3s ease;
}
.card.last .card-count { color: var(--c); font-size: 30px; }

.card-unit {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #9CA3AF;
  margin: 4px 0 10px;
}

/* Fill bar */
.bar-track {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  transition: height 0.95s cubic-bezier(0.34,1.56,0.64,1);
  border-radius: 5px 5px 0 0;
}

/* Bottom type badge */
.card-tag {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  text-align: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 5px 0;
}
.tag-actual { background: #F3F4F6; color: #9CA3AF; }
.tag-est    { background: #FFF7ED; color: #D97706; }
.tag-proj   { color: #fff; }

/* Growth chip on last card */
.growth-chip {
  position: absolute;
  top: 10px; right: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 800;
}

/* ── Insight strip ── */
.insight {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px;
  border-left: 5px solid;
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
}
.insight-pct {
  font-family: 'Poppins', sans-serif;
  font-size: 40px;
  font-weight: 900;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}
.insight-text {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.65;
  margin: 0;
}
.insight-text strong { color: #1A1A2E; }

.footnote {
  font-size: 11px;
  color: #9CA3AF;
  font-style: italic;
  margin: -8px 0 0;
}

@media (max-width: 680px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
  .insight { flex-direction: column; gap: 8px; }
  .insight-pct { font-size: 30px; }
}
</style>
