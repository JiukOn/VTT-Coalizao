/* initiativeDeck.js — Tactical action card deck for cinematic initiative rounds */

export const ACTION_CARDS = [
  {
    id: 'blitz_strike',
    title: 'Ataque Relâmpago',
    icon: '⚡',
    initBonus: 5,
    effect: 'Iniciativa +5 e +1 de dano no primeiro ataque realizado nesta rodada.',
    color: '#F59E0B',
  },
  {
    id: 'defensive_stance',
    title: 'Postura Defensiva',
    icon: '🛡️',
    initBonus: -2,
    effect: 'Iniciativa -2, mas ganha +2 na CA/Defesa até o início da próxima rodada.',
    color: '#3B82F6',
  },
  {
    id: 'calibrated_aim',
    title: 'Mira Calibrada',
    icon: '🎯',
    initBonus: 0,
    effect: 'Iniciativa normal e Vantagem garantida no primeiro disparo à distância.',
    color: '#10B981',
  },
  {
    id: 'evasive_maneuver',
    title: 'Manobra de Esquiva',
    icon: '💨',
    initBonus: 3,
    effect: 'Iniciativa +3 e deslocamento máximo dobrado (+100% movimento) nesta rodada.',
    color: '#38BDF8',
  },
  {
    id: 'tactical_recovery',
    title: 'Recuperação Tática',
    icon: '🔋',
    initBonus: -1,
    effect: 'Iniciativa -1 e recupera imediatamente +4 de Energia (ENR).',
    color: '#A855F7',
  },
]

/**
 * Draws random action cards for combatants
 * @param {number} count
 * @returns {Array<object>}
 */
export function drawInitiativeCards(count = 1) {
  const drawn = []
  const pool = [...ACTION_CARDS]

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...ACTION_CARDS)
    const idx = Math.floor(Math.random() * pool.length)
    drawn.push(pool.splice(idx, 1)[0])
  }

  return drawn
}
