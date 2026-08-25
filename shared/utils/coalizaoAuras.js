/* coalizaoAuras.js — Canonical tactical auras from the Coalizão RPG rules and database */

export const COALIZAO_AURAS = {
  harmony: {
    id: 'harmony',
    name: 'Aura da Harmonia',
    icon: '✨',
    color: '#38BDF8',
    radiusMeters: 6,
    desc: 'Aura de equilíbrio e paz. Aliados em 6m recebem +2 em testes de Resistência contra efeitos psicológicos e debuffs.',
    allyBonus: { resBonus: 2 },
    enemyPenalty: {},
  },
  chaos: {
    id: 'chaos',
    name: 'Aura do Caos',
    icon: '🌀',
    color: '#EC4899',
    radiusMeters: 6,
    desc: 'Ondas instáveis de energia entrópica. Inimigos em 6m sofrem -1 em jogadas de ataque e perícias.',
    allyBonus: {},
    enemyPenalty: { attackPenalty: -1 },
  },
  inspiration: {
    id: 'inspiration',
    name: 'Aura da Inspiração',
    icon: '⭐',
    color: '#F59E0B',
    radiusMeters: 6,
    desc: 'Inspira companheiros ao combate heroico. Aliados em 6m causam +2 de dano em todos os ataques bem-sucedidos.',
    allyBonus: { damageBonus: 2 },
    enemyPenalty: {},
  },
  oppressor: {
    id: 'oppressor',
    name: 'Aura do Opressor',
    icon: '👑',
    color: '#8B5CF6',
    radiusMeters: 6,
    desc: 'Presença avassaladora e aterrorizante. Inimigos em 6m têm Desvantagem em testes de Moral e Coragem.',
    allyBonus: {},
    enemyPenalty: { disadvantageOnMorale: true },
  },
  revelation: {
    id: 'revelation',
    name: 'Aura da Revelação',
    icon: '👁️',
    color: '#10B981',
    radiusMeters: 6,
    desc: 'Luz pura que perfura ilusões. Inimigos em modo furtivo a até 6m são imediatamente revelados.',
    allyBonus: { trueSight: true },
    enemyPenalty: { revealStealth: true },
  },
  disorder: {
    id: 'disorder',
    name: 'Aura da Desordem',
    icon: '⚡',
    color: '#EF4444',
    radiusMeters: 6,
    desc: 'Flutuações caóticas de energia. O custo de habilidades de Energia (ENR) de inimigos aumenta em +1.',
    allyBonus: {},
    enemyPenalty: { enrCostIncrease: 1 },
  },
}

/**
 * Checks if a target token position is inside the emitter aura range
 * @param {{x: number, y: number}} sourcePos
 * @param {{x: number, y: number}} targetPos
 * @param {number} radiusMeters Default 6m (4 grid cells)
 * @param {number} gridSize Default 40px
 * @returns {boolean}
 */
export function isWithinAuraRange(sourcePos, targetPos, radiusMeters = 6, gridSize = 40) {
  if (!sourcePos || !targetPos) return false

  const radiusPx = (radiusMeters / 1.5) * gridSize
  const dist = Math.hypot(sourcePos.x - targetPos.x, sourcePos.y - targetPos.y)

  return dist <= radiusPx
}

/**
 * Gets the modifier applied by an aura to a target
 * @param {string} auraId
 * @param {boolean} isAlly
 * @returns {object} Modifier object
 */
export function getAuraModifiers(auraId, isAlly = true) {
  const aura = COALIZAO_AURAS[auraId]
  if (!aura) return {}

  return isAlly ? aura.allyBonus : aura.enemyPenalty
}
