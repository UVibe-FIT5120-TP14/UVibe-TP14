import { ref, computed, onMounted, onUnmounted } from 'vue'

// ─── Age group definitions ─────────────────────────────────────────────────────

export const AGE_GROUPS = [
    { key: 'children', label: 'Children 0–14', ages: ['00-04', '05-09', '10-14'], color: '#10b981', rgba: 'rgba(16,185,129,0.18)' },
    { key: 'young', label: 'Young 15–29', ages: ['15-19', '20-24', '25-29'], color: '#38bdf8', rgba: 'rgba(56,189,248,0.18)' },
    { key: 'adults', label: 'Adults 30–59', ages: ['30-34', '35-39', '40-44', '45-49', '50-54', '55-59'], color: '#f59e0b', rgba: 'rgba(245,158,11,0.18)' },
    { key: 'older', label: 'Older 60–79', ages: ['60-64', '65-69', '70-74', '75-79'], color: '#f97316', rgba: 'rgba(249,115,22,0.18)' },
    { key: 'elderly', label: 'Elderly 80+', ages: ['80-84', '85-89', '90+'], color: '#f43f5e', rgba: 'rgba(244,63,94,0.18)' },
] as const

export type AgeGroupKey = typeof AGE_GROUPS[number]['key']

// ─── Chart geometry constants ──────────────────────────────────────────────────

export const CHART_YEARS = [2016, 2017, 2018, 2019]
export const CW = 460, CH = 255
export const PAD = { l: 50, r: 14, t: 14, b: 38 }
export const PLOT_W = CW - PAD.l - PAD.r
export const PLOT_H = CH - PAD.t - PAD.b

// ─── Age → group mapping (for real API data with raw age strings) ──────────────

const AGE_TO_GROUP: Record<string, AgeGroupKey> = {}
for (const grp of AGE_GROUPS)
    for (const age of grp.ages)
        AGE_TO_GROUP[age] = grp.key

// ─── Mock data (used when real API data is unavailable) ───────────────────────

function seededNoise(s: number) { return (Math.sin(s * 127.1 + 311.7) * 43758.5453) % 1 }

