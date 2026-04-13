/* MapPage.jsx — Tactical map with multi-tab maps, fog, walls, text labels */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, X, Edit2, Check } from 'lucide-react'
import Token from '../components/map/Token.jsx'
import MapToolbar from '../components/map/MapToolbar.jsx'
import ContextMenu from '../components/ui/ContextMenu.jsx'
import { db } from '../services/database.js'

const MAP_WIDTH  = 3000
const MAP_HEIGHT = 3000
const METERS_PER_SQUARE = 1.5

// ── Vision / Ray-casting utilities ───────────────────────────────────────────

/**
 * Returns true if segment (ax,ay)→(bx,by) intersects segment (cx,cy)→(dx,dy).
 * Uses parametric form with a small epsilon to avoid coincident endpoint hits.
 */
function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
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
function isBlockedByWall(ox, oy, tx, ty, walls) {
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
function computeVisionCells(entity, gridConfig, walls) {
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

  // Center cell
  const colC = Math.floor((cx - ox) / size)
  const rowC = Math.floor((cy - oy) / size)

  const r = Math.ceil(radius) + 1
  for (let dc = -r; dc <= r; dc++) {
    for (let dr = -r; dr <= r; dr++) {
      const col = colC + dc
      const row = rowC + dr
      if (col < 0 || row < 0 || col * size > MAP_WIDTH || row * size > MAP_HEIGHT) continue

      // Cell center in world coords
      const tcx = col * size + ox + size / 2
      const tcy = row * size + oy + size / 2
      const dist = Math.hypot(tcx - cx, tcy - cy)

      // Is cell within radius?
      let inRange = dist <= radiusPx
      // Is cell within cone (if enabled)?
      if (hasCone && dist > 0) {
        const angle = Math.atan2(tcy - cy, tcx - cx)
        let diff = Math.abs(angle - coneDir)
        if (diff > Math.PI) diff = 2 * Math.PI - diff
        if (diff <= CONE_HALF && dist <= coneExtended) inRange = true
      }

      if (!inRange) continue

      // Ray-cast from token center to cell center
      if (!isBlockedByWall(cx, cy, tcx, tcy, walls)) {
        visibleCells.add(`${col},${row}`)
      }
    }
  }

  return visibleCells
}

// Snap world pos to nearest grid cell center
function snapPos(x, y, size, offX, offY) {
  const col = Math.round((x - offX - size / 2) / size)
  const row = Math.round((y - offY - size / 2) / size)
  return { x: col * size + offX + size / 2, y: row * size + offY + size / 2 }
}

// Staggered initial token position
function defaultPos(index, size) {
  return {
    x: 120 + (index % 8) * (size + 8) + size / 2,
    y: 120 + Math.floor(index / 8) * (size + 8) + size / 2,
  }
}

// Column letter label (0='A', 25='Z', 26='AA'…)
function colLabel(n) {
  let s = ''; n++
  while (n > 0) { s = String.fromCharCode(64 + (n % 26 || 26)) + s; n = Math.floor((n - 1) / 26) }
  return s
}

// Snap an angle to the nearest 0°, 45°, 90°, 135°, 180°, etc.
function snapAngle45(dx, dy) {
  const angle = Math.atan2(dy, dx)
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return snapped
}

// Compute snapped endpoint for wall tool given start + current mouse
function wallEndSnapped(start, current) {
  const dx = current.x - start.x
  const dy = current.y - start.y
  const len = Math.hypot(dx, dy)
  if (len < 2) return current
  const angle = snapAngle45(dx, dy)
  return { x: start.x + Math.cos(angle) * len, y: start.y + Math.sin(angle) * len }
}

// Default empty map data
function emptyMapData() {
  return {
    imageData: null,
    gridConfig: { show: true, size: 50, color: '#9B59E8', opacity: 0.3, lineWidth: 1, offsetX: 0, offsetY: 0, showCoords: false },
    drawPaths: [],
    wallSegments: [],
    textLabels: [],
    revealedCells: [],
    fogEnabled: false,
  }
}

// Serialize map state for DB
function serializeMap(mapData) {
  return {
    ...mapData,
    revealedCells: Array.from(mapData.revealedCells),
    // imageData stored as-is (base64 string or null)
  }
}

// Deserialize map state from DB
function deserializeMap(record) {
  return {
    ...emptyMapData(),
    ...record,
    revealedCells: new Set(record.revealedCells || []),
  }
}

// ── Vision config modal ───────────────────────────────────────────────────────
function VisionModal({ entity, onSave, onClose }) {
  const [radius, setRadius] = useState(entity.visionRadius ?? 5)
  const [cone, setCone]     = useState(entity.visionCone   ?? false)
  const [angle, setAngle]   = useState(entity.visionAngle  ?? 0)

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 24, width: 300,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
          👁️ Visibilidade — {entity.name}
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="input-label">Raio de Visão (em quadrados, 0 = desativar)</label>
          <input
            className="input"
            type="number"
            min={0} max={30}
            value={radius}
            onChange={e => setRadius(Math.max(0, parseInt(e.target.value) || 0))}
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
            {radius > 0 ? `Círculo de ${radius} quadrados (${(radius * 1.5).toFixed(1)} m)` : 'Visibilidade desativada'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="vision-cone"
            checked={cone}
            onChange={e => setCone(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }}
          />
          <label htmlFor="vision-cone" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
            Cone de visão direcional (120°, alcance +20%)
          </label>
        </div>

        {cone && (
          <div className="form-group" style={{ margin: 0 }}>
            <label className="input-label">Direção do cone (0° = leste, 90° = sul)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min={0} max={359}
                value={angle}
                onChange={e => setAngle(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right', fontSize: '0.85rem' }}>{angle}°</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(entity.tableId, {
              visionRadius: radius > 0 ? radius : null,
              visionCone:   radius > 0 ? cone : false,
              visionAngle:  radius > 0 ? angle : null,
            })}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MapPage({ tableEntities = [], setTableEntities }) {

  // ── Multi-map tabs ────────────────────────────────────────────���───────────
  const [maps, setMaps]           = useState([])        // [{id, name, campaignId}]
  const [activeMapId, setActiveMapId] = useState(null)
  const [renamingId, setRenamingId]   = useState(null)
  const [renameText, setRenameText]   = useState('')

  // ── Per-map data (active map) ─────────────────────────────────────────────
  const [mapData, setMapData] = useState(emptyMapData())
  const mapDataRef = useRef(mapData)  // for saving before switch without stale closure
  useEffect(() => { mapDataRef.current = mapData }, [mapData])

  // Convenience accessors
  const mapImage      = mapData.imageData
  const gridConfig    = mapData.gridConfig
  const drawPaths     = mapData.drawPaths
  const wallSegments  = mapData.wallSegments
  const textLabels    = mapData.textLabels
  const revealedCells = mapData.revealedCells
  const fogEnabled    = mapData.fogEnabled

  const setMapField = (key, val) => setMapData(prev => ({ ...prev, [key]: val }))

  // ── Viewport ──────────────────────────────────────────────────────────────
  const [scale, setScale]   = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // ── Tools ─────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('select')
  const [snapEnabled, setSnapEnabled] = useState(true)

  // ── Drawing ───────────────────────────────────────────────────────────────
  const [currentPath, setCurrentPath] = useState(null)
  const [drawColor, setDrawColor]     = useState('#FF4444')
  const [drawSize, setDrawSize]       = useState(4)

  // ── Wall tool ─────────────────────────────────────────────────────────────
  const [wallStart, setWallStart]     = useState(null)
  const [wallPreview, setWallPreview] = useState(null)

  // ── Measure ───────────────────────────────────────────────────────────────
  const [measurePts, setMeasurePts] = useState({ start: null, end: null })

  // ── Token interaction ─────────────────────────────────────────────────────
  const [activeTokenId, setActiveTokenId]     = useState(null)
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  const [tokenCtxMenu, setTokenCtxMenu]       = useState(null)
  const [interactionKind, setInteractionKind] = useState('none')
  const [dragStart, setDragStart]             = useState({ x: 0, y: 0 })

  // Vision config modal
  const [visionModal, setVisionModal] = useState(null)  // { entity } | null

  const containerRef = useRef(null)
  const canvasRef    = useRef(null)

  // ── Load maps from DB on mount ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      let list = await db.maps.toArray()
      if (list.length === 0) {
        // Create a default map
        const id = await db.maps.add({ name: 'Mapa 1', campaignId: 'coalizao', createdAt: new Date().toISOString(), ...serializeMap(emptyMapData()) })
        list = [{ id, name: 'Mapa 1', campaignId: 'coalizao' }]
      }
      setMaps(list.map(m => ({ id: m.id, name: m.name })))
      setActiveMapId(list[0].id)
      const record = await db.maps.get(list[0].id)
      setMapData(deserializeMap(record))
    }
    load()
  }, [])

  // ── Save current map state to DB ──────────────────────────────────────────
  const saveCurrentMap = useCallback(async (id, data) => {
    if (!id) return
    try {
      await db.maps.update(id, serializeMap(data))
    } catch (err) {
      console.error('[MapPage] Failed to save map:', err)
    }
  }, [])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!activeMapId) return
    const timer = setInterval(() => saveCurrentMap(activeMapId, mapDataRef.current), 30000)
    return () => clearInterval(timer)
  }, [activeMapId, saveCurrentMap])

  // ── Switch active map ─────────────────────────────────────────────────────
  const switchMap = async (newId) => {
    if (newId === activeMapId) return
    await saveCurrentMap(activeMapId, mapDataRef.current)
    const record = await db.maps.get(newId)
    setMapData(deserializeMap(record))
    setActiveMapId(newId)
    setScale(1); setOffset({ x: 0, y: 0 })
    setActiveTool('select')
    setMeasurePts({ start: null, end: null })
    setWallStart(null); setWallPreview(null)
  }

  // ── Create new map ────────────────────────────────────────────────────────
  const createMap = async () => {
    await saveCurrentMap(activeMapId, mapDataRef.current)
    const name = `Mapa ${maps.length + 1}`
    const id = await db.maps.add({ name, campaignId: 'coalizao', createdAt: new Date().toISOString(), ...serializeMap(emptyMapData()) })
    setMaps(prev => [...prev, { id, name }])
    const record = await db.maps.get(id)
    setMapData(deserializeMap(record))
    setActiveMapId(id)
    setScale(1); setOffset({ x: 0, y: 0 })
  }

  // ── Delete map ────────────────────────────────────────────────────────────
  const deleteMap = async (id) => {
    if (maps.length <= 1) return   // keep at least one
    await db.maps.delete(id)
    const remaining = maps.filter(m => m.id !== id)
    setMaps(remaining)
    if (activeMapId === id) {
      const record = await db.maps.get(remaining[0].id)
      setMapData(deserializeMap(record))
      setActiveMapId(remaining[0].id)
    }
  }

  // ── Rename map ────────────────────────────────────────────────────────────
  const commitRename = async () => {
    const name = renameText.trim() || 'Mapa'
    await db.maps.update(renamingId, { name })
    setMaps(prev => prev.map(m => m.id === renamingId ? { ...m, name } : m))
    setRenamingId(null)
  }

  // ── Canvas render ─────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fog of War — combine manually revealed cells with dynamic token vision
    if (fogEnabled) {
      // Compute dynamic vision from all tokens that have visionRadius
      const dynamicCells = new Set(revealedCells)
      tableEntities.forEach(entity => {
        if (entity.visionRadius) {
          const cells = computeVisionCells(entity, gridConfig, wallSegments)
          cells.forEach(k => dynamicCells.add(k))
        }
      })

      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'destination-out'
      const { size, offsetX: ox, offsetY: oy } = gridConfig
      dynamicCells.forEach(key => {
        const [c, r] = key.split(',').map(Number)
        ctx.fillRect(c * size + ox, r * size + oy, size, size)
      })
      ctx.restore()
    }

    // Draw saved freehand paths
    const renderPath = (path) => {
      if (path.points.length < 2) return
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y)
      ctx.strokeStyle = path.color; ctx.lineWidth = path.size
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.stroke(); ctx.restore()
    }
    drawPaths.forEach(renderPath)
    if (currentPath) renderPath(currentPath)

    // Draw wall segments
    const allWalls = [...wallSegments, ...(wallPreview ? [wallPreview] : [])]
    allWalls.forEach(w => {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(w.x1, w.y1)
      ctx.lineTo(w.x2, w.y2)
      ctx.strokeStyle = w.color || '#FBBF24'
      ctx.lineWidth   = w.width || 3
      ctx.lineCap     = 'round'
      ctx.shadowColor = w.color || '#FBBF24'
      ctx.shadowBlur  = 4
      ctx.stroke(); ctx.restore()
    })

    // Measure line
    if (measurePts.start && measurePts.end) {
      const { start: s, end: e } = measurePts
      ctx.save()
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = '#9B59E8'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke()
      ctx.fillStyle = '#9B59E8'
      ;[s, e].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill() })
      ctx.restore()
    }
  }, [fogEnabled, revealedCells, drawPaths, currentPath, wallSegments, wallPreview, measurePts, gridConfig, tableEntities])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      setScale(s => Math.max(0.15, Math.min(5, s - e.deltaY * 0.001)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ── World position helper ─────────────────────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top  - offset.y) / scale,
    }
  }, [offset, scale])

  // ── Fog helpers ───────────────────────────────────────────────────────────
  const toggleFogCell = (wx, wy, reveal = true) => {
    const { size, offsetX: ox, offsetY: oy } = gridConfig
    const col = Math.floor((wx - ox) / size)
    const row = Math.floor((wy - oy) / size)
    const key = `${col},${row}`
    setMapField('revealedCells', (() => {
      const s = new Set(revealedCells)
      reveal ? s.add(key) : s.delete(key)
      return s
    })())
  }

  const revealAll = () => {
    const { size, offsetX: ox, offsetY: oy } = gridConfig
    const cols = Math.ceil((MAP_WIDTH  - ox) / size)
    const rows = Math.ceil((MAP_HEIGHT - oy) / size)
    const all = new Set()
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        all.add(`${c},${r}`)
    setMapField('revealedCells', all)
  }

  const hideAll = () => setMapField('revealedCells', new Set())

  // ── Map image upload ──────────────────────────────────────────────────────
  const handleMapUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setMapField('imageData', ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Token mouse down ──────────────────────────────────────────────────────
  const handleTokenMouseDown = (e, tableId) => {
    e.stopPropagation()
    if (e.button === 2) return
    if (e.shiftKey || activeTool === 'measure') return
    setInteractionKind('token')
    setActiveTokenId(tableId)
    setSelectedTokenId(tableId)
    setTokenCtxMenu(null)
    const entity = tableEntities.find(en => en.tableId === tableId)
    const rect = containerRef.current.getBoundingClientRect()
    const mx = entity?.mapX ?? defaultPos(tableEntities.indexOf(entity), gridConfig.size).x
    const my = entity?.mapY ?? defaultPos(tableEntities.indexOf(entity), gridConfig.size).y
    setDragStart({
      x: e.clientX - rect.left - mx * scale - offset.x,
      y: e.clientY - rect.top  - my * scale - offset.y,
    })
  }

  // ── Token context menu ────────────────────────────────────────────────────
  const handleTokenContextMenu = (e, entity) => {
    e.preventDefault(); e.stopPropagation()
    setTokenCtxMenu({
      pos: { x: e.clientX, y: e.clientY },
      options: [
        {
          label: 'Editar HP',
          action: () => {
            const val = prompt(`HP de ${entity.name} (atual: ${entity.hp ?? 0}):`, entity.hp ?? 0)
            if (val !== null) setTableEntities(prev => prev.map(en =>
              en.tableId === entity.tableId ? { ...en, hp: parseInt(val) || 0 } : en
            ))
          },
        },
        {
          label: entity.visionRadius ? `Visão: ${entity.visionRadius} quad.` : 'Configurar Visibilidade',
          action: () => { setTokenCtxMenu(null); setVisionModal({ entity }) },
        },
        {
          label: 'Remover do Mapa',
          action: () => setTableEntities(prev => prev.filter(en => en.tableId !== entity.tableId)),
          danger: true,
        },
      ],
    })
  }

  // ── Map mouse events ──────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (tokenCtxMenu) { setTokenCtxMenu(null); return }
    const world = toWorld(e.clientX, e.clientY)

    if (e.shiftKey || activeTool === 'measure') {
      setInteractionKind('measure')
      setMeasurePts({ start: world, end: world })
      return
    }
    if (activeTool === 'select' || activeTool === 'pan') {
      setInteractionKind('pan')
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      setSelectedTokenId(null)
      return
    }
    if (activeTool === 'draw') {
      setInteractionKind('draw')
      setCurrentPath({ points: [world], color: drawColor, size: drawSize })
      return
    }
    if (activeTool === 'erase') {
      setInteractionKind('erase')
      setMapField('drawPaths', drawPaths.filter(path =>
        !path.points.some(p => Math.hypot(p.x - world.x, p.y - world.y) < 20)
      ))
      setMapField('wallSegments', wallSegments.filter(w => {
        const midX = (w.x1 + w.x2) / 2, midY = (w.y1 + w.y2) / 2
        return Math.hypot(midX - world.x, midY - world.y) > 20
      }))
      setMapField('textLabels', textLabels.filter(l =>
        Math.hypot(l.x - world.x, l.y - world.y) > 30
      ))
      return
    }
    if (activeTool === 'wall') {
      setInteractionKind('wall')
      setWallStart(world)
      setWallPreview({ x1: world.x, y1: world.y, x2: world.x, y2: world.y, color: '#FBBF24', width: 3 })
      return
    }
    if (activeTool === 'text') {
      const text = window.prompt('Texto da etiqueta:')
      if (text?.trim()) {
        setMapField('textLabels', [...textLabels, { x: world.x, y: world.y, text: text.trim(), color: '#FFFFFF', fontSize: 14 }])
      }
      return
    }
    if (activeTool === 'fog' || fogEnabled) {
      if (fogEnabled) {
        setInteractionKind('fog')
        toggleFogCell(world.x, world.y, !e.altKey)
      }
    }
  }

  const handleMouseMove = (e) => {
    const world = toWorld(e.clientX, e.clientY)
    if (interactionKind === 'pan') {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    } else if (interactionKind === 'token' && activeTokenId) {
      const rect = containerRef.current.getBoundingClientRect()
      let nx = (e.clientX - rect.left - offset.x - dragStart.x) / scale
      let ny = (e.clientY - rect.top  - offset.y - dragStart.y) / scale
      if (snapEnabled) {
        const s = snapPos(nx, ny, gridConfig.size, gridConfig.offsetX, gridConfig.offsetY)
        nx = s.x; ny = s.y
      }
      setTableEntities(prev => prev.map(en =>
        en.tableId === activeTokenId ? { ...en, mapX: nx, mapY: ny } : en
      ))
    } else if (interactionKind === 'measure') {
      setMeasurePts(prev => ({ ...prev, end: world }))
    } else if (interactionKind === 'draw') {
      setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, world] } : prev)
    } else if (interactionKind === 'erase') {
      setMapField('drawPaths', drawPaths.filter(path =>
        !path.points.some(p => Math.hypot(p.x - world.x, p.y - world.y) < 18)
      ))
    } else if (interactionKind === 'fog' && fogEnabled) {
      toggleFogCell(world.x, world.y, true)
    } else if (interactionKind === 'wall' && wallStart) {
      const end = wallEndSnapped(wallStart, world)
      setWallPreview({ x1: wallStart.x, y1: wallStart.y, x2: end.x, y2: end.y, color: '#FBBF24', width: 3 })
    }
  }

  const handleMouseUp = () => {
    if (interactionKind === 'draw' && currentPath?.points.length > 1) {
      setMapField('drawPaths', [...drawPaths, currentPath])
    }
    if (interactionKind === 'wall' && wallPreview) {
      if (Math.hypot(wallPreview.x2 - wallPreview.x1, wallPreview.y2 - wallPreview.y1) > 5) {
        setMapField('wallSegments', [...wallSegments, wallPreview])
      }
      setWallStart(null); setWallPreview(null)
    }
    if (interactionKind === 'measure') {
      setTimeout(() => setMeasurePts({ start: null, end: null }), 2000)
    }
    setCurrentPath(null)
    setInteractionKind('none')
    setActiveTokenId(null)
  }

  // ── Grid CSS ──────────────────────────────────────────────────────────────
  const gridStyle = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    opacity: gridConfig.opacity,
    backgroundImage: `
      linear-gradient(to right, ${gridConfig.color} ${gridConfig.lineWidth}px, transparent ${gridConfig.lineWidth}px),
      linear-gradient(to bottom, ${gridConfig.color} ${gridConfig.lineWidth}px, transparent ${gridConfig.lineWidth}px)
    `,
    backgroundSize: `${gridConfig.size}px ${gridConfig.size}px`,
    backgroundPosition: `${gridConfig.offsetX}px ${gridConfig.offsetY}px`,
  }

  // ── Coordinate labels ─────────────────────────────────────────────────────
  const renderCoords = () => {
    const { size, offsetX: ox, offsetY: oy } = gridConfig
    const cols = Math.ceil(MAP_WIDTH  / size)
    const rows = Math.ceil(MAP_HEIGHT / size)
    const labels = []
    for (let c = 0; c < Math.min(cols, 40); c++) {
      for (let r = 0; r < Math.min(rows, 30); r++) {
        labels.push(
          <div key={`${c}-${r}`} style={{
            position: 'absolute',
            left: c * size + ox + 2, top: r * size + oy + 1,
            fontSize: Math.max(7, Math.round(size * 0.18)),
            color: gridConfig.color, opacity: 0.7,
            fontFamily: 'var(--font-mono)', pointerEvents: 'none', userSelect: 'none',
          }}>
            {colLabel(c)}{r + 1}
          </div>
        )
      }
    }
    return labels
  }

  // ── Measure HUD ───────────────────────────────────────────────────────────
  let distSquares = 0, distMeters = 0
  if (measurePts.start && measurePts.end) {
    const dx = measurePts.end.x - measurePts.start.x
    const dy = measurePts.end.y - measurePts.start.y
    distSquares = Math.sqrt(dx * dx + dy * dy) / gridConfig.size
    distMeters  = distSquares * METERS_PER_SQUARE
  }

  // ── Cursor ────────────────────────────────────────────────────────────────
  const cursorMap = { select:'default', pan:'grab', measure:'crosshair', draw:'crosshair', erase:'cell', wall:'crosshair', text:'text', fog: fogEnabled ? 'cell' : 'default' }
  const cursor = interactionKind === 'token' ? 'grabbing' : interactionKind === 'pan' ? 'grabbing' : (cursorMap[activeTool] || 'default')

  const TAB_BAR_H = 34
  const TOOLBAR_H = 42

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* ── Map Tab Bar ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: TAB_BAR_H, zIndex: 25,
        display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px',
        background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
      }}>
        {maps.map(m => (
          <div
            key={m.id}
            onClick={() => switchMap(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 10px', height: TAB_BAR_H - 2,
              borderRadius: '4px 4px 0 0',
              background: m.id === activeMapId ? 'var(--bg-secondary)' : 'transparent',
              borderBottom: m.id === activeMapId ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer', flexShrink: 0, minWidth: 80,
              fontSize: '0.78rem', fontWeight: m.id === activeMapId ? 600 : 400,
              color: m.id === activeMapId ? 'var(--text-primary)' : 'var(--text-muted)',
              userSelect: 'none',
            }}
          >
            {renamingId === m.id ? (
              <input
                autoFocus
                value={renameText}
                onChange={e => setRenameText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                onBlur={commitRename}
                onClick={e => e.stopPropagation()}
                style={{ width: 80, fontSize: '0.78rem', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', borderRadius: 3, padding: '1px 4px', color: 'var(--text-primary)' }}
              />
            ) : (
              <>
                <span
                  onDoubleClick={e => { e.stopPropagation(); setRenamingId(m.id); setRenameText(m.name) }}
                  style={{ flex: 1 }}
                >
                  {m.name}
                </span>
                {maps.length > 1 && m.id === activeMapId && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteMap(m.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 1px', lineHeight: 1 }}
                    title="Excluir mapa"
                  >
                    <X size={11} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        <button
          onClick={createMap}
          title="Novo mapa"
          style={{
            display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px',
            background: 'none', border: '1px dashed var(--border-subtle)', borderRadius: 4,
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0,
          }}
        >
          <Plus size={12} /> Novo
        </button>
      </div>

      {/* ── Tool Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: TAB_BAR_H, left: 0, right: 0, zIndex: 20 }}>
        <MapToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUploadMap={handleMapUpload}
          gridConfig={gridConfig}
          onGridConfigChange={cfg => setMapField('gridConfig', cfg)}
          snapToGrid={snapEnabled}
          onSnapChange={setSnapEnabled}
          fogEnabled={fogEnabled}
          onFogToggle={v => setMapField('fogEnabled', v)}
          onRevealAll={revealAll}
          onHideAll={hideAll}
          onClearDrawing={() => { setMapField('drawPaths', []); setMapField('wallSegments', []); setMapField('textLabels', []) }}
          drawColor={drawColor}
          drawSize={drawSize}
          onDrawColorChange={setDrawColor}
          onDrawSizeChange={setDrawSize}
          scale={scale}
          onZoomIn={() => setScale(s => Math.min(5, +(s + 0.1).toFixed(2)))}
          onZoomOut={() => setScale(s => Math.max(0.15, +(s - 0.1).toFixed(2)))}
          onResetView={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
          tokenCount={tableEntities.length}
        />
      </div>

      {/* ── Viewport ─────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: TAB_BAR_H + TOOLBAR_H,
          left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
          cursor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map world */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0,
            width: MAP_WIDTH, height: MAP_HEIGHT,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            backgroundImage: mapImage ? `url(${mapImage})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: mapImage ? '#0a0a14' : '#1a1a2e',
          }}
        >
          {/* Empty hint */}
          {!mapImage && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ textAlign:'center', color:'var(--text-muted)', opacity:0.4, fontSize:'1rem' }}>
                <div style={{ fontSize:'3rem', marginBottom:12 }}>🗺️</div>
                <div>Clique em <strong>Mapa</strong> na toolbar para carregar uma imagem</div>
                <div style={{ fontSize:'0.8rem', marginTop:6 }}>PNG · JPG · WebP · duplo-clique na aba para renomear</div>
              </div>
            </div>
          )}

          {/* Grid */}
          {gridConfig.show && <div style={gridStyle} />}
          {gridConfig.show && gridConfig.showCoords && renderCoords()}

          {/* Canvas: fog + draw + walls + measure */}
          <canvas ref={canvasRef} width={MAP_WIDTH} height={MAP_HEIGHT}
            style={{ position:'absolute', top:0, left:0, pointerEvents:'none' }} />

          {/* Text labels */}
          {textLabels.map((label, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: label.x, top: label.y,
                transform: 'translate(-50%, -50%)',
                color: label.color || '#FFFFFF',
                fontSize: (label.fontSize || 14),
                fontWeight: 700,
                textShadow: '0 0 4px #000, 0 1px 3px #000',
                pointerEvents: activeTool === 'erase' ? 'none' : 'auto',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                cursor: activeTool === 'erase' ? 'cell' : 'default',
              }}
              onDoubleClick={() => {
                const newText = window.prompt('Editar etiqueta:', label.text)
                if (newText !== null) {
                  const updated = [...textLabels]
                  updated[i] = { ...label, text: newText.trim() || label.text }
                  setMapField('textLabels', updated)
                }
              }}
            >
              {label.text}
            </div>
          ))}

          {/* Tokens */}
          {tableEntities.map((entity, index) => {
            const defPos = defaultPos(index, gridConfig.size)
            const pos = { x: entity.mapX ?? defPos.x, y: entity.mapY ?? defPos.y }
            return (
              <Token
                key={entity.tableId}
                entity={entity}
                gridSize={gridConfig.size}
                isActive={activeTokenId === entity.tableId}
                isSelected={selectedTokenId === entity.tableId}
                position={pos}
                onMouseDown={e => handleTokenMouseDown(e, entity.tableId)}
                onClick={() => setSelectedTokenId(entity.tableId)}
                onContextMenu={e => handleTokenContextMenu(e, entity)}
                showVision={fogEnabled && !!entity.visionRadius}
              />
            )
          })}
        </div>

        {/* Measure HUD */}
        {measurePts.start && measurePts.end && (
          <div style={{
            position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
            background:'rgba(0,0,0,0.85)', color:'white', padding:'6px 14px',
            borderRadius:6, zIndex:50, fontSize:'0.9rem', fontWeight:700, whiteSpace:'nowrap',
            border:'1px solid var(--accent-primary)',
          }}>
            📏 {distSquares.toFixed(1)} quadrados · {distMeters.toFixed(1)} m
          </div>
        )}

        {/* Token context menu */}
        {tokenCtxMenu && (
          <ContextMenu
            position={tokenCtxMenu.pos}
            options={tokenCtxMenu.options}
            onClose={() => setTokenCtxMenu(null)}
          />
        )}

        {/* Vision config modal */}
        {visionModal && (
          <VisionModal
            entity={visionModal.entity}
            onSave={(tableId, updates) => {
              setTableEntities(prev => prev.map(en =>
                en.tableId === tableId ? { ...en, ...updates } : en
              ))
              setVisionModal(null)
            }}
            onClose={() => setVisionModal(null)}
          />
        )}

        {/* Status bar */}
        <div style={{
          position:'absolute', bottom:0, right:0,
          background:'rgba(0,0,0,0.6)', color:'var(--text-muted)',
          fontSize:'0.68rem', padding:'2px 8px',
          fontFamily:'var(--font-mono)', borderTopLeftRadius:4,
        }}>
          {Math.round(scale * 100)}% · {tableEntities.length} tokens · {wallSegments.length} paredes
        </div>
      </div>
    </div>
  )
}
