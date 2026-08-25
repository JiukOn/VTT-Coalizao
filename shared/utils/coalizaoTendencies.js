/* coalizaoTendencies.js — Canonical character tendencies and specializations from Coalizão RPG */

export const COALIZAO_TENDENCIES = {
  combat_tactics: {
    id: 'combat_tactics',
    name: 'Táticas de Combate',
    icon: '⚔️',
    bonusType: 'melee_attack',
    bonus: 1,
    desc: '+1 bônus em rolagens de ataque corpo a corpo e manobras táticas.',
  },
  firearms: {
    id: 'firearms',
    name: 'Armas de Fogo',
    icon: '🔫',
    bonusType: 'ranged_attack',
    bonus: 1,
    desc: '+1 bônus em precisão com armas de tiro e balística.',
  },
  first_aid: {
    id: 'first_aid',
    name: 'Primeiros Socorros',
    icon: '🩹',
    bonusType: 'healing',
    bonus: 2,
    desc: '+2 na quantidade de HP restaurada por kits médicos e bandagens.',
  },
  parkour: {
    id: 'parkour',
    name: 'Parkour & Mobilidade',
    icon: '🏃',
    bonusType: 'movement',
    bonus: 1,
    desc: '+1 metro de deslocamento adicional em terrenos difíceis e obstáculos.',
  },
  weapon_modification: {
    id: 'weapon_modification',
    name: 'Modificação de Armas',
    icon: '🔬',
    bonusType: 'crafting',
    bonus: 1,
    desc: 'Mestre da oficina com redução de custo na instalação de acessórios.',
  },
  sorcery: {
    id: 'sorcery',
    name: 'Feitiçaria & Energias',
    icon: '🔮',
    bonusType: 'magic_power',
    bonus: 1,
    desc: '+1 de dano ou potência em habilidades e magias de Energia.',
  },
}

/**
 * Calculates total bonus provided by character's active tendencies for a specific action type
 * @param {Array<string>} entityTendencies Array of tendency IDs or objects
 * @param {string} bonusType Type of action ('melee_attack', 'ranged_attack', 'healing', 'movement')
 * @returns {number} Bonus value
 */
export function getTendencyBonus(entityTendencies = [], bonusType = '') {
  if (!Array.isArray(entityTendencies) || !bonusType) return 0

  let total = 0
  for (const t of entityTendencies) {
    const id = typeof t === 'string' ? t : t?.id
    const def = COALIZAO_TENDENCIES[id]
    if (def && def.bonusType === bonusType) {
      total += def.bonus
    }
  }

  return total
}
