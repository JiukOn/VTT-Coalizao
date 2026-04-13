/**
 * useWebSocket.js — Low-level WebSocket connection hook
 *
 * Handles connection lifecycle, auto-reconnect with exponential backoff,
 * message dispatch, and keepalive pings for relay connections (wss://).
 * Used by both ServerContext (host) and PlayerDashboard (player).
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export const WS_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  ERROR:        'error',
}

const RECONNECT_BASE_MS  = 2000
const RECONNECT_MAX_MS   = 30000
const RECONNECT_FACTOR   = 1.5
// Keepalive ping interval — prevents proxy/platform idle-connection timeouts (e.g. Render, Railway)
const KEEPALIVE_MS       = 25_000

/**
 * @param {string|null}   url        — WebSocket URL to connect (null = don't connect)
 * @param {function}      onMessage  — callback(parsedMessage) for incoming messages
 * @param {object}        options
 * @param {boolean}       options.autoReconnect — default true
 * @returns {{ status, send, disconnect, reconnect }}
 */
export function useWebSocket(url, onMessage, { autoReconnect = true } = {}) {
  const [status, setStatus] = useState(WS_STATUS.DISCONNECTED)
  const wsRef              = useRef(null)
  const onMessageRef       = useRef(onMessage)
  const reconnectTimerRef  = useRef(null)
  const keepaliveTimerRef  = useRef(null)
  const reconnectDelayRef  = useRef(RECONNECT_BASE_MS)
  const intentionalClose   = useRef(false)

  // Keep onMessage ref current without re-running effect
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  const clearKeepalive = () => {
    if (keepaliveTimerRef.current) {
      clearInterval(keepaliveTimerRef.current)
      keepaliveTimerRef.current = null
    }
  }

  const doConnect = useCallback((wsUrl) => {
    if (!wsUrl) return
    setStatus(WS_STATUS.CONNECTING)
    intentionalClose.current = false

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus(WS_STATUS.CONNECTED)
      reconnectDelayRef.current = RECONNECT_BASE_MS // reset backoff on success

      // Start keepalive pings for relay (wss://) connections
      if (wsUrl.startsWith('wss://') || wsUrl.startsWith('ws://')) {
        clearKeepalive()
        keepaliveTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, KEEPALIVE_MS)
      }
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        // Silently ignore pong responses (keepalive reply from relay)
        if (msg.type === 'pong') return
        onMessageRef.current?.(msg)
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      clearKeepalive()
      setStatus(WS_STATUS.DISCONNECTED)
      if (!intentionalClose.current && autoReconnect) {
        const delay = reconnectDelayRef.current
        reconnectDelayRef.current = Math.min(delay * RECONNECT_FACTOR, RECONNECT_MAX_MS)
        reconnectTimerRef.current = setTimeout(() => doConnect(wsUrl), delay)
      }
    }

    ws.onerror = () => {
      clearKeepalive()
      setStatus(WS_STATUS.ERROR)
    }
  }, [autoReconnect])

  // Connect / disconnect when url changes
  useEffect(() => {
    if (!url) return
    doConnect(url)
    return () => {
      clearReconnectTimer()
      if (keepaliveTimerRef.current) {
        clearInterval(keepaliveTimerRef.current)
        keepaliveTimerRef.current = null
      }
      if (wsRef.current) {
        intentionalClose.current = true
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [url, doConnect])

  const send = useCallback((type, data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }))
      return true
    }
    return false
  }, [])

  const disconnect = useCallback(() => {
    clearReconnectTimer()
    if (keepaliveTimerRef.current) {
      clearInterval(keepaliveTimerRef.current)
      keepaliveTimerRef.current = null
    }
    intentionalClose.current = true
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStatus(WS_STATUS.DISCONNECTED)
  }, [])

  const reconnect = useCallback(() => {
    clearReconnectTimer()
    if (wsRef.current) {
      intentionalClose.current = true
      wsRef.current.close()
    }
    doConnect(url)
  }, [url, doConnect])

  return { status, send, disconnect, reconnect }
}
