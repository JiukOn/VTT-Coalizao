/**
 * pathfindingHelper.js — Tactical A* Pathfinding helper for 2D Grid
 *
 * Communicates with the Python Intelligence Engine (/api/engine/map/pathfind)
 * to compute optimal routes around walls and obstacles, with local fallback.
 */

/**
 * Computes a tactical path between two points on the grid.
 * @param {object} params
 * @param {number} params.startX - Starting world X coordinate
 * @param {number} params.startY - Starting world Y coordinate
 * @param {number} params.endX - Target world X coordinate
 * @param {number} params.endY - Target world Y coordinate
 * @param {number} params.gridSize - Size of each grid square in pixels (default: 50)
 * @param {Array} params.obstacles - Array of { x, y } blocked cells or wall segments
 * @param {number} params.metersPerSquare - Distance in meters per cell (default: 1.5)
 * @returns {Promise<{ found: boolean, path: Array<{x: number, y: number}>, distanceMeters: number, squares: number }>}
 */
export async function fetchTacticalPath({
  startX,
  startY,
  endX,
  endY,
  gridSize = 50,
  obstacles = [],
  metersPerSquare = 1.5,
}) {
  const startCol = Math.floor(startX / gridSize)
  const startRow = Math.floor(startY / gridSize)
  const endCol = Math.floor(endX / gridSize)
  const endRow = Math.floor(endY / gridSize)

  // Direct line if start and end are the same
  if (startCol === endCol && startRow === endRow) {
    return {
      found: true,
      path: [{ x: startX, y: startY }],
      distanceMeters: 0,
      squares: 0,
    }
  }

  try {
    const formattedObstacles = obstacles
      .filter(obs => obs.col != null && obs.row != null)
      .map(obs => [obs.col, obs.row])

    const res = await fetch('/api/engine/map/pathfind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: [startCol, startRow],
        goal: [endCol, endRow],
        obstacles: formattedObstacles,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.found && Array.isArray(data.path) && data.path.length > 0) {
        const worldPath = data.path.map(([col, row]) => ({
          x: col * gridSize + gridSize / 2,
          y: row * gridSize + gridSize / 2,
        }))
        const squares = Math.max(0, data.path.length - 1)
        return {
          found: true,
          path: worldPath,
          distanceMeters: +(squares * metersPerSquare).toFixed(1),
          squares,
        }
      }
    }
  } catch {
    // Silently fallback to local euclidean path
  }

  // Local fallback (direct linear distance)
  const dx = endX - startX
  const dy = endY - startY
  const distPixels = Math.hypot(dx, dy)
  const squares = Math.round(distPixels / gridSize)
  const distanceMeters = +(squares * metersPerSquare).toFixed(1)

  return {
    found: true,
    path: [
      { x: startX, y: startY },
      { x: endX, y: endY },
    ],
    distanceMeters,
    squares,
  }
}
