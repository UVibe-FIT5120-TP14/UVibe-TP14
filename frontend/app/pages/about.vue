<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const auth = useAuthStore()

interface UserProfile {
  id: number
  name: string | null
  email: string
  skin_color?: string | null
}

const { data: profile, error, pending: loading } = await useAsyncData<UserProfile>(
  'about-profile',
  () =>
    $fetch(`${config.public.apiBase}/api/user/profile`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
)

const displayName = computed(() => profile.value?.name || profile.value?.email?.split('@')[0] || 'User')
const initial = computed(() => (displayName.value?.trim()?.[0] || 'U').toUpperCase())

function onEditProfile() {
  // Placeholder: hook up edit page/API later
  alert('Profile editing coming soon')
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <AppHeader location="About" />

    <main class="flex-1 flex items-start justify-center pb-24 px-4">
      <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <!-- Left: Avatar + Name/Email -->
        <section class="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full border border-white/10 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-3xl font-bold">
            {{ initial }}
          </div>
          <h2 class="mt-4 text-xl font-semibold truncate max-w-[14rem]">{{ displayName }}</h2>
          <p class="mt-1 text-gray-400 text-sm break-all">{{ profile?.email }}</p>
        </section>

        <!-- Right: Basic Info -->
        <section class="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Basic Info</h3>
            <button class="px-3 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/15 border border-white/10" @click="onEditProfile">Edit Profile</button>
          </div>

          <div v-if="loading" class="animate-pulse space-y-3">
            <div class="h-9 bg-white/10 rounded" />
            <div class="h-9 bg-white/10 rounded" />
            <div class="h-9 bg-white/10 rounded" />
          </div>

          <div v-else-if="error" class="text-red-400 text-sm">Failed to load. Please log in again.</div>

          <div v-else class="divide-y divide-white/10">
            <div class="flex items-center justify-between py-3">
              <span class="text-gray-400 text-sm">Skin tone</span>
              <span class="text-white text-sm">{{ profile?.skin_color || 'Not set' }}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-gray-400 text-sm">Gender</span>
              <span class="text-white text-sm">{{ profile?.gender || 'Not set' }}</span>
            </div>
            <!-- Add more fields later: birthday, gender, SPF preferences, etc. -->
          </div>
        </section>
      </div>
    </main>

    <BottomNav active-tab="home" />
  </div>
</template>