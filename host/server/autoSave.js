/**
 * autoSave.js — Session auto-save heartbeat
 *
 * Saves a draft of the current session state to disk every 60 seconds
 * when the Master sends a session_snapshot message.
 *
 * Files:
 *   user/master/memory/temp/draft_session.json  — latest session state
 *   user/master/memory/temp/undo_stack.json     — last 20 reversible actions
 */

import fs from 'fs'
import path from 'path'
import { log } from './serverLogger.js'

const MAX_UNDO_ENTRIES = 20

let tempDir = null
let undoStack = []

/**
 * Initialize auto-save with the project root directory.
 * Creates the temp directory structure if it doesn't exist.
 * @param {string} rootDir - Project root directory
 */
export function initAutoSave(rootDir) {
  tempDir = path.join(rootDir, 'user', 'master', 'memory', 'temp')
  fs.mkdirSync(tempDir, { recursive: true })

  // Load existing undo stack if present
  const undoPath = path.join(tempDir, 'undo_stack.json')
  if (fs.existsSync(undoPath)) {
    try {
      undoStack = JSON.parse(fs.readFileSync(undoPath, 'utf-8'))
      log('info', `[AutoSave] Loaded ${undoStack.length} undo entries`)
    } catch {
      undoStack = []
    }
  }

  log('info', '[AutoSave] Initialized')
}

/**
 * Save a session snapshot to disk.
 * Called when the Master sends a session_snapshot WS message.
 * @param {object} data - Session state data from the Master
 */
export function saveSnapshot(data) {
  if (!tempDir) return

  try {
    const draftPath = path.join(tempDir, 'draft_session.json')
    const snapshot = {
      ...data,
      savedAt: new Date().toISOString(),
      version: 'auto',
    }
    fs.writeFileSync(draftPath, JSON.stringify(snapshot, null, 2), 'utf-8')
    log('debug', '[AutoSave] Draft session saved')
  } catch (e) {
    log('error', `[AutoSave] Failed to save draft: ${e.message}`)
  }
}

/**
 * Push an action to the undo stack and persist it.
 * @param {object} action - Action descriptor { type, entityId, before, after, timestamp }
 */
export function pushUndo(action) {
  if (!tempDir) return

  undoStack.push({
    ...action,
    timestamp: action.timestamp || new Date().toISOString(),
  })

  // Trim to max size
  if (undoStack.length > MAX_UNDO_ENTRIES) {
    undoStack = undoStack.slice(-MAX_UNDO_ENTRIES)
  }

  try {
    const undoPath = path.join(tempDir, 'undo_stack.json')
    fs.writeFileSync(undoPath, JSON.stringify(undoStack, null, 2), 'utf-8')
  } catch (e) {
    log('error', `[AutoSave] Failed to save undo stack: ${e.message}`)
  }
}
