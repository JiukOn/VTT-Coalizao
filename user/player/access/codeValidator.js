/* ============================================================
   codeValidator.js — Player session code validation
   Validates the 6-character alphanumeric code entered by
   the player before attempting a WebSocket connection.
   ============================================================ */

/** Expected format: exactly 6 alphanumeric characters (case insensitive) */
const CODE_REGEX = /^[A-Z0-9]{6}$/i

/**
 * Validate the format of a session code.
 * @param {string} code
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateCodeFormat(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código inválido.' }
  }
  const trimmed = code.trim().toUpperCase()
  if (trimmed.length !== 6) {
    return { valid: false, error: 'O código deve ter exatamente 6 caracteres.' }
  }
  if (!CODE_REGEX.test(trimmed)) {
    return { valid: false, error: 'O código deve conter apenas letras e números.' }
  }
  return { valid: true, error: null }
}

/**
 * Normalize a code to uppercase (canonical form).
 * @param {string} code
 * @returns {string}
 */
export function normalizeCode(code) {
  return (code || '').trim().toUpperCase()
}

/**
 * Ping the host WebSocket to verify the session code is active.
 * Returns true if the server acknowledges the code.
 * @param {string} hostUrl - ws:// or wss:// URL
 * @param {string} code    - normalized 6-char code
 * @param {number} [timeout=5000] - ms to wait for ack
 * @returns {Promise<boolean>}
 */
export function pingHostWithCode(hostUrl, code, timeout = 5000) {
  return new Promise((resolve) => {
    let ws
    const timer = setTimeout(() => {
      ws?.close()
      resolve(false)
    }, timeout)

    try {
      ws = new WebSocket(hostUrl)
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'ping_code', code }))
      }
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          if (msg.type === 'pong_code' && msg.valid) {
            clearTimeout(timer)
            ws.close()
            resolve(true)
          } else if (msg.type === 'pong_code') {
            clearTimeout(timer)
            ws.close()
            resolve(false)
          }
        } catch {
          // ignore parse errors
        }
      }
      ws.onerror = () => {
        clearTimeout(timer)
        resolve(false)
      }
    } catch {
      clearTimeout(timer)
      resolve(false)
    }
  })
}
