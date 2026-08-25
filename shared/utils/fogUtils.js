/**
 * fogUtils.js — Fog of War Brush Utilities
 *
 * Computes grid cells touched by circular reveal/hide brushes.
 */

/**
 * Computes all grid cell keys ("col,row") touched by a circle.
 * @param {number} worldX - Center X coordinate in world pixels
 * @param {number} worldY - Center Y coordinate in world pixels
 * @param {number} brushRadiusPx - Radius of the brush in pixels
 * @param {number} gridSize - Size of each grid square in pixels (default: 50)
 * @returns {string[]} Array of cell keys "col,row"
 */
export function getCellsInBrushRadius(worldX, worldY, brushRadiusPx, gridSize = 50) {
  if (brushRadiusPx <= 0) return []

  const minCol = Math.floor((worldX - brushRadiusPx) / gridSize)
  const maxCol = Math.floor((worldX + brushRadiusPx) / gridSize)
  const minRow = Math.floor((worldY - brushRadiusPx) / gridSize)
  const maxRow = Math.floor((worldY + brushRadiusPx) / gridSize)

  const touched = []
  const radiusSq = brushRadiusPx * brushRadiusPx

  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      const cellCenterX = col * gridSize + gridSize / 2
      const cellCenterY = row * gridSize + gridSize / 2
      const dx = cellCenterX - worldX
      const dy = cellCenterY - worldY
      if (dx * dx + dy * dy <= radiusSq) {
        touched.push(`${col},${row}`)
      }
    }
  }

  return touched
}

/**
 * Applies reveal brush to a Set of revealed cells.
 * @param {Set<string>} revealedCells
 * @param {string[]} newCells
 * @returns {Set<string>}
 */
export function applyRevealBrush(revealedCells, newCells) {
  const next = new Set(revealedCells)
  for (const c of newCells) {
    next.add(c)
  }
  return next
}

/**
 * Applies hide/shroud brush to a Set of revealed cells.
 * @param {Set<string>} revealedCells
 * @param {string[]} cellsToHide
 * @returns {Set<string>}
 */
export function applyHideBrush(revealedCells, cellsToHide) {
  const next = new Set(revealedCells)
  for (const c of cellsToHide) {
    next.delete(c)
  }
  return next
}
