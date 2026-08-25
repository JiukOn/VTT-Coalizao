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
import { validatePlayerMessage } from '../../shared/schemas/wsMessages.js'

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

  const validation = validatePlayerMessage(msg)
  if (!validation.success) {
    const playerTypes = ['join', 'get_characters', 'dice_roll', 'token_move', 'notes_save', 'ping', 'resync_request', 'chat_message']
    if (playerTypes.includes(msg.type)) {
      log('warn', `[WS] Invalid player message payload for ${msg.type}: ${JSON.stringify(validation.error?.issues)}`)
      ws.send(JSON.stringify({ type: 'error', message: 'Payload de mensagem inválido.' }))
      return true
    }
    return false
  }

  switch (msg.type) {

    // ── Pre-join: Get available characters ───────────────────────────────────
    case 'get_characters': {
      if (msg.campaignCode !== ctx.sessionCode) {
        ws.send(JSON.stringify({ type: 'error', message: 'Código de campanha inválido.' }))
        return true
      }
      let characters = []
      if (ctx.cachedRoster && ctx.cachedRoster.length > 0) {
        characters = ctx.cachedRoster.map(c => ({
          id: c.id,
          name: c.name,
          classId: c.classId,
          level: c.level,
          avatar: c.avatar,
          hasPassword: Boolean(c.password && c.password.trim().length > 0),
        }))
      } else if (ctx.cachedGameState?.order) {
        characters = ctx.cachedGameState.order.map(e => ({
          id: e.id || e.tableId,
          name: e.name,
          hasPassword: false,
        }))
      }
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

      // Password verification if character has password set
      if (ctx.cachedRoster && ctx.cachedRoster.length > 0) {
        const targetHero = ctx.cachedRoster.find(c => 
          (msg.characterId && String(c.id) === String(msg.characterId)) || 
          c.name.toLowerCase() === msg.playerName.trim().toLowerCase()
        )
        if (targetHero && targetHero.password && targetHero.password.trim().length > 0) {
          if (!msg.characterPassword || msg.characterPassword !== targetHero.password.trim()) {
            log('warn', `[WS] Password mismatch for character ${msg.playerName} from client ${clientId}`)
            ws.send(JSON.stringify({ type: 'error', message: 'Senha incorreta para este personagem.' }))
            return true
          }
        }
      }

      // Check if character is already in use by another active player
      const alreadyOnline = [...ctx.clients.values()].some(c => 
        c.role === 'player' && 
        c.playerName.toLowerCase() === msg.playerName.trim().toLowerCase()
      )
      if (alreadyOnline) {
        log('warn', `[WS] Rejected duplicate join for character ${msg.playerName}`)
        ws.send(JSON.stringify({ type: 'error', message: 'Este personagem já está conectado na sessão.' }))
        return true
      }

      const playerId = randomUUID()
      client.role = 'player'
      client.playerName = msg.playerName.trim()
      client.playerId = playerId
      client.characterId = msg.characterId || null
      ctx.clients.set(clientId, client)
      log('info', `[WS] Player authenticated & connected: ${client.playerName} (${playerId})`)

      // Send welcome + cached game state
      ws.send(JSON.stringify({
        type: 'welcome',
        playerId,
        playerName: client.playerName,
        gameState: ctx.cachedGameState || null,
        mapState: ctx.cachedMapState || null,
        quests: ctx.cachedQuests || [],
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

    case 'map_ping': {
      if (client.role !== 'player') return true
      const pingData = { ...msg.data, author: client.playerName || 'Jogador' }
      ctx.broadcastToRole('host', { type: 'map_ping', data: pingData })
      // Also send to other players
      for (const [cid, c] of ctx.clients.entries()) {
        if (c.role === 'player' && cid !== clientId && c.ws.readyState === 1) {
          c.ws.send(JSON.stringify({ type: 'map_ping', data: pingData }))
        }
      }
      return true
    }

    // ── WebRTC Voice Signal Relay ─────────────────────────────────────────────
    case 'voice_signal': {
      if (client.role !== 'player') return true;
      const voiceData = { ...msg.data, sender: client.playerName || 'Jogador' };
      // Broadcast to host
      ctx.broadcastToRole('host', { type: 'voice_signal', data: voiceData });
      // Broadcast to other players
      for (const [cid, c] of ctx.clients.entries()) {
        if (c.role === 'player' && cid !== clientId && c.ws.readyState === 1) {
          c.ws.send(JSON.stringify({ type: 'voice_signal', data: voiceData }));
        }
      }
      return true;
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

    // ── Chat Messages ─────────────────────────────────────────────────────────
    case 'chat_message': {
      if (client.role !== 'player') return true;
      msg.sender = client.playerName;
      
      const out = JSON.stringify(msg);

      if (msg.isWhisper && msg.target) {
        let targetClient = null;
        for (const c of ctx.clients.values()) {
          if (c.playerName === msg.target || c.role === msg.target || (msg.target === 'Mestre' && c.role === 'host')) {
            targetClient = c;
            break;
          }
        }
        if (targetClient && targetClient.ws.readyState === 1) {
          targetClient.ws.send(out);
        }
        if (ws.readyState === 1 && targetClient?.ws !== ws) {
          ws.send(out);
        }
      } else {
        for (const c of ctx.clients.values()) {
          if (c.ws && c.ws.readyState === 1) c.ws.send(out);
        }
      }
      return true;
    }

    // ── Keepalive ────────────────────────────────────────────────────────────
    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong' }))
      return true
    }

    // ── Resync ───────────────────────────────────────────────────────────────
    case 'resync_request': {
      if (client.role !== 'player') return true
      log('info', `[WS] Player ${client.playerName} requesting resync`)
      ws.send(JSON.stringify({
        type: 'resync',
        gameState: ctx.cachedGameState || null,
        mapState: ctx.cachedMapState || null,
        quests: ctx.cachedQuests || [],
        stateVersion: ctx.stateVersion || 0,
      }))
      return true
    }

    default:
      return false
  }
}
