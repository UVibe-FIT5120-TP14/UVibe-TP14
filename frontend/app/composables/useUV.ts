import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'





export function useUV() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const fetchedUVIndex = ref<number | null>(null)
  const locationName = ref<string>('Locating...')
  const isLoading = ref(false)
  const uvError = ref<string | null>(null)

  async function fetchCurrentUV(lat: number, lon: number) {
    isLoading.value = true
    uvError.value = null






    try {
      const data = await $fetch<any>(
        `${config.public.apiBase}/api/uv?lat=${lat}&lon=${lon}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      fetchedUVIndex.value = Math.round(data.uv_index)
      locationName.value = data.location_name
    } catch (error) {
      console.error('Failed to fetch UV data:', error)
      uvError.value = 'Could not fetch UV data'
      locationName.value = 'Unavailable'
    } finally {
      isLoading.value = false
    }
  }




  
  return {
    fetchedUVIndex,
    locationName,
    isLoading,
    uvError,
    fetchCurrentUV
  }
}