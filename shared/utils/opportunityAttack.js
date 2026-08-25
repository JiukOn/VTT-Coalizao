/* opportunityAttack.js — Reaction and Opportunity Attack detection on token movement */

/**
 * Checks if a token movement triggers an Opportunity Attack from an enemy
 * Triggers when moving from inside enemy melee reach (<= threatRange) to outside it (> threatRange).
 * @param {{x: number, y: number}} oldPos Token starting position
 * @param {{x: number, y: number}} newPos Token destination position
 * @param {{x: number, y: number}} enemyPos Enemy token position
 * @param {number} threatRangeMeters Default melee reach (1.5m)
 * @param {number} gridSize Grid cell pixel size (default: 40)
 * @returns {boolean} True if movement provoked an opportunity attack
 */
export function checkOpportunityAttack(
  oldPos,
  newPos,
  enemyPos,
  threatRangeMeters = 1.5,
  gridSize = 40
) {
  if (!oldPos || !newPos || !enemyPos) return false

  const threatDistancePx = (threatRangeMeters / 1.5) * gridSize

  const oldDist = Math.hypot(oldPos.x - enemyPos.x, oldPos.y - enemyPos.y)
  const newDist = Math.hypot(newPos.x - enemyPos.x, newPos.y - enemyPos.y)

  // Was in melee reach and stepped outside
  const wasThreatened = oldDist <= threatDistancePx + 2 // with small tolerance
  const isNowOutside = newDist > threatDistancePx + 2

  return wasThreatened && isNowOutside
}
