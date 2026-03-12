<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  layout: false,
})

const config = useRuntimeConfig()
const auth = useAuthStore()
const router = useRouter()

interface UserProfile {
  id: number
  email: string
}

const { data: profile, error } = await useAsyncData<UserProfile>('profile', () =>
  $fetch(`${config.public.apiBase}/api/user/profile`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
)

function logout() {
  auth.clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-card">
      <div class="header">
        <h1>Dashboard</h1>
        <button class="logout-btn" @click="logout">Log out</button>
      </div>

      <div v-if="error" class="error">
        Failed to load profile. Please log in again.
      </div>

      <div v-else-if="profile" class="profile">
        <p>Welcome back!</p>
        <p class="email">{{ profile.email }}</p>
        <p class="meta">User ID: {{ profile.id }}</p>
      </div>

      <div v-else class="loading">Loading…</div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.dashboard-card {
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #111;
}

.logout-btn {
  padding: 0.4rem 0.9rem;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.logout-btn:hover {
  background: #f9fafb;
}

.profile p {
  margin: 0.3rem 0;
  color: #444;
}

.profile .email {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
}

.profile .meta {
  font-size: 0.85rem;
  color: #9ca3af;
}

.error {
  color: #dc2626;
}

.loading {
  color: #9ca3af;
}
</style>
