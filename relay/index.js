/* global process */
/**
 * VTP Coalizão — Relay Server (Phase 7B)
 * WebSocket relay server for Host ↔ Player connections via internet.
 *
 * Características:
 *   • Totalmente stateless: nenhum dado da campanha é persistido
 *   • Suporta múltiplas salas simultâneas (uma por código de sessão)
 *   • TLS/WSS gerenciado pela plataforma de deploy (Railway, Render, Fly.io)
 *   • Compatível com o protocolo WebSocket do servidor local (Fase 7A)
 *
 * Deploy (Railway / Render / Fly.io):
 *   • Defina a variável de ambiente PORT (as plataformas fazem isso automaticamente)
 *   • Variável ALLOWED_ORIGIN: domínio do frontend (default: * para dev)
 *
 * Uso local para desenvolvimento:
 *   node relay/index.js
 *   PORT=4001 node relay/index.js
 */

import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'

// ── Server setup ──────────────────────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
const wss    = new WebSocketServer({ server })

app.use(express.json())

// ── CORS headers ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// ── Room state (in-memory only, resets on restart) ────────────────────────────
// rooms: Map<sessionCode, Room>
// Room: { code, host: ClientInfo|null, players: Map<clientId, ClientInfo>, cachedGameState }
// ClientInfo: { clientId, ws, playerName?, playerId? }
const rooms = new Map()

function getOrCreateRoom(code) {
  if (!rooms.has(code)) {
    rooms.set(code, {
      code,
      host: null,
      players: new Map(),
      cachedGameState: null,
      cachedMapState:  null,
    })
  }
  return rooms.get(code)
}

function cleanupRoom(code) {
  const room = rooms.get(code)
  if (!room) return
  if (!room.host && room.players.size === 0) {
    rooms.delete(code)
    console.log(`[Relay] Room ${code} removed (empty)`)
  }
}

// ── REST endpoints ────────────────────────────────────────────────────────────

// Health check — usado por plataformas de deploy e IniciarDev.bat
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: [...rooms.values()].reduce((n, r) => n + r.players.size, 0),
  })
})

// Status de uma sala específica — útil para o painel do Mestre
app.get('/api/room/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase())
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada ou host desconectado.' })
  }
  res.json({
    code: room.code,
    hostOnline: !!room.host,
    playerCount: room.players.size,
    players: [...room.players.values()].map(p => ({ name: p.playerName, id: p.playerId })),
  })
})

// ── WebSocket ─────────────────────────────────────────────────────────────────
// Tracks all active connections: clientId → { ws, roomCode?, role? }
const clients = new Map()

wss.on('connection', (ws) => {
  const clientId = randomUUID()
  clients.set(clientId, { ws, roomCode: null, role: 'unknown' })

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    handleMessage(clientId, ws, msg)
  })

  ws.on('close', () => onClientDisconnect(clientId))
  ws.on('error', (err) => {
    console.error(`[WS] Client error ${clientId}:`, err.message)
    onClientDisconnect(clientId)
  })

  // Ping/pong para manter conexão viva (proxies fecham idle connections)
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
})

// Heartbeat: verifica conexões a cada 30 s
const heartbeatInterval = setInterval(() => {
  for (const { ws } of clients.values()) {
    if (!ws.isAlive) { ws.terminate(); continue }
    ws.isAlive = false
    ws.ping()
  }
}, 30_000)

wss.on('close', () => clearInterval(heartbeatInterval))

function onClientDisconnect(clientId) {
  const meta = clients.get(clientId)
  if (!meta) return
  clients.delete(clientId)

  const { roomCode, role } = meta
  if (!roomCode) return

  const room = rooms.get(roomCode)
  if (!room) return

  if (role === 'host') {
    room.host = null
    // Notify all players in room that host disconnected
    for (const player of room.players.values()) {
      safeSend(player.ws, { type: 'host_disconnected', message: 'O Mestre se desconectou.' })
    }
    console.log(`[Relay] Host disconnected from room ${roomCode}`)
  } else if (role === 'player') {
    const player = room.players.get(clientId)
    if (player) {
      room.players.delete(clientId)
      if (room.host) {
        safeSend(room.host.ws, {
          type: 'player_left',
          playerName: player.playerName,
          playerId: player.playerId,
        })
      }
      console.log(`[Relay] Player ${player.playerName} left room ${roomCode}`)
    }
  }

  cleanupRoom(roomCode)
}

