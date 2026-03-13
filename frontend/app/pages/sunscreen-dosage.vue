<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ middleware: ['auth'] })

// Highly diversified clothing options corresponding to AC1
const hatOptions = [
  'Wide-brim hat', 
  'Baseball cap', 
  'Sun visor', 
  'No hat'
]

const shirtOptions = [
  'Long-sleeved UPF shirt', 
  'Standard Long-sleeved shirt', 
  'T-shirt', 
  'Polo shirt', 
  'Tank-top', 
  'Crop top', 
  'One-piece swimsuit', 
  'Bikini top', 
  'No shirt'
]

const bottomOptions = [
  'Long pants', 
  'Cropped pants (Capris)', 
  'Knee-length shorts', 
  'Short shorts', 
  'Board shorts', 
  'Speedo / Swim briefs', 
  'Bikini bottom'
]

// User selections (Defaults set to a common summer outfit)
const selectedHat = ref(hatOptions[1])
const selectedShirt = ref(shirtOptions[2])
const selectedBottom = ref(bottomOptions[3])

// Standard measurements: 1 teaspoon (5ml) per body part
// Total body = 7 teaspoons (Face/Neck, Left Arm, Right Arm, Front Torso, Back Torso, Left Leg, Right Leg)
const calculatedDosage = computed(() => {
  let teaspoons = 0;

  // Face and Neck (Max 1 tsp)
  if (selectedHat.value === 'No hat' || selectedHat.value === 'Sun visor') {
    teaspoons += 1; // Visor leaves scalp and neck exposed
  } else if (selectedHat.value === 'Baseball cap') {
    teaspoons += 0.8; // Protects forehead/nose, but leaves neck and ears exposed
  } else if (selectedHat.value === 'Wide-brim hat') {
    teaspoons += 0.5; // Protects most, but still need some for lower face/neck reflection
  }

  // Arms & Torso (Max 4 tsp total: Left Arm, Right Arm, Front, Back)
  if (selectedShirt.value === 'No shirt' || selectedShirt.value === 'Bikini top') {
    teaspoons += 4; // Fully exposed torso and arms
  } else if (selectedShirt.value === 'Crop top') {
    teaspoons += 3.5; // Arms and lower torso exposed
  } else if (selectedShirt.value === 'Tank-top') {
    teaspoons += 3; // Shoulders, arms, and neck exposed
  } else if (selectedShirt.value === 'One-piece swimsuit') {
    teaspoons += 2.5; // Arms and upper chest/back exposed
  } else if (selectedShirt.value === 'T-shirt' || selectedShirt.value === 'Polo shirt') {
    teaspoons += 1.5; // Forearms and neck exposed
  } else if (selectedShirt.value === 'Standard Long-sleeved shirt' || selectedShirt.value === 'Long-sleeved UPF shirt') {
    teaspoons += 0.5; // Only hands and neck exposed
  }

  // Legs (Max 2 tsp total: Left Leg, Right Leg)
  if (selectedBottom.value === 'Speedo / Swim briefs' || selectedBottom.value === 'Bikini bottom') {
    teaspoons += 2; // Fully exposed legs
  } else if (selectedBottom.value === 'Short shorts') {
    teaspoons += 1.5; // Thighs and lower legs exposed
  } else if (selectedBottom.value === 'Board shorts') {
    teaspoons += 1.2; // Knees down exposed
  } else if (selectedBottom.value === 'Knee-length shorts') {
    teaspoons += 1; // Calves and feet exposed
  } else if (selectedBottom.value === 'Cropped pants (Capris)') {
    teaspoons += 0.5; // Ankles and feet exposed
  } else if (selectedBottom.value === 'Long pants') {
    teaspoons += 0; // Fully covered
  }

  return teaspoons;
})
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <header class="flex items-center p-4 border-b border-gray-800 bg-black sticky top-0 z-10">
      <NuxtLink to="/protect" class="text-gray-400 hover:text-white mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold">Calculate Dosage</h1>
    </header>

    <main class="flex-1 flex flex-col items-center py-6 px-4 pb-24 overflow-y-auto">
      <div class="w-full max-w-md flex flex-col gap-6">
        
        <p class="text-sm text-gray-400">
          Select what you are currently wearing. We will calculate the exact amount of sunscreen needed for your exposed skin.
        </p>

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg space-y-5">
          
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Headwear</label>
            <select v-model="selectedHat" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-3 outline-none focus:border-blue-500">
              <option v-for="opt in hatOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Tops</label>
            <select v-model="selectedShirt" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-3 outline-none focus:border-blue-500">
              <option v-for="opt in shirtOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Bottoms</label>
            <select v-model="selectedBottom" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-3 outline-none focus:border-blue-500">
              <option v-for="opt in bottomOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>

        <div class="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 text-center shadow-lg mt-2">
          <h2 class="text-sm text-blue-300 uppercase tracking-widest mb-2">Required Dosage</h2>
          <div class="text-5xl font-black text-white mb-2">
            {{ calculatedDosage.toFixed(1) }} <span class="text-2xl font-normal text-gray-400">tsp</span>
          </div>
          <p class="text-sm text-gray-400 mt-3">
            <strong>Approx. {{ (calculatedDosage * 5).toFixed(1) }} ml.</strong><br>
            Apply thoroughly to all exposed areas at least 20 minutes before going outside.
          </p>
        </div>

      </div>
    </main>
  </div>
</template>