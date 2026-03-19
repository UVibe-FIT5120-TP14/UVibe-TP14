<script setup lang="ts">
import { ref, onMounted } from 'vue'

const revealed = ref(false)
onMounted(() => setTimeout(() => { revealed.value = true }, 80))

const props = defineProps<{ vizId?: string }>()

function scrollToViz() {
  const target = props.vizId
    ? document.getElementById(props.vizId)
    : document.querySelector('[data-viz-section]') as HTMLElement | null

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // Fallback: scroll down by one viewport height
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="hero" :class="{ revealed }">
    <div class="hero-badge">🌞 Australia · UV & Skin Cancer · 2016–2019</div>

    <h1 class="hero-title">
      Australia loves the sun.<br>
      <span class="hero-accent">The sun doesn't always love us back.</span>
    </h1>

    <p class="hero-body">
      We have some of the highest UV levels on Earth — and one of the highest skin cancer rates to match.
      Here's what the real data looks like, and what it means for you.
    </p>

    <div class="stats-row">
      <div class="stat-card" style="--d:0.10s">
        <div class="stat-num">2 in 3</div>
        <div class="stat-desc">Australians get skin cancer before age 70</div>
      </div>
      <div class="stat-card" style="--d:0.22s">
        <div class="stat-num">#1</div>
        <div class="stat-desc">Most diagnosed cancer in Australia</div>
      </div>
      <div class="stat-card" style="--d:0.34s">
        <div class="stat-num">95%</div>
        <div class="stat-desc">Of cases are preventable with sun protection</div>
      </div>
    </div>

    <!-- CTA + scroll arrow -->
    <div class="cta-area">
      <button class="cta-btn" @click="scrollToViz">
        <span class="cta-label">See the data for yourself</span>
        <span class="cta-icon">
          <!-- Right arrow SVG -->
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

    </div>
  </div>
</template>

<style scoped>
.hero {
  padding: 52px 40px 44px;
  max-width: 880px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s ease, transform 0.75s ease;
}
.hero.revealed { opacity: 1; transform: none; }

.hero-badge {
  display: inline-block;
  background: rgba(255,107,43,0.1);
  color: #FF6B2B;
  border: 1.5px solid rgba(255,107,43,0.22);
  border-radius: 100px;
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 22px;
}

.hero-title {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(26px, 3.8vw, 44px);
  font-weight: 800;
  line-height: 1.18;
  color: #1A1A2E;
  margin: 0 0 18px;
}
.hero-accent { color: #FF6B2B; }

.hero-body {
  font-size: 17px;
  line-height: 1.7;
  color: #6B7280;
  max-width: 600px;
  margin: 0 0 40px;
}

/* ── Stat cards ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 18px;
  padding: 26px 20px;
  box-shadow: 0 4px 28px rgba(255,107,43,0.08);
  border: 1.5px solid rgba(255,107,43,0.08);
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.55s ease var(--d), transform 0.55s ease var(--d);
}
.hero.revealed .stat-card { opacity: 1; transform: none; }

.stat-num {
  font-family: 'Poppins', sans-serif;
  font-size: 38px;
  font-weight: 900;
  color: #FF6B2B;
  line-height: 1;
  margin-bottom: 10px;
}
.stat-desc {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.45;
  font-weight: 600;
}

@media (max-width: 620px) {
  .hero { padding: 36px 20px 30px; }
  .stats-row { grid-template-columns: 1fr; gap: 12px; }
}

/* ── CTA area ── */
.cta-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  margin-top: 44px;
  /* Entrance — appears after the stat cards */
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.55s ease 0.5s, transform 0.55s ease 0.5s;
}
.hero.revealed .cta-area { opacity: 1; transform: none; }

/* ── CTA button ── */
.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #FF6B2B;
  color: #fff;
  border: none;
  border-radius: 100px;
  padding: 16px 30px;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 28px rgba(255,107,43,0.38);
  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
              box-shadow 0.18s ease,
              background 0.18s ease;
}
.cta-btn:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 12px 40px rgba(255,107,43,0.5);
  background: #f55e1f;
}
.cta-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 4px 16px rgba(255,107,43,0.3);
}

.cta-label { line-height: 1; }

.cta-icon {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  padding: 5px;
  transition: transform 0.18s ease;
}
.cta-btn:hover .cta-icon { transform: translateX(3px); }

/* ── Scroll hint + chevrons ── */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.scroll-text {
  font-size: 13px;
  font-weight: 700;
  color: #9CA3AF;
  letter-spacing: 0.03em;
}

.arrow-wrap {
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding-left: 2px;
}

/* Three chevrons — sequential fade+drop animation */
@keyframes chevBounce {
  0%, 60%, 100% { opacity: 0.15; transform: translateY(-4px); }
  30%            { opacity: 1;    transform: translateY(4px);  }
}

.chevron { display: block; }
.c1 { animation: chevBounce 1.8s ease-in-out infinite 0.0s; }
.c2 { animation: chevBounce 1.8s ease-in-out infinite 0.2s; }
.c3 { animation: chevBounce 1.8s ease-in-out infinite 0.4s; }

@media (max-width: 620px) {
  .cta-btn { font-size: 15px; padding: 14px 24px; }
}
</style>