import { useAuthStore } from '~/stores/auth'

export interface UVHistoryResponse {
    region: string
    year: number
    month: number
    uv_index: number
}

export function useUVHistory() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    const history = ref<UVHistoryResponse[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchHistory() {
        loading.value = true
        error.value = null
        try {
            history.value = await $fetch<UVHistoryResponse[]>(
                `${config.public.apiBase}/api/uv/history`,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            )
        } catch {
            error.value = 'Could not load UV history'
        } finally {
            loading.value = false
        }
    }

    onMounted(() => fetchHistory())

    return { history, loading, error }
}