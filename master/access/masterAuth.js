/* ============================================================
   masterAuth.js — Master authentication hook
   Controls access to the Master (GM) view.
   Authentication is currently trust-based: anyone who opens
   index.html is the Master. A future enhancement could add
   a password/code to protect the GM screen.
   ============================================================ */

/** localStorage key that marks this browser as authenticated Master */
const MASTER_KEY = 'vtp-is-master'

/**
 * Mark this browser session as the authenticated Master.
 * Call once on first load if no protection is needed.
 */
export function setMasterSession() {
  localStorage.setItem(MASTER_KEY, '1')
}

/**
 * Check if the current browser is authenticated as the Master.
 * @returns {boolean}
 */
export function isMaster() {
  return localStorage.getItem(MASTER_KEY) === '1'
}

/**
 * Clear the Master session (log out).
 */
export function clearMasterSession() {
  localStorage.removeItem(MASTER_KEY)
}

/**
 * React hook: returns true if this browser is authenticated as Master.
 * Auto-sets the flag on first use (open-door policy).
 */
export function useMasterAuth() {
  if (!isMaster()) setMasterSession()
  return true // Always true for now — no password required
}
