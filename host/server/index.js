/* global process */
/**
 * VTP Coalizão — Local Server (Phase 7A)
 * Node.js + Express + WebSocket for player connections via LAN/VPN
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

// ── Paths ─────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
// server lives at host/server/ → go up two levels to reach project root
const ROOT_DIR   = path.join(__dirname, '../..')
const DIST_DIR   = path.join(ROOT_DIR, 'dist')
const SAVES_DIR  = path.join(ROOT_DIR, 'saves')

fs.mkdirSync(SAVES_DIR, { recursive: true })

// ── Server setup ──────────────────────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const wss    = new WebSocketServer({ server })

app.use(express.json())

// Serve static frontend (production build)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/^(?!\/api).*/, (_req, res) =>
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  )
}

// ── Session state ─────────────────────────────────────────────────────────────
let sessionCode = generateCode()

// clientId → { ws, role: 'host'|'player', playerName?, playerId? }
const clients = new Map()

// Shared game state relayed from host to players on join
let cachedGameState = null  // { order, round, entityMap }
let cachedMapState  = null  // { imageData, gridConfig, revealedCells, wallSegments... }

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
  res.json({ sessionCode })
})

app.post('/api/save-entity', (req, res) => {
  const { folder, id, data } = req.body
  if (!folder || !id || !data) {
    return res.status(400).json({ error: 'Missing folder, id, or data' })
  }
  
  // Validate path traversal (only allow known folders)
  const allowedFolders = ['personalities', 'classes', 'effects', 'auras', 'species', 'tendencies', 'ambients', 'biomes', 'elements', 'locations', 'modifications', 'sessions', 'heroes', 'npcs', 'creatures', 'items', 'skills']
  
  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({ error: 'Invalid folder' })
  }
  
  try {
    const dir = path.join(ROOT_DIR, 'database', 'infodata', folder)
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, `${id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    res.json({ success: true, path: filePath })
  } catch (e) {
    console.error('[Server] Error saving JSON file:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── WebSocket ─────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  const clientId = randomUUID()
  clients.set(clientId, { ws, role: 'unknown' })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    handleMessage(clientId, ws, msg)
  })

  ws.on('close', () => {
    const client = clients.get(clientId)
    if (client?.role === 'player') {
      broadcastToRole('host', { type: 'player_left', playerName: client.playerName, playerId: client.playerId })
    }
    clients.delete(clientId)
  })

  ws.on('error', (err) => {
    console.error(`[WS] Client ${clientId} error:`, err.message)
    clients.delete(clientId)
  })
})

function handleMessage(clientId, ws, msg) {
  const client = clients.get(clientId)
  if (!client) return

  switch (msg.type) {

    // ── Host identifies itself ──────────────────────────────────────────────
    case 'host_hello': {
      client.role = 'host'
      clients.set(clientId, client)
      console.log('[WS] Host connected')
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode }))
      break
    }

    // ── Pre-join: Get characters ────────────────────────────────────────────
    case 'get_characters': {
      if (msg.campaignCode !== sessionCode) {
        ws.send(JSON.stringify({ type: 'error', message: 'Código de campanha inválido.' }))
        return
      }
      const characters = cachedGameState?.order 
        ? cachedGameState.order.map(e => e.name) 
        : []
      ws.send(JSON.stringify({ type: 'character_list', characters }))
      break
    }

    // ── Player joins ────────────────────────────────────────────────────────
    case 'join': {
      if (msg.campaignCode !== sessionCode) {
        ws.send(JSON.stringify({ type: 'error', message: 'Código de campanha inválido.' }))
        return
      }
      if (!msg.playerName?.trim()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Nome do jogador obrigatório.' }))
        return
      }
      const playerId = randomUUID()
      client.role = 'player'
      client.playerName = msg.playerName.trim()
      client.playerId = playerId
      clients.set(clientId, client)
      console.log(`[WS] Player connected: ${client.playerName} (${playerId})`)

      // Send welcome + current game state to the new player
      ws.send(JSON.stringify({
        type: 'welcome',
        playerId,
        playerName: client.playerName,
        gameState: cachedGameState || null,
        mapState: cachedMapState || null,
      }))

      // Notify host
      broadcastToRole('host', {
        type: 'player_joined',
        playerName: client.playerName,
        playerId,
      })
      break
    }

    // ── Host broadcasts game state to all players ────────────────────────────
    case 'game_state_update': {
      // Cache so new players get it on join
      cachedGameState = msg.data
      broadcastToRole('player', { type: 'game_state', data: msg.data })
      break
    }

    // ── Delta events from host → relay to all players ───────────────────────
    case 'map_update': {
      cachedMapState = msg.data
      broadcastToRole('player', { type: msg.type, data: msg.data })
      break
    }

    case 'entity_update':
    case 'turn_change':
    case 'combat_event': {
      broadcastToRole('player', { type: msg.type, data: msg.data })
      break
    }

    // ── Events from player → relay to host ──────────────────────────────────
    case 'dice_roll':
    case 'token_move': {
      broadcastToRole('host', {
        type: msg.type,
        data: msg.data,
        from: client.playerName,
        playerId: client.playerId,
      })
      break
    }

    // ── Notes: save to disk + relay to host ─────────────────────────────────
    case 'notes_save': {
      const name  = client.playerName || 'desconhecido'
      const code  = sessionCode
      const notes = msg.notes ?? ''
      try {
        const dir = path.join(SAVES_DIR, code)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(
          path.join(dir, `${name}_notes.json`),
          JSON.stringify({ playerName: name, sessionCode: code, notes, savedAt: new Date().toISOString() }, null, 2)
        )
      } catch (e) {
        console.error('[Server] Error saving player notes:', e.message)
      }
      broadcastToRole('host', { type: 'notes_received', playerName: name, notes })
      break
    }

    // ── Ping (client keepalive) ──────────────────────────────────────────────
    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong' }))
      break
    }

    default:
      console.warn(`[WS] Unknown message type: ${msg.type}`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function broadcastToRole(role, payload) {
  const data = JSON.stringify(payload)
  for (const client of clients.values()) {
    if (client.role === role && client.ws.readyState === 1 /* OPEN */) {
      client.ws.send(data)
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10)

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs()
  console.log('')
  console.log('┌────────────────────────────────────────────────┐')
  console.log('│   VTP Coalizão — Local Server (Phase 7A)      │')
  console.log('├────────────────────────────────────────────────┤')
  console.log(`│   Port      : ${PORT}`)
  console.log(`│   Code      : ${sessionCode}`)
  console.log('│   Network IPs:')
  if (ips.length === 0) {
    console.log('│     (no network interface detected)')
  } else {
    ips.forEach(n => console.log(`│     ${n.iface}: http://${n.address}:${PORT}`))
  }
  console.log('├────────────────────────────────────────────────┤')
  console.log('│   Host:    http://localhost:5173               │')
  console.log(`│   Player:  http://{ip}:${PORT}/#/player        │`)
  console.log('└────────────────────────────────────────────────┘')
  console.log('')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...')
  server.close(() => process.exit(0))
})
