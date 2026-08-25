/* restUtils.js — Short and Long rest recovery formulas for Coalizão RPG */

const getBonus = (val) => Math.floor((val || 0) / 5)

/**
 * Calculates resource recovery and condition cleansing for a Short Rest (1 hour)
 * @param {object} entity
 * @param {Array<number>} [diceRolls] Optional pre-rolled dice for Vit recovery (1d4 per level)
 * @returns {{ updatedEntity: object, hpGained: number, enrGained: number, cleansedConditions: Array<string> }}
 */
export function calculateShortRest(entity, diceRolls = null) {
  if (!entity) return { updatedEntity: entity, hpGained: 0, enrGained: 0, cleansedConditions: [] }

  const level = entity.level || 1
  const vitBonus = getBonus(entity.attributes?.vit ?? 2)

  // Roll 1d4 per level if not provided
  let hpRollTotal = 0
  if (Array.isArray(diceRolls) && diceRolls.length > 0) {
    hpRollTotal = diceRolls.reduce((a, b) => a + b, 0)
  } else {
    for (let i = 0; i < level; i++) {
      hpRollTotal += Math.floor(Math.random() * 4) + 1
    }
  }

  const hpGained = Math.max(1, hpRollTotal + vitBonus)
  const maxHp = entity.maxHp ?? entity.vitMax ?? 20
  const curHp = entity.hp ?? 0
  const nextHp = Math.min(maxHp, curHp + hpGained)

  const maxEnr = entity.maxEnr ?? 20
  const curEnr = entity.enr ?? 0
  const enrGained = Math.floor(maxEnr / 2)
  const nextEnr = Math.min(maxEnr, curEnr + enrGained)

  // Cleanse short-duration conditions
  const temporaryConditions = ['stunned', 'staggered', 'prone', 'shaken']
  const curEffects = Array.isArray(entity.effects) ? entity.effects : []
  const remainingEffects = curEffects.filter(eff => {
    const effId = typeof eff === 'string' ? eff : eff.id
    return !temporaryConditions.includes(effId)
  })
  const cleansedConditions = curEffects
    .map(eff => (typeof eff === 'string' ? eff : eff.id))
    .filter(id => temporaryConditions.includes(id))

  const updatedEntity = {
    ...entity,
    hp: nextHp,
    enr: nextEnr,
    effects: remainingEffects,
  }

  return {
    updatedEntity,
    hpGained: nextHp - curHp,
    enrGained: nextEnr - curEnr,
    cleansedConditions,
  }
}

/**
 * Calculates full resource restoration for a Long Rest (8 hours)
 * @param {object} entity
 * @returns {{ updatedEntity: object, hpGained: number, enrGained: number, heroicPointsGained: number }}
 */
export function calculateLongRest(entity) {
  if (!entity) return { updatedEntity: entity, hpGained: 0, enrGained: 0, heroicPointsGained: 0 }

  const maxHp = entity.maxHp ?? entity.vitMax ?? 20
  const curHp = entity.hp ?? 0

  const maxEnr = entity.maxEnr ?? 20
  const curEnr = entity.enr ?? 0

  const curHeroic = entity.heroicPoints || 0
  const nextHeroic = Math.min(3, curHeroic + 1)

  const updatedEntity = {
    ...entity,
    hp: maxHp,
    enr: maxEnr,
    heroicPoints: nextHeroic,
    effects: [], // Clear all standard conditions on full rest
  }

  return {
    updatedEntity,
    hpGained: maxHp - curHp,
    enrGained: maxEnr - curEnr,
    heroicPointsGained: nextHeroic - curHeroic,
  }
}
