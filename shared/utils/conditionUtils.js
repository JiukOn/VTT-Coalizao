/* conditionUtils.js — Predefined status conditions and aura definitions for tokens */

export const CONDITIONS = [
  { id: 'bleeding',    name: 'Sangrando',    color: '#EF4444', icon: '🩸' },
  { id: 'poisoned',    name: 'Envenenado',   color: '#10B981', icon: '☠️' },
  { id: 'burning',     name: 'Queimando',    color: '#F59E0B', icon: '🔥' },
  { id: 'frozen',      name: 'Congelado',    color: '#06B6D4', icon: '❄️' },
  { id: 'stunned',     name: 'Atordoado',    color: '#FBBF24', icon: '💫' },
  { id: 'blessed',     name: 'Abençoado',    color: '#A78BFA', icon: '✨' },
  { id: 'invisible',   name: 'Invisível',    color: '#94A3B8', icon: '👻' },
  { id: 'frightened',  name: 'Amedrontado',  color: '#7C3AED', icon: '😱' },
  { id: 'prone',       name: 'Caído',        color: '#78716C', icon: '⬇️' },
  { id: 'concentrating', name: 'Concentrando', color: '#3B82F6', icon: '🧠' },
  { id: 'shielded',    name: 'Protegido',    color: '#60A5FA', icon: '🛡️' },
  { id: 'exhausted',   name: 'Exausto',      color: '#9CA3AF', icon: '😩' },
]

export const CONDITION_COLORS = Object.fromEntries(
  CONDITIONS.map(c => [c.id, c.color])
)

export const CONDITION_ICONS = Object.fromEntries(
  CONDITIONS.map(c => [c.id, c.icon])
)
