<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const config = useRuntimeConfig()
const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true

  try {
    const data = await $fetch<{ access_token: string; token_type: string }>(
      `${config.public.apiBase}/api/auth/login`,
      {
        method: 'POST',
        timeout: 15000,
        body: { email: email.value, password: password.value },
      }
    )
    auth.setToken(data.access_token)
    router.push('/')
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 401) {
      errorMsg.value = 'Invalid email or password. Please try again.'
    } else {
      errorMsg.value = 'Something went wrong. Please try again later.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1>Sign in</h1>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="test@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading">
          <span v-if="loading">Signing in…</span>
          <span v-else>Sign in</span>
        </button>
      </form>

      <p class="footer-link">
        Don't have an account?
        <NuxtLink to="/register">Create account</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 380px;
}

h1 {
  margin: 0 0 1.5rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: #111;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #444;
}

input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

input:focus {
  border-color: #6366f1;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

button {
  width: 100%;
  padding: 0.7rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

button:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background: #4f46e5;
}

.footer-link {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: #666;
}

.footer-link a {
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
}

.footer-link a:hover {
  text-decoration: underline;
}
</style>
