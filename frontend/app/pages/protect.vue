<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

definePageMeta({ middleware: ['auth'] })

// --- 1. Import Logic from Composables ---
const { lat, lon, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
const { fetchedUVIndex, locationName, isLoading: isUVLoading, uvError, fetchCurrentUV } = useUV()
const { isTimerRunning, selectedIntervalHours, formattedTime, startReminder, stopReminder } = useSunscreenTimer()

// --- 2. Local State ---
const isManualUV = ref(false)
const manualUVValue = ref(5)
const selectedClothingItem = ref<{ icon: string, name: string, description: string } | null>(null)

// Calculate effective UV index (Switches seamlessly between Real and Manual)
const effectiveUVIndex = computed(() => isManualUV.value ? manualUVValue.value : (fetchedUVIndex.value ?? 0))

// Fetch Outfit state using our abstracted composable
const { avatarOutfit } = useAvatarOutfit(effectiveUVIndex)

// --- 3. Watchers & Lifecycle ---
watch([lat, lon], ([newLat, newLon]) => {
  if (newLat !== null && newLon !== null) fetchCurrentUV(newLat, newLon)
})

watch(geoError, (err) => {
  if (err) {
    uvError.value = err
    locationName.value = 'Location denied'
  }
})

onMounted(() => requestLocation())

// --- 4. Sunscreen Dosage Calculation ---
const dosage = computed(() => {
  const outfit = avatarOutfit.value
  const uv = effectiveUVIndex.value

  const armsExposed = outfit.torso?.id === 'tshirt'
  const legsExposed = outfit.legs?.id === 'shorts'

  const parts = [
    { name: 'Face / Neck / Ears', tsp: 1, covered: false },
    { name: 'Left Arm',           tsp: 1, covered: !armsExposed },
    { name: 'Right Arm',          tsp: 1, covered: !armsExposed },
    { name: 'Body Front',         tsp: 1, covered: true },
    { name: 'Body Back',          tsp: 1, covered: true },
    { name: 'Left Leg',           tsp: 1, covered: !legsExposed },
    { name: 'Right Leg',          tsp: 1, covered: !legsExposed },
  ]

  const totalTsp = parts.filter(p => !p.covered).reduce((sum, p) => sum + p.tsp, 0)
  const totalMl  = totalTsp * 5
  const spfLabel = uv >= 3 ? 'SPF 50+ recommended' : 'SPF 30+ recommended'

  return { parts, totalTsp, totalMl, spfLabel }
})

// --- 5. Clothing Modal ---
function openClothingModal(item: any) {
  if (item) selectedClothingItem.value = item
}

function closeClothingModal() {
  selectedClothingItem.value = null
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #FFF8F3; color: #1A1A2E;">
    <AppHeader :location="locationName" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center py-6 px-4 pb-24 overflow-y-auto">
      <h1 class="text-2xl font-bold mb-1 tracking-wide" style="color: #1A1A2E;">Protection Plan</h1>
      <p class="text-sm mb-6" style="color: #9CA3AF;">Personalised for your current UV level</p>

      <!-- Loading -->
      <div v-if="geoLoading || isUVLoading" class="flex flex-col items-center gap-2 mb-6" style="color: #9CA3AF;">
        <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="color: #FF6B2B;">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Locating &amp; Analyzing UV...</span>
      </div>

      <!-- Error -->
      <div v-else-if="uvError && !isManualUV" class="text-red-500 p-4 rounded-xl border border-red-200 text-center w-full max-w-md mb-6" style="background-color: rgba(239,68,68,0.05);">
        <p class="font-bold mb-1">Unable to fetch live data</p>
        <p class="text-sm">{{ uvError }}</p>
        <button
          @click="isManualUV = true"
          class="mt-4 px-4 py-2 rounded-full text-sm font-semibold"
          style="background-color: #F5E6D3; color: #1A1A2E;"
        >Use Manual Input</button>
      </div>

      <div v-else class="w-full max-w-md flex flex-col gap-5">

        <!-- UV Index card -->
        <div class="rounded-2xl p-6 text-center shadow-sm relative overflow-hidden border" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);">
          <div
            class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 transition-colors duration-500"
            :class="isManualUV ? 'bg-yellow-400' : 'bg-orange-400'"
          />
          <p
            class="text-sm uppercase tracking-widest mb-2 font-semibold transition-colors duration-300"
            :style="{ color: isManualUV ? '#ca8a04' : '#9CA3AF' }"
          >
            {{ isManualUV ? 'Planned UV Index' : 'Current Local UV' }}
          </p>
          <div
            class="text-[5rem] leading-none font-black mb-1 transition-colors duration-300"
            :style="{ color: isManualUV ? '#ca8a04' : '#FF6B2B' }"
          >
            {{ effectiveUVIndex }}
          </div>
          <p v-if="isManualUV" class="text-xs font-medium tracking-wide mt-2" style="color: rgba(202,138,4,0.7);">
            Manual Override Active
          </p>
        </div>

        <!-- Plan Ahead toggle -->
        <div class="rounded-2xl p-5 shadow-sm border" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold" style="color: #1A1A2E;">Plan Ahead (Manual UV)</h2>
              <p class="text-xs mt-0.5" style="color: #9CA3AF;">Check outfits for different UV levels</p>
            </div>
            <button
              @click="isManualUV = !isManualUV"
              class="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none"
              :style="{ backgroundColor: isManualUV ? '#ca8a04' : '#D9C4B0' }"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-md"
                :class="isManualUV ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div v-if="isManualUV" class="mt-5 pt-5 flex flex-col gap-3" style="border-top: 1px solid rgba(26,26,46,0.08);">
            <input
              type="range" min="0" max="11" step="1"
              v-model="manualUVValue"
              class="w-full accent-yellow-500"
            />
            <div class="flex justify-between text-xs font-medium" style="color: #9CA3AF;">
              <span>0 (Low)</span>
              <span>11+ (Extreme)</span>
            </div>
          </div>
        </div>

        <!-- What to Wear (avatar) -->
        <div class="rounded-2xl p-6 shadow-sm text-center relative overflow-hidden border" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-1 relative z-10" style="color: #1A1A2E;">
            <span class="text-xl">👕</span> What to Wear
          </h2>
          <p class="text-xs mb-6 relative z-10" style="color: #9CA3AF;">Tap the avatar's clothes to learn about UV protection.</p>

          <InteractiveAvatar
            :avatarOutfit="avatarOutfit"
            @item-clicked="openClothingModal"
          />
        </div>

        <!-- Sunscreen Dosage -->
        <div class="rounded-2xl p-5 shadow-sm flex flex-col border" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-0.5" style="color: #1A1A2E;">
            <span class="text-xl">🧴</span> Sunscreen Dosage
          </h2>
          <p class="text-xs mb-4" style="color: #9CA3AF;">Based on your UV {{ effectiveUVIndex }} outfit — exposed areas only</p>

          <!-- Body parts breakdown -->
          <div class="flex flex-col gap-2.5 mb-4">
            <div
              v-for="part in dosage.parts"
              :key="part.name"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2 text-sm">
                <span class="text-base leading-none">{{ part.covered ? '✅' : '🧴' }}</span>
                <span
                  class="text-sm"
                  :style="{
                    color: part.covered ? '#9CA3AF' : '#1A1A2E',
                    textDecoration: part.covered ? 'line-through' : 'none',
                  }"
                >{{ part.name }}</span>
              </div>
              <span
                v-if="!part.covered"
                class="text-xs font-semibold"
                style="color: #FF6B2B;"
              >1 tsp · 5 ml</span>
              <span v-else class="text-xs" style="color: #D9C4B0;">Covered</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="w-full mb-4" style="height:1px; background-color: rgba(26,26,46,0.08);"></div>

          <!-- Total -->
          <div class="rounded-xl px-4 py-3 text-center mb-4" style="background-color: #FFF8F3; border: 1px solid rgba(255,107,43,0.15);">
            <p class="text-xs mb-1" style="color: #9CA3AF;">Total to apply</p>
            <p class="text-3xl font-black leading-none" style="color: #FF6B2B;">{{ dosage.totalTsp }} tsp</p>
            <p class="text-xs mt-1" style="color: #6B7280;">≈ {{ dosage.totalMl }} ml &nbsp;·&nbsp; {{ dosage.spfLabel }}</p>
          </div>

          <!-- Application tips -->
          <div class="flex flex-col gap-2">
            <div class="flex items-start gap-2 text-xs" style="color: #6B7280;">
              <span class="shrink-0 mt-0.5">⏰</span>
              <span>Apply <strong style="color: #1A1A2E;">20 minutes</strong> before going outside.</span>
            </div>
            <div class="flex items-start gap-2 text-xs" style="color: #6B7280;">
              <span class="shrink-0 mt-0.5">🔄</span>
              <span>Reapply every <strong style="color: #1A1A2E;">2 hours</strong>, or immediately after swimming, sweating, or towel drying.</span>
            </div>
            <div class="flex items-start gap-2 text-xs" style="color: #6B7280;">
              <span class="shrink-0 mt-0.5">👆</span>
              <span>Face tip: use the <strong style="color: #1A1A2E;">two-finger rule</strong> — a strip of sunscreen along your index and middle fingers.</span>
            </div>
          </div>
        </div>

        <!-- Reapplication Tracker -->
        <div class="rounded-2xl p-5 shadow-sm text-center border" style="background-color: #ffffff; border-color: rgba(26,26,46,0.08);">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-2" style="color: #1A1A2E;">
            <span class="text-xl">⏱️</span> Reapplication Tracker
          </h2>

          <div v-if="!isTimerRunning" class="mb-4 text-left">
            <label class="text-xs block mb-2" style="color: #9CA3AF;">Set Reminder Interval:</label>
            <select
              v-model="selectedIntervalHours"
              class="text-sm rounded-lg block w-full p-2.5 outline-none border"
              style="background-color: #F5E6D3; border-color: rgba(26,26,46,0.15); color: #1A1A2E;"
            >
              <option :value="2">Every 2 Hours (Standard)</option>
              <option :value="3">Every 3 Hours</option>
              <option :value="4">Every 4 Hours</option>
            </select>
          </div>

          <div v-if="isTimerRunning" class="text-4xl font-mono font-light mb-6 tracking-wider" style="color: #1A1A2E;">
            {{ formattedTime }}
          </div>

          <div class="flex gap-4 justify-center mt-2">
            <button
              v-if="!isTimerRunning"
              @click="startReminder"
              class="px-6 py-2.5 font-semibold rounded-full transition-colors w-full"
              style="background-color: #FF6B2B; color: #ffffff;"
            >
              Start Tracker
            </button>
            <button
              v-else
              @click="stopReminder"
              class="px-6 py-2.5 font-semibold rounded-full border transition-colors w-full text-red-500"
              style="background-color: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.3);"
            >
              Stop Tracker
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- Clothing item modal -->
    <div
      v-if="selectedClothingItem"
      class="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      style="background-color: rgba(26,26,46,0.5);"
      @click="closeClothingModal"
    >
      <div
        class="rounded-2xl p-6 max-w-sm w-full shadow-2xl relative border"
        style="background-color: #FFF8F3; border-color: rgba(26,26,46,0.1);"
        @click.stop
      >
        <h3 class="text-xl font-bold mb-3 flex items-center gap-2" style="color: #1A1A2E;">
          <span>{{ selectedClothingItem.icon }}</span> {{ selectedClothingItem.name }}
        </h3>
        <p class="text-sm leading-relaxed mb-8" style="color: #6B7280;">{{ selectedClothingItem.description }}</p>
        <button
          @click="closeClothingModal"
          class="w-full py-3 rounded-full font-semibold transition-colors shadow-sm"
          style="background-color: #F5E6D3; color: #1A1A2E;"
        >
          Got it
        </button>
      </div>
    </div>

    <BottomNav active-tab="protect" />
  </div>
</template>
