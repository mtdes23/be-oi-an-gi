export function useHaptics() {
  return {
    async impact(style = 'medium') {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          await window.Capacitor.Plugins.Haptics.impact({ style })
        } else if (navigator.vibrate) {
          const patterns = {
            light: [10],
            medium: [20],
            heavy: [30]
          }
          navigator.vibrate(patterns[style] || [20])
        }
      } catch {}
    },

    async notification(type = 'success') {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          await window.Capacitor.Plugins.Haptics.notification({ type })
        } else if (navigator.vibrate) {
          const patterns = {
            success: [10, 50, 10],
            warning: [20, 50, 20],
            error: [30, 50, 30]
          }
          navigator.vibrate(patterns[type] || [10, 50, 10])
        }
      } catch {}
    },

    async vibrate(duration = 20) {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          await window.Capacitor.Plugins.Haptics.vibrate({ duration })
        } else if (navigator.vibrate) {
          navigator.vibrate(duration)
        }
      } catch {}
    }
  }
}
