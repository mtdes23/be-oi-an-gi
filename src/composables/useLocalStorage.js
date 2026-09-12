const pendingWrites = new Map()
let flushTimer = null

function flush() {
  for (const [key, value] of pendingWrites) {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('localStorage write failed:', key, e)
    }
  }
  pendingWrites.clear()
  flushTimer = null
}

export function debouncedSet(key, value, delay = 500) {
  pendingWrites.set(key, value)
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, delay)
}

export function immediateSet(key, value) {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  for (const [k, v] of pendingWrites) {
    try { localStorage.setItem(k, v) } catch {}
  }
  pendingWrites.clear()
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.warn('localStorage write failed:', key, e)
  }
}
