import type { ColorStop } from '~/types/uvInsights'

// ─── GeoJSON ──────────────────────────────────────────────────────────────────

export const GEOJSON_URL = 'https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson'

export const NAME_TO_CODE: Record<string, string> = {
    'Western Australia': 'WA',
    'Northern Territory': 'NT',
    'Queensland': 'QLD',
    'South Australia': 'SA',
    'New South Wales': 'NSW',
    'Australian Capital Territory': 'ACT',
    'Victoria': 'VIC',
    'Tasmania': 'TAS',
}

export const LABEL_FONT: Record<string, number> = { ACT: 16 }

export const SVG_W = 900
export const SVG_H = 780

// ─── Timeline ─────────────────────────────────────────────────────────────────

export const START_YEAR = 2016
export const END_YEAR = 2019
export const UNIFIED_YEARS = [2016, 2017, 2018, 2019]
export const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12

// ─── UV color scale (WHO-aligned) ─────────────────────────────────────────────

export const UV_STOPS: ColorStop[] = [
    { val: 0, r: 34, g: 197, b: 94 }, // green-500   Low
    { val: 3, r: 234, g: 179, b: 8 }, // yellow-500  Moderate
    { val: 6, r: 249, g: 115, b: 22 }, // orange-500  High
    { val: 8, r: 239, g: 68, b: 68 }, // red-500     Very High
    { val: 11, r: 168, g: 85, b: 247 }, // violet-500  Extreme
    { val: 15, r: 109, g: 40, b: 217 }, // violet-700
]

// ─── Cancer bubble (cyan — fully distinct from UV scale) ──────────────────────

export const BUBBLE_STROKE = 'rgba(34, 211, 238, 0.85)'
export const BUBBLE_FILL = 'rgba(34, 211, 238, 0.12)'

// ─── State comparison ─────────────────────────────────────────────────────────

export const COMPARE_COLORS = ['#3B82F6', '#F59E0B']

// ─── State data ───────────────────────────────────────────────────────────────

export const STATE_POP: Record<string, number> = {
    NSW: 8_600_000,
    VIC: 7_100_000,
    QLD: 5_700_000,
    SA: 1_900_000,
    WA: 3_000_000,
    TAS: 570_000,
    NT: 250_000,
    ACT: 470_000,
}

export const STATE_TAGLINES: Record<string, string> = {
    QLD: 'Highest UV & melanoma rates nationally',
    NT: 'Year-round extreme UV exposure',
    WA: 'Vast coastal UV exposure zones',
    NSW: 'Largest absolute case volume nationally',
    SA: 'Moderate UV, significant cumulative risk',
    ACT: 'Urban UV — consistent year-round',
    VIC: 'Cooler climate, still significant risk',
    TAS: 'Lowest UV in Australia — still significant',
}

// ─── Map legend ───────────────────────────────────────────────────────────────

export const UV_TICKS = [
    { v: 15, l: '15', label: 'Extreme' },
    { v: 11, l: '11', label: 'Very High' },
    { v: 8, l: '8', label: 'High' },
    { v: 6, l: '6', label: 'Moderate' },
    { v: 3, l: '3', label: 'Low' },
    { v: 0, l: '0', label: '' },
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export const TOOLTIP_W = 240
export const TOOLTIP_H = 200
export const OFFSET = 16