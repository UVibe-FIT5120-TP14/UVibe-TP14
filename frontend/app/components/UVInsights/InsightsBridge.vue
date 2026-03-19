<script setup lang="ts">
import { ref, onMounted } from 'vue'
const revealed = ref(false)
onMounted(() => setTimeout(() => { revealed.value = true }, 200))
</script>

<template>
  <div class="bridge" :class="{ revealed }">

    <div class="intro">
      <p class="intro-eyebrow">📊 What you're about to explore</p>
      <h2 class="intro-title">Two tools. One mission — know your risk.</h2>
      <p class="intro-sub">
        Explore real Australian UV and skin cancer data from 2016 to 2019,
        then see where things are heading for your age group over the next decade.
      </p>
    </div>

    <div class="cards">

      <!-- Card 1: UV Map -->
      <div class="card" style="--delay:0.08s">
        <div class="card-icon-wrap" style="background:rgba(255,107,43,0.1)">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <!-- Simple map pin / location shape -->
            <path d="M14 2C9.03 2 5 6.03 5 11c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9z"
              fill="#FF6B2B" fill-opacity="0.18" stroke="#FF6B2B" stroke-width="1.8"/>
            <circle cx="14" cy="11" r="3.2" fill="#FF6B2B"/>
          </svg>
        </div>
        <div class="card-body">
          <h3 class="card-title">UV &amp; Cancer Map</h3>
          <p class="card-desc">
            See how UV intensity and skin cancer rates vary across every Australian state —
            month by month over four years.
          </p>
          <ul class="card-bullets">
            <li>Colour-coded UV intensity per state</li>
            <li>Cancer case density as bubble size</li>
            <li>Compare any two states side by side</li>
          </ul>
        </div>
        <div class="card-tag" style="color:#FF6B2B;background:rgba(255,107,43,0.08)">Map · 2016–2019</div>
      </div>

      <!-- Card 2: Age Prediction -->
      <div class="card" style="--delay:0.22s">
        <div class="card-icon-wrap" style="background:rgba(8,145,178,0.1)">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <!-- Simple trend arrow -->
            <polyline points="3,22 9,14 15,17 25,5"
              stroke="#0891B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <polyline points="20,5 25,5 25,10"
              stroke="#0891B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <div class="card-body">
          <h3 class="card-title">Your Age Group's Future</h3>
          <p class="card-desc">
            Enter your age and see how skin cancer cases in your group are projected
            to grow over the next decade.
          </p>
          <ul class="card-bullets">
            <li>Projections from 2019 out to 2034</li>
            <li>Personalised to your age group</li>
            <li>Includes a prevention reminder 🧴</li>
          </ul>
        </div>
        <div class="card-tag" style="color:#0891B2;background:rgba(8,145,178,0.08)">Projection · 2019–2034</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bridge {
  max-width: 920px;
  margin: 0 auto;
  padding: 40px 40px 36px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.bridge.revealed { opacity: 1; transform: none; }

/* ── Intro copy ── */
.intro {
  margin-bottom: 28px;
}
.intro-eyebrow {
  font-size: 13px;
  font-weight: 800;
  color: #FF6B2B;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}
.intro-title {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(20px, 2.4vw, 28px);
  font-weight: 800;
  color: #1A1A2E;
  margin: 0 0 10px;
  line-height: 1.22;
}
.intro-sub {
  font-size: 15px;
  color: #6B7280;
  line-height: 1.65;
  margin: 0;
  max-width: 580px;
}

/* ── Cards ── */
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  position: relative;
  background: #fff;
  border-radius: 20px;
  border: 1.5px solid rgba(255,107,43,0.1);
  padding: 24px 22px 56px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* Entrance */
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s cubic-bezier(0.34,1.56,0.64,1) var(--delay),
              box-shadow 0.2s ease, border-color 0.2s ease;
}
.bridge.revealed .card { opacity: 1; transform: none; }
.card:hover {
  box-shadow: 0 8px 40px rgba(255,107,43,0.12);
  border-color: rgba(255,107,43,0.22);
}

/* ── Icon ── */
.card-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Body ── */
.card-body { display: flex; flex-direction: column; gap: 8px; }

.card-title {
  font-family: 'Poppins', sans-serif;
  font-size: 17px;
  font-weight: 800;
  color: #1A1A2E;
  margin: 0;
}
.card-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.6;
  margin: 0;
}

.card-bullets {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.card-bullets li {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A2E;
  padding-left: 18px;
  position: relative;
}
.card-bullets li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #FF6B2B;
  font-size: 12px;
  font-weight: 900;
}

/* ── Bottom tag ── */
.card-tag {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  text-align: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 0;
  border-radius: 0 0 18px 18px;
}

@media (max-width: 640px) {
  .bridge { padding: 28px 20px 24px; }
  .cards { grid-template-columns: 1fr; }
}
</style>
