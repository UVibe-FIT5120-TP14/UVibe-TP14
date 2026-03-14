import { ref, computed, onUnmounted } from 'vue'

export function useSunscreenTimer() {
  const isTimerRunning = ref(false)
  const selectedIntervalHours = ref(2)
  const timeLeft = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startReminder() {
    if (isTimerRunning.value) return
    isTimerRunning.value = true
    timeLeft.value = selectedIntervalHours.value * 60 * 60

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) timeLeft.value--
      else {
        stopReminder()
        alert(`Time to reapply your sunscreen! It's been ${selectedIntervalHours.value} hours.`)
        if (Notification.permission === 'granted') {
          new Notification("UVibe Alert", { body: `Time to reapply your sunscreen!`, icon: "/favicon.ico" })
        }
      }
    }, 1000)
  }

  function stopReminder() {
    isTimerRunning.value = false
    if (timerInterval) clearInterval(timerInterval)
  }

  const formattedTime = computed(() => {
    const h = Math.floor(timeLeft.value / 3600)
    const m = Math.floor((timeLeft.value % 3600) / 60)
    const s = timeLeft.value % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  return {
    isTimerRunning,
    selectedIntervalHours,
    formattedTime,
    startReminder,
    stopReminder
  }
}