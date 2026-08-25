/* touchUtils.js — Touch gestures calculation for mobile and tablet tabletop interaction */

/**
 * Calculates Euclidean distance between two touch points for pinch-to-zoom
 * @param {{ clientX: number, clientY: number }} touch1
 * @param {{ clientX: number, clientY: number }} touch2
 * @returns {number} Distance in pixels
 */
export function getTouchDistance(touch1, touch2) {
  if (!touch1 || !touch2) return 0
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.hypot(dx, dy)
}

/**
 * Calculates midpoint between two touch points for centering zoom/pan
 * @param {{ clientX: number, clientY: number }} touch1
 * @param {{ clientX: number, clientY: number }} touch2
 * @returns {{ x: number, y: number }}
 */
export function getTouchCenter(touch1, touch2) {
  if (!touch1 || !touch2) return { x: 0, y: 0 }
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  }
}

/**
 * Checks if a touch duration qualifies as a long-press (e.g. for map ping)
 * @param {number} startTime Timestamp when touch started
 * @param {number} endTime Timestamp when touch ended/evaluated
 * @param {number} thresholdMs Minimum duration (default 500ms)
 * @returns {boolean}
 */
export function isLongPress(startTime, endTime = Date.now(), thresholdMs = 500) {
  if (!startTime) return false
  return (endTime - startTime) >= thresholdMs
}
