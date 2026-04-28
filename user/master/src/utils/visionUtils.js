/* visionUtils.js — Shared ray-casting + vision utilities for map rendering */

export const MAP_WIDTH  = 3000
export const MAP_HEIGHT = 3000

/**
 * Returns true if segment (ax,ay)→(bx,by) intersects segment (cx,cy)→(dx,dy).
 * Uses parametric form with a small epsilon to avoid coincident endpoint hits.
 */
export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1x = bx - ax, d1y = by - ay
  const d2x = dx - cx, d2y = dy - cy
  const cross = d1x * d2y - d1y * d2x
  if (Math.abs(cross) < 1e-9) return false   // parallel / collinear
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999
}

/**
 * Checks if a ray from (ox,oy) to (tx,ty) is blocked by any wall segment.
 * We cast the ray slightly before reaching the target (t < 0.999) so that
 * cells right at the wall edge are still considered visible.
 */
export function isBlockedByWall(ox, oy, tx, ty, walls) {
  for (const w of walls) {
    if (segmentsIntersect(ox, oy, tx, ty, w.x1, w.y1, w.x2, w.y2)) return true
  }
  return false
}

/**
 * Compute the set of grid-cell keys visible from a token's position.
 * Uses circle + optional direction cone + ray casting against wallSegments.
 *
 * @param {object} entity     — token entity with mapX, mapY, visionRadius, visionAngle, visionCone
 * @param {object} gridConfig — { size, offsetX, offsetY }
 * @param {Array}  walls      — wallSegments array [{x1,y1,x2,y2}]
 * @returns {Set<string>}     — Set of "col,row" keys
 */
export function computeVisionCells(entity, gridConfig, walls) {
  const radius = entity.visionRadius
  if (!radius || radius <= 0) return new Set()

  const { size, offsetX: ox, offsetY: oy } = gridConfig
  const cx = entity.mapX ?? 0
  const cy = entity.mapY ?? 0
  const radiusPx = radius * size

  // Optional cone vision
  const hasCone = entity.visionCone && entity.visionAngle != null
  const coneDir = hasCone ? (entity.visionAngle * Math.PI) / 180 : 0
  const CONE_HALF = Math.PI * (60 / 180)  // ±60° = 120° total aperture
  const coneExtended = radiusPx * 1.2     // cone reaches 20% further

  const visibleCells = new Set()

  const colC = Math.floor((cx - ox) / size)
  const rowC = Math.floor((cy - oy) / size)

  const r = Math.ceil(radius) + 1
  for (let dc = -r; dc <= r; dc++) {
    for (let dr = -r; dr <= r; dr++) {
      const col = colC + dc
      const row = rowC + dr
      if (col < 0 || row < 0 || col * size >= MAP_WIDTH || row * size >= MAP_HEIGHT) continue

      const tcx = col * size + ox + size / 2
      const tcy = row * size + oy + size / 2
      const dist = Math.hypot(tcx - cx, tcy - cy)

      let inRange = dist <= radiusPx
      if (hasCone && dist > 0) {
        const angle = Math.atan2(tcy - cy, tcx - cx)
        let diff = Math.abs(angle - coneDir)
        if (diff > Math.PI) diff = 2 * Math.PI - diff
        if (diff <= CONE_HALF && dist <= coneExtended) inRange = true
      }

      if (!inRange) continue

      if (!isBlockedByWall(cx, cy, tcx, tcy, walls)) {
        visibleCells.add(`${col},${row}`)
      }
    }
  }

  return visibleCells
}
