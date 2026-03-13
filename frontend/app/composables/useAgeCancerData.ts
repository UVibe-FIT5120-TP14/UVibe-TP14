import { useAuthStore } from '~/stores/auth'

export interface AgeCancerRecord {
    year: number       // 2016–2019
    age_group: string  // "00-04" | "05-09" | … | "90+"
    count: number      // both cancer types, both sexes combined
}

export function useAgeCancerData() {
    const config = useRuntimeConfig()
    const auth = useAuthStore()

    const ageCancer = ref<AgeCancerRecord[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetch() {
        loading.value = true
        error.value = null
        try {
            ageCancer.value = await $fetch<AgeCancerRecord[]>(
                `${config.public.apiBase}/api/cancer/age`,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            )
        } catch {
            error.value = 'Could not load age cancer data'
        } finally {
            loading.value = false
        }
    }

    onMounted(() => fetch())

    return { ageCancer, loading, error }
}