<script setup lang="ts">
defineProps<{
  activeTab?: 'insights' | 'home' | 'protect'
}>()
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 border-t flex items-center justify-around py-2 z-30"
    style="background-color: #FFF8F3; border-color: rgba(26,26,46,0.1);"
  >

    <!-- Insights -->
    <NuxtLink
      to="/insights"
      class="flex flex-col items-center gap-1 px-6 py-2 transition-colors"
      :style="{ color: activeTab === 'insights' ? '#FF6B2B' : '#9CA3AF' }"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
      </svg>
      <span class="text-[10px] tracking-wide">Insights</span>
    </NuxtLink>

    <!-- Home -->
    <NuxtLink
      to="/home"
      class="flex flex-col items-center gap-1 px-6 py-2 transition-colors"
      :style="{ color: activeTab === 'home' ? '#FF6B2B' : '#9CA3AF' }"
    >
      <div
        class="flex flex-col items-center gap-1 p-2 rounded-full transition-colors"
        :style="activeTab === 'home' ? 'background-color: rgba(255,107,43,0.1);' : ''"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
        </svg>
      </div>
      <span class="text-[10px] tracking-wide">Home</span>
    </NuxtLink>

    <!-- Protect -->
    <NuxtLink
      to="/protect"
      class="flex flex-col items-center gap-1 px-6 py-2 transition-colors"
      :style="{ color: activeTab === 'protect' ? '#FF6B2B' : '#9CA3AF' }"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
      </svg>
      <span class="text-[10px] tracking-wide">Protect</span>
    </NuxtLink>

  </nav>
</template>
