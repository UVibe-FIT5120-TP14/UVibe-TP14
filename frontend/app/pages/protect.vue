<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const auth = useAuthStore()

// --- 1. Geolocation & UV State ---
const { lat, lon, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

const fetchedUVIndex = ref<number | null>(null)
const locationName = ref<string>('Locating...')
const isLoading = ref(true)
const uvError = ref<string | null>(null)

// --- 2. Manual UV State ---
const isManualUV = ref(false)
const manualUVValue = ref(5)

const effectiveUVIndex = computed(() => {
  if (isManualUV.value) return manualUVValue.value
  return fetchedUVIndex.value ?? 0
})

// --- 3. Timer State ---
const isTimerRunning = ref(false)
const selectedIntervalHours = ref(2)
const timeLeft = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

// --- 4. Interactive Avatar Outfit State ---
const selectedClothingItem = ref<{ icon: string, name: string, description: string } | null>(null)

// Richly detailed styling for the mannequin based on UV levels
// Colors are now high-contrast against the dark background!
const avatarOutfit = computed(() => {
  const uv = effectiveUVIndex.value
  const outfit: Record<string, any> = { head: null, eyes: null, torso: null, legs: null, accessory: null }

  if (uv < 3) {
    // Low UV (0-2)
    outfit.torso = { id: 'tshirt', icon: '👕', name: 'Cotton T-Shirt', description: 'Low UV. Standard cotton provides a UPF of about 5-15, which is plenty for low UV conditions. No special fabrics needed.', color: 'bg-sky-400' }
    outfit.legs = { id: 'shorts', icon: '🩳', name: 'Casual Shorts', description: 'Comfortable wear. Sunscreen is optional but recommended if you plan to stay outside for long periods.', color: 'bg-stone-300' }
  } else if (uv < 6) {
    // Moderate UV (3-5)
    outfit.head = { id: 'cap', icon: '🧢', name: 'Baseball Cap', description: 'Provides basic shade for the forehead and eyes. However, it leaves your neck and ears exposed to UV rays.', color: 'bg-indigo-500' }
    outfit.eyes = { id: 'shades', icon: '🕶️', name: 'UV-blocking Shades', description: 'Look for labels saying UV400 or "100% UV protection" to prevent long-term eye damage and cataracts.', color: 'bg-gray-900' }
    outfit.torso = { id: 'tshirt', icon: '👕', name: 'T-shirt (Cover Shoulders)', description: 'Shoulders burn easily. Avoid tank tops. Standard fabric offers UPF ~15. Apply sunscreen to exposed arms.', color: 'bg-teal-400' }
    outfit.legs = { id: 'long-pants', icon: '👖', name: 'Light Pants', description: 'Pants provide a physical barrier. Denim has a UPF of 1700+, but lighter tightly-woven fabrics work well too.', color: 'bg-indigo-300' }
  } else if (uv < 8) {
    // High UV (6-7)
    outfit.head = { id: 'sunhat', icon: '👒', name: 'Broad-brimmed Hat', description: 'A brim of at least 7.5cm protects your ears and the back of your neck, which baseball caps leave completely exposed.', color: 'bg-amber-400' }
    outfit.eyes = { id: 'shades', icon: '🕶️', name: 'UV-blocking Shades', description: 'Crucial at high UV levels to protect the delicate, thin skin around your eyes from premature aging.', color: 'bg-gray-900' }
    outfit.torso = { id: 'long-shirt', icon: '👔', name: 'Tightly Woven Long Sleeves', description: 'Rule of thumb: Hold the fabric up to the light. If you can easily see through it, UV rays can get through too.', color: 'bg-emerald-400' }
    outfit.legs = { id: 'long-pants', icon: '👖', name: 'Long Pants', description: 'Maximize physical coverage to minimize your reliance on sunscreen.', color: 'bg-slate-300' }
  } else if (uv < 11) {
    // Very High UV (8-10) - HIGH VISIBILITY TECH WEAR
    outfit.head = { id: 'sunhat', icon: '👒', name: 'UPF 50+ Sun Hat', description: 'UPF 50+ fabric allows only 1/50th of UV radiation to pass through, effectively blocking 98% of harmful rays.', color: 'bg-orange-400' }
    outfit.eyes = { id: 'wrap-shades', icon: '🥽', name: 'Wrap-around Sunglasses', description: 'Standard glasses let UV rays leak in. Wrap-around styles stop scattered and reflected rays from entering the sides.', color: 'bg-gray-900' }
    outfit.torso = { id: 'jacket', icon: '🥋', name: 'UPF 50+ Zip Jacket', description: 'Synthetic fibers like polyester and nylon are excellent UV reflectors. Look for official UPF 50+ tags.', color: 'bg-cyan-400' } // Bright Cyan
    outfit.legs = { id: 'long-pants', icon: '👖', name: 'UPF 50+ Pants', description: 'Dark or bright colors absorb more UV rays than pale colors, offering significantly better protection.', color: 'bg-gray-200' } // Bright Light Grey
    outfit.accessory = { id: 'umbrella', icon: '⛱️', name: 'UV Umbrella', description: 'A parasol with a black inner coating absorbs reflected UV rays from the concrete ground.', color: '' }
  } else {
    // Extreme UV (11+) - MAX VISIBILITY ALERT GEAR
    outfit.head = { id: 'legionnaire', icon: '👒', name: 'Legionnaire Hat', description: 'A wide-brim hat with a back neck flap provides the ultimate physical barrier for extreme conditions.', color: 'bg-rose-500' }
    outfit.eyes = { id: 'wrap-shades', icon: '🥽', name: 'Wrap-around Sunglasses', description: 'Essential protection against extreme UV radiation to prevent photokeratitis (snow blindness).', color: 'bg-gray-900' }
    outfit.torso = { id: 'jacket', icon: '🥷', name: 'Full UPF 50+ Tech Gear', description: 'Unprotected skin can burn in minutes. Wear long UPF 50+ sleeves and consider a UPF neck gaiter.', color: 'bg-rose-500' } // Bright Rose Red
    outfit.legs = { id: 'long-pants', icon: '👖', name: 'Full UPF 50+ Pants', description: 'Absolutely no skin should be exposed. Wear long thick pants and closed shoes.', color: 'bg-zinc-200' } // Bright White/Grey
    outfit.accessory = { id: 'house', icon: '🏠', name: 'Stay Indoors', description: 'The best protection is avoiding exposure entirely. Reschedule outdoor activities.', color: '' }
  }
  return outfit
})

// --- Methods ---
async function fetchCurrentUV() {
  if (lat.value === null || lon.value === null) return
  isLoading.value = true
  uvError.value = null
  try {
    const data = await $fetch<any>(
      `${config.public.apiBase}/api/uv?lat=${lat.value}&lon=${lon.value}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    fetchedUVIndex.value = Math.round(data.uv_index)
    locationName.value = data.location_name
  } catch (error) {
    uvError.value = 'Could not fetch UV data'
    locationName.value = 'Unavailable'
  } finally {
    isLoading.value = false
  }
}

watch([lat, lon], ([newLat, newLon]) => {
  if (newLat !== null && newLon !== null) fetchCurrentUV()
})

watch(geoError, (err) => {
  if (err) {
    uvError.value = err
    locationName.value = 'Location denied'
    isLoading.value = false
  }
})

onMounted(() => requestLocation())
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

function openClothingModal(item: { icon: string, name: string, description: string }) {
  if (!item) return
  selectedClothingItem.value = item
}

function closeClothingModal() {
  selectedClothingItem.value = null
}

function startReminder() {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  timeLeft.value = selectedIntervalHours.value * 60 * 60
  if (Notification.permission === 'default') Notification.requestPermission()
  
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else {
      stopReminder()
      alert(`Time to reapply your sunscreen! It's been ${selectedIntervalHours.value} hours.`)
      if (Notification.permission === 'granted') {
        new Notification("UVibe Alert", { body: `Time to reapply your sunscreen!`, icon: "/favicon.ico" })
      }
    }
  }, 1000)
}

