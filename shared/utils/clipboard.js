/**
 * clipboard.js — Universal Safe Clipboard Utility
 * 
 * Works reliably in:
 * - Secure HTTPS contexts
 * - Insecure HTTP contexts (local IP LAN, e.g. http://192.168.1.50:5173)
 * - Mobile browsers and WebViews
 */

export async function copyToClipboard(text) {
  if (typeof text !== 'string') {
    text = String(text ?? '')
  }

  // 1. Try modern navigator.clipboard if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback to legacy execCommand below
    }
  }

  // 2. Fallback using hidden textarea and document.execCommand('copy')
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.style.opacity = '0'
      textarea.setAttribute('readonly', '')
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch {
      return false
    }
  }

  return false
}

export default copyToClipboard
