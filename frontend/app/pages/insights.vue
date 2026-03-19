<script setup lang="ts">
import UVInsights from '~/components/UVInsights/UVInsights.vue'

definePageMeta({ middleware: ['auth'] })

const { history, loading: uvLoading, error: uvError } = useUVHistory()
const { stateCancer, loading: cancerLoading, error: cancerError } = useStateCancerData()
const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #FFF8F3; color: #1A1A2E;">

    <AppHeader location="Melbourne, VIC" @toggle-sidebar="sidebarOpen = true" />

    <main class="flex-1 flex flex-col pb-24 px-4 pt-4 gap-4">

      <!-- Loading (UV is primary data) -->
      <div v-if="uvLoading" class="flex-1 flex flex-col items-center justify-center gap-3" style="color: #9CA3AF;">
        <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span class="text-xs tracking-widest uppercase">Loading history…</span>
      </div>

      <!-- Error -->
      <div v-else-if="uvError" class="flex-1 flex flex-col items-center justify-center gap-2">
        <p class="text-red-500 text-sm">{{ uvError }}</p>
      </div>

      <!-- Insights — cancer data streams in reactively when the fetch completes -->
      <UVInsights v-else :data="history" :cancer-data="stateCancer"/>

    </main>

    <BottomNav active-tab="insights" />
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

  </div>
</template>