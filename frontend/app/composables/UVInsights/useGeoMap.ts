import { ref, onMounted } from 'vue'
import { geoMercator, geoPath, geoCentroid } from 'd3-geo'
import type { GeoFeature } from '~/types/uvInsights'
import { GEOJSON_URL, SVG_W, SVG_H, NAME_TO_CODE } from '~/utils/uvInsights'

export function useGeoMap() {
  const geoFeatures = ref<GeoFeature[]>([])
  const mapLoading = ref(true)
  const mapError = ref<string | null>(null)

  onMounted(async () => {
    try {
      const geo = await fetch(GEOJSON_URL).then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })

      const proj = geoMercator().fitSize([SVG_W, SVG_H], geo)
      const pathGen = geoPath(proj)

      geoFeatures.value = geo.features
        .map((f: any) => {
          const name = f.properties?.STATE_NAME ?? f.properties?.name ?? f.properties?.Name ?? ''
          const code = NAME_TO_CODE[name] ?? f.properties?.STATE_ABBREV ?? name
          const [cx, cy] = proj(geoCentroid(f)) ?? [0, 0]
          return { id: code, name, path: pathGen(f) ?? '', labelX: cx, labelY: cy } as GeoFeature
        })
        .filter((f: GeoFeature) => f.path)

      mapLoading.value = false
    } catch {
      mapError.value = 'Could not load map data'
      mapLoading.value = false
    }
  })

  return { geoFeatures, mapLoading, mapError }
}