function generateMockAgeCancer() {
    const BASES: Record<AgeGroupKey, number> = {
        children: 27, young: 488, adults: 8_040, older: 9_940, elderly: 3_150,
    }
    const rows: { year: number; age_group: string; count: number }[] = []
    for (const [key, base] of Object.entries(BASES) as [AgeGroupKey, number][]) {
        for (let yr = 2016; yr <= 2019; yr++) {
            const growth = 1 + (yr - 2016) * 0.022
            const noise = 1 + (seededNoise(yr * 97 + key.charCodeAt(0) * 13) - 0.5) * 0.06
            rows.push({ year: yr, age_group: key, count: Math.round(base * growth * noise) })
        }
    }
    return rows
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useAgeCancerChart() {
    const { ageCancer } = useAgeCancerData()

    // Toggle visibility per age group
    const hiddenGroups = ref<AgeGroupKey[]>([])
    function toggleGroup(key: AgeGroupKey) {
        hiddenGroups.value = hiddenGroups.value.includes(key)
            ? hiddenGroups.value.filter(k => k !== key)
            : [...hiddenGroups.value, key]
    }

    // Aggregate records into { year → { groupKey → totalCount } }
    const ageAnnualData = computed<Record<number, Record<AgeGroupKey, number>>>(() => {
        const isMock = !ageCancer.value?.length
        const records = isMock ? generateMockAgeCancer() : ageCancer.value

        const map: Record<number, Record<string, number>> = {}
        CHART_YEARS.forEach(yr => {
            map[yr] = { children: 0, young: 0, adults: 0, older: 0, elderly: 0 }
        })

        records.forEach(d => {
            const yr = Number(d.year) // coerce — APIs sometimes return strings
            if (!CHART_YEARS.includes(yr)) return
            // Mock data uses group keys directly; real API uses raw age strings
            const groupKey: AgeGroupKey | undefined = isMock
                ? (d.age_group as AgeGroupKey)
                : AGE_TO_GROUP[d.age_group]
            if (!groupKey) return
            map[yr][groupKey] = (map[yr][groupKey] ?? 0) + d.count
        })

        return map as Record<number, Record<AgeGroupKey, number>>
    })

    // ─── SVG coordinate helpers ────────────────────────────────────────────────

    const chartMax = computed(() => {
        let max = 0
        for (const yr of CHART_YEARS)
            for (const grp of AGE_GROUPS) {
                const v = ageAnnualData.value[yr]?.[grp.key] ?? 0
                if (v > max) max = v
            }
        return max || 1
    })

    function xPos(i: number) { return PAD.l + (i / (CHART_YEARS.length - 1)) * PLOT_W }
    function yPos(v: number) { return PAD.t + PLOT_H - (v / chartMax.value) * PLOT_H }

    function groupPoints(key: AgeGroupKey) {
        return CHART_YEARS.map((yr, i) => ({
            x: xPos(i),
            y: yPos(ageAnnualData.value[yr]?.[key] ?? 0),
            val: ageAnnualData.value[yr]?.[key] ?? 0,
            yr,
        }))
    }

    function polyline(key: AgeGroupKey) {
        return groupPoints(key).map(p => `${p.x},${p.y}`).join(' ')
    }

    function areaPath(key: AgeGroupKey) {
        const pts = groupPoints(key)
        const top = pts.map(p => `${p.x},${p.y}`).join(' L ')
        const base = `L ${pts.at(-1)!.x},${PAD.t + PLOT_H} L ${pts[0].x},${PAD.t + PLOT_H} Z`
        return `M ${top} ${base}`
    }

    // Y-axis ticks — ~4 evenly spaced, rounded to nearest 1k
    const yTicks = computed(() => {
        const max = chartMax.value
        const step = Math.ceil((max / 4) / 1000) * 1000 || 500
        const ticks: number[] = []
        for (let v = 0; v <= max + step * 0.5; v += step) ticks.push(v)
        return ticks
    })

    // ─── Crosshair hover ──────────────────────────────────────────────────────

    const chartHoveredIdx = ref<number | null>(null)
    const chartHoveredYear = computed(() =>
        chartHoveredIdx.value !== null ? CHART_YEARS[chartHoveredIdx.value] : null
    )

    function onChartMouseMove(e: MouseEvent) {
        const svg = e.currentTarget as SVGSVGElement
        const rect = svg.getBoundingClientRect()
        const relX = ((e.clientX - rect.left) / rect.width) * CW
        let closest = 0, minDist = Infinity
        CHART_YEARS.forEach((_, i) => {
            const d = Math.abs(relX - xPos(i))
            if (d < minDist) { minDist = d; closest = i }
        })
        chartHoveredIdx.value = closest
    }
    function onChartMouseLeave() { chartHoveredIdx.value = null }

    // ─── Left-to-right draw-on animation ──────────────────────────────────────

    const chartDrawProgress = ref(0)
    let animFrame: number | null = null

    function startChartAnimation() {
        chartDrawProgress.value = 0
        const start = performance.now()
        const duration = 1300

        function step(now: number) {
            const t = Math.min((now - start) / duration, 1)
            chartDrawProgress.value = 1 - Math.pow(1 - t, 3) // cubic ease-out
            if (t < 1) animFrame = requestAnimationFrame(step)
        }
        animFrame = requestAnimationFrame(step)
    }

    onMounted(() => { setTimeout(startChartAnimation, 350) })
    onUnmounted(() => { if (animFrame) cancelAnimationFrame(animFrame) })

    return {
        hiddenGroups, toggleGroup,
        ageAnnualData, chartMax,
        xPos, yPos, polyline, areaPath, yTicks,
        chartHoveredIdx, chartHoveredYear,
        onChartMouseMove, onChartMouseLeave,
        chartDrawProgress,
    }
}