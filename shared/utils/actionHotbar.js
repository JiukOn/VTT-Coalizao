/**
 * actionHotbar.js — Custom Action Hotbar and Macro Executor for Coalizão RPG
 * 
 * Supports 9 hotbar slots (keyboard 1-9) with canonical attribute variables:
 * +frc, +dex, +vit, +int, +crm, +res, +pre, +enr
 */

import { getBonus } from './characterUtils.js'

export const DEFAULT_HOTBAR_SLOTS = [
  { id: 1, key: '1', label: 'Ataque FRC', command: '/r 1d20+frc [Ataque FRC]', icon: 'swords', color: '#EF4444' },
  { id: 2, key: '2', label: 'Disparo DEX', command: '/r 1d20+dex [Disparo DEX]', icon: 'crosshair', color: '#10B981' },
  { id: 3, key: '3', label: 'Canalização INT', command: '/r 1d20+int [Magia INT]', icon: 'zap', color: '#3B82F6' },
  { id: 4, key: '4', label: 'Teste RES', command: '/r 1d20+res [Defesa RES]', icon: 'shield', color: '#F59E0B' },
  { id: 5, key: '5', label: 'Percepção PRE', command: '/r 1d20+pre [Percepção PRE]', icon: 'eye', color: '#8B5CF6' },
  { id: 6, key: '6', label: 'Social CRM', command: '/r 1d20+crm [Lábia CRM]', icon: 'message-circle', color: '#EC4899' },
  { id: 7, key: '7', label: 'Dano 2d4', command: '/r 2d4 [Dano]', icon: 'flame', color: '#F97316' },
  { id: 8, key: '8', label: 'Dano 4d4', command: '/r 4d4 [Dano Pesado]', icon: 'skull', color: '#DC2626' },
  { id: 9, key: '9', label: 'Rolagem D20', command: '/r 1d20 [Rolagem Livre]', icon: 'dices', color: '#6B7280' },
]

/**
 * Resolves macro text replacing attribute variables with entity bonus.
 * @param {string} command - ex: "/r 1d20+frc [Ataque]"
 * @param {object} entity - character entity
 * @returns {string} resolved command
 */
export function resolveMacroCommand(command, entity = {}) {
  if (!command || typeof command !== 'string') return ''

  const attrs = entity?.attributes || {}
  const getAttrBonus = (attrName) => {
    const val = attrs[attrName.toLowerCase()] ?? attrs[attrName.toUpperCase()] ?? 10
    return getBonus(val)
  }

  return command.replace(/\+([a-zA-Z]{3})\b/gi, (match, attrKey) => {
    const key = attrKey.toLowerCase()
    const valid = ['vit', 'dex', 'crm', 'frc', 'int', 'res', 'pre', 'enr']
    if (valid.includes(key)) {
      const bonus = getAttrBonus(key)
      return bonus >= 0 ? `+${bonus}` : `${bonus}`
    }
    return match
  })
}

/**
 * Load hotbar from localStorage or fallback to default
 * @param {string} storageKey
 * @returns {Array<object>}
 */
export function loadHotbar(storageKey = 'vtt_hotbar_slots') {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length === 9) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_HOTBAR_SLOTS
}

/**
 * Save hotbar to localStorage
 * @param {Array<object>} slots
 * @param {string} storageKey
 */
export function saveHotbar(slots, storageKey = 'vtt_hotbar_slots') {
  try {
    localStorage.setItem(storageKey, JSON.stringify(slots))
  } catch { /* ignore */ }
}
