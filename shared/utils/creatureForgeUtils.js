/**
 * creatureForgeUtils.js — Creature & Monster Balancing Engine for Coalizão System
 *
 * Rules:
 * - 8 Attributes: VIT, DEX, CRM, FRC, INT, RES, PRE, ENR
 * - D20 for test resolution + D4 for base damage
 * - Base HP = VIT * 4 + ND * 12 + ArchetypeBonus
 * - Base Energy = ENR * 3 + ND * 4
 * - Defense = 10 + Math.floor(DEX / 2) + Math.floor(RES / 2)
 */

export const ARCHETYPES = {
  bruto: {
    id: 'bruto',
    name: 'Bruto / Tanque',
    desc: 'Alta vitalidade e força física. Linha de frente esmagadora.',
    primaryAttrs: ['frc', 'vit', 'res'],
    hpMult: 1.4,
    enrMult: 0.8,
    attackType: 'melee',
  },
  assassino: {
    id: 'assassino',
    name: 'Assassino / Ágil',
    desc: 'Alta destreza e precisão. Foco em dano crítico e furtividade.',
    primaryAttrs: ['dex', 'pre'],
    hpMult: 0.9,
    enrMult: 1.0,
    attackType: 'ranged',
  },
  conjurador: {
    id: 'conjurador',
    name: 'Conjurador / Místico',
    desc: 'Alta energia e intelecto. Conjurador de magias de plasma e energia.',
    primaryAttrs: ['enr', 'int', 'pre'],
    hpMult: 0.8,
    enrMult: 1.6,
    attackType: 'magic',
  },
  artilheiro: {
    id: 'artilheiro',
    name: 'Artilheiro / Balístico',
    desc: 'Combate à distância com armas pesadas e cobertura.',
    primaryAttrs: ['pre', 'dex', 'res'],
    hpMult: 1.0,
    enrMult: 1.0,
    attackType: 'ranged',
  },
  colosso: {
    id: 'colosso',
    name: 'Colosso / Chefe de Fase',
    desc: 'Ameaça lendária com vida massiva e múltiplos ataques.',
    primaryAttrs: ['frc', 'vit', 'res', 'enr'],
    hpMult: 2.2,
    enrMult: 1.5,
    attackType: 'melee',
  },
}

/**
 * Calculates XP reward based on Challenge Rating (ND).
 * @param {number} nd
 * @returns {number}
 */
export function calculateCreatureXp(nd = 1) {
  const ndNum = Math.max(0.25, parseFloat(nd) || 1)
  if (ndNum <= 0.25) return 50
  if (ndNum <= 0.5) return 100
  if (ndNum <= 1) return 200
  if (ndNum <= 2) return 450
  if (ndNum <= 3) return 700
  if (ndNum <= 4) return 1100
  if (ndNum <= 5) return 1800
  return Math.round(ndNum * 400 + Math.pow(ndNum, 2) * 50)
}

/**
 * Computes balanced stats, HP, Energy and Attack for a custom creature.
 * @param {number} nd - Challenge rating (e.g. 0.5, 1, 2, 5, 10)
 * @param {string} archetypeId - Key from ARCHETYPES
 * @returns {object} Balanced creature stat sheet
 */
export function calculateCreatureBaseStats(nd = 1, archetypeId = 'bruto') {
  const arch = ARCHETYPES[archetypeId] || ARCHETYPES.bruto
  const ndNum = Math.max(0.25, parseFloat(nd) || 1)

  // Base attribute pool scaling with ND
  const baseAttr = Math.max(1, Math.round(1 + ndNum * 0.8))
  const primaryAttr = Math.max(2, Math.round(3 + ndNum * 1.2))

  const attributes = {
    vit: baseAttr,
    dex: baseAttr,
    crm: Math.max(0, baseAttr - 1),
    frc: baseAttr,
    int: Math.max(0, baseAttr - 1),
    res: baseAttr,
    pre: baseAttr,
    enr: baseAttr,
  }

  // Boost archetype primary attributes
  arch.primaryAttrs.forEach(attr => {
    attributes[attr] = primaryAttr
  })

  // Calculate HP, Energy, Defense
  const baseHp = Math.round((attributes.vit * 4 + ndNum * 12) * arch.hpMult)
  const maxHp = Math.max(8, baseHp)

  const baseEnr = Math.round((attributes.enr * 3 + ndNum * 4) * arch.enrMult)
  const maxEnr = Math.max(4, baseEnr)

  const defense = 10 + Math.floor(attributes.dex / 2) + Math.floor(attributes.res / 2)
  const attackBonus = Math.max(1, Math.round(ndNum + 2))
  const damageBonus = Math.max(1, Math.round(ndNum + (arch.id === 'bruto' ? 2 : 1)))

  return {
    nd: ndNum,
    archetype: arch.id,
    archetypeName: arch.name,
    xp: calculateCreatureXp(ndNum),
    hp: maxHp,
    maxHp,
    energy: maxEnr,
    maxEnergy: maxEnr,
    defense,
    attributes,
    attack: {
      type: arch.attackType,
      bonus: attackBonus,
      damage: `1d4+${damageBonus}`,
      damageBonus,
    },
  }
}
