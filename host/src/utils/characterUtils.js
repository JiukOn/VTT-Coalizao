/* ============================================================
   VTP COALIZÃO — Character Utility Functions
   Attribute calculations, level progression, combat formulas
   ============================================================ */

/**
 * Attribute point gains per level (Coalizão progression table)
 */
export const LEVEL_POINTS = {
  1: 25, // Initial distribution
  2: 3,
  3: 2,
  4: 3,
  5: 2,  // + Class Evolution
  6: 3,
  7: 2,
  8: 3,
  9: 2,
  10: 3, // + TransEvolution eligible
}

/**
 * All 8 attributes of the Coalizão system
 */
export const ATTRIBUTES = [
  { key: 'vit', name: 'Vitalidade', abbr: 'VIT', description: 'Chama da vida, resistência a danos e doenças' },
  { key: 'dex', name: 'Destreza', abbr: 'DEX', description: 'Agilidade, esquiva, movimentação' },
  { key: 'crm', name: 'Carisma', abbr: 'CRM', description: 'Influência, persuasão, leitura emocional' },
  { key: 'frc', name: 'Força', abbr: 'FRC', description: 'Poder físico bruto, empunhadura' },
  { key: 'int', name: 'Inteligência', abbr: 'INT', description: 'Raciocínio, estratégia, aprendizado' },
  { key: 'res', name: 'Resiliência', abbr: 'RES', description: 'Defesa mental e espiritual' },
  { key: 'pre', name: 'Precisão', abbr: 'PRE', description: 'Mira, coordenação fina, percepção' },
  { key: 'enr', name: 'Energia', abbr: 'ENR', description: 'Poder primordial, capacidade energética' },
]

/**
 * Calculates bonus from attribute value (+1 per 5 points)
 */
export function getBonus(value) {
  return Math.floor(value / 5)
}

/**
 * Gets the total points available for a given level
 */
export function getTotalPointsForLevel(level) {
  let total = 0
  for (let i = 1; i <= level; i++) {
    total += LEVEL_POINTS[i] || 0
  }
  return total
}

/**
 * Calculates movement range (short movement)
 * @param {number} d4Result - The d4 roll result (1-4)
 * @param {number} dexBonus - DEX bonus of the character
 * @returns {number} Movement in meters
 */
export function calculateShortMovement(d4Result, dexBonus) {
  if (d4Result === 4) return dexBonus * 4
  if (d4Result === 1) return 4
  // For 2 and 3, using Option B (calculated):
  const worst = 4
  const best = dexBonus * 4
  if (d4Result === 2) return Math.ceil(worst + best / 2)
  if (d4Result === 3) return Math.floor(best - worst / 2)
  return 4
}

/**
 * Creates a blank character template
 */
export function createBlankCharacter(campaignId) {
  return {
    campaignId,
    name: '',
    surname: '',
    age: 18,
    // Dual species (v4.0)
    speciesPrimary: '',
    speciesSecondary: '',
    // Legacy single-species field (kept for backwards compat)
    species: '',
    appearance: '',
    backstory: '',
    catchphrase: '',
    // Tendencies: predefined skills that grant advantage (Botânica, Estratégia…)
    tendencies: [],
    // Alignments: freeform text list (Leal ao Rei, Protetor de Crianças…)
    alignments: [],
    personality: '',
    classId: '',
    level: 1,
    xp: 0,
    xpMax: 20,
    aura: '',
    // Starting abilities
    skill1Id: '',  // auto-assigned legacy ability of chosen class
    skill2Id: '',  // player-selectable second ability
    // Base attributes (before multiplier)
    attributes: {
      vit: 0, dex: 0, crm: 0, frc: 0,
      int: 0, res: 0, pre: 0, enr: 0,
    },
    // Class multipliers
    multipliers: {
      vit: 1, dex: 1, crm: 1, frc: 1,
      int: 1, res: 1, pre: 1, enr: 1,
    },
    // Temporary modifiers (from effects, items, etc.)
    tempModifiers: {
      vit: 0, dex: 0, crm: 0, frc: 0,
      int: 0, res: 0, pre: 0, enr: 0,
    },
    // 8 equipment slots (v4.0 — follows official character sheet)
    equipment: {
      cabeca: null,     // Cabeça
      pescoco: null,    // Pescoço
      corpo: null,      // Corpo
      maoDireita: null, // Mão Dta (arma principal / escudo)
      maoEsquerda: null,// Mão Esq (arma secundária / escudo / tocha)
      cintura: null,    // Cintura
      pernas: null,     // Pernas
      pes: null,        // Pés
    },
    inventory: [],
    abilities: [],
    effects: [],
    ouris: 0,
    stylePoint: false,
    creativityPoint: false,
    tokenImage: null,
    tokenColor: '#9B59E8',
    tokenIcon: 'user',
    notes: '',
    evolution: null, // 'ascendente' | 'transcendente' | 'descendente'
  }
}
