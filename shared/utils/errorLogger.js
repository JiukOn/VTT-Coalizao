/**
 * errorLogger.js — Frontend error capture and persistence
 *
 * Captures window.onerror, unhandledrejection, and console.error calls.
 * Stores errors in memory and localStorage, and flushes them to the
 * server via POST /api/save-error-log when the server is available.
 *
 * Usage:
 *   import { initErrorLogger } from '@shared/utils/errorLogger.js'
 *   initErrorLogger()  // call once at app bootstrap
 */

const MAX_STORED_ERRORS = 50
const STORAGE_KEY = 'vtt_error_log'
const FLUSH_INTERVAL_MS = 30_000 // flush every 30s

let errorBuffer = []
let initialized = false

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTimestamp() {
  return new Date().toISOString()
}

function addEntry(entry) {
  errorBuffer.push(entry)
  if (errorBuffer.length > MAX_STORED_ERRORS) {
    errorBuffer = errorBuffer.slice(-MAX_STORED_ERRORS)
  }

  // Also persist to localStorage as backup
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(errorBuffer))
  } catch { /* localStorage full or unavailable */ }
}

/**
 * Attempt to send buffered errors to the server.
 * Silently fails if the server is unreachable (offline mode).
 */
async function flushToServer() {
  if (errorBuffer.length === 0) return

  const errors = [...errorBuffer]

  try {
    const res = await fetch('/api/save-error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors }),
    })

    if (res.ok) {
      // Remove flushed errors from buffer
      errorBuffer = errorBuffer.filter(e => !errors.includes(e))
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(errorBuffer))
      } catch { /* ignore */ }
    }
  } catch {
    // Server not available — keep errors in buffer for next flush
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the error logger. Should be called once at app startup.
 * Sets up global error handlers and periodic flush to server.
 */
export function initErrorLogger() {
  if (initialized) return
  initialized = true

  // Load any previously persisted errors
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      errorBuffer = JSON.parse(stored)
    }
  } catch { /* ignore */ }

  // ── Capture window.onerror (syntax errors, runtime errors) ────────────────
  const originalOnError = window.onerror
  window.onerror = (message, source, lineno, colno, error) => {
    addEntry({
      level: 'error',
      message: String(message),
      source: `${source}:${lineno}:${colno}`,
      stack: error?.stack || null,
      timestamp: getTimestamp(),
      type: 'window.onerror',
    })
    if (originalOnError) return originalOnError(message, source, lineno, colno, error)
    return false
  }

  // ── Capture unhandled promise rejections ──────────────────────────────────
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    addEntry({
      level: 'error',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : null,
      timestamp: getTimestamp(),
      type: 'unhandledrejection',
    })
  })

  // ── Override console.error to capture explicit error logs ─────────────────
  const originalConsoleError = console.error.bind(console)
  console.error = (...args) => {
    originalConsoleError(...args)
    addEntry({
      level: 'error',
      message: args.map(a => {
        if (a instanceof Error) return `${a.message}`
        return typeof a === 'string' ? a : JSON.stringify(a)
      }).join(' '),
      stack: args.find(a => a instanceof Error)?.stack || null,
      timestamp: getTimestamp(),
      type: 'console.error',
    })
  }

  // ── Periodic flush to server ──────────────────────────────────────────────
  setInterval(flushToServer, FLUSH_INTERVAL_MS)

  // ── Flush on page unload ──────────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliability during unload
    if (errorBuffer.length > 0 && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/save-error-log',
        JSON.stringify({ errors: errorBuffer })
      )
    }
  })

  console.log('[ErrorLogger] Initialized — errors will be captured and persisted')
}

/**
 * Manually log an error to the buffer.
 * @param {string} message - Error message
 * @param {Error} [error]  - Optional Error object for stack trace
 */
export function logError(message, error) {
  addEntry({
    level: 'error',
    message,
    stack: error?.stack || null,
    timestamp: getTimestamp(),
    type: 'manual',
  })
}

/**
 * Get the current error buffer (for debugging or export).
 * @returns {Array} Array of error entries
 */
export function getErrorLog() {
  return [...errorBuffer]
}
