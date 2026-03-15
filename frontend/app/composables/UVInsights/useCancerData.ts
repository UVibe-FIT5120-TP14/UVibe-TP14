import { computed } from 'vue'
import type { Ref } from 'vue'
import type { UVHistoryResponse, StateCancerRecord } from '~/types/uvInsights'
import { NAME_TO_CODE, STATE_POP } from '~/utils/uvInsights'

export function useCancerData(
    allUV: Ref<UVHistoryResponse[]>,
    allCancer: Ref<StateCancerRecord[]>,
    currentYear: Ref<number>,
    currentMonth: Ref<number>,
) {
    // Build { year → { stateCode → totalCount } }
    const cancerLookup = computed(() => {
        const map: Record<number, Record<string, number>> = {}
        allCancer.value.forEach(d => {
            if (!map[d.year]) map[d.year] = {}
            // Normalise: "New South Wales" → "NSW", already-coded values pass through
            const stateKey = NAME_TO_CODE[d.state] ?? d.state
            map[d.year][stateKey] = (map[d.year][stateKey] ?? 0) + (d.count ?? 0)
        })
        return map
    })

    // Build { stateCode → uv_index } for the exact month/year on the slider
    const currentUV = computed(() => {
        const yr = currentYear.value
        const mo = currentMonth.value
        const lookup: Record<string, number> = {}
        allUV.value.forEach(d => {
            if (d.year === yr && d.month === mo) lookup[d.region] = d.uv_index
        })
        return lookup
    })

    const currentStateCancer = computed(() => cancerLookup.value[currentYear.value] ?? {})
    const latestStateCancer = computed(() => cancerLookup.value[2019] ?? {})
    // Alias so downstream code doesn't need to import currentYear directly
    const currentCancerYear = currentYear

    // Per-capita rate for a given state in the currently-selected year
    function getCancerRate(stateId: string): number | null {
        const count = currentStateCancer.value[stateId]
        const pop = STATE_POP[stateId]
        if (count === undefined || !pop) return null
        return (count / pop) * 100_000
    }

    // Max rate across all states — used to normalise bubble radii
    const currentMaxCancerCount = computed(() => {
        let max = 0
        Object.keys(STATE_POP).forEach(id => {
            const rate = getCancerRate(id)
            if (rate !== null && rate > max) max = rate
        })
        return max || 1
    })

    // Bubble radius: base 6px + up to 50px scaled by rate
    function cancerBubbleR(id: string): number {
        const rate = getCancerRate(id)
        if (!rate) return 0
        const ratio = rate / currentMaxCancerCount.value
        return 6 + Math.pow(ratio, 1.1) * 50
    }

    return {
        cancerLookup,
        currentUV,
        currentStateCancer,
        latestStateCancer,
        currentCancerYear,
        getCancerRate,
        currentMaxCancerCount,
        cancerBubbleR,
    }
}