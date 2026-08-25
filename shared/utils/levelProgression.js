/* levelProgression.js — Level progression, XP thresholds and attribute recalculation formulas */

export const XP_TABLE = [
  { level: 1,  xpRequired: 0 },
  { level: 2,  xpRequired: 300 },
  { level: 3,  xpRequired: 900 },
  { level: 4,  xpRequired: 2700 },
  { level: 5,  xpRequired: 6500 },
  { level: 6,  xpRequired: 14000 },
  { level: 7,  xpRequired: 23000 },
  { level: 8,  xpRequired: 34000 },
  { level: 9,  xpRequired: 48000 },
  { level: 10, xpRequired: 64000 },
]

/**
 * Calculates level and progress info from total XP
 * @param {number} xp
 * @param {number} currentLevel Optional current recorded level
 * @returns {object}
 */
export function calculateLevelFromXp(xp = 0, currentLevel = 1) {
  let level = 1
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i].xpRequired) {
      level = XP_TABLE[i].level
      break
    }
  }

  const currentLevelDef = XP_TABLE.find(t => t.level === level) || XP_TABLE[0]
  const nextLevelDef = XP_TABLE.find(t => t.level === level + 1) || null

  const xpAtCurrentLevel = currentLevelDef.xpRequired
  const xpForNext = nextLevelDef ? nextLevelDef.xpRequired : currentLevelDef.xpRequired
  const xpGainedInLevel = Math.max(0, xp - xpAtCurrentLevel)
  const xpNeededInLevel = nextLevelDef ? xpForNext - xpAtCurrentLevel : 1
  const progressPercent = nextLevelDef
    ? Math.min(100, Math.round((xpGainedInLevel / xpNeededInLevel) * 100))
    : 100

  const canLevelUp = level > currentLevel

  return {
    level,
    xp,
    xpRequired: currentLevelDef.xpRequired,
    nextLevelXp: nextLevelDef ? nextLevelDef.xpRequired : null,
    progressPercent,
    canLevelUp,
  }
}

/**
 * Calculates max HP gain on level up
 * @param {number} currentMaxHp
 * @param {number} vit
 * @returns {number}
 */
export function calculateMaxHpOnLevelUp(currentMaxHp = 20, vit = 2) {
  const hpGain = Math.max(2, Math.floor(vit / 2) + 4)
  return currentMaxHp + hpGain
}

/**
 * Calculates max ENR gain on level up
 * @param {number} currentMaxEnr
 * @param {number} enr
 * @returns {number}
 */
export function calculateMaxEnrOnLevelUp(currentMaxEnr = 20, enr = 2) {
  const enrGain = Math.max(2, Math.floor(enr / 2) + 3)
  return currentMaxEnr + enrGain
}

/**
 * Applies level up changes to an entity
 * @param {object} entity
 * @param {object} updates
 * @param {object} updates.attributeIncreases Map of attribute key to increase (e.g. { frc: 1 })
 * @returns {object} Updated entity copy
 */
export function applyLevelUp(entity, { attributeIncreases = {} } = {}) {
  const newAttributes = { ...(entity.attributes || {}) }
  for (const [key, inc] of Object.entries(attributeIncreases)) {
    if (typeof inc === 'number') {
      newAttributes[key] = (newAttributes[key] || 0) + inc
    }
  }

  const newLevel = (entity.level || 1) + 1
  const curMaxHp = entity.maxHp ?? entity.vitMax ?? 20
  const curMaxEnr = entity.maxEnr ?? 20

  const nextMaxHp = calculateMaxHpOnLevelUp(curMaxHp, newAttributes.vit ?? 2)
  const nextMaxEnr = calculateMaxEnrOnLevelUp(curMaxEnr, newAttributes.enr ?? 2)

  return {
    ...entity,
    level: newLevel,
    attributes: newAttributes,
    maxHp: nextMaxHp,
    hp: nextMaxHp,
    maxEnr: nextMaxEnr,
    enr: nextMaxEnr,
  }
}
