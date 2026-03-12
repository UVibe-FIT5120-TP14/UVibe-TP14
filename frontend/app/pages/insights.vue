<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <AppHeader location="Melbourne, VIC" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center justify-center gap-4 pb-24 px-4">
      <!-- TODO: UV insights / charts -->
      <button class="w-full max-w-xs py-4 rounded-xl bg-gray-800 text-white font-semibold">
        Button 1
      </button>
      <button class="w-full max-w-xs py-4 rounded-xl bg-gray-800 text-white font-semibold">
        Button 2
      </button>
    </main>

    <BottomNav active-tab="insights" />
  </div>
</template>
