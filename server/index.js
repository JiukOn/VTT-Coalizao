/**
 * VTP Coalizão — Local Server (Fase 7A)
 * Node.js + Express + WebSocket para conexão de jogadores via LAN/VPN
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
const ROOT_DIR   = path.join(__dirname, '..')
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
let cachedGameState = null  // { order, round, entityMap, mapState }

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
  const allowedFolders = ['personalities', 'classes', 'effects', 'auras', 'species', 'tendencies', 'environments', 'modifications', 'heroes', 'npcs', 'creatures', 'items', 'abilities']
  
  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({ error: 'Invalid folder' })
  }
  
  try {
    const dir = path.join(ROOT_DIR, 'src', 'data', folder)
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, `${id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    res.json({ success: true, path: filePath })
  } catch (e) {
    console.error('[Server] Erro ao salvar JSON:', e.message)
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
      console.log('[WS] Mestre conectado')
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode }))
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
      console.log(`[WS] Jogador conectado: ${client.playerName} (${playerId})`)

      // Send welcome + current game state to the new player
      ws.send(JSON.stringify({
        type: 'welcome',
        playerId,
        playerName: client.playerName,
        gameState: cachedGameState || null,
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
    case 'map_update':
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
        console.error('[Server] Erro ao salvar notas:', e.message)
      }
      broadcastToRole('host', { type: 'notes_received', playerName: name, notes })
      break
    }

    default:
      console.warn(`[WS] Mensagem desconhecida: ${msg.type}`)
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
  console.log('│   VTP COALIZÃO — Servidor Local (Fase 7A)     │')
  console.log('├────────────────────────────────────────────────┤')
  console.log(`│   Porta     : ${PORT}`)
  console.log(`│   Código    : ${sessionCode}`)
  console.log('│   IPs da rede:')
  if (ips.length === 0) {
    console.log('│     (nenhuma interface de rede detectada)')
  } else {
    ips.forEach(n => console.log(`│     ${n.iface}: http://${n.address}:${PORT}`))
  }
  console.log('├────────────────────────────────────────────────┤')
  console.log('│   Mestre:  http://localhost:5173               │')
  console.log(`│   Jogador: http://{ip}:${PORT}/#/player        │`)
  console.log('└────────────────────────────────────────────────┘')
  console.log('')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Encerrando...')
  server.close(() => process.exit(0))
})
