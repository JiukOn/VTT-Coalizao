/**
 * ServerContext.jsx — Host-side WebSocket connection to VTP server.
 *
 * Supports two modes:
 *  - Local (Fase 7A): connects to ws://localhost:{port}, server runs on host's machine
 *  - Relay (Fase 7B): connects to wss://{relay-host}, server runs in the cloud
 *
 * Responsibilities:
 *  - Maintain the WebSocket connection (local or relay)
 *  - Expose session code, connected players, and connection status
 *  - Provide broadcast() to send game events to all connected players
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useWebSocket, WS_STATUS } from '../../../../src/hooks/useWebSocket.js'
import { useLocalStorage } from '../../../../src/hooks/index.js'

const ServerContext = createContext(null)

// Same charset as server/sessionManager.js — used for local code generation in relay mode
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateLocalCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export function ServerProvider({ children }) {
  const [serverPort, setServerPort] = useLocalStorage('vtp_serverPort', 3001)
  const [relayUrl,   setRelayUrl]   = useLocalStorage('vtp_relayUrl',   '')
  const [relayMode,  setRelayMode]  = useLocalStorage('vtp_relayMode',  false)

  const [wsUrl, setWsUrl]               = useState(null)  // null = not connected
  const [sessionCode, setSessionCode]   = useState('')
  const [players, setPlayers]           = useState([])

  // Code we want to request on the next host_hello (used in relay mode to keep
  // the same code across reconnects, or after requestNewCode())
  const requestedCodeRef = useRef(null)

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'host_welcome':
        setSessionCode(msg.sessionCode)
        requestedCodeRef.current = msg.sessionCode  // remember so we can reuse on reconnect
        break
      case 'code_changed':
        setSessionCode(msg.sessionCode)
        break
      case 'player_joined':
        setPlayers(prev => {
          if (prev.some(p => p.id === msg.playerId)) return prev
          return [...prev, { name: msg.playerName, id: msg.playerId }]
        })
        break
      case 'player_left':
        setPlayers(prev => prev.filter(p => p.id !== msg.playerId))
        break
      case 'dice_roll':
        window.dispatchEvent(new CustomEvent('vtp:player_dice', { detail: msg }))
        break
      case 'token_move':
        window.dispatchEvent(new CustomEvent('vtp:token_move', { detail: msg }))
        break
      case 'notes_received':
        window.dispatchEvent(new CustomEvent('vtp:player_notes', { detail: msg }))
        break
      default:
        break
    }
  }, [])

  const { status, send, disconnect } = useWebSocket(wsUrl, handleMessage)

  // When connected, announce ourselves as host (with optional requested code for relay)
  const prevStatus = useRef(WS_STATUS.DISCONNECTED)
  useEffect(() => {
    if (status === WS_STATUS.CONNECTED && prevStatus.current !== WS_STATUS.CONNECTED) {
      const payload = {}
      if (requestedCodeRef.current) {
        payload.sessionCode = requestedCodeRef.current
      }
      send('host_hello', payload)
    }
    prevStatus.current = status
  }, [status, send])

  // ── Public API ─────────────────────────────────────────────────────────────────

  /** Connect to local server (Fase 7A) */
  const connect = useCallback((port = serverPort) => {
    requestedCodeRef.current = null
    setWsUrl(`ws://localhost:${port}`)
    setPlayers([])
    setSessionCode('')
  }, [serverPort])

  /** Connect to relay server (Fase 7B) */
  const connectViaRelay = useCallback((url = relayUrl) => {
    if (!url?.trim()) return
    // On first relay connect, let relay generate a code.
    // On reconnect, requestedCodeRef keeps the existing code.
    setWsUrl(url.trim())
    setPlayers([])
    setSessionCode('')
  }, [relayUrl])

  const disconnectServer = useCallback(() => {
    disconnect()
    setWsUrl(null)
    setPlayers([])
    setSessionCode('')
    requestedCodeRef.current = null
  }, [disconnect])

  /**
   * Broadcast a game event to all connected players.
   * type: 'map_update' | 'entity_update' | 'turn_change' | 'combat_event' | 'game_state_update'
   */
  const broadcast = useCallback((type, data) => {
    return send(type, { data })
  }, [send])

  /**
   * Request a new session code.
   * - Local mode: POST /api/new-code on the local server
   * - Relay mode: generate code locally, update requestedCodeRef, and reconnect
   */
  const requestNewCode = useCallback(() => {
    if (relayMode) {
      const newCode = generateLocalCode()
      requestedCodeRef.current = newCode
      // Reconnect with new code by setting wsUrl to same value (triggers reconnect via disconnect)
      const currentUrl = wsUrl
      disconnect()
      setTimeout(() => {
        setPlayers([])
        setSessionCode('')
        setWsUrl(currentUrl)
      }, 300)
    } else {
      fetch('/api/new-code', { method: 'POST' })
        .then(r => r.json())
        .then(({ sessionCode: code }) => setSessionCode(code))
        .catch(() => {})
    }
  }, [relayMode, wsUrl, disconnect])

  return (
    <ServerContext.Provider value={{
      status,
      wsUrl,
      sessionCode,
      players,
      // Local mode
      serverPort,
      setServerPort,
      connect,
      // Relay mode
      relayMode,
      setRelayMode,
      relayUrl,
      setRelayUrl,
      connectViaRelay,
      // Shared
      disconnect: disconnectServer,
      broadcast,
      requestNewCode,
    }}>
      {children}
    </ServerContext.Provider>
  )
}

export function useServer() {
  const ctx = useContext(ServerContext)
  if (!ctx) throw new Error('useServer must be used inside <ServerProvider>')
  return ctx
}