function stopReminder() {
  isTimerRunning.value = false
  if (timerInterval) clearInterval(timerInterval)
}

const formattedTime = computed(() => {
  const h = Math.floor(timeLeft.value / 3600)
  const m = Math.floor((timeLeft.value % 3600) / 60)
  const s = timeLeft.value % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <AppHeader :location="locationName" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center py-6 px-4 pb-24 overflow-y-auto">
      <h1 class="text-2xl font-bold mb-6 tracking-wide">Protection Plan</h1>

      <div v-if="geoLoading || isLoading" class="text-gray-400 flex flex-col items-center gap-2 mb-6">
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
        
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-300">Plan Ahead (Manual UV)</h2>
            <button 
              @click="isManualUV = !isManualUV"
              class="text-xs px-3 py-1 rounded-full font-bold transition-colors"
              :class="isManualUV ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'"
            >
              {{ isManualUV ? 'ON' : 'OFF' }}
            </button>
          </div>
          
          <div v-if="isManualUV" class="flex flex-col gap-2">
            <input 
              type="range" min="0" max="11" step="1" 
              v-model="manualUVValue" 
              class="w-full accent-purple-500"
            />
            <div class="flex justify-between text-xs text-gray-500">
              <span>0 (Low)</span>
              <span>11+ (Extreme)</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg text-center relative overflow-hidden">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-1 text-green-300 relative z-10">
            <span class="text-xl">👕</span> Interactive What to Wear
          </h2>
          <p class="text-xs text-gray-400 mb-6 relative z-10">Tap the mannequin's clothes to learn about UPF.</p>
          
          <div class="relative w-64 h-[25rem] mx-auto mt-6 mb-2">
            
            <div class="absolute top-16 left-1/2 -translate-x-1/2 w-4 h-6 bg-[#e5b38a] z-0"></div>
            
            <div class="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-14 bg-[#fbcda1] rounded-b-[1.5rem] rounded-t-full z-10 shadow-sm">
              <div class="absolute top-6 left-[0.65rem] w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
              <div class="absolute top-6 right-[0.65rem] w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
            </div>

            <div class="absolute top-20 left-1/2 -translate-x-1/2 w-16 h-32 bg-[#fbcda1] rounded-2xl z-0"></div>
            
            <div class="absolute top-20 right-[calc(50%+2.25rem)] w-5 h-32 bg-[#fbcda1] rounded-full z-0 flex flex-col justify-end items-center pb-1 shadow-sm">
                <div class="w-3.5 h-3.5 bg-[#e5b38a] rounded-full"></div>
            </div>
            
            <div class="absolute top-20 left-[calc(50%+2.25rem)] w-5 h-32 bg-[#fbcda1] rounded-full z-0 flex flex-col justify-end items-center pb-1 shadow-sm">
                <div class="w-3.5 h-3.5 bg-[#e5b38a] rounded-full"></div>
            </div>

            <div class="absolute top-48 right-[calc(50%+0.1rem)] w-6 h-32 bg-[#e5b38a] rounded-full z-0"></div>
            <div class="absolute top-48 left-[calc(50%+0.1rem)] w-6 h-32 bg-[#e5b38a] rounded-full z-0"></div>

            <div class="absolute top-[19.5rem] right-[calc(50%+0.05rem)] w-7 h-4 bg-white rounded-t-xl rounded-b-sm z-10 border-b-2 border-gray-300"></div>
            <div class="absolute top-[19.5rem] left-[calc(50%+0.05rem)] w-7 h-4 bg-white rounded-t-xl rounded-b-sm z-10 border-b-2 border-gray-300"></div>


            <div v-if="avatarOutfit.legs" @click.stop="openClothingModal(avatarOutfit.legs)" 
                 class="absolute top-48 right-[calc(50%+0.1rem)] w-[1.6rem] transition-all duration-500 z-10 cursor-pointer hover:brightness-110 shadow-inner"
                 :class="[avatarOutfit.legs.color, avatarOutfit.legs.id === 'shorts' ? 'h-14 rounded-b-lg' : 'h-[7.5rem] rounded-b-sm']">
                 <div v-if="avatarOutfit.legs.id === 'long-pants'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
            </div>
            <div v-if="avatarOutfit.legs" @click.stop="openClothingModal(avatarOutfit.legs)" 
                 class="absolute top-48 left-[calc(50%+0.1rem)] w-[1.6rem] transition-all duration-500 z-10 cursor-pointer hover:brightness-110 shadow-inner"
                 :class="[avatarOutfit.legs.color, avatarOutfit.legs.id === 'shorts' ? 'h-14 rounded-b-lg' : 'h-[7.5rem] rounded-b-sm']">
                 <div v-if="avatarOutfit.legs.id === 'long-pants'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
            </div>

            <div v-if="avatarOutfit.torso" @click.stop="openClothingModal(avatarOutfit.torso)" 
                 class="absolute top-20 left-1/2 -translate-x-1/2 w-16 h-32 rounded-2xl z-20 cursor-pointer overflow-hidden shadow-md hover:brightness-110 transition-all duration-500"
                 :class="avatarOutfit.torso.color">
                <div v-if="avatarOutfit.torso.id === 'tshirt'" class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#e5b38a] rounded-full"></div>
                <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-black/20"></div>
                <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute bottom-3 left-1.5 w-3 h-5 border border-black/10 rounded-sm"></div>
                <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute bottom-3 right-1.5 w-3 h-5 border border-black/10 rounded-sm"></div>
            </div>
            <div v-if="avatarOutfit.torso?.id === 'jacket'" @click.stop="openClothingModal(avatarOutfit.torso)"
                 class="absolute top-[4.25rem] left-1/2 -translate-x-1/2 w-7 h-4 rounded-t-md z-10 cursor-pointer transition-all duration-500" 
                 :class="avatarOutfit.torso.color"></div>
            
            <div v-if="avatarOutfit.torso" @click.stop="openClothingModal(avatarOutfit.torso)" 
                 class="absolute top-20 right-[calc(50%+2.25rem)] w-5 rounded-t-full cursor-pointer hover:brightness-110 transition-all duration-500 z-20 shadow-sm"
                 :class="[avatarOutfit.torso.color, avatarOutfit.torso.id === 'tshirt' ? 'h-12' : 'h-[6.5rem] rounded-b-sm']">
                 <div v-if="avatarOutfit.torso.id !== 'tshirt'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
            </div>
            <div v-if="avatarOutfit.torso" @click.stop="openClothingModal(avatarOutfit.torso)" 
                 class="absolute top-20 left-[calc(50%+2.25rem)] w-5 rounded-t-full cursor-pointer hover:brightness-110 transition-all duration-500 z-20 shadow-sm"
                 :class="[avatarOutfit.torso.color, avatarOutfit.torso.id === 'tshirt' ? 'h-12' : 'h-[6.5rem] rounded-b-sm']">
                 <div v-if="avatarOutfit.torso.id !== 'tshirt'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
            </div>

            <div v-if="avatarOutfit.head" @click.stop="openClothingModal(avatarOutfit.head)" 
                 class="absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-30 flex justify-center cursor-pointer hover:scale-105"
                 :class="[avatarOutfit.head.id === 'cap' ? 'top-3 w-12 h-5 rounded-t-[1rem]' : 'top-3 w-14 h-6 rounded-t-full', avatarOutfit.head.color]">
                <div v-if="avatarOutfit.head.id === 'cap'" class="absolute bottom-0 left-6 w-8 h-1.5 bg-inherit rounded-r-full shadow-sm"></div>
                <div v-if="avatarOutfit.head.id === 'sunhat' || avatarOutfit.head.id === 'legionnaire'" class="absolute bottom-0 w-24 h-2 bg-inherit rounded-full shadow-sm"></div>
                <div v-if="avatarOutfit.head.id === 'legionnaire'" class="absolute top-4 w-16 h-12 bg-inherit rounded-b-lg -z-10 opacity-95"></div>
            </div>

            <div v-if="avatarOutfit.eyes" @click.stop="openClothingModal(avatarOutfit.eyes)" 
                 class="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-4 flex justify-between items-center z-40 cursor-pointer hover:scale-110 transition-all">
              <template v-if="avatarOutfit.eyes.id === 'wrap-shades'">
                  <div class="w-11 h-4 bg-gray-900 rounded-full shadow-md border border-gray-700 flex justify-center items-center overflow-hidden mx-auto">
                       <div class="w-8 h-1 bg-white/30 rotate-12 -translate-y-1"></div> </div>
              </template>
              <template v-else>
                  <div class="w-4 h-3 bg-gray-900 rounded-lg shadow-sm"></div>
                  <div class="w-1.5 h-0.5 bg-gray-800"></div>
                  <div class="w-4 h-3 bg-gray-900 rounded-lg shadow-sm"></div>
              </template>
            </div>

            <div v-if="avatarOutfit.accessory" @click.stop="openClothingModal(avatarOutfit.accessory)" 
                 class="absolute top-0 right-2 text-5xl cursor-pointer hover:scale-110 transition-transform z-50 drop-shadow-2xl animate-pulse">
              {{ avatarOutfit.accessory.icon }}
            </div>
          </div>

          <div class="flex flex-wrap justify-center gap-2 mt-2 relative z-20">
            <button v-for="item in Object.values(avatarOutfit).filter(Boolean)" :key="item.name"
                    @click="openClothingModal(item)"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 flex items-center gap-1.5 transition-colors shadow-sm">
              <span>{{ item.icon }}</span> {{ item.name }}
            </button>
          </div>
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