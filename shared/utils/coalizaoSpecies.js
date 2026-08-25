/* coalizaoSpecies.js — Canonical species, lore and racial attribute modifiers for Coalizão RPG */

export const COALIZAO_SPECIES = {
  human: {
    id: 'human',
    name: 'Humano',
    icon: '👤',
    attributeModifiers: {},
    desc: 'Adaptáveis e versáteis, adequados para qualquer classe ou caminho.',
  },
  lancax: {
    id: 'lancax',
    name: 'Lancax',
    icon: '🌊',
    attributeModifiers: { dex: 2, pre: 1, vit: -1 },
    desc: 'Híbridos com o ser aquático Lancax, dotados de destreza aquática e percepção aguçada.',
  },
  elf: {
    id: 'elf',
    name: 'Elfo',
    icon: '🧝',
    attributeModifiers: { int: 2, pre: 1, frc: -1 },
    desc: 'Seres de intelecto elevado e afinidade natural com energias sutis.',
  },
  dwarf: {
    id: 'dwarf',
    name: 'Anão',
    icon: '🧔',
    attributeModifiers: { res: 2, vit: 1, dex: -1 },
    desc: 'Robustos e tenazes, mestres da metalurgia e da resistência física.',
  },
  gran: {
    id: 'gran',
    name: 'Gran',
    icon: '🗿',
    attributeModifiers: { frc: 2, res: 1, int: -1 },
    desc: 'Seres de constituição pesada e força bruta inabalável.',
  },
  yomunkai: {
    id: 'yomunkai',
    name: 'Yomunkai',
    icon: '🔮',
    attributeModifiers: { enr: 2, int: 1, vit: -1 },
    desc: 'Conexão profunda com o fluxo energético e canais de energia primordiais.',
  },
  ink_king: {
    id: 'ink_king',
    name: 'Ink King',
    icon: '🖋️',
    attributeModifiers: { crm: 2, int: 2, frc: -2 },
    desc: 'Seres enigmáticos de alta eloquência e intelecto refinado.',
  },
  demon: {
    id: 'demon',
    name: 'Demônio',
    icon: '😈',
    attributeModifiers: { crm: 2, frc: 1, res: -1 },
    desc: 'Portadores de carisma imponente e agressividade ardente.',
  },
  angel: {
    id: 'angel',
    name: 'Anjo',
    icon: '🪽',
    attributeModifiers: { crm: 2, enr: 1, frc: -1 },
    desc: 'Entidades radiantes de presença inspiradora e reservas de energia pura.',
  },
  giant: {
    id: 'giant',
    name: 'Gigante',
    icon: '🏔️',
    attributeModifiers: { frc: 3, vit: 2, dex: -2 },
    desc: 'Titãs de poder físico colossal e vitalidade avassaladora.',
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    icon: '👺',
    attributeModifiers: { dex: 2, crm: -1 },
    desc: 'Ágeis e oportunistas, especialistas em fugas e truques rápidos.',
  },
  kobold: {
    id: 'kobold',
    name: 'Kobold',
    icon: '🦎',
    attributeModifiers: { dex: 2, frc: -1 },
    desc: 'Pequenos répteis velozes com reflexos aguçados.',
  },
}

/**
 * Applies species attribute modifiers to a base set of attributes
 * @param {object} baseAttributes
 * @param {string} speciesId
 * @returns {object} Modified attributes
 */
export function applySpeciesModifiers(baseAttributes = {}, speciesId = 'human') {
  const species = COALIZAO_SPECIES[speciesId] || COALIZAO_SPECIES.human
  const modifiers = species.attributeModifiers || {}

  const result = { ...baseAttributes }

  for (const [attr, mod] of Object.entries(modifiers)) {
    result[attr] = (result[attr] || 0) + mod
  }

  return result
}
