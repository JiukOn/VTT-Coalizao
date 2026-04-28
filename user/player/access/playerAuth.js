/* ============================================================
   playerAuth.js — Player authentication and session management
   Manages player login state with sessionStorage + expiry.
   Session expires after EXPIRY_MS (default: 8 hours).
   ============================================================ */

const SESSION_KEY = 'vtp-player-session'
const EXPIRY_MS   = 8 * 60 * 60 * 1000 // 8 hours

/**
 * @typedef {Object} PlayerSession
 * @property {string} code        - 6-char session code
 * @property {string} hostUrl     - WebSocket URL of the host
 * @property {string} playerId    - player's unique ID (uuid)
 * @property {string} playerName  - player's display name
 * @property {string} characterId - selected character ID
 * @property {number} expiresAt   - timestamp when session expires
 */

/**
 * Save a player session to sessionStorage.
 * @param {PlayerSession} session
 */
export function savePlayerSession(session) {
  const data = { ...session, expiresAt: Date.now() + EXPIRY_MS }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

/**
 * Load the player session from sessionStorage.
 * Returns null if no session or if expired.
 * @returns {PlayerSession|null}
 */
export function loadPlayerSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() > data.expiresAt) {
      clearPlayerSession()
      return null
    }
    return data
  } catch {
    return null
  }
}

/**
 * Clear the player session (log out).
 */
export function clearPlayerSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Refresh the session expiry (call on active WS messages).
 */
export function refreshPlayerSession() {
  const session = loadPlayerSession()
  if (session) savePlayerSession(session)
}

/**
 * Check if there's an active valid player session.
 * @returns {boolean}
 */
export function hasActivePlayerSession() {
  return loadPlayerSession() !== null
}
