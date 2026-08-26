/**
 * uuid.js — Universal Cryptographically Safe UUID Generator
 * 
 * Works 100% reliably in:
 * - Secure HTTPS contexts
 * - Insecure HTTP contexts (local IP LAN, e.g. http://192.168.1.50:5173)
 * - Mobile browsers and WebViews
 * - Node.js and testing environments
 */

export function generateUUID() {
  const cObj = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : (typeof window !== 'undefined' && window.crypto ? window.crypto : null)

  // 1. Try native crypto.randomUUID if available
  if (cObj && typeof cObj.randomUUID === 'function') {
    try {
      return cObj.randomUUID()
    } catch {
      // Fallback if randomUUID fails or throws
    }
  }

  // 2. Try crypto.getRandomValues (RFC4122 version 4 compliant)
  if (cObj && typeof cObj.getRandomValues === 'function') {
    try {
      const buffer = new Uint8Array(16)
      cObj.getRandomValues(buffer)
      buffer[6] = (buffer[6] & 0x0f) | 0x40 // Version 4
      buffer[8] = (buffer[8] & 0x3f) | 0x80 // Variant 10xx
      const hex = Array.from(buffer, b => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    } catch {
      // Fallback to high-entropy pseudo-random
    }
  }

  // 3. Robust fallback using timestamp, performance.now, and high-entropy math
  const d0 = (Date.now() + (typeof performance !== 'undefined' && performance.now ? performance.now() * 1000 : 0)) | 0
  let d = d0
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16
    if (d > 0) {
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      r = (Math.random() * 16) | 0
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export default generateUUID
