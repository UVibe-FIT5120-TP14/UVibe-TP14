<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const auth = useAuthStore()

// --- UV data ---
const uvValue = ref<number>(0)
const locationName = ref<string>('Locating...')
const peakUV = ref<number | null>(null)
const peakWindow = ref<string | null>(null)
const sunsetTime = ref<string | null>(null)
const loadingUV = ref(false)
const uvError = ref<string | null>(null)
const sidebarOpen = ref(false)

// --- Geolocation ---
const { lat, lon, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

async function fetchUV() {
  if (lat.value === null || lon.value === null) return
  loadingUV.value = true
  uvError.value = null
  try {
    const data = await $fetch<{
      uv_index: number
      location_name: string
      latitude: number
      longitude: number
      recorded_at: string
      sunset: string | null
      peak_window: string | null
      peak_uv: number | null
    }>(
      `${config.public.apiBase}/api/uv?lat=${lat.value}&lon=${lon.value}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    uvValue.value = Math.round(data.uv_index)
    locationName.value = data.location_name
    peakUV.value = data.peak_uv !== null ? Math.round(data.peak_uv) : null
    peakWindow.value = data.peak_window
    sunsetTime.value = data.sunset
      ? new Date(data.sunset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : null
  } catch {
    uvError.value = 'Could not fetch UV data'
    locationName.value = 'Unavailable'
  } finally {
    loadingUV.value = false
  }
}

watch([lat, lon], ([newLat, newLon]) => {
  if (newLat !== null && newLon !== null) fetchUV()
})

watch(geoError, (err) => {
  if (err) {
    uvError.value = err
    locationName.value = 'Location denied'
  }
})

onMounted(() => {
  requestLocation()
  statsTimer = setInterval(() => {
    statsIndex.value = (statsIndex.value + 1) % skinStats.length
  }, 8000)
})

onUnmounted(() => {
  clearInterval(statsTimer)
})

// --- Greeting ---
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
})

// --- Left widget: rotating skin-cancer stats ---
let statsTimer: ReturnType<typeof setInterval>
const statsIndex = ref(0)
const skinStats = [
  { stat: '75%',     detail: 'of UV radiation still reaches your skin on a cloudy day.',           source: 'cancer.org.au'    },
  { stat: '80%',     detail: 'of UV rays can reflect off sand and water directly onto your skin.', source: 'skincancer.org'   },
  { stat: 'SPF 50+', detail: 'sunscreen should be reapplied every 2 hours, not just once.',        source: 'tga.gov.au'       },
  { stat: 'A tan',   detail: 'is your skin\'s damage response — there is no such thing as a safe tan.', source: 'who.int'   },
]
const currentStat = computed(() => skinStats[statsIndex.value])

// --- WHO UV Index scale ---
const uvColor = computed((): string => {
  if (uvValue.value <= 2) return '#22c55e'
  if (uvValue.value <= 5) return '#eab308'
  if (uvValue.value <= 7) return '#f97316'
  if (uvValue.value <= 10) return '#ef4444'
  return '#8b5cf6'
})

const uvLabel = computed((): string => {
  if (uvValue.value <= 2) return 'LOW'
  if (uvValue.value <= 5) return 'MODERATE'
  if (uvValue.value <= 7) return 'HIGH'
  if (uvValue.value <= 10) return 'VERY HIGH'
  return 'EXTREME'
})
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #FFF8F3; color: #1A1A2E;">

    <!-- Header -->
    <AppHeader
      :location="locationName"
      @toggle-sidebar="sidebarOpen = true"
    />

    <!-- Alerts bar -->
    <div
      v-if="peakWindow"
      class="flex items-center gap-2 px-4 py-2 border-b text-xs"
      style="background-color: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.2); color: #b45309;"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
      </svg>
      <span>UV Alert — Elevated UV expected {{ peakWindow }}. Apply SPF and seek shade.</span>
    </div>

    <!-- Main content: 3-panel layout on desktop, stacked on mobile -->
    <main class="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-12 pb-24 px-4">

      <!-- LEFT: rotating skin-cancer stats widget -->
      <div class="flex items-center justify-center w-full md:w-auto order-2 md:order-1">
        <div class="w-full max-w-xs rounded-2xl border overflow-hidden" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08); min-height: 220px;">
        <Transition name="tip-fade" mode="out-in">
          <div
            :key="statsIndex"
            class="w-full px-5 py-5 text-center flex flex-col items-center justify-center"
            style="min-height: 220px;"
          >
            <p class="text-xs font-bold tracking-widest uppercase mb-2" style="color: rgba(255,107,43,0.6);">Did you know?</p>
            <p class="text-3xl font-black leading-none mb-2" style="color: #FF6B2B;">{{ currentStat.stat }}</p>
            <p class="text-xs leading-relaxed mb-2" style="color: #6B7280;">{{ currentStat.detail }}</p>
            <p class="text-[10px] mb-4" style="color: #D9C4B0;">{{ currentStat.source }}</p>
            <NuxtLink
              to="/insights"
              class="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
              style="background-color: #FF6B2B; color: #ffffff;"
            >
              See the data →
            </NuxtLink>
          </div>
        </Transition>
        </div>
      </div>

      <!-- CENTRE: UV dial + welcome + context + stats row -->
      <div class="flex flex-col items-center gap-10 order-1 md:order-2">

        <!-- Welcome line -->
        <div class="text-center space-y-0.5">
          <p class="text-sm tracking-wide" style="color: #6B7280;">
            {{ greeting }}<span v-if="locationName && locationName !== 'Locating...'">, {{ locationName }}</span>
          </p>
          <p class="text-xs" style="color: #9CA3AF;">Here's your UV right now</p>
        </div>

        <!-- UV Display -->
        <UVDisplay
          :uv-index="uvValue"
          :color="uvColor"
          :label="uvLabel"
        />

        <!-- Time context -->
        <div class="text-center space-y-1">
          <p class="text-sm" style="color: #6B7280;">
            <span v-if="geoLoading || loadingUV">Fetching UV data...</span>
            <span v-else-if="uvError" class="text-red-500">{{ uvError }}</span>
            <span v-else>Current UV Index</span>
          </p>
          <p class="text-xs tracking-wide" style="color: #9CA3AF;">Updated just now</p>
        </div>

        <!-- Quick stats row -->
        <div class="flex gap-8 text-center">
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs tracking-wide uppercase" style="color: #9CA3AF;">Peak Today</span>
            <span class="font-semibold" style="color: #1A1A2E;">{{ peakUV ?? '—' }}</span>
            <span class="text-xs" style="color: #6B7280;">{{ peakWindow ?? 'No data' }}</span>
          </div>
          <div class="w-px" style="background-color: rgba(26,26,46,0.1);" />
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs tracking-wide uppercase" style="color: #9CA3AF;">Sunset</span>
            <span class="font-semibold" style="color: #1A1A2E;">{{ sunsetTime ?? '—' }}</span>
          </div>
        </div>


      </div>

      <!-- RIGHT: Plan ahead CTA -->
      <div class="flex items-center justify-center w-full md:w-auto order-3 md:order-3">
        <NuxtLink
          to="/protect"
          class="group w-full max-w-xs rounded-2xl px-5 py-5 border flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
          style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);"
        >
          <p class="text-xs font-bold tracking-widest uppercase" style="color: rgba(255,107,43,0.6);">Going out today?</p>
          <p class="text-2xl font-black leading-tight group-hover:text-[#FF6B2B] transition-colors" style="color: #1A1A2E;">Plan your protection.</p>
          <p class="text-xs leading-relaxed" style="color: #6B7280;">
            Calculate sunscreen dosage, pick your outfit &amp; set a reapplication reminder.
          </p>
          <span
            class="self-start px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
            style="background-color: #FF6B2B; color: #ffffff;"
          >Plan now →</span>
        </NuxtLink>
      </div>

    </main>

    <!-- Bottom nav -->
    <BottomNav active-tab="home" />

    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
  </div>
</template>

<style scoped>
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
