<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const config = useRuntimeConfig()
const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleRegister() {
  errorMsg.value = ''
  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const data = await $fetch<{ access_token: string; token_type: string }>(
      `${config.public.apiBase}/api/auth/register`,
      {
        method: 'POST',
        timeout: 15000,
        body: {
          name: name.value,
          email: email.value,
          password: password.value,
          confirm_password: confirmPassword.value,
        },
      }
    )
    auth.setToken(data.access_token)
    router.push('/')
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status
    const detail = err?.data?.detail
    if (detail === 'An account with this email already exists') {
      errorMsg.value = 'An account with this email already exists.'
    } else if (status === 422) {
      // Pydantic validation error — detail is an array of field errors
      const first = Array.isArray(detail) ? detail[0] : null
      if (first?.loc?.includes('email')) {
        errorMsg.value = 'Please enter a valid email address (e.g. name@example.com).'
      } else if (first?.loc?.includes('password')) {
        errorMsg.value = 'Password must be at least 8 characters.'
      } else {
        errorMsg.value = 'Please check your details and try again.'
      }
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
      <h1>Create account</h1>

      <form @submit.prevent="handleRegister">
        <div class="field">
          <label for="name">Full name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Jane Smith"
            autocomplete="name"
            required
          />
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="jane@example.com"
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
            autocomplete="new-password"
            required
          />
        </div>

        <div class="field">
          <label for="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading">
          <span v-if="loading">Creating account…</span>
          <span v-else>Create account</span>
        </button>
      </form>

      <p class="footer-link">
        Already have an account?
        <NuxtLink to="/login">Sign in</NuxtLink>
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
