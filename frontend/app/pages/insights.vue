<script setup lang="ts">
import UVInsights from '~/components/UVInsights.vue' 

definePageMeta({ middleware: ['auth'] })

const { history, loading, error } = useUVHistory()
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">

    <AppHeader location="Melbourne, VIC" @toggle-sidebar="" />

    <main class="flex-1 flex flex-col pb-24 px-4 pt-4 gap-4">

      <!-- Loading state -->
      <div
        v-if="loading"
        class="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600"
      >
        <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span class="text-xs tracking-widest uppercase">Loading history…</span>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="flex-1 flex flex-col items-center justify-center gap-2"
      >
        <p class="text-red-400 text-sm">{{ error }}</p>
        <button
          class="text-xs text-gray-500 underline underline-offset-2"
          @click="fetchHistory"
        >
          Retry
        </button>
      </div>

      <!-- Heatmap -->
      <UVInsights v-else :data="history" />

    </main>

    <BottomNav active-tab="insights" />

  </div>
</template>