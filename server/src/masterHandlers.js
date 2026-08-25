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
import { validateMasterMessage } from '../../shared/schemas/wsMessages.js'

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

  const validation = validateMasterMessage(msg)
  if (!validation.success) {
    // If it's a known master message type with invalid payload, reject it
    const masterTypes = ['host_hello', 'host_auth', 'game_state_update', 'map_update', 'entity_update', 'turn_change', 'combat_event', 'session_snapshot', 'chat_message']
    if (masterTypes.includes(msg.type)) {
      log('warn', `[WS] Invalid master message payload for ${msg.type}: ${JSON.stringify(validation.error?.issues)}`)
      ws.send(JSON.stringify({ type: 'error', message: 'Payload de mensagem inválido.' }))
      return true
    }
    return false
  }

  switch (msg.type) {

    // ── Host authenticates ──────────────────────────────────────────────────
    case 'host_auth': {
      const expectedPassword = ctx.masterPassword
      if (expectedPassword && msg.masterPassword !== expectedPassword) {
        log('warn', `[WS] Master auth failed from ${clientId}: invalid password`)
        ws.send(JSON.stringify({ type: 'error', message: 'Senha do Mestre incorreta.' }))
        return true
      }
      client.role = 'host'
      ctx.clients.set(clientId, client)
      log('info', `[WS] Master authenticated successfully (client ${clientId})`)
      const ips = ctx.getLocalIPs ? ctx.getLocalIPs().map(n => n.address) : []
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode: ctx.sessionCode, isMaster: true, ips, port: ctx.port }))
      return true
    }

    // ── Host identifies itself ──────────────────────────────────────────────
    case 'host_hello': {
      client.role = 'host'
      ctx.clients.set(clientId, client)
      log('info', '[WS] Host connected')
      const ips = ctx.getLocalIPs ? ctx.getLocalIPs().map(n => n.address) : []
      ws.send(JSON.stringify({ type: 'host_welcome', sessionCode: ctx.sessionCode, ips, port: ctx.port }))
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

    // ── Character roster update (with passwords for player auth) ───────────
    case 'roster_update': {
      if (client.role !== 'host') return true
      if (Array.isArray(msg.characters)) {
        ctx.setCachedRoster(msg.characters)
        log('info', `[WS] Roster updated with ${msg.characters.length} characters`)
      }
      return true
    }

    // ── Map Ping (Host to Players) ──────────────────────────────────────────
    case 'map_ping': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'map_ping', data: msg.data });
      return true;
    }

    // ── Ambient Soundscape Broadcast ──────────────────────────────────────────
    case 'ambient_change': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'ambient_change', data: msg.data });
      return true;
    }

    // ── Handout Cinematic Reveal ──────────────────────────────────────────────
    case 'handout_reveal': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'handout_reveal', data: msg.data });
      return true;
    }

    // ── Award XP to Players ───────────────────────────────────────────────────
    case 'award_xp': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'award_xp', data: msg.data });
      return true;
    }

    // ── Quest Board Updates ───────────────────────────────────────────────────
    case 'quest_update': {
      if (client.role !== 'host') return true;
      ctx.setCachedQuests?.(msg.quests || []);
      ctx.broadcastToRole('player', { type: 'quest_update', quests: msg.quests });
      return true;
    }

    // ── Cinematic Scene Reveal ───────────────────────────────────────────────
    case 'scene_reveal': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'scene_reveal', data: msg.data });
      return true;
    }

    // ── WebRTC Voice Chat Signal ──────────────────────────────────────────────
    case 'voice_signal': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'voice_signal', data: msg.data });
      return true;
    }

    // ── Dynamic Weather Change ────────────────────────────────────────────────
    case 'weather_change': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'weather_change', data: msg.data });
      return true;
    }

    // ── Award Heroic Points / Inspiration ─────────────────────────────────────
    case 'award_inspiration': {
      if (client.role !== 'host') return true;
      ctx.broadcastToRole('player', { type: 'award_inspiration', data: msg.data });
      return true;
    }

    // ── Chat Messages ─────────────────────────────────────────────────────────
    case 'chat_message': {
      if (client.role !== 'host') return true;
      msg.sender = msg.sender || 'Mestre';
      const out = JSON.stringify(msg);

      if (msg.isWhisper && msg.target) {
        let targetClient = null;
        for (const c of ctx.clients.values()) {
          if (c.playerName === msg.target || c.role === msg.target) {
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

    default:
      return false
  }
}
