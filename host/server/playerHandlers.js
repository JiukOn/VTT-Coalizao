/**
 * playerHandlers.js — WebSocket message handlers for Player role
 *
 * Handles messages that originate from or target Players:
 *   - get_characters:   Pre-join character list request
 *   - join:             Player authenticates and joins the session
 *   - dice_roll:        Player rolled dice → relay to host
 *   - token_move:       Player moved their token → relay to host
 *   - notes_save:       Player saves session notes → disk + relay to host
 *   - ping:             Keepalive heartbeat
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'node:crypto'
import { log } from './serverLogger.js'

/**
 * @param {object}   ctx              Shared server context
 * @param {string}   ctx.sessionCode  Current session code
 * @param {Map}      ctx.clients      Connected clients map
 * @param {Function} ctx.broadcastToRole  Broadcast helper
 * @param {object|null} ctx.cachedGameState  Cached game state
 * @param {object|null} ctx.cachedMapState   Cached map state
 * @param {string}   ctx.savesDir     Absolute path to saves directory
 * @param {string}   clientId         UUID of the sending client
 * @param {WebSocket} ws              WebSocket connection
 * @param {object}   msg              Parsed message
 * @returns {boolean} true if handled, false if not a player message
 */
export function handlePlayerMessage(ctx, clientId, ws, msg) {
  const client = ctx.clients.get(clientId)
  if (!client) return false

  switch (msg.type) {

    // ── Pre-join: Get available characters ───────────────────────────────────
    case 'get_characters': {
      if (msg.campaignCode !== ctx.sessionCode) {
        ws.send(JSON.stringify({ type: 'error', message: 'Código de campanha inválido.' }))
        return true
      }
      const characters = ctx.cachedGameState?.order
        ? ctx.cachedGameState.order.map(e => e.name)
        : []
      ws.send(JSON.stringify({ type: 'character_list', characters }))
      return true
    }

    // ── Player joins the session ─────────────────────────────────────────────
    case 'join': {
      if (msg.campaignCode !== ctx.sessionCode) {
        ws.send(JSON.stringify({ type: 'error', message: 'Código de campanha inválido.' }))
        return true
      }
      if (!msg.playerName?.trim()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Nome do jogador obrigatório.' }))
        return true
      }

      // Check player limit (8 max)
      const currentPlayers = [...ctx.clients.values()].filter(c => c.role === 'player').length
      if (currentPlayers >= 8) {
        ws.send(JSON.stringify({ type: 'error', message: 'Sala cheia (máximo 8 jogadores).' }))
        return true
      }

      const playerId = randomUUID()
      client.role = 'player'
      client.playerName = msg.playerName.trim()
      client.playerId = playerId
      ctx.clients.set(clientId, client)
      log('info', `[WS] Player connected: ${client.playerName} (${playerId})`)

      // Send welcome + cached game state
      ws.send(JSON.stringify({
        type: 'welcome',
        playerId,
        playerName: client.playerName,
        gameState: ctx.cachedGameState || null,
        mapState: ctx.cachedMapState || null,
      }))

      // Notify host
      ctx.broadcastToRole('host', {
        type: 'player_joined',
        playerName: client.playerName,
        playerId,
      })
      return true
    }

    // ── Player events → relay to host ────────────────────────────────────────
    case 'dice_roll':
    case 'token_move': {
      if (client.role !== 'player') {
        log('warn', `[WS] Rejected ${msg.type} from non-player client ${clientId}`)
        return true
      }
      ctx.broadcastToRole('host', {
        type: msg.type,
        data: msg.data,
        from: client.playerName,
        playerId: client.playerId,
      })
      return true
    }

    // ── Notes: save to disk + relay to host ──────────────────────────────────
    case 'notes_save': {
      if (client.role !== 'player') return true
      const name  = client.playerName || 'desconhecido'
      const code  = ctx.sessionCode
      const notes = msg.notes ?? ''
      try {
        const dir = path.join(ctx.savesDir, code)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(
          path.join(dir, `${name}_notes.json`),
          JSON.stringify({
            playerName: name,
            sessionCode: code,
            notes,
            savedAt: new Date().toISOString(),
          }, null, 2)
        )
        log('info', `[Server] Saved notes for ${name}`)
      } catch (e) {
        log('error', `[Server] Error saving player notes: ${e.message}`)
      }
      ctx.broadcastToRole('host', { type: 'notes_received', playerName: name, notes })
      return true
    }

    // ── Keepalive ────────────────────────────────────────────────────────────
    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong' }))
      return true
    }

    default:
      return false
  }
}
