/* coverUtils.js — Geometric tactical cover calculator based on map walls and obstacles */

/**
 * Checks if two line segments (p1-p2 and p3-p4) intersect
 */
function lineSegmentsIntersect(p1, p2, p3, p4) {
  const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

/**
 * Calculates cover degree and AC defense bonus between attacker and target
 * @param {{x: number, y: number}} attackerPos Center of attacker token
 * @param {{x: number, y: number}} defenderPos Center of defender token
 * @param {Array<object>} wallSegments List of wall segments on the map
 * @param {number} tokenSize Token bounding box size (default: 40)
 * @returns {{ coverType: 'none'|'half'|'three_quarters'|'total', bonusAC: number, label: string, color: string }}
 */
export function calculateCover(attackerPos, defenderPos, wallSegments = [], tokenSize = 40) {
  if (!attackerPos || !defenderPos || !Array.isArray(wallSegments) || wallSegments.length === 0) {
    return { coverType: 'none', bonusAC: 0, label: 'Sem Cobertura', color: '#10B981' }
  }

  // Filter blocking walls (closed/locked doors or solid walls)
  const solidWalls = wallSegments.filter(w => !w.isDoor || w.doorState !== 'open')
  if (solidWalls.length === 0) {
    return { coverType: 'none', bonusAC: 0, label: 'Sem Cobertura', color: '#10B981' }
  }

  const halfSize = tokenSize / 2

  // 4 corners of defender
  const defenderCorners = [
    { x: defenderPos.x - halfSize, y: defenderPos.y - halfSize },
    { x: defenderPos.x + halfSize, y: defenderPos.y - halfSize },
    { x: defenderPos.x - halfSize, y: defenderPos.y + halfSize },
    { x: defenderPos.x + halfSize, y: defenderPos.y + halfSize },
  ]

  let blockedRays = 0

  for (const corner of defenderCorners) {
    const isRayBlocked = solidWalls.some(w =>
      lineSegmentsIntersect(
        attackerPos,
        corner,
        { x: w.x1, y: w.y1 },
        { x: w.x2, y: w.y2 }
      )
    )
    if (isRayBlocked) blockedRays++
  }

  if (blockedRays === 0) {
    return { coverType: 'none', bonusAC: 0, label: 'Sem Cobertura', color: '#10B981' }
  }
  if (blockedRays <= 2) {
    return { coverType: 'half', bonusAC: 2, label: 'Meia Cobertura (+2 CA)', color: '#FBBF24' }
  }
  if (blockedRays === 3) {
    return { coverType: 'three_quarters', bonusAC: 5, label: '3/4 Cobertura (+5 CA)', color: '#F97316' }
  }
  return { coverType: 'total', bonusAC: 99, label: 'Cobertura Total (Bloqueado)', color: '#EF4444' }
}
