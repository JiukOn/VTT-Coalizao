/* global process */
/**
 * VTP Coalizão — Local Server (Phase 7A, refactored v8.0)
 * Node.js + Express + WebSocket for player connections via LAN/VPN
 *
 * Architecture:
 *   - masterHandlers.js  — WS handlers for Master (host) messages
 *   - playerHandlers.js  — WS handlers for Player messages
 *   - serverLogger.js    — Persistent logging to logs/error/
 *   - autoSave.js        — Session auto-save heartbeat
 *   - sessionManager.js  — Code generation + IP detection
 *
 * Uso:
 *   npm run server          — inicia em modo produção
 *   npm run server:dev      — inicia com hot-reload (node --watch)
 *
 * Portas:
 *   HTTP/WS: 3001 (default) — configurável via env PORT
 *   Frontend (Vite dev): 5173 — rodando separadamente
 */

import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'node:crypto'
import { generateCode, getLocalIPs } from './sessionManager.js'
import { initServerLogger, log } from './serverLogger.js'
import { handleMasterMessage } from './masterHandlers.js'
import { handlePlayerMessage } from './playerHandlers.js'
import { initAutoSave, saveSnapshot } from './autoSave.js'

// ── Paths ─────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
// server lives at host/server/ → go up two levels to reach project root
const ROOT_DIR   = path.join(__dirname, '../..')
const DIST_DIR   = path.join(ROOT_DIR, 'dist')
// Player saves now go to database/saves/ per architectural plan
const SAVES_DIR  = path.join(ROOT_DIR, 'database', 'saves')
const LOGS_DIR   = path.join(ROOT_DIR, 'docs', 'logs')

// ── Initialize logger first (captures all console output) ─────────────────────
initServerLogger(ROOT_DIR)

// ── Create directories ────────────────────────────────────────────────────────
fs.mkdirSync(SAVES_DIR, { recursive: true })
fs.mkdirSync(LOGS_DIR, { recursive: true })

// ── Initialize auto-save ──────────────────────────────────────────────────────
initAutoSave(ROOT_DIR)

// ── Environment & Config ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10)
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:8000'
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || (() => {
  const argIdx = process.argv.indexOf('--master-password')
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1]
  }
  return null
})()

// ── Server setup ──────────────────────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const wss    = new WebSocketServer({ server, maxPayload: 100 * 1024 * 1024 })

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve static frontend (production build)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^(?!\/api).*/, (_req, res) =>
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  )
}

// ── Session state ─────────────────────────────────────────────────────────────
let sessionCode = generateCode()

// clientId → { ws, role: 'host'|'player'|'unknown', playerName?, playerId? }
const clients = new Map()

// Shared game state relayed from host to players on join
let cachedGameState = null  // { order, round, entityMap }
let cachedMapState  = null  // { imageData, gridConfig, revealedCells, wallSegments... }
let cachedRoster    = []    // [{ id, name, classId, level, avatar, hasPassword, password }]
let cachedQuests    = []    // [{ id, title, description, status, xp, reward }]
let stateVersion    = 0     // Incremented on every state update

// ── REST endpoints ────────────────────────────────────────────────────────────

app.get('/api/status', (_req, res) => {
  const players = [...clients.values()]
    .filter(c => c.role === 'player')
    .map(c => ({ name: c.playerName, id: c.playerId }))

  res.json({
    online: true,
    sessionCode,
    playerCount: players.length,
    players,
    ips: getLocalIPs().map(n => n.address),
  })
})

app.post('/api/new-code', (_req, res) => {
  sessionCode = generateCode()
  broadcastToRole('host', { type: 'code_changed', sessionCode })
  log('info', `[Server] New session code generated: ${sessionCode}`)
  res.json({ sessionCode })
})

