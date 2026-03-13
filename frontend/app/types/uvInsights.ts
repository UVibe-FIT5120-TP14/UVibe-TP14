export interface UVHistoryResponse {
    region: string
    year: number
    month: number
    uv_index: number
}

export interface StateCancerRecord {
    state: string
    year: number
    count: number
}

export interface GeoFeature {
    id: string
    name: string
    path: string
    labelX: number
    labelY: number
}

export interface ColorStop {
    val: number
    r: number
    g: number
    b: number
}