function handleMessage(clientId, ws, msg) {
  const meta = clients.get(clientId)
  if (!meta) return

  switch (msg.type) {

    // ── Host announces itself ──────────────────────────────────────────────────
    // Host sends: { type: 'host_hello', sessionCode?: string }
    // If sessionCode provided and no room exists → use it; else generate new
    case 'host_hello': {
      let code = msg.sessionCode?.toUpperCase()?.trim()
      if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
        code = generateRelayCode()
      }

      // If this host was already in a room, remove from old room
      if (meta.roomCode) {
        const oldRoom = rooms.get(meta.roomCode)
        if (oldRoom) oldRoom.host = null
        cleanupRoom(meta.roomCode)
      }

      const room = getOrCreateRoom(code)
      room.host = { clientId, ws, playerName: null, playerId: null }

      meta.roomCode = code
      meta.role = 'host'
      clients.set(clientId, meta)

      console.log(`[Relay] Host connected → room ${code}`)
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode: code }))
      break
    }

    // ── Player joins a room ────────────────────────────────────────────────────
    case 'join': {
      const code = msg.campaignCode?.toUpperCase()?.trim()

      if (!code || !rooms.has(code)) {
        safeSend(ws, { type: 'error', message: 'Código de campanha inválido ou sala não existe.' })
        return
      }

      const room = rooms.get(code)
      if (!room.host) {
        safeSend(ws, { type: 'error', message: 'O Mestre ainda não está conectado. Tente novamente em alguns segundos.' })
        return
      }
      if (!msg.playerName?.trim()) {
        safeSend(ws, { type: 'error', message: 'Nome do jogador obrigatório.' })
        return
      }

      // Limit to 8 players
      if (room.players.size >= 8) {
        safeSend(ws, { type: 'error', message: 'Sala cheia (máximo 8 jogadores).' })
        return
      }

      const playerId = randomUUID()
      const playerName = msg.playerName.trim()

      room.players.set(clientId, { clientId, ws, playerName, playerId })
      meta.roomCode = code
      meta.role = 'player'
      clients.set(clientId, meta)

      console.log(`[Relay] Player ${playerName} → room ${code} (${room.players.size}/8)`)

      // Welcome + cached game/map state
      safeSend(ws, {
        type: 'welcome',
        playerId,
        playerName,
        gameState: room.cachedGameState || null,
        mapState:  room.cachedMapState  || null,
      })

      // Notify host
      safeSend(room.host.ws, { type: 'player_joined', playerName, playerId })
      break
    }

    // ── Pre-join: player fetches character list before committing ─────────────
    case 'get_characters': {
      const code = msg.campaignCode?.toUpperCase()?.trim()
      const room = rooms.get(code)
      if (!room) {
        safeSend(ws, { type: 'error', message: 'Código de campanha inválido ou sala não existe.' })
        return
      }
      const characters = room.cachedGameState?.order
        ? room.cachedGameState.order.map(e => e.name)
        : []
      safeSend(ws, { type: 'character_list', characters })
      break
    }

    // ── Host → cache full game state (sent to late-joining players) ───────────
    case 'game_state_update': {
      if (meta.role !== 'host') return
      const room = rooms.get(meta.roomCode)
      if (!room) return
      room.cachedGameState = msg.data
      relayToPlayers(room, { type: 'game_state', data: msg.data })
      break
    }

    // ── Delta events: host → all players ──────────────────────────────────────
    case 'map_update': {
      if (meta.role !== 'host') return
      const room = rooms.get(meta.roomCode)
      if (!room) return
      room.cachedMapState = msg.data
      relayToPlayers(room, { type: 'map_update', data: msg.data })
      break
    }

    case 'entity_update':
    case 'turn_change':
    case 'combat_event': {
      if (meta.role !== 'host') return
      const room = rooms.get(meta.roomCode)
      if (!room) return
      relayToPlayers(room, { type: msg.type, data: msg.data })
      break
    }

    // ── Events: player → host ──────────────────────────────────────────────────
    case 'dice_roll':
    case 'token_move': {
      if (meta.role !== 'player') return
      const room = rooms.get(meta.roomCode)
      if (!room?.host) return
      const player = room.players.get(clientId)
      safeSend(room.host.ws, {
        type: msg.type,
        data: msg.data,
        from: player?.playerName,
        playerId: player?.playerId,
      })
      break
    }

    // ── Notes: relay to host only (no disk save on relay) ─────────────────────
    case 'notes_save': {
      if (meta.role !== 'player') return
      const room = rooms.get(meta.roomCode)
      if (!room?.host) return
      const player = room.players.get(clientId)
      safeSend(room.host.ws, {
        type: 'notes_received',
        playerName: player?.playerName,
        notes: msg.notes ?? '',
      })
      break
    }

    // ── Ping (client keepalive) ────────────────────────────────────────────────
    case 'ping': {
      safeSend(ws, { type: 'pong' })
      break
    }

    default:
      console.warn(`[Relay] Unknown message type: ${msg.type} (client ${clientId})`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeSend(ws, payload) {
  if (ws && ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(payload))
  }
}

function relayToPlayers(room, payload) {
  const data = JSON.stringify(payload)
  for (const player of room.players.values()) {
    if (player.ws.readyState === 1) player.ws.send(data)
  }
}

const RELAY_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateRelayCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += RELAY_CHARSET[Math.floor(Math.random() * RELAY_CHARSET.length)]
  }
  return code
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4001', 10)

server.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('┌────────────────────────────────────────────────┐')
  console.log('│   VTP Coalizão — Relay Server (Phase 7B)      │')
  console.log('├────────────────────────────────────────────────┤')
  console.log(`│   Port   : ${PORT}`)
  console.log('│   Health : GET /health')
  console.log('│   Room   : GET /api/room/:code')
  console.log('│   Mode   : stateless relay (no persistence)   │')
  console.log('└────────────────────────────────────────────────┘')
  console.log('')
})

process.on('SIGINT', () => {
  clearInterval(heartbeatInterval)
  console.log('\n[Relay] Shutting down...')
  server.close(() => process.exit(0))
})
