/* radioComms.js — Military and clandestine radio frequencies, encrypted comms */

export const RADIO_FREQUENCIES = {
  mil_command: { id: 'mil_command', label: '104.2 MHz — Comando Militar Coalizão', icon: '📡', color: '#38BDF8' },
  renegade:    { id: 'renegade',    label: '88.5 MHz — Frequência Clandestina',     icon: '📻', color: '#F59E0B' },
  emergency:   { id: 'emergency',   label: '99.0 MHz — Canal de Emergência / Médico', icon: '🚨', color: '#EF4444' },
}

/**
 * Formats a radio transmission text
 * @param {string} sender
 * @param {string} freqKey
 * @param {string} message
 * @returns {string}
 */
export function formatRadioMessage(sender = 'Operador', freqKey = 'mil_command', message = '') {
  const freq = RADIO_FREQUENCIES[freqKey] || RADIO_FREQUENCIES.mil_command
  return `${freq.icon} **[${freq.label}]** *${sender}*: "${(message || '').trim()}"`
}
