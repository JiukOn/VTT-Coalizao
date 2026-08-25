/* energyShields.js — Energy force fields and shield points (SP) absorption & regeneration */

/**
 * Absorbs incoming damage using shield points before HP
 * @param {number} currentSp
 * @param {number} currentHp
 * @param {number} incomingDamage
 * @returns {{ nextSp: number, nextHp: number, absorbedByShield: number, damageToHp: number }}
 */
export function absorbDamageWithShield(currentSp = 0, currentHp = 10, incomingDamage = 0) {
  const safeSp = Math.max(0, currentSp || 0)
  const safeHp = Math.max(0, currentHp || 0)
  const safeDamage = Math.max(0, incomingDamage || 0)

  const absorbedByShield = Math.min(safeSp, safeDamage)
  const remainingDamage = safeDamage - absorbedByShield

  const nextSp = safeSp - absorbedByShield
  const nextHp = Math.max(0, safeHp - remainingDamage)

  return {
    nextSp,
    nextHp,
    absorbedByShield,
    damageToHp: remainingDamage,
  }
}

/**
 * Regenerates shield points up to maxSp
 * @param {number} currentSp
 * @param {number} maxSp
 * @param {number} regenAmount
 * @returns {{ nextSp: number, regenerated: number }}
 */
export function regenerateShield(currentSp = 0, maxSp = 5, regenAmount = 1) {
  const safeSp = Math.max(0, currentSp || 0)
  const safeMax = Math.max(0, maxSp || 0)

  const nextSp = Math.min(safeMax, safeSp + regenAmount)
  const regenerated = nextSp - safeSp

  return {
    nextSp,
    regenerated,
  }
}
