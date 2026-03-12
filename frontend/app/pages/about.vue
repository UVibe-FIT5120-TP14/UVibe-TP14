<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <AppHeader location="Melbourne, VIC" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col items-center justify-center pb-24 px-4">
      <!-- TODO: About content -->
      <p class="text-gray-600 text-sm">About coming soon</p>
    </main>

    <BottomNav active-tab="home" />
  </div>
</template>
