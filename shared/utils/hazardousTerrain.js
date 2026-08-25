/* hazardousTerrain.js — Hazardous and difficult terrain zones for tactical maps */

export const TERRAIN_TYPES = {
  difficult: { id: 'difficult', label: 'Terreno Difícil (Escombros/Lama)', color: '#A16207', icon: '🟤', movementCost: 2, effectDesc: 'Movimento custa o dobro (+100%).' },
  toxic:     { id: 'toxic',     label: 'Gás Tóxico / Radiação',            color: '#10B981', icon: '🟢', movementCost: 1, effectDesc: 'Aplica 2 de dano de ENR e risco de Envenenado.' },
  fire:      { id: 'fire',      label: 'Chamas / Plasma Ardente',          color: '#EF4444', icon: '🔴', movementCost: 1, effectDesc: 'Aplica 1d4 de dano de Fogo e Queimando.' },
  ice:       { id: 'ice',       label: 'Gelo Escorregadio',                color: '#38BDF8', icon: '🔵', movementCost: 1.5, effectDesc: 'Teste de DEX ou fica Derrubado.' },
}

/**
 * Creates a new terrain zone
 * @param {object} params
 * @param {number} params.x Top-left world X
 * @param {number} params.y Top-left world Y
 * @param {number} params.width Zone width in world px
 * @param {number} params.height Zone height in world px
 * @param {'difficult'|'toxic'|'fire'|'ice'} params.type
 * @param {string} params.name
 * @returns {object}
 */
export function createTerrainZone({
  x = 100,
  y = 100,
  width = 120,
  height = 120,
  type = 'difficult',
  name = '',
} = {}) {
  const typeDef = TERRAIN_TYPES[type] || TERRAIN_TYPES.difficult
  return {
    id: `tz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    width: Math.max(40, width),
    height: Math.max(40, height),
    type,
    name: (name || '').trim() || typeDef.label,
    color: typeDef.color,
  }
}

/**
 * Checks which terrain zones contain the token position
 * @param {{x: number, y: number}} tokenPos Token world position
 * @param {Array<object>} zones List of terrain zones
 * @returns {Array<object>} List of zones containing the token
 */
export function checkTokenInTerrainZones(tokenPos, zones = []) {
  if (!tokenPos || !Array.isArray(zones) || zones.length === 0) return []

  return zones.filter(z =>
    tokenPos.x >= z.x &&
    tokenPos.x <= z.x + z.width &&
    tokenPos.y >= z.y &&
    tokenPos.y <= z.y + z.height
  )
}

/**
 * Renders terrain zones on 2D canvas context
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<object>} zones
 */
export function drawTerrainZones(ctx, zones = []) {
  if (!ctx || !Array.isArray(zones) || zones.length === 0) return

  ctx.save()

  for (const z of zones) {
    const typeDef = TERRAIN_TYPES[z.type] || TERRAIN_TYPES.difficult

    ctx.save()
    ctx.fillStyle = `${typeDef.color}25`
    ctx.strokeStyle = typeDef.color
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])

    // Fill and border
    ctx.fillRect(z.x, z.y, z.width, z.height)
    ctx.strokeRect(z.x, z.y, z.width, z.height)

    // Label in center
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const labelText = `${typeDef.icon} ${z.name || typeDef.label}`
    const textWidth = ctx.measureText(labelText).width
    const centerX = z.x + z.width / 2
    const centerY = z.y + z.height / 2

    ctx.fillRect(centerX - textWidth / 2 - 4, centerY - 8, textWidth + 8, 16)
    ctx.fillStyle = typeDef.color
    ctx.fillText(labelText, centerX, centerY)

    ctx.restore()
  }

  ctx.restore()
}
