/**
 * masterHandlers.js — WebSocket message handlers for Master (Host) role
 *
 * Handles messages that originate from or target the Master:
 *   - host_hello:         Master identifies itself to the server
 *   - game_state_update:  Master broadcasts full game state to players
 *   - map_update:         Master broadcasts map changes to players
 *   - entity_update:      Master broadcasts entity delta to players
 *   - turn_change:        Master advances initiative turn
 *   - combat_event:       Master broadcasts combat resolution result
 *   - session_snapshot:   Master sends session state for auto-save
 */

import { log } from './serverLogger.js'

/**
 * @param {object}   ctx              Shared server context
 * @param {string}   ctx.sessionCode  Current session code
 * @param {Map}      ctx.clients      Connected clients map
 * @param {Function} ctx.broadcastToRole  Broadcast helper
 * @param {Function} ctx.setCachedGameState  Cache setter
 * @param {Function} ctx.setCachedMapState   Cache setter
 * @param {Function} ctx.saveAutoSnapshot    Auto-save callback
 * @param {string}   clientId         UUID of the sending client
 * @param {WebSocket} ws              WebSocket connection
 * @param {object}   msg              Parsed message
 * @returns {boolean} true if handled, false if not a master message
 */
export function handleMasterMessage(ctx, clientId, ws, msg) {
  const client = ctx.clients.get(clientId)
  if (!client) return false

  switch (msg.type) {

    // ── Host identifies itself ──────────────────────────────────────────────
    case 'host_hello': {
      client.role = 'host'
      ctx.clients.set(clientId, client)
      log('info', '[WS] Host connected')
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode: ctx.sessionCode }))
      return true
    }

    // ── Host broadcasts full game state ─────────────────────────────────────
    case 'game_state_update': {
      if (client.role !== 'host') {
        log('warn', `[WS] Rejected game_state_update from non-host client ${clientId}`)
        ws.send(JSON.stringify({ type: 'error', message: 'Apenas o Mestre pode enviar game_state_update.' }))
        return true
      }
      ctx.setCachedGameState(msg.data)
      ctx.broadcastToRole('player', { type: 'game_state', data: msg.data })
      return true
    }

    // ── Map update (cached for late-joining players) ────────────────────────
    case 'map_update': {
      if (client.role !== 'host') {
        log('warn', `[WS] Rejected map_update from non-host client ${clientId}`)
        ws.send(JSON.stringify({ type: 'error', message: 'Apenas o Mestre pode atualizar o mapa.' }))
        return true
      }
      ctx.setCachedMapState(msg.data)
      ctx.broadcastToRole('player', { type: msg.type, data: msg.data })
      return true
    }

    // ── Delta events (entity, turn, combat) → relay to players ──────────────
    case 'entity_update':
    case 'turn_change':
    case 'combat_event': {
      if (client.role !== 'host') {
        log('warn', `[WS] Rejected ${msg.type} from non-host client ${clientId}`)
        ws.send(JSON.stringify({ type: 'error', message: 'Apenas o Mestre pode enviar este tipo de evento.' }))
        return true
      }
      ctx.broadcastToRole('player', { type: msg.type, data: msg.data })
      return true
    }

    // ── Session snapshot for auto-save ───────────────────────────────────────
    case 'session_snapshot': {
      if (client.role !== 'host') return true
      ctx.saveAutoSnapshot(msg.data)
      return true
    }

    default:
      return false
  }
}
