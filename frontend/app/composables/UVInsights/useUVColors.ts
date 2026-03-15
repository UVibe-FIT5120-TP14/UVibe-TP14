import type { ColorStop } from '~/types/uvInsights'
import { UV_STOPS } from '~/utils/uvInsights'

export function useUVColors() {
    function interpColor(stops: ColorStop[], value: number): [number, number, number] {
        const max = stops[stops.length - 1].val
        const v = Math.max(0, Math.min(max, value))
        let lo = stops[0], hi = stops[stops.length - 1]
        for (let i = 0; i < stops.length - 1; i++) {
            if (v >= stops[i].val && v <= stops[i + 1].val) { lo = stops[i]; hi = stops[i + 1]; break }
        }
        const t = lo.val === hi.val ? 0 : (v - lo.val) / (hi.val - lo.val)
        return [
            Math.round(lo.r + t * (hi.r - lo.r)),
            Math.round(lo.g + t * (hi.g - lo.g)),
            Math.round(lo.b + t * (hi.b - lo.b)),
        ]
    }

    function uvColor(uv: number): string {
        const [r, g, b] = interpColor(UV_STOPS, uv)
        return `rgb(${r},${g},${b})`
    }

    function uvColorA(uv: number, a: number): string {
        const [r, g, b] = interpColor(UV_STOPS, uv)
        return `rgba(${r},${g},${b},${a})`
    }

    function uvLabel(uv: number): string {
        if (uv < 3) return 'Low'
        if (uv < 6) return 'Moderate'
        if (uv < 8) return 'High'
        if (uv < 11) return 'Very High'
        return 'Extreme'
    }

    function rateLabel(rate: number): string {
        if (rate < 20) return 'Below Avg'
        if (rate < 35) return 'Moderate'
        if (rate < 50) return 'Elevated'
        if (rate < 65) return 'High'
        return 'Very High'
    }

    return { interpColor, uvColor, uvColorA, uvLabel, rateLabel }
}