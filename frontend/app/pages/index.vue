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

onMounted(() => requestLocation())

// --- WHO UV Index scale ---
const uvColor = computed((): string => {
  if (uvValue.value <= 2) return '#22c55e'   // Green  — Low
  if (uvValue.value <= 5) return '#eab308'   // Yellow — Moderate
  if (uvValue.value <= 7) return '#f97316'   // Orange — High
  if (uvValue.value <= 10) return '#ef4444'  // Red    — Very High
  return '#8b5cf6'                            // Violet — Extreme
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
  <div class="min-h-screen bg-black text-white flex flex-col">

    <!-- Header -->
    <AppHeader
      :location="locationName"
      @toggle-sidebar="sidebarOpen = true"
    />

    <!-- Alerts bar — only shown when UV is forecast to reach moderate or above -->
    <div
      v-if="peakWindow"
      class="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
      </svg>
      <span>UV Alert — Elevated UV expected {{ peakWindow }}. Apply SPF and seek shade.</span>
    </div>

    <!-- Main content -->
    <main class="flex-1 flex flex-col items-center justify-center gap-10 pb-24 px-4">

      <!-- UV Display -->
      <UVDisplay
        :uv-index="uvValue"
        :color="uvColor"
        :label="uvLabel"
      />

      <!-- Time context -->
      <div class="text-center space-y-1">
        <p class="text-gray-400 text-sm">
          <span v-if="geoLoading || loadingUV">Fetching UV data...</span>
          <span v-else-if="uvError" class="text-red-400">{{ uvError }}</span>
          <span v-else>Current UV Index</span>
        </p>
        <p class="text-gray-600 text-xs tracking-wide">Updated just now</p>
      </div>

      <!-- Quick stats row -->
      <div class="flex gap-6 text-center">
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-gray-500 tracking-wide uppercase">Peak Today</span>
          <span class="text-white font-semibold">{{ peakUV ?? '—' }}</span>
          <span class="text-xs text-gray-400">{{ peakWindow ?? 'No data' }}</span>
        </div>
        <div class="w-px bg-white/10" />
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-gray-500 tracking-wide uppercase">Now</span>
          <span class="text-white font-semibold">{{ uvValue }}</span>
          <span class="text-xs" :style="{ color: uvColor }">{{ uvLabel }}</span>
        </div>
        <div class="w-px bg-white/10" />
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs text-gray-500 tracking-wide uppercase">Sunset</span>
          <span class="text-white font-semibold">{{ sunsetTime ?? '—' }}</span>
        </div>
      </div>
    </main>

    <!-- Bottom nav -->
    <BottomNav active-tab="home" />

    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
  </div>
</template>
