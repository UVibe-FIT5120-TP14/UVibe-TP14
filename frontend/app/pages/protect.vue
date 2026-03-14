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

// --- 4. Modal Methods ---
function openClothingModal(item: any) {
  if (item) selectedClothingItem.value = item
}

function closeClothingModal() {
  selectedClothingItem.value = null
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <AppHeader :location="locationName" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center py-6 px-4 pb-24 overflow-y-auto">
      <h1 class="text-2xl font-bold mb-6 tracking-wide">Protection Plan</h1>

      <div v-if="geoLoading || isUVLoading" class="text-gray-400 flex flex-col items-center gap-2 mb-6">
        <svg class="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Locating & Analyzing UV...</span>
      </div>
      
      <div v-else-if="uvError && !isManualUV" class="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center w-full max-w-md mb-6">
        <p class="font-bold mb-1">Unable to fetch live data</p>
        <p class="text-sm">{{ uvError }}</p>
        <button @click="isManualUV = true" class="mt-4 px-4 py-2 bg-gray-800 rounded-full text-sm">Use Manual Input</button>
      </div>

      <div v-else class="w-full max-w-md flex flex-col gap-6">
        
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 transition-colors duration-500"
               :class="isManualUV ? 'bg-yellow-500' : 'bg-purple-500'"></div>

          <p class="text-sm uppercase tracking-widest mb-2 font-semibold transition-colors duration-300"
             :class="isManualUV ? 'text-yellow-500/80' : 'text-gray-400'">
            {{ isManualUV ? 'Planned UV Index' : 'Current Local UV' }}
          </p>
          
          <div class="text-[5rem] leading-none font-black mb-1 transition-colors duration-300" 
               :class="isManualUV ? 'text-yellow-400' : 'text-purple-400'">
            {{ effectiveUVIndex }}
          </div>
          
          <p v-if="isManualUV" class="text-xs text-yellow-500/60 mt-2 font-medium tracking-wide">
            Manual Override Active
          </p>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold text-gray-300">Plan Ahead(Manual UV)</h2>
              <p class="text-xs text-gray-500 mt-0.5">Check outfits for different UV levels</p>
            </div>
            <button 
              @click="isManualUV = !isManualUV"
              class="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none"
              :class="isManualUV ? 'bg-yellow-500' : 'bg-gray-700'"
            >
              <span 
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-md"
                :class="isManualUV ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          
          <div v-if="isManualUV" class="mt-5 pt-5 border-t border-gray-800 flex flex-col gap-3">
            <input 
              type="range" min="0" max="11" step="1" 
              v-model="manualUVValue" 
              class="w-full accent-yellow-500"
            />
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>0 (Low)</span>
              <span>11+ (Extreme)</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg text-center relative overflow-hidden">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-1 text-green-300 relative z-10">
            <span class="text-xl">👕</span> Interactive What to Wear
          </h2>
          <p class="text-xs text-gray-400 mb-6 relative z-10">Tap the avatar's clothes to learn about UPF.</p>
          
          <InteractiveAvatar 
            :avatarOutfit="avatarOutfit" 
            @item-clicked="openClothingModal" 
          />
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col items-center text-center">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-2 text-blue-300">
            <span class="text-xl">🧴</span> Sunscreen Dosage
          </h2>
          <p class="text-gray-400 text-sm mb-4">Calculate exact sunscreen pumps/teaspoons based on your outfit.</p>
          <NuxtLink to="/sunscreen-dosage" class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-colors w-full">
            Calculate Dosage
          </NuxtLink>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg text-center">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-2 text-yellow-300">
            <span class="text-xl">⏱️</span> Reapplication Tracker
          </h2>
          
          <div v-if="!isTimerRunning" class="mb-4 text-left">
            <label class="text-xs text-gray-400 block mb-2">Set Reminder Interval:</label>
            <select v-model="selectedIntervalHours" class="bg-black border border-gray-700 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5 outline-none">
              <option :value="2">Every 2 Hours (Standard)</option>
              <option :value="3">Every 3 Hours</option>
              <option :value="4">Every 4 Hours</option>
            </select>
          </div>
          
          <div v-if="isTimerRunning" class="text-4xl font-mono font-light mb-6 tracking-wider">
            {{ formattedTime }}
          </div>

          <div class="flex gap-4 justify-center mt-2">
            <button v-if="!isTimerRunning" @click="startReminder" class="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-full transition-colors w-full">
              Start Tracker
            </button>
            <button v-else @click="stopReminder" class="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-full border border-red-500/50 transition-colors w-full">
              Stop Tracker
            </button>
          </div>
        </div>

      </div>
    </main>

    <div v-if="selectedClothingItem" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" @click="closeClothingModal">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative" @click.stop>
        <h3 class="text-xl font-bold text-green-300 mb-3 flex items-center gap-2">
          <span>{{ selectedClothingItem.icon }}</span> {{ selectedClothingItem.name }}
        </h3>
        <p class="text-gray-300 text-sm leading-relaxed mb-8">{{ selectedClothingItem.description }}</p>
        <button @click="closeClothingModal" class="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-colors shadow-md">
          Got it
        </button>
      </div>
    </div>

    <BottomNav active-tab="protect" />
  </div>
</template>