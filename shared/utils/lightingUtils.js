/* lightingUtils.js — Dynamic lighting, light sources and movement distance calculations */
import { hasLineOfSight } from './visionUtils.js'

/**
 * Calculates all illuminated cells from an array of light sources
 * considering walls and closed doors
 * @param {Array<{ x: number, y: number, radius: number, color?: string, intensity?: number }>} lightSources
 * @param {Array<{ x1: number, y1: number, x2: number, y2: number, isDoor?: boolean, doorState?: string }>} walls
 * @param {number} cellSize Grid cell size in pixels
 * @returns {Map<string, { intensity: number, color: string, distance: number }>} Map of "col,row" to light data
 */
export function calculateLightCells(lightSources = [], walls = [], cellSize = 50) {
  const litCells = new Map()
  if (!Array.isArray(lightSources) || lightSources.length === 0) return litCells

  const blockingWalls = (walls || []).filter(w => !w.isDoor || w.doorState !== 'open')

  for (const src of lightSources) {
    if (!src || src.x == null || src.y == null) continue
    const radius = Math.max(1, src.radius || 4)
    const color = src.color || '#FBBF24'
    const intensity = src.intensity != null ? src.intensity : 1.0

    const centerCol = Math.floor(src.x / cellSize)
    const centerRow = Math.floor(src.y / cellSize)

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > radius) continue

        const targetCol = centerCol + dx
        const targetRow = centerRow + dy
        if (targetCol < 0 || targetRow < 0) continue

        const targetX = targetCol * cellSize + cellSize / 2
        const targetY = targetRow * cellSize + cellSize / 2

        // Check if light ray from source is blocked by walls
        if (hasLineOfSight(src.x, src.y, targetX, targetY, blockingWalls)) {
          const key = `${targetCol},${targetRow}`
          const falloff = 1 - (dist / radius)
          const cellIntensity = falloff * intensity

          const existing = litCells.get(key)
          if (!existing || existing.intensity < cellIntensity) {
            litCells.set(key, {
              intensity: Math.min(1, cellIntensity),
              color,
              distance: dist,
            })
          }
        }
      }
    }
  }

  return litCells
}

/**
 * Merges natural vision with illuminated cells that are within the character's direct LoS
 * @param {Set<string>} naturalVision Set of "col,row" strings from character's vision
 * @param {Map<string, object>} lightCells Map of "col,row" to light data
 * @param {{ x: number, y: number }} heroPos Character position in world coords
 * @param {Array} walls Wall segments
 * @param {number} cellSize Grid size in pixels
 * @returns {Set<string>} Combined set of visible "col,row" strings
 */
export function mergeVisionWithLights(naturalVision, lightCells, heroPos, walls = [], cellSize = 50) {
  const visible = new Set(naturalVision || [])
  if (!lightCells || lightCells.size === 0 || !heroPos) return visible

  const blockingWalls = (walls || []).filter(w => !w.isDoor || w.doorState !== 'open')

  for (const [key] of lightCells.entries()) {
    if (visible.has(key)) continue

    const [colStr, rowStr] = key.split(',')
    const col = parseInt(colStr, 10)
    const row = parseInt(rowStr, 10)
    const targetX = col * cellSize + cellSize / 2
    const targetY = row * cellSize + cellSize / 2

    // If hero has unobstructed line of sight to the lit cell, they can see it!
    if (hasLineOfSight(heroPos.x, heroPos.y, targetX, targetY, blockingWalls)) {
      visible.add(key)
    }
  }

  return visible
}

/**
 * Calculates Euclidean distance and grid count between two points
 * @param {number} x1 Start X (grid cells or pixels)
 * @param {number} y1 Start Y
 * @param {number} x2 End X
 * @param {number} y2 End Y
 * @param {number} gridScale Meters per grid cell (default: 1.5m)
 * @returns {{ distanceCells: number, distanceMeters: number, formatted: string }}
 */
export function calculateRouteDistance(x1, y1, x2, y2, gridScale = 1.5) {
  const dx = x2 - x1
  const dy = y2 - y1
  const distanceCells = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10
  const distanceMeters = Math.round(distanceCells * gridScale * 10) / 10

  return {
    distanceCells,
    distanceMeters,
    formatted: `${distanceMeters}m (${distanceCells}q)`,
  }
}
