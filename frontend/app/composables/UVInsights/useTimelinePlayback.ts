import { ref, computed, watch, onUnmounted } from 'vue'
import { START_YEAR, TOTAL_MONTHS, UNIFIED_YEARS } from '~/utils/uvInsights'

export function useTimelinePlayback() {
  const sliderIndex = ref(TOTAL_MONTHS - 1)
  const isPlaying = ref(false)
  let playTimer: ReturnType<typeof setInterval> | null = null

  const currentYear = computed(() => START_YEAR + Math.floor(sliderIndex.value / 12))
  const currentMonth = computed(() => (sliderIndex.value % 12) + 1)

  function togglePlay() {
    isPlaying.value = !isPlaying.value

    if (isPlaying.value) {
      if (sliderIndex.value >= UNIFIED_YEARS.length - 1) sliderIndex.value = 0
      playTimer = setInterval(() => {
        if (sliderIndex.value < TOTAL_MONTHS - 1) {
          sliderIndex.value++
        } else {
          isPlaying.value = false
          clearInterval(playTimer!)
        }
      }, 150)
    } else {
      if (playTimer) { clearInterval(playTimer); playTimer = null }
    }
  }

  watch(isPlaying, playing => {
    if (!playing && playTimer) { clearInterval(playTimer); playTimer = null }
  })

  onUnmounted(() => { if (playTimer) clearInterval(playTimer) })

  return { sliderIndex, isPlaying, currentYear, currentMonth, togglePlay }
}