app.post('/api/save-entity', async (req, res) => {
  const { folder, id, data } = req.body
  if (!folder || !id || !data) {
    return res.status(400).json({ error: 'Missing folder, id, or data' })
  }

  // 1. Tentar gravação atômica segura via Python Engine
  try {
    const pyRes = await fetch(`${PYTHON_ENGINE_URL}/storage/save-entity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, id, data }),
    })
    if (pyRes.ok) {
      const pyData = await pyRes.json()
      log('info', `[Server] Saved entity ${folder}/${id} atomically via Python Engine`)
      return res.json(pyData)
    }
  } catch {
    // Python engine offline, fallback para gravação local Node.js
  }

  // 2. Fallback local Node.js
  const allowedFolders = ['personalities', 'classes', 'effects', 'auras', 'species', 'tendencies', 'ambients', 'biomes', 'elements', 'locations', 'modifications', 'sessions', 'heroes', 'npcs', 'creatures', 'items', 'skills']
  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({ error: 'Invalid folder' })
  }

  try {
    const dir = path.join(ROOT_DIR, 'database', 'infodata', folder)
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, `${id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    log('info', `[Server] Saved entity ${folder}/${id} via Node fallback`)
    res.json({ success: true, path: filePath, atomic: false })
  } catch (e) {
    log('error', `[Server] Error saving JSON file: ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

// ── Error log endpoint (receives frontend errors) ─────────────────────────────
app.post('/api/save-error-log', (req, res) => {
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const errors = body?.errors
  if (!Array.isArray(errors) || errors.length === 0) {
    return res.status(400).json({ error: 'Missing or empty errors array' })
  }

  try {
    for (const entry of errors) {
      const msg = `[FRONTEND ${entry.level || 'error'}] ${entry.message || 'Unknown error'}` +
        (entry.stack ? `\n  Stack: ${entry.stack}` : '') +
        (entry.source ? `\n  Source: ${entry.source}` : '') +
        (entry.timestamp ? `\n  At: ${entry.timestamp}` : '')
      log('error', msg)
    }
    res.json({ success: true, saved: errors.length })
  } catch (e) {
    log('error', `[Server] Error saving frontend error log: ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

// ── Python Intelligence Engine Proxy ──────────────────────────────────────────

app.all(/^\/api\/engine/, async (req, res) => {
  const targetPath = req.url.replace('/api/engine', '') || '/'
  const targetUrl = `${PYTHON_ENGINE_URL}${targetPath}`

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    const response = await fetch(targetUrl, fetchOptions)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    log('warn', `[Engine] Python engine offline at ${targetUrl}: ${err.message}`)
    res.status(503).json({
      error: 'Python Intelligence Engine indisponível',
      message: 'Inicie o motor Python com "npm run engine" para habilitar geradores procedurais e pathfinding em Python.',
      offline: true,
    })
  }
})

// ── WebSocket ─────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  const clientId = randomUUID()
  clients.set(clientId, { ws, role: 'unknown' })
  log('debug', `[WS] New connection: ${clientId}`)

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    handleMessage(clientId, ws, msg)
  })

  ws.on('close', () => {
    const client = clients.get(clientId)
    if (client?.role === 'player') {
      log('info', `[WS] Player disconnected: ${client.playerName}`)
      broadcastToRole('host', { type: 'player_left', playerName: client.playerName, playerId: client.playerId })
    } else if (client?.role === 'host') {
      log('info', '[WS] Host disconnected')
    }
    clients.delete(clientId)
  })

  ws.on('error', (err) => {
    log('error', `[WS] Client ${clientId} error: ${err.message}`)
    clients.delete(clientId)
  })
})

// ── Shared context for handlers ───────────────────────────────────────────────

function getHandlerContext() {
  return {
    sessionCode,
    clients,
    broadcastToRole,
    cachedGameState,
    cachedMapState,
    cachedRoster,
    cachedQuests,
    stateVersion,
    port: PORT,
    getLocalIPs,
    masterPassword: MASTER_PASSWORD,
    getStateVersion: () => stateVersion,
    savesDir: SAVES_DIR,
    setCachedGameState: (data) => { cachedGameState = data; stateVersion++ },
    setCachedMapState:  (data) => { cachedMapState = data; stateVersion++ },
    setCachedRoster:    (roster) => { cachedRoster = roster },
    setCachedQuests:    (quests) => { cachedQuests = quests },
    saveAutoSnapshot:   (data) => { saveSnapshot(data) },
  }
}

function handleMessage(clientId, ws, msg) {
  const client = clients.get(clientId)
  if (!client) return

  // ── Role validation: reject typed messages from wrong role ────────────────
  // Messages that declare a role must match the client's established role
  if (msg.role && client.role !== 'unknown' && msg.role !== client.role) {
    log('warn', `[WS] Role mismatch: client ${clientId} is ${client.role} but msg declares ${msg.role}`)
    ws.send(JSON.stringify({ type: 'error', message: 'Role mismatch — ação não autorizada.' }))
    return
  }

  const ctx = getHandlerContext()

  // Try master handlers first, then player handlers
  if (handleMasterMessage(ctx, clientId, ws, msg)) return
  if (handlePlayerMessage(ctx, clientId, ws, msg)) return

  log('warn', `[WS] Unknown message type: ${msg.type}`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function broadcastToRole(role, payload) {
  const data = JSON.stringify(payload)
  for (const client of clients.values()) {
    if (client.role === role && client.ws.readyState === 1 /* OPEN */) {
      try {
        client.ws.send(data)
      } catch (err) {
        log('warn', `[WS] Failed to send to ${client.role}: ${err.message}`)
      }
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs()
  console.log('')
  console.log('┌────────────────────────────────────────────────┐')
  console.log('│   VTP Coalizão — Local Server v8.0             │')
  console.log('├────────────────────────────────────────────────┤')
  console.log(`│   Port      : ${PORT}`)
  console.log(`│   Code      : ${sessionCode}`)
  console.log(`│   Auth      : ${MASTER_PASSWORD ? 'Enabled' : 'Disabled'}`)
  console.log('│   Network IPs:')
  if (ips.length === 0) {
    console.log('│     (no network interface detected)')
  } else {
    ips.forEach(n => console.log(`│     ${n.iface}: http://${n.address}:${PORT}`))
  }
  console.log('├────────────────────────────────────────────────┤')
  console.log(`│   Saves     : ${SAVES_DIR}`)
  console.log(`│   Logs      : ${LOGS_DIR}`)
  console.log('├────────────────────────────────────────────────┤')
  console.log('│   Host:    http://localhost:5173               │')
  console.log(`│   Player:  http://{ip}:${PORT}/#/player        │`)
  console.log('└────────────────────────────────────────────────┘')
  console.log('')
})

// Global exception resilience handlers (prevent server crash)
process.on('uncaughtException', (err) => {
  log('error', `[Server:UncaughtException] ${err.message}\n${err.stack}`)
})

process.on('unhandledRejection', (reason) => {
  log('error', `[Server:UnhandledRejection] ${reason?.message || reason}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', '[Server] Shutting down...')
  console.log('\n[Server] Shutting down...')
  server.close(() => process.exit(0))
})
