import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { GeoFeature } from '~/types/uvInsights'
import {
    COMPARE_COLORS, STATE_POP, STATE_TAGLINES,
    TOOLTIP_W, TOOLTIP_H, OFFSET, UV_STOPS,
} from '~/utils/uvInsights'
import { useUVColors } from './useUVColors'

export function useMapInteractions(
    geoFeatures: Ref<GeoFeature[]>,
    currentUV: Ref<Record<string, number>>,
    currentStateCancer: Ref<Record<string, number>>,
    currentCancerYear: Ref<number>,
    getCancerRate: (id: string) => number | null,
) {
    const { interpColor, uvColor, uvColorA, uvLabel, rateLabel } = useUVColors()

    // ─── Mouse tracking ───────────────────────────────────────────────────────

    const hoveredId = ref<string | null>(null)
    const mouseX = ref(0)
    const mouseY = ref(0)
    const containerRef = ref<HTMLElement | null>(null)

    function onMouseMove(e: MouseEvent) {
        if (!containerRef.value) return
        const r = containerRef.value.getBoundingClientRect()
        mouseX.value = e.clientX - r.left
        mouseY.value = e.clientY - r.top
    }

    // ─── Tooltip positioning (flips to stay in-bounds) ────────────────────────

    const tooltipStyle = computed(() => {
        if (!containerRef.value) return {}
        const w = containerRef.value.offsetWidth
        const h = containerRef.value.offsetHeight
        const flipX = mouseX.value + OFFSET + TOOLTIP_W > w
        const flipY = mouseY.value + OFFSET + TOOLTIP_H > h
        return {
            left: flipX ? `${mouseX.value - TOOLTIP_W - OFFSET}px` : `${mouseX.value + OFFSET}px`,
            top: flipY ? `${mouseY.value - TOOLTIP_H - OFFSET}px` : `${mouseY.value + OFFSET}px`,
        }
    })

    // ─── Tooltip content ──────────────────────────────────────────────────────

    const hoveredInfo = computed(() => {
        if (!hoveredId.value) return null
        const feat = geoFeatures.value.find(f => f.id === hoveredId.value)
        if (!feat) return null

        const id = hoveredId.value
        const uv = currentUV.value[id]
        const rate = getCancerRate(id)
        const count = currentStateCancer.value[id]
        const population = STATE_POP[id]
        const [mr, mg, mb] = interpColor(UV_STOPS, uv ?? 0)

        return {
            id,
            name: feat.name,
            uv,
            uvLabel: uv !== undefined ? uvLabel(uv) : '—',
            uvColor: uv !== undefined ? uvColor(uv) : '#6b7280',
            uvGlow: uv !== undefined ? uvColorA(uv, 0.55) : 'rgba(107,114,128,0.4)',
            rate,
            rateLabel: rate !== null ? rateLabel(rate) : '—',
            count,
            cancerYear: currentCancerYear.value,
            tagline: STATE_TAGLINES[id] ?? '',
            glow: `rgba(${mr},${mg},${mb},0.5)`,
            selIdx: selectedStates.value.indexOf(id),
            population,
        }
    })

    // ─── State selection & comparison ─────────────────────────────────────────

    const selectedStates = ref<string[]>([])

    /** Dim non-selected states once exactly 2 are chosen */
    const dimActive = computed(() => selectedStates.value.length === 2)

    function stateOpacity(id: string): number {
        if (!dimActive.value) return 1
        return selectedStates.value.includes(id) ? 1 : 0.15
    }

    function onStateClick(id: string) {
        const idx = selectedStates.value.indexOf(id)
        if (idx !== -1) {
            selectedStates.value = selectedStates.value.filter(s => s !== id)
        } else if (selectedStates.value.length < 2) {
            selectedStates.value = [...selectedStates.value, id]
        } else {
            // Replace oldest selection with the new one
            selectedStates.value = [selectedStates.value[1], id]
        }
    }

    const showComparison = computed(() => selectedStates.value.length === 2)

    const comparisonData = computed(() =>
        selectedStates.value.map((id, i) => {
            const feat = geoFeatures.value.find(f => f.id === id)
            const uv = currentUV.value[id] ?? null
            const rate = getCancerRate(id)
            const count = currentStateCancer.value[id] ?? null
            return {
                id,
                name: feat?.name ?? id,
                ringColor: COMPARE_COLORS[i],
                uv,
                uvLabel: uv !== null ? uvLabel(uv) : '—',
                uvColor: uv !== null ? uvColor(uv) : '#6b7280',
                uvPct: uv !== null ? (uv / 15) * 100 : 0,
                rate,
                rateLabel: rate !== null ? rateLabel(rate) : '—',
                rateColor: '#22d3ee',
                ratePct: rate !== null ? Math.min((rate / 80) * 100, 100) : 0,
                count,
                cancerYear: currentCancerYear.value,
            }
        })
    )

    return {
        hoveredId, containerRef, onMouseMove,
        tooltipStyle, hoveredInfo,
        selectedStates, dimActive, stateOpacity, onStateClick,
        showComparison, comparisonData,
    }
}