/**
 * sessionManager.js — Session code generation and IP detection
 */

import os from 'os'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1 (confusing)

/**
 * Generates a 6-character alphanumeric session code
 */
export function generateCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

/**
 * Returns all non-internal IPv4 addresses of this machine
 */
export function getLocalIPs() {
  const result = []
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        result.push({ iface: name, address: net.address })
      }
    }
  }
  return result
}
