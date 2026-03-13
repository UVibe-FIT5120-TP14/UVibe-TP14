import { useAuthStore } from '~/stores/auth'

// Returned by GET /api/cancer/state
// Backend aggregates: SELECT state, year, SUM(count) as count
//   FROM state_cancer_incidents GROUP BY state, year
export interface StateCancerRecord {
    state: string  // 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'
    year: number   // 1982–2019
    count: number  // both cancer types + both sexes combined
}

export function useCancerData() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    const stateCancer = ref<StateCancerRecord[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchStateCancer() {
        loading.value = true
        error.value = null
        try {
            stateCancer.value = await $fetch<StateCancerRecord[]>(
                `${config.public.apiBase}/api/cancer/state`,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            )
        } catch {
            error.value = 'Could not load cancer data'
        } finally {
            loading.value = false
        }
    }

    onMounted(() => fetchStateCancer())

    return { stateCancer, loading, error }
}