export function useGeolocation() {
  const lat = ref<number | null>(null)
  const lon = ref<number | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function requestLocation() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser'
      return
    }
    loading.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lat.value = pos.coords.latitude
        lon.value = pos.coords.longitude
        loading.value = false
      },
      () => {
        error.value = 'Location access denied'
        loading.value = false
      }
    )
  }

  return { lat, lon, error, loading, requestLocation }
}
