/* mapMarkers.js — Master secret notes and pin markers for tactical maps */

export const MARKER_TYPES = {
  trap:    { id: 'trap',    label: 'Armadilha',  icon: '⚠️', color: '#EF4444', defaultTitle: 'Armadilha Oculta' },
  secret:  { id: 'secret',  label: 'Segredo',    icon: '🔍', color: '#38BDF8', defaultTitle: 'Passagem Secreta' },
  loot:    { id: 'loot',    label: 'Tesouro',    icon: '💎', color: '#F59E0B', defaultTitle: 'Cofre / Espólios' },
  monster: { id: 'monster', label: 'Emboscada',  icon: '👾', color: '#A855F7', defaultTitle: 'Inimigo Oculto' },
  note:    { id: 'note',    label: 'Nota de Sala', icon: '📝', color: '#10B981', defaultTitle: 'Descrição Narrativa' },
}

/**
 * Creates a new secret map marker
 * @param {object} params
 * @param {number} params.x World X
 * @param {number} params.y World Y
 * @param {'trap'|'secret'|'loot'|'monster'|'note'} params.type Marker category
 * @param {string} params.title Short marker name
 * @param {string} params.description Secret notes visible only to master
 * @param {number|null} params.dc Optional Difficulty Class (DC) to detect/disarm
 * @returns {object}
 */
export function createMapMarker({
  x = 100,
  y = 100,
  type = 'secret',
  title = '',
  description = '',
  dc = null,
} = {}) {
  const typeDef = MARKER_TYPES[type] || MARKER_TYPES.secret
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    x,
    y,
    type,
    title: (title || '').trim() || typeDef.defaultTitle,
    description: (description || '').trim(),
    dc: dc !== null && dc !== undefined && !isNaN(dc) ? Number(dc) : null,
    revealed: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Filters markers that should be visible to players
 * @param {Array<object>} markers
 * @param {boolean} isMaster
 * @returns {Array<object>}
 */
export function filterVisibleMarkers(markers = [], isMaster = false) {
  if (!Array.isArray(markers)) return []
  if (isMaster) return markers
  return markers.filter(m => m.revealed === true)
}
