<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const auth = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()
const deleting = ref(false)

function logout() {
  auth.logout()
  router.push('/login')
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/api/user/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    auth.logout()
    router.push('/login')
  } catch {
    alert('Failed to delete account. Please try again.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-40 backdrop-blur-sm"
        style="background-color: rgba(26,26,46,0.4);"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed top-0 right-0 h-full w-64 border-l z-50 flex flex-col"
        style="background-color: #FFF8F3; border-color: rgba(26,26,46,0.1); color: #1A1A2E;"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b" style="border-color: rgba(26,26,46,0.1);">
          <span class="font-black tracking-widest text-lg" style="color: #1A1A2E;">UVibe</span>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style="color: #9CA3AF;"
            @click="$emit('close')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Nav links -->
        <nav class="flex flex-col flex-1 px-5 py-6 gap-2">
          <NuxtLink
            to="/about"
            class="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
            style="color: #6B7280;"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
            </svg>
            About
          </NuxtLink>

          <button
            class="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full text-red-500"
            :disabled="deleting"
            @click="deleteAccount"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
            </svg>
            {{ deleting ? 'Deleting…' : 'Delete Account' }}
          </button>
        </nav>

        <!-- Logout at bottom -->
        <div class="px-5 py-6 border-t" style="border-color: rgba(26,26,46,0.1);">
          <button
            class="flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors"
            style="color: #9CA3AF;"
            @click="logout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
