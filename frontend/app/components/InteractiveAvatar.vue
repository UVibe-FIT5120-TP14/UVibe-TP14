<script setup lang="ts">
defineProps<{
  avatarOutfit: Record<string, any>
}>()

const emit = defineEmits(['item-clicked'])
</script>

<template>
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

    <div v-if="avatarOutfit.legs" @click.stop="emit('item-clicked', avatarOutfit.legs)" 
         class="absolute top-48 right-[calc(50%+0.1rem)] w-[1.6rem] transition-all duration-500 z-10 cursor-pointer hover:brightness-110 shadow-inner"
         :class="[avatarOutfit.legs.color, avatarOutfit.legs.id === 'shorts' ? 'h-14 rounded-b-lg' : 'h-[7.5rem] rounded-b-sm']">
         <div v-if="avatarOutfit.legs.id === 'long-pants'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
    </div>
    <div v-if="avatarOutfit.legs" @click.stop="emit('item-clicked', avatarOutfit.legs)" 
         class="absolute top-48 left-[calc(50%+0.1rem)] w-[1.6rem] transition-all duration-500 z-10 cursor-pointer hover:brightness-110 shadow-inner"
         :class="[avatarOutfit.legs.color, avatarOutfit.legs.id === 'shorts' ? 'h-14 rounded-b-lg' : 'h-[7.5rem] rounded-b-sm']">
         <div v-if="avatarOutfit.legs.id === 'long-pants'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
    </div>

    <div v-if="avatarOutfit.torso" @click.stop="emit('item-clicked', avatarOutfit.torso)" 
         class="absolute top-20 left-1/2 -translate-x-1/2 w-16 h-32 rounded-2xl z-20 cursor-pointer overflow-hidden shadow-md hover:brightness-110 transition-all duration-500"
         :class="avatarOutfit.torso.color">
        <div v-if="avatarOutfit.torso.id === 'tshirt'" class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-5 bg-[#e5b38a] rounded-full"></div>
        <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-black/20"></div>
        <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute bottom-3 left-1.5 w-3 h-5 border border-black/10 rounded-sm"></div>
        <div v-if="avatarOutfit.torso.id === 'jacket'" class="absolute bottom-3 right-1.5 w-3 h-5 border border-black/10 rounded-sm"></div>
    </div>
    <div v-if="avatarOutfit.torso?.id === 'jacket'" @click.stop="emit('item-clicked', avatarOutfit.torso)"
         class="absolute top-[4.25rem] left-1/2 -translate-x-1/2 w-7 h-4 rounded-t-md z-10 cursor-pointer transition-all duration-500" 
         :class="avatarOutfit.torso.color"></div>
    
    <div v-if="avatarOutfit.torso" @click.stop="emit('item-clicked', avatarOutfit.torso)" 
         class="absolute top-20 right-[calc(50%+2.25rem)] w-5 rounded-t-full cursor-pointer hover:brightness-110 transition-all duration-500 z-20 shadow-sm"
         :class="[avatarOutfit.torso.color, avatarOutfit.torso.id === 'tshirt' ? 'h-12' : 'h-[6.5rem] rounded-b-sm']">
         <div v-if="avatarOutfit.torso.id !== 'tshirt'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
    </div>
    <div v-if="avatarOutfit.torso" @click.stop="emit('item-clicked', avatarOutfit.torso)" 
         class="absolute top-20 left-[calc(50%+2.25rem)] w-5 rounded-t-full cursor-pointer hover:brightness-110 transition-all duration-500 z-20 shadow-sm"
         :class="[avatarOutfit.torso.color, avatarOutfit.torso.id === 'tshirt' ? 'h-12' : 'h-[6.5rem] rounded-b-sm']">
         <div v-if="avatarOutfit.torso.id !== 'tshirt'" class="absolute bottom-0 w-full h-1.5 bg-black/10"></div>
    </div>

    <div v-if="avatarOutfit.head" @click.stop="emit('item-clicked', avatarOutfit.head)" 
         class="absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-30 flex justify-center cursor-pointer hover:scale-105"
         :class="[avatarOutfit.head.id === 'cap' ? 'top-3 w-12 h-5 rounded-t-[1rem]' : 'top-3 w-14 h-6 rounded-t-full', avatarOutfit.head.color]">
        <div v-if="avatarOutfit.head.id === 'cap'" class="absolute bottom-0 left-6 w-8 h-1.5 bg-inherit rounded-r-full shadow-sm"></div>
        <div v-if="avatarOutfit.head.id === 'sunhat' || avatarOutfit.head.id === 'legionnaire'" class="absolute bottom-0 w-24 h-2 bg-inherit rounded-full shadow-sm"></div>
        <div v-if="avatarOutfit.head.id === 'legionnaire'" class="absolute top-4 w-16 h-12 bg-inherit rounded-b-lg -z-10 opacity-95"></div>
    </div>

    <div v-if="avatarOutfit.eyes" @click.stop="emit('item-clicked', avatarOutfit.eyes)" 
         class="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-4 flex justify-between items-center z-40 cursor-pointer hover:scale-110 transition-all">
      <template v-if="avatarOutfit.eyes.id === 'wrap-shades'">
          <div class="w-11 h-4 bg-gray-900 rounded-full shadow-md border border-gray-700 flex justify-center items-center overflow-hidden mx-auto">
               <div class="w-8 h-1 bg-white/30 rotate-12 -translate-y-1"></div> 
          </div>
      </template>
      <template v-else>
          <div class="w-4 h-3 bg-gray-900 rounded-lg shadow-sm"></div>
          <div class="w-1.5 h-0.5 bg-gray-800"></div>
          <div class="w-4 h-3 bg-gray-900 rounded-lg shadow-sm"></div>
      </template>
    </div>

    <div v-if="avatarOutfit.accessory" @click.stop="emit('item-clicked', avatarOutfit.accessory)" 
         class="absolute top-0 right-2 text-5xl cursor-pointer hover:scale-110 transition-transform z-50 drop-shadow-2xl animate-pulse">
      {{ avatarOutfit.accessory.icon }}
    </div>
  </div>

  <div class="flex flex-wrap justify-center gap-2 mt-2 relative z-20">
    <button v-for="item in Object.values(avatarOutfit).filter(Boolean)" :key="item.name"
            @click="emit('item-clicked', item)"
            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 flex items-center gap-1.5 transition-colors shadow-sm">
      <span>{{ item.icon }}</span> {{ item.name }}
    </button>
  </div>
</template>