/* encounterUtils.js — Encounter challenge rating calculator and post-combat loot generator */

/**
 * Evaluates the threat level and difficulty of an encounter
 * based on active party members vs enemies on the board
 * @param {Array} partyEntities Array of player/hero entities
 * @param {Array} enemyEntities Array of hostile/NPC creatures
 * @returns {{ ratio: number, difficulty: 'trivial'|'moderate'|'challenging'|'deadly', label: string, color: string, description: string }}
 */
export function calculateEncounterThreat(partyEntities = [], enemyEntities = []) {
  if (!partyEntities || partyEntities.length === 0) {
    return {
      ratio: 0,
      difficulty: 'trivial',
      label: 'Sem Heróis',
      color: '#6B7280',
      description: 'Nenhum personagem de jogador presente.',
    }
  }

  if (!enemyEntities || enemyEntities.length === 0) {
    return {
      ratio: 0,
      difficulty: 'trivial',
      label: 'Pacífico',
      color: '#10B981',
      description: 'Nenhum inimigo ativo na mesa.',
    }
  }

  // Calculate party battle strength
  const partyPower = partyEntities.reduce((sum, hero) => {
    const lvl = hero.level || 1
    const hp = hero.maxHp || hero.hp || 20
    const ac = hero.ac || 12
    return sum + (lvl * 12) + hp + (ac * 2)
  }, 0)

  // Calculate enemy battle strength
  const enemyPower = enemyEntities.reduce((sum, enemy) => {
    const hp = enemy.maxHp || enemy.hp || 16
    const ac = enemy.ac || 11
    const atk = enemy.attacks?.length ? enemy.attacks.length * 6 : 6
    return sum + hp * 1.2 + ac * 2 + atk
  }, 0)

  const ratio = partyPower > 0 ? Math.round((enemyPower / partyPower) * 100) / 100 : 1

  if (ratio <= 0.6) {
    return {
      ratio,
      difficulty: 'trivial',
      label: 'Trivial',
      color: '#10B981',
      description: 'Vitória garantida sem grande custo de recursos.',
    }
  } else if (ratio <= 1.0) {
    return {
      ratio,
      difficulty: 'moderate',
      label: 'Moderado',
      color: '#F59E0B',
      description: 'Desafio equilibrado para o grupo.',
    }
  } else if (ratio <= 1.4) {
    return {
      ratio,
      difficulty: 'challenging',
      label: 'Desafiador',
      color: '#F97316',
      description: 'Perigo alto; exige estratégia e trabalho em equipe.',
    }
  } else {
    return {
      ratio,
      difficulty: 'deadly',
      label: 'Mortal',
      color: '#EF4444',
      description: 'Risco iminente de derrota.',
    }
  }
}

/**
 * Generates randomized thematic post-combat loot
 * @param {number} enemyCount Number of defeated foes
 * @param {'trivial'|'moderate'|'challenging'|'deadly'} threatTier Difficulty tier
 * @returns {{ gold: number, enrCells: number, items: Array<{ name: string, type: string, rarity: string, weight: number }> }}
 */
export function generateLoot(enemyCount = 1, threatTier = 'moderate') {
  const count = Math.max(1, enemyCount)
  const multipliers = {
    trivial: 1.0,
    moderate: 1.5,
    challenging: 2.5,
    deadly: 4.0,
  }
  const mult = multipliers[threatTier] || 1.5

  const baseGold = Math.floor((Math.random() * 15 + 10) * count * mult)
  const baseEnr = Math.floor((Math.random() * 3 + 1) * count * (mult > 2 ? 2 : 1))

  const ITEM_POOL = [
    { name: 'Ampola de Estimulante Biótico (Cura 1d4+2 PV)', type: 'consumable', rarity: 'Comum', weight: 0.2 },
    { name: 'Cartucho de Plasma Térmico (10 disparos)', type: 'ammo', rarity: 'Comum', weight: 0.5 },
    { name: 'Micro-Injetor de Adrenalina (+2 em Testes de FRC por 3 turnos)', type: 'consumable', rarity: 'Incomum', weight: 0.1 },
    { name: 'Célula de Energia de Alta Densidade (Recarrega 8 ENR)', type: 'consumable', rarity: 'Incomum', weight: 0.4 },
    { name: 'Faca Tática de Nanocarbono (1d4+2 Cortante)', type: 'weapon', rarity: 'Incomum', weight: 0.8 },
    { name: 'Chip de Criptografia Renegado (Pista de Missão)', type: 'misc', rarity: 'Raro', weight: 0.1 },
    { name: 'Emissor de Escudo Gravitacional Portátil (+2 CA por 1 cena)', type: 'accessory', rarity: 'Raro', weight: 1.2 },
  ]

  // Pick 1 to 3 items based on count and tier
  const itemCount = Math.min(4, Math.floor(Math.random() * 2 + (mult >= 2.5 ? 2 : 1)))
  const shuffled = [...ITEM_POOL].sort(() => 0.5 - Math.random())
  const selectedItems = shuffled.slice(0, itemCount)

  return {
    gold: baseGold,
    enrCells: baseEnr,
    items: selectedItems,
  }
}
