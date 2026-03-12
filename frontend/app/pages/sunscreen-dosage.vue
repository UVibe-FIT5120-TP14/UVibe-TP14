<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ middleware: ['auth'] })

// Clothing options corresponding to AC1
const hatOptions = ['Wide-Brim hat', 'No hat']
const shirtOptions = ['T-shirt', 'Long sleeved shirt', 'Tank-top', 'Bathing Suit', 'Bikini top', 'No shirt']
const bottomOptions = ['Long pants', 'Board Shorts', 'Short Shorts', 'Budgie Smugglers', 'Bikini Bottom']

// User selections
const selectedHat = ref(hatOptions[1])
const selectedShirt = ref(shirtOptions[0])
const selectedBottom = ref(bottomOptions[2])

// Standard measurements: 1 teaspoon (5ml) per body part
// Total body = 7 teaspoons (Face/Neck, Left Arm, Right Arm, Front Torso, Back Torso, Left Leg, Right Leg)
const calculatedDosage = computed(() => {
  let teaspoons = 0;

  // Face and Neck (1 tsp)
  if (selectedHat.value === 'No hat') {
    teaspoons += 1;
  } else {
    // Wide-brim hat covers most of face/neck, maybe need 0.5 for lower face
    teaspoons += 0.5; 
  }

  // Arms & Torso (4 tsp total: LArm, RArm, Front, Back)
  if (selectedShirt.value === 'No shirt' || selectedShirt.value === 'Bathing Suit' || selectedShirt.value === 'Bikini top') {
    teaspoons += 4; // Need to cover everything
  } else if (selectedShirt.value === 'Tank-top') {
    teaspoons += 3; // Covers some torso, arms fully exposed
  } else if (selectedShirt.value === 'T-shirt') {
    teaspoons += 1.5; // Forearms and some neck exposed
  } else if (selectedShirt.value === 'Long sleeved shirt') {
    teaspoons += 0; // Fully covered
  }

  // Legs (2 tsp total: LLeg, RLeg)
  if (selectedBottom.value === 'Budgie Smugglers' || selectedBottom.value === 'Bikini Bottom') {
    teaspoons += 2; // Fully exposed
  } else if (selectedBottom.value === 'Short Shorts') {
    teaspoons += 1.5; // Mostly exposed
  } else if (selectedBottom.value === 'Board Shorts') {
    teaspoons += 1; // Lower legs exposed
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

        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-5">
          
          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Headwear</label>
            <select v-model="selectedHat" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-2.5">
              <option v-for="opt in hatOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Tops</label>
            <select v-model="selectedShirt" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-2.5">
              <option v-for="opt in shirtOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-300 mb-2">Bottoms</label>
            <select v-model="selectedBottom" class="bg-black border border-gray-700 text-white text-sm rounded-lg w-full p-2.5">
              <option v-for="opt in bottomOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>

        <div class="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 text-center shadow-lg mt-4">
          <h2 class="text-sm text-blue-300 uppercase tracking-widest mb-2">Required Dosage</h2>
          <div class="text-5xl font-black text-white mb-2">
            {{ calculatedDosage }} <span class="text-2xl font-normal text-gray-400">tsp</span>
          </div>
          <p class="text-sm text-gray-400 mt-2">
            Approx. {{ (calculatedDosage * 5).toFixed(1) }} ml. Apply thoroughly to all exposed areas 20 minutes before going outside.
          </p>
        </div>

      </div>
    </main>
  </div>
</template>