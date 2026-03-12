<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const auth = useAuthStore()

// State management for UV
const fetchedUVIndex = ref<number | null>(null)
const isLoading = ref(true)

// AC4: Manual UV Input for planning ahead
const isManualUV = ref(false)
const manualUVValue = ref(5)

// Compute the effective UV Index based on whether the user is using live data or manual input
const effectiveUVIndex = computed(() => {
  if (isManualUV.value) return manualUVValue.value
  return fetchedUVIndex.value ?? 0
})

// AC2: Customizable Reminder Interval
const isTimerRunning = ref(false)
const selectedIntervalHours = ref(2) // Default to 2 hours
const timeLeft = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

// AC3: Clothing Modal State
const selectedClothingItem = ref<{ name: string, description: string } | null>(null)

async function fetchCurrentUV() {
  try {
    const lat = -37.8136 
    const lon = 144.9631 
    const data = await $fetch<any>(`${config.public.apiBase}/api/uv?lat=${lat}&lon=${lon}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    fetchedUVIndex.value = data.uv_index
  } catch (error) {
    console.error('Failed to fetch UV data:', error)
    fetchedUVIndex.value = 6.5 
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCurrentUV()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// AC3: Clothing Recommendations with description for the modal
const clothingRecommendations = computed(() => {
  const uv = effectiveUVIndex.value
  const recommendations = []

  if (uv < 3) {
    recommendations.push({ name: 'Comfortable casual wear', description: 'No special UPF clothing required for low UV. Standard cotton is fine.' })
  } else if (uv < 6) {
    recommendations.push({ name: 'Broad-brimmed Hat', description: 'A hat with at least a 7.5cm brim provides excellent protection for the face, neck, and ears.' })
    recommendations.push({ name: 'UV-blocking Sunglasses', description: 'Look for glasses labeled EPF 10 or "100% UV protection" to protect your eyes from cataracts.' })
    recommendations.push({ name: 'T-shirt covering shoulders', description: 'Standard T-shirts have a UPF of around 15. Ensure shoulders are covered as they burn easily.' })
  } else {
    recommendations.push({ name: 'Broad-brimmed Hat', description: 'A hat with at least a 7.5cm brim provides excellent protection for the face, neck, and ears.' })
    recommendations.push({ name: 'Wrap-around Sunglasses', description: 'Wrap-around styles prevent UV rays from entering from the sides.' })
    recommendations.push({ name: 'UPF 50+ Long sleeves & pants', description: 'UPF 50+ fabric blocks 98% of UV rays. Look for tightly woven, dark, or synthetic fabrics like polyester or nylon.' })
  }
  return recommendations
})

function openClothingModal(item: { name: string, description: string }) {
  selectedClothingItem.value = item
}

function closeClothingModal() {
  selectedClothingItem.value = null
}

// AC2: Timer logic updated to use selected interval
function startReminder() {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  timeLeft.value = selectedIntervalHours.value * 60 * 60 // Convert hours to seconds

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopReminder()
      triggerNotification()
    }
  }, 1000)
}

function stopReminder() {
  isTimerRunning.value = false
  if (timerInterval) clearInterval(timerInterval)
}

function triggerNotification() {
  alert(`Time to reapply your sunscreen! It's been ${selectedIntervalHours.value} hours.`)
  if (Notification.permission === 'granted') {
    new Notification("UVibe Alert", {
      body: `It's been ${selectedIntervalHours.value} hours! Time to reapply your sunscreen.`,
      icon: "/favicon.ico"
    })
  }
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
    <AppHeader location="Melbourne, VIC" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center py-6 px-4 pb-24 overflow-y-auto">
      <h1 class="text-2xl font-bold mb-6 tracking-wide">Protection Plan</h1>

      <div v-if="isLoading" class="text-gray-400">Analyzing current UV conditions...</div>

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

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center shadow-lg">
          <p class="text-sm text-gray-400 uppercase tracking-widest mb-1">
            {{ isManualUV ? 'Planned UV Index' : 'Current UV Index' }}
          </p>
          <p class="text-5xl font-black text-purple-400">{{ effectiveUVIndex }}</p>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col items-center text-center">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-2 text-blue-300">
            <span class="text-xl">🧴</span> Sunscreen Dosage
          </h2>
          <p class="text-gray-400 text-sm mb-4">Calculate exact sunscreen pumps/teaspoons based on your outfit.</p>
          <NuxtLink 
            to="/sunscreen-dosage" 
            class="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full transition-colors w-full"
          >
            Calculate Dosage
          </NuxtLink>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <h2 class="text-lg font-semibold flex items-center gap-2 mb-3 text-green-300">
            <span class="text-xl">👕</span> What to Wear
          </h2>
          <p class="text-xs text-gray-400 mb-3">Tap an item to learn about UPF protection.</p>
          <ul class="space-y-2">
            <li 
              v-for="(item, index) in clothingRecommendations" 
              :key="index"
              @click="openClothingModal(item)"
              class="flex items-center gap-3 text-sm text-gray-300 bg-black/50 p-3 rounded-lg border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <div class="w-2 h-2 rounded-full bg-green-400"></div>
              {{ item.name }}
            </li>
          </ul>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg text-center">
          <h2 class="text-lg font-semibold flex items-center justify-center gap-2 mb-2 text-yellow-300">
            <span class="text-xl">⏱️</span> Reapplication Tracker
          </h2>
          
          <div v-if="!isTimerRunning" class="mb-4">
            <label class="text-xs text-gray-400 block mb-2">Set Reminder Interval:</label>
            <select v-model="selectedIntervalHours" class="bg-black border border-gray-700 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5">
              <option :value="2">Every 2 Hours (Standard)</option>
              <option :value="3">Every 3 Hours</option>
              <option :value="4">Every 4 Hours</option>
            </select>
          </div>
          
          <div v-if="isTimerRunning" class="text-4xl font-mono font-light mb-6 tracking-wider">
            {{ formattedTime }}
          </div>

          <div class="flex gap-4 justify-center mt-2">
            <button 
              v-if="!isTimerRunning" 
              @click="startReminder"
              class="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-full transition-colors w-full"
            >
              Start Tracker
            </button>
            <button 
              v-else 
              @click="stopReminder"
              class="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-full border border-red-500/50 transition-colors w-full"
            >
              Stop Tracker
            </button>
          </div>
        </div>

      </div>
    </main>

    <div v-if="selectedClothingItem" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <h3 class="text-xl font-bold text-green-300 mb-2">{{ selectedClothingItem.name }}</h3>
        <p class="text-gray-300 text-sm leading-relaxed mb-6">{{ selectedClothingItem.description }}</p>
        <button 
          @click="closeClothingModal" 
          class="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-semibold transition-colors"
        >
          Got it
        </button>
      </div>
    </div>

    <BottomNav active-tab="protect" />
  </div>
</template>