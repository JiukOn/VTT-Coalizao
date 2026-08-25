/**
 * aoeTargeting.js — Geometric AoE Targeting and Movement Trajectory Calculations
 * 
 * Provides mathematical functions for calculating:
 * 1. Tokens enclosed by Circle, Cone, and Line AoE templates.
 * 2. Total distance and waypoints length in tactical movement.
 * 3. Base movement allowance based on DEX attribute.
 */

const METERS_PER_SQUARE = 1.5

/**
 * Calculates base movement distance in meters for an entity.
 * Formula: 9m base + floor(DEX / 5) * 1.5m
 * @param {object} entity
 * @returns {{ normalMeters: number, runMeters: number, normalSquares: number, runSquares: number }}
 */
export function calculateMaxMovement(entity) {
  const dex = entity?.attributes?.dex ?? entity?.dex ?? 10
  const bonus = Math.floor(dex / 5)
  const normalMeters = Math.max(4.5, 9 + bonus * METERS_PER_SQUARE)
  const runMeters = normalMeters * 2
  return {
    normalMeters,
    runMeters,
    normalSquares: Math.round(normalMeters / METERS_PER_SQUARE),
    runSquares: Math.round(runMeters / METERS_PER_SQUARE),
  }
}

/**
 * Calculates the total length of a path of waypoints in pixels, squares, and meters.
 * @param {Array<{x: number, y: number}>} points
 * @param {number} gridSize
 * @param {number} [metersPerSquare=1.5]
 * @returns {{ totalPx: number, totalSquares: number, totalMeters: number, segments: number[] }}
 */
export function calculatePathDistance(points = [], gridSize = 50, metersPerSquare = METERS_PER_SQUARE) {
  if (!points || points.length < 2) {
    return { totalPx: 0, totalSquares: 0, totalMeters: 0, segments: [] }
  }

  let totalPx = 0
  const segments = []

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    totalPx += dist
    segments.push(dist)
  }

  const totalSquares = +(totalPx / gridSize).toFixed(1)
  const totalMeters = +(totalSquares * metersPerSquare).toFixed(1)

  return { totalPx, totalSquares, totalMeters, segments }
}

/**
 * Detects all tokens within a Circle AoE.
 * @param {{ x: number, y: number }} center
 * @param {number} radiusPx
 * @param {Array<object>} tokens
 * @param {number} gridSize
 * @returns {Array<object>}
 */
export function getTokensInCircleAoE(center, radiusPx, tokens = [], gridSize = 50) {
  if (!center || radiusPx <= 0) return []
  return tokens.filter(t => {
    const tx = t.mapX ?? t.x ?? 0
    const ty = t.mapY ?? t.y ?? 0
    const tokenRadius = (t.size === 'grande' ? 1.5 : t.size === 'colossal' ? 2 : 1) * (gridSize / 2)
    const dist = Math.hypot(tx - center.x, ty - center.y)
    return dist <= radiusPx + tokenRadius * 0.75
  })
}

/**
 * Detects all tokens within a Cone AoE.
 * @param {{ x: number, y: number }} origin
 * @param {number} lengthPx
 * @param {number} directionAngleRad - angle in radians
 * @param {number} apertureDeg - cone aperture in degrees (e.g. 60 or 90)
 * @param {Array<object>} tokens
 * @param {number} gridSize
 * @returns {Array<object>}
 */
export function getTokensInConeAoE(origin, lengthPx, directionAngleRad, apertureDeg = 60, tokens = [], gridSize = 50) {
  if (!origin || lengthPx <= 0) return []
  const halfApertureRad = (apertureDeg * Math.PI) / 360

  return tokens.filter(t => {
    const tx = t.mapX ?? t.x ?? 0
    const ty = t.mapY ?? t.y ?? 0
    const dist = Math.hypot(tx - origin.x, ty - origin.y)
    const tokenRadius = (gridSize / 2) * 0.75

    if (dist > lengthPx + tokenRadius) return false
    if (dist < tokenRadius) return true // Origin point includes point-blank target

    const angleToToken = Math.atan2(ty - origin.y, tx - origin.x)
    let diff = Math.abs(angleToToken - directionAngleRad)
    while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI)

    return diff <= halfApertureRad + 0.15
  })
}

/**
 * Detects all tokens within a Line AoE.
 * @param {{ x: number, y: number }} start
 * @param {{ x: number, y: number }} end
 * @param {number} widthPx
 * @param {Array<object>} tokens
 * @param {number} gridSize
 * @returns {Array<object>}
 */
export function getTokensInLineAoE(start, end, widthPx = 25, tokens = [], gridSize = 50) {
  if (!start || !end) return []
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lineLenSq = dx * dx + dy * dy
  if (lineLenSq === 0) return getTokensInCircleAoE(start, widthPx / 2, tokens, gridSize)

  const halfWidth = widthPx / 2

  return tokens.filter(t => {
    const tx = t.mapX ?? t.x ?? 0
    const ty = t.mapY ?? t.y ?? 0
    const tokenRadius = (gridSize / 2) * 0.75

    // Project point onto line segment clamped to [0, 1]
    const tParam = Math.max(0, Math.min(1, ((tx - start.x) * dx + (ty - start.y) * dy) / lineLenSq))
    const projX = start.x + tParam * dx
    const projY = start.y + tParam * dy

    const dist = Math.hypot(tx - projX, ty - projY)
    return dist <= halfWidth + tokenRadius
  })
}
