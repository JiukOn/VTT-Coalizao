/* global process */
/**
 * serverLogger.js — Persistent logging for the VTT Coalizão server
 *
 * Features:
 *   - Writes all logs to logs/error/ directory as daily .txt files
 *   - Overrides console.log/warn/error to also persist to disk
 *   - Captures uncaught exceptions and unhandled rejections
 *   - Each log line includes ISO timestamp + level
 *
 * Usage:
 *   import { initServerLogger, log } from './serverLogger.js'
 *   initServerLogger(rootDir) // call once at startup
 *   log('info', 'Server started')
 *   log('error', 'Something went wrong', errorObject)
 */

import fs from 'fs'
import path from 'path'

let logDir = null
let logStream = null
let currentDateStr = null

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateStr() {
  return new Date().toISOString().slice(0, 10) // "2026-04-28"
}

function getTimestamp() {
  return new Date().toISOString() // "2026-04-28T23:15:00.000Z"
}

function ensureStream() {
  const today = getDateStr()
  if (currentDateStr === today && logStream) return

  // Close previous stream if date changed
  if (logStream) {
    try { logStream.end() } catch { /* ignore */ }
  }

  currentDateStr = today
  const filePath = path.join(logDir, `${today}_server.txt`)
  logStream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf-8' })
  logStream.on('error', (err) => {
    // Fallback: stderr if we can't write to log file
    process.stderr.write(`[ServerLogger] Failed to write log: ${err.message}\n`)
  })
}

function writeLine(level, message) {
  if (!logDir) return
  ensureStream()
  const line = `[${getTimestamp()}] [${level.toUpperCase()}] ${message}\n`
  logStream.write(line)
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the server logger. Creates the log directory and overrides
 * console methods to also persist to disk.
 * @param {string} rootDir - Project root directory
 */
export function initServerLogger(rootDir) {
  logDir = path.join(rootDir, 'logs', 'error')
  fs.mkdirSync(logDir, { recursive: true })

  // Override console methods to also write to disk
  const originalLog   = console.log.bind(console)
  const originalWarn  = console.warn.bind(console)
  const originalError = console.error.bind(console)

  console.log = (...args) => {
    originalLog(...args)
    writeLine('info', args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '))
  }

  console.warn = (...args) => {
    originalWarn(...args)
    writeLine('warn', args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '))
  }

  console.error = (...args) => {
    originalError(...args)
    writeLine('error', args.map(a => {
      if (a instanceof Error) return `${a.message}\n${a.stack}`
      return typeof a === 'string' ? a : JSON.stringify(a)
    }).join(' '))
  }

  // Capture uncaught exceptions
  process.on('uncaughtException', (err) => {
    const msg = `UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`
    writeLine('fatal', msg)
    originalError('[FATAL]', msg)
    // Flush and exit
    if (logStream) {
      logStream.end(() => process.exit(1))
    } else {
      process.exit(1)
    }
  })

  // Capture unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error
      ? `UNHANDLED REJECTION: ${reason.message}\n${reason.stack}`
      : `UNHANDLED REJECTION: ${JSON.stringify(reason)}`
    writeLine('fatal', msg)
    originalError('[FATAL]', msg)
  })

  writeLine('info', '=== Server logger initialized ===')
}

/**
 * Log a message at the specified level (without relying on console override).
 * Use this for explicit structured logging.
 * @param {'info'|'warn'|'error'|'debug'} level
 * @param {string} message
 */
export function log(level, message) {
  writeLine(level, message)

  // Also output to console (which will re-write via override, but that's fine
  // since writeLine checks are idempotent)
  switch (level) {
    case 'error': process.stderr.write(`[${level.toUpperCase()}] ${message}\n`); break
    case 'warn':  process.stderr.write(`[${level.toUpperCase()}] ${message}\n`); break
    default:      process.stdout.write(`[${level.toUpperCase()}] ${message}\n`); break
  }
}
