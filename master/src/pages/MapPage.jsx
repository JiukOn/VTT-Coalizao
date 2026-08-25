/* MapPage.jsx — Tactical map with multi-tab maps, fog, walls, text labels */
import { useState, useRef, useEffect, useCallback } from 'react'
import Token from '../components/map/Token.jsx'
import { CONDITIONS } from '../utils/conditionUtils.js'
import MapToolbar from '../components/map/MapToolbar.jsx'
import ContextMenu from '../components/ui/ContextMenu.jsx'
import Modal from '../components/common/Modal.jsx'
import NPCSheet from '../components/entities/NPCSheet.jsx'
import CreatureSheet from '../components/entities/CreatureSheet.jsx'
import WeatherModal from '../components/map/WeatherModal.jsx'
import MapMarkerModal from '../components/map/MapMarkerModal.jsx'
import GenerateDungeonModal from '../components/map/GenerateDungeonModal.jsx'
import PhysicalTVModal from '../components/map/PhysicalTVModal.jsx'
import { MARKER_TYPES } from '@shared/utils/mapMarkers.js'
import { getCellsInBrushRadius, applyRevealBrush, applyHideBrush } from '@shared/utils/fogUtils.js'
import { Sliders, Plus, Map, X, Zap } from 'lucide-react'
import { db } from '../services/database.js'
import { useServer } from '../context/ServerContext.jsx'
import { MAP_WIDTH, MAP_HEIGHT, computeVisionCells } from '../utils/visionUtils.js'
import AoEResolverModal from '../components/map/AoEResolverModal.jsx'
import {
  getTokensInCircleAoE,
  getTokensInConeAoE,
  getTokensInLineAoE,
  calculatePathDistance,
  calculateMaxMovement,
} from '@shared/utils/aoeTargeting.js'
import {
  canEntityMount,
  coupleTokenToMount,
  decoupleTokenFromMount,
  moveMountAndRiders,
} from '@shared/utils/mountCoupling.js'

const METERS_PER_SQUARE = 1.5

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

function wallEndSnapped(start, current) {
  const dx = current.x - start.x
  const dy = current.y - start.y
  const len = Math.hypot(dx, dy)
  if (len < 2) return current
  const angle = snapAngle45(dx, dy)
  return { x: start.x + Math.cos(angle) * len, y: start.y + Math.sin(angle) * len }
}

// Compute if a point is within an active AoE spell template
function isPointInAoe(px, py, aoe, size) {
  if (!aoe) return false
  const radiusPx = (aoe.radiusMeters / METERS_PER_SQUARE) * size
  const dx = px - aoe.x
  const dy = py - aoe.y
  const dist = Math.hypot(dx, dy)

  if (aoe.shape === 'circle') {
    return dist <= radiusPx
  }
  if (aoe.shape === 'cone') {
    if (dist > radiusPx || dist === 0) return false
    const angle = Math.atan2(dy, dx)
    let diff = Math.abs(angle - (aoe.angle || 0))
    if (diff > Math.PI) diff = 2 * Math.PI - diff
    return diff <= Math.PI / 4 // 90° total cone (+- 45°)
  }
  if (aoe.shape === 'line') {
    const halfWidth = size / 2
    const len = radiusPx
    const ang = aoe.angle || 0
    const rx = Math.cos(-ang) * dx - Math.sin(-ang) * dy
    const ry = Math.sin(-ang) * dx + Math.cos(-ang) * dy
    return rx >= 0 && rx <= len && Math.abs(ry) <= halfWidth
  }
  return false
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
const VISION_PRESETS = [
  { label: 'Cego (0)', value: 0 },
  { label: 'Curta (4q · 6m)', value: 4 },
  { label: 'Normal (8q · 12m)', value: 8 },
  { label: 'Aguçada (12q · 18m)', value: 12 },
  { label: 'Longo (20q · 30m)', value: 20 },
]

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
          borderRadius: 12, padding: 24, width: 340,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
          👁️ Visibilidade — {entity.name}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {VISION_PRESETS.map(preset => (
            <button
              key={preset.value}
              className={`btn btn-sm ${radius === preset.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={() => setRadius(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="input-label">Raio de Visão (customizado)</label>
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
              visionAngle:  radius > 0 && cone ? angle : 0,
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
  const { serverOnline, broadcast } = useServer()

  // ── Multi-map tabs ────────────────────────────────────────────���───────────
  const [maps, setMaps]           = useState([])        // [{id, name, campaignId}]
  const [activeMapId, setActiveMapId] = useState(null)
  const [renamingId, setRenamingId]   = useState(null)
  const [renameText, setRenameText]   = useState('')

  // ── Per-map data (active map) ─────────────────────────────────────────────
  const [mapData, setMapData] = useState(emptyMapData())
  const mapDataRef = useRef(mapData)  // for saving before switch without stale closure

  // ── Save current map state to DB ──────────────────────────────────────────
  const saveCurrentMap = useCallback(async (id, data) => {
    if (!id) return
    try {
      await db.maps.update(id, serializeMap(data))
    } catch (err) {
      console.error('[MapPage] Failed to save map:', err)
    }
  }, [])

  useEffect(() => { 
    mapDataRef.current = mapData 
    if (serverOnline) {
      broadcast('map_update', serializeMap(mapData))
    }
    if (activeMapId) {
      const timer = setTimeout(() => {
        saveCurrentMap(activeMapId, mapData)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mapData, serverOnline, broadcast, activeMapId, saveCurrentMap])

  // Convenience accessors
  const mapImage      = mapData.imageData
  const gridConfig    = mapData.gridConfig
  const drawPaths     = mapData.drawPaths
  const wallSegments  = mapData.wallSegments
  const textLabels    = mapData.textLabels
  const revealedCells = mapData.revealedCells
  const fogEnabled    = mapData.fogEnabled
  const markers       = mapData.markers || []

  const setMapField = (key, val) => setMapData(prev => ({ ...prev, [key]: val }))

  // ── Viewport ──────────────────────────────────────────────────────────────
  const [scale, setScale]   = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // ── Tools ─────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('select')
  const [snapEnabled, setSnapEnabled] = useState(true)

  // ── Secret Map Markers ─────────────────────────────────────────────────────
  const [markerModalOpen, setMarkerModalOpen] = useState(false)
  const [editingMarker, setEditingMarker]     = useState(null)
  const [newMarkerPos, setNewMarkerPos]       = useState({ x: 100, y: 100 })

  // ── Drawing ───────────────────────────────────────────────────────────────
  const [currentPath, setCurrentPath] = useState(null)
  const [drawColor, setDrawColor]     = useState('#FF4444')
  const [drawSize, setDrawSize]       = useState(4)

  // ── Wall tool ─────────────────────────────────────────────────────────────
  const [wallStart, setWallStart]     = useState(null)
  const [wallPreview, setWallPreview] = useState(null)

  // ── Measure ───────────────────────────────────────────────────────────────
  const [measurePts, setMeasurePts] = useState({ start: null, end: null })

  // ── AoE Spell Templates ───────────────────────────────────────────────────
  const [aoeConfig, setAoeConfig]   = useState({ shape: 'circle', radiusMeters: 6, color: '#EF4444' })
  const [activeAoe, setActiveAoe]   = useState(null)
  const [aoeResolverOpen, setAoeResolverOpen] = useState(false)
  const [aoeCapturedTargets, setAoeCapturedTargets] = useState([])

  // ── Drag Waypoints & Movement Trajectory ───────────────────────────────────
  const [dragWaypoints, setDragWaypoints] = useState([])

  // ── Ambient Weather ────────────────────────────────────────────────────────
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)
  const [dungeonModalOpen, setDungeonModalOpen] = useState(false)
  const [tvModalOpen, setTvModalOpen]           = useState(false)
  const [tvModeActive, setTvModeActive]         = useState(false)
  const [hidePlayerTokens, setHidePlayerTokens] = useState(false)
  const [fogBrushSize, setFogBrushSize]         = useState(1)
  const [brushHoverPos, setBrushHoverPos]       = useState(null)
  const [currentWeather, setCurrentWeather]     = useState('none') // { shape, x, y, radiusMeters, color, angle }

  const handleApplyTVMode = ({ scale: newScale, hidePlayerTokens: shouldHide }) => {
    setScale(newScale)
    setHidePlayerTokens(shouldHide)
    setTvModeActive(true)
  }

  const handleApplyDungeon = (dungeonData) => {
    setMapData(prev => ({
      ...prev,
      wallSegments: dungeonData.wallSegments || [],
      markers: [
        ...(prev.markers || []),
        ...(dungeonData.torches || []).map(t => ({
          id: t.id,
          x: t.x,
          y: t.y,
          type: 'torch',
          title: 'Tocha Iluminada',
          description: `Tocha da masmorra (${t.radius}m de raio)`,
          color: t.color,
        })),
        ...(dungeonData.spawns || []).map((s, idx) => ({
          id: `spawn_${idx}`,
          x: s.x,
          y: s.y,
          type: s.type === 'players' ? 'hero' : 'monster',
          title: s.label,
          description: s.type === 'players' ? 'Ponto de entrada dos heróis' : 'Guarnição de combate',
          color: s.type === 'players' ? '#3B82F6' : '#EF4444',
        })),
      ],
    }))
  }

  // ── Token interaction ─────────────────────────────────────────────────────
  const [activeTokenId, setActiveTokenId]     = useState(null)
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  const [targetedTokenId, setTargetedTokenId] = useState(null)
  const [tokenCtxMenu, setTokenCtxMenu]       = useState(null)
  const [interactionKind, setInteractionKind] = useState('none')
  const [dragStart, setDragStart]             = useState({ x: 0, y: 0 })

  // Vision config modal
  const [visionModal, setVisionModal] = useState(null)  // { entity } | null
  
  const [pings, setPings] = useState([]) // [{ id, x, y, color, author, startTime }]

  useEffect(() => {
    const handler = (evt) => {
      const { x, y, color, author } = evt.detail?.data || {}
      if (x != null && y != null) {
        setPings(prev => [...prev, { id: Date.now() + Math.random(), x, y, color: color || '#3B82F6', author: author || '?', startTime: Date.now() }])
      }
    }
    window.addEventListener('vtp:map_ping', handler)
    return () => window.removeEventListener('vtp:map_ping', handler)
  }, [])

  useEffect(() => {
    if (pings.length === 0) return
    const timer = setInterval(() => {
      setPings(prev => prev.filter(p => Date.now() - p.startTime < 2500))
    }, 100)
    return () => clearInterval(timer)
  }, [pings.length])

  // Condition modal
  const [conditionModal, setConditionModal] = useState(null) // { entity } | null

  // Entity sheet modal — opened on token double-click
  const [sheetEntity, setSheetEntity] = useState(null)  // full DB record | null

  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const mapImageRef  = useRef(null)
  const renderCanvasRef = useRef()

  useEffect(() => {
    if (!mapImage) {
      mapImageRef.current = null
      renderCanvasRef.current?.()
      return
    }
    let active = true
    const img = new Image()
    img.onload = () => {
      if (active) {
        mapImageRef.current = img
        renderCanvasRef.current?.()
      }
    }
    img.src = mapImage
    return () => { active = false }
  }, [mapImage])

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

    // Draw wall segments (with door visual distinction)
    const allWalls = [...wallSegments, ...(wallPreview ? [wallPreview] : [])]
    allWalls.forEach(w => {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(w.x1, w.y1)
      ctx.lineTo(w.x2, w.y2)

      if (w.isDoor) {
        const doorColors = { open: '#4ADE80', closed: '#CD853F', locked: '#EF4444' }
        const color = doorColors[w.doorState] || '#CD853F'
        ctx.strokeStyle = color
        ctx.lineWidth = w.width || 4
        ctx.lineCap = 'round'
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        if (w.doorState === 'open') {
          ctx.setLineDash([6, 8])
          ctx.globalAlpha = 0.5
        }
        ctx.stroke()

        // Draw door icon marker at midpoint
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
        const mx = (w.x1 + w.x2) / 2
        const my = (w.y1 + w.y2) / 2
        const icon = w.doorState === 'open' ? '🚪' : w.doorState === 'locked' ? '🔒' : '🚪'
        ctx.font = '14px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(icon, mx, my)
      } else if (w.isWindow || w.wallType === 'window') {
        ctx.strokeStyle = '#38BDF8'
        ctx.lineWidth = w.width || 3.5
        ctx.lineCap = 'round'
        ctx.shadowColor = '#38BDF8'
        ctx.shadowBlur = 8
        ctx.setLineDash([8, 4])
        ctx.stroke()

        const mx = (w.x1 + w.x2) / 2
        const my = (w.y1 + w.y2) / 2
        ctx.shadowBlur = 0
        ctx.font = '12px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🪟', mx, my)
      } else if (w.isOneWay || w.wallType === 'cliff') {
        ctx.strokeStyle = '#A855F7'
        ctx.lineWidth = w.width || 4
        ctx.lineCap = 'round'
        ctx.shadowColor = '#A855F7'
        ctx.shadowBlur = 6
        ctx.setLineDash([12, 4])
        ctx.stroke()

        const mx = (w.x1 + w.x2) / 2
        const my = (w.y1 + w.y2) / 2
        ctx.shadowBlur = 0
        ctx.font = '12px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⛰️', mx, my)
      } else {
        ctx.strokeStyle = w.color || '#FBBF24'
        ctx.lineWidth = w.width || 3
        ctx.lineCap = 'round'
        ctx.shadowColor = w.color || '#FBBF24'
        ctx.shadowBlur = 4
        ctx.stroke()
      }
      ctx.restore()
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

    // Tactical Target Line (between selected token and targeted token)
    if (selectedTokenId && targetedTokenId && selectedTokenId !== targetedTokenId) {
      const source = tableEntities.find(en => en.tableId === selectedTokenId)
      const target = tableEntities.find(en => en.tableId === targetedTokenId)
      if (source && target) {
        const sDef = defaultPos(tableEntities.indexOf(source), gridConfig.size)
        const tDef = defaultPos(tableEntities.indexOf(target), gridConfig.size)
        const sx = source.mapX ?? sDef.x
        const sy = source.mapY ?? sDef.y
        const tx = target.mapX ?? tDef.x
        const ty = target.mapY ?? tDef.y

        const distPx = Math.hypot(tx - sx, ty - sy)
        const distSquares = distPx / gridConfig.size
        const distMeters = distSquares * METERS_PER_SQUARE

        const rangeColor = distMeters <= 1.5 ? '#4ADE80' : distMeters <= 15 ? '#FBBF24' : '#F87171'

        ctx.save()
        ctx.setLineDash([6, 6])
        ctx.strokeStyle = rangeColor
        ctx.lineWidth = 2.5
        ctx.shadowColor = rangeColor
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx, ty)
        ctx.stroke()
        ctx.restore()

        // Distance Badge
        ctx.save()
        const mx = (sx + tx) / 2
        const my = (sy + ty) / 2
        const badgeText = `🎯 ${distMeters.toFixed(1)}m`
        ctx.font = 'bold 13px sans-serif'
        const textW = ctx.measureText(badgeText).width
        ctx.fillStyle = 'rgba(0,0,0,0.85)'
        ctx.strokeStyle = rangeColor
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.roundRect(mx - textW / 2 - 8, my - 11, textW + 16, 22, 5)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = rangeColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(badgeText, mx, my)
        ctx.restore()

        // Target Crosshair on target
        ctx.save()
        ctx.translate(tx, ty)
        ctx.strokeStyle = '#EF4444'
        ctx.lineWidth = 2.5
        ctx.shadowColor = '#EF4444'
        ctx.shadowBlur = 8
        const tSize = gridConfig.size / 2 + 8
        ctx.beginPath()
        ctx.arc(0, 0, tSize, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -(tSize + 6)); ctx.lineTo(0, -(tSize - 4))
        ctx.moveTo(0, tSize - 4); ctx.lineTo(0, tSize + 6)
        ctx.moveTo(-(tSize + 6), 0); ctx.lineTo(-(tSize - 4), 0)
        ctx.moveTo(tSize - 4, 0); ctx.lineTo(tSize + 6, 0)
        ctx.stroke()
        ctx.restore()
      }
    }

    // AoE Spell Template
    if (activeAoe) {
      const { shape, x, y, radiusMeters, color, angle = 0 } = activeAoe
      const radiusPx = (radiusMeters / METERS_PER_SQUARE) * gridConfig.size

      ctx.save()
      ctx.translate(x, y)

      if (shape === 'circle') {
        // Fill
        ctx.beginPath()
        ctx.arc(0, 0, radiusPx, 0, Math.PI * 2)
        ctx.fillStyle = `${color}33`
        ctx.fill()
        // Border
        ctx.setLineDash([8, 6])
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.stroke()
      } else if (shape === 'cone') {
        const halfAngle = Math.PI / 4 // 90° cone
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, radiusPx, angle - halfAngle, angle + halfAngle)
        ctx.closePath()
        ctx.fillStyle = `${color}33`
        ctx.fill()
        ctx.setLineDash([8, 6])
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.stroke()
      } else if (shape === 'line') {
        const halfWidth = gridConfig.size / 2
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.rect(0, -halfWidth, radiusPx, gridConfig.size)
        ctx.fillStyle = `${color}33`
        ctx.fill()
        ctx.setLineDash([8, 6])
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.shadowColor = color
        ctx.shadowBlur = 10
        ctx.stroke()
      }
      ctx.restore()

      // Highlight all tokens caught in AoE
      tableEntities.forEach((entity, index) => {
        const defPos = defaultPos(index, gridConfig.size)
        const ex = entity.mapX ?? defPos.x
        const ey = entity.mapY ?? defPos.y
        if (isPointInAoe(ex, ey, activeAoe, gridConfig.size)) {
          ctx.save()
          ctx.translate(ex, ey)
          ctx.beginPath()
          ctx.arc(0, 0, gridConfig.size / 2 + 6, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.shadowColor = color
          ctx.shadowBlur = 12
          ctx.stroke()
          ctx.restore()
        }
      })
    }

    // ── Tactical Movement Trajectory & Waypoints ─────────────────────────────
    if (dragWaypoints.length > 1 && activeTokenId) {
      const activeEntity = tableEntities.find(en => en.tableId === activeTokenId)
      const maxMove = calculateMaxMovement(activeEntity)
      const pathDist = calculatePathDistance(dragWaypoints, gridConfig.size, METERS_PER_SQUARE)

      const trajColor = pathDist.totalMeters <= maxMove.normalMeters
        ? '#10B981' // Green (Normal movement)
        : pathDist.totalMeters <= maxMove.runMeters
        ? '#FBBF24' // Yellow (Dash / Run movement)
        : '#EF4444' // Red (Exceeded)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(dragWaypoints[0].x, dragWaypoints[0].y)
      for (let i = 1; i < dragWaypoints.length; i++) {
        ctx.lineTo(dragWaypoints[i].x, dragWaypoints[i].y)
      }
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = trajColor
      ctx.lineWidth = 3
      ctx.shadowColor = trajColor
      ctx.shadowBlur = 8
      ctx.stroke()

      // Draw waypoints anchors
      dragWaypoints.forEach((wp, idx) => {
        ctx.beginPath()
        ctx.arc(wp.x, wp.y, idx === 0 || idx === dragWaypoints.length - 1 ? 5 : 3.5, 0, Math.PI * 2)
        ctx.fillStyle = trajColor
        ctx.fill()
      })

      // Draw floating distance badge at current endpoint
      const lastPt = dragWaypoints[dragWaypoints.length - 1]
      const label = `${pathDist.totalMeters}m (${pathDist.totalSquares}q)`
      ctx.font = 'bold 12px sans-serif'
      const textWidth = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(lastPt.x - textWidth / 2 - 6, lastPt.y - 30, textWidth + 12, 20)
      ctx.strokeStyle = trajColor
      ctx.lineWidth = 1.5
      ctx.strokeRect(lastPt.x - textWidth / 2 - 6, lastPt.y - 30, textWidth + 12, 20)
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, lastPt.x, lastPt.y - 20)
      ctx.restore()
    }

    if (mapImageRef.current) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      const img = mapImageRef.current; const imgRatio = img.width / img.height; const canvasRatio = canvas.width / canvas.height; let drawW, drawH, drawX, drawY; if (imgRatio > canvasRatio) { drawH = canvas.height; drawW = img.width * (canvas.height / img.height); drawX = (canvas.width - drawW) / 2; drawY = 0; } else { drawW = canvas.width; drawH = img.height * (canvas.width / img.width); drawX = 0; drawY = (canvas.height - drawH) / 2; } ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore()
    }
  }, [fogEnabled, revealedCells, drawPaths, currentPath, wallSegments, wallPreview, measurePts, gridConfig, tableEntities, selectedTokenId, targetedTokenId, activeAoe, dragWaypoints, activeTokenId])

  useEffect(() => { renderCanvasRef.current = renderCanvas }, [renderCanvas])
  useEffect(() => { renderCanvas() }, [renderCanvas])

  // ── Keyboard Waypoint Placement ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && interactionKind === 'token' && activeTokenId) {
        e.preventDefault()
        const activeEntity = tableEntities.find(en => en.tableId === activeTokenId)
        if (activeEntity && activeEntity.mapX != null && activeEntity.mapY != null) {
          setDragWaypoints(prev => [...prev, { x: activeEntity.mapX, y: activeEntity.mapY }])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [interactionKind, activeTokenId, tableEntities])

  // ── Mass AoE Effect Handler ────────────────────────────────────────────────
  const handleApplyMassEffect = ({ effectType, amount, conditionId, targets, summary }) => {
    setTableEntities(prev => prev.map(en => {
      const isTarget = targets.some(t => (t.tableId || t.id) === (en.tableId || en.id))
      if (!isTarget) return en

      if (effectType === 'damage') {
        const curHp = en.hp ?? en.vitMax ?? 20
        return { ...en, hp: Math.max(0, curHp - amount) }
      }
      if (effectType === 'heal') {
        const curHp = en.hp ?? en.vitMax ?? 20
        const maxHp = en.maxHp ?? en.vitMax ?? 30
        return { ...en, hp: Math.min(maxHp, curHp + amount) }
      }
      if (effectType === 'condition') {
        const conditions = Array.isArray(en.conditions) ? [...en.conditions] : []
        if (!conditions.includes(conditionId)) conditions.push(conditionId)
        return { ...en, conditions }
      }
      return en
    }))

    if (serverOnline && broadcast) {
      broadcast('chat_message', { text: summary, sender: 'Mestre' })
    }
  }

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

  const applyFogBrush = (wx, wy, isReveal = true) => {
    const brushRadiusPx = (fogBrushSize * gridConfig.size) / 2
    const touched = getCellsInBrushRadius(wx, wy, brushRadiusPx, gridConfig.size)
    setMapField('revealedCells', isReveal
      ? applyRevealBrush(revealedCells, touched)
      : applyHideBrush(revealedCells, touched)
    )
  }

  // ── Map image upload ──────────────────────────────────────────────────────
  const handleMapUpload = (dataOrEvent) => {
    if (typeof dataOrEvent === 'string') {
      setMapField('imageData', dataOrEvent)
      return
    }
    const file = dataOrEvent?.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setMapField('imageData', ev.target.result)
    reader.readAsDataURL(file)
    if (dataOrEvent?.target) dataOrEvent.target.value = ''
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
    setDragWaypoints([{ x: mx, y: my }])
  }

  // ── Load entity sheet from DB by tableId / entityType ────────────────────
  const openEntitySheet = useCallback(async (entity) => {
    try {
      let record = null
      const etype = entity.entityType || ''
      if (etype === 'npc') {
        record = await db.npcs.get(entity.id)
      } else if (etype === 'creature' || etype === 'enemy') {
        record = await db.creatures.get(entity.id)
      } else if (etype === 'hero' || etype === 'character' || etype === 'ally') {
        record = await db.characters.get(entity.id)
      }
      // Merge live HP/effects from table token into DB record for display
      if (record) {
        setSheetEntity({ ...record, entityType: etype, hp: entity.hp ?? record.hp, effects: entity.effects ?? [] })
      } else {
        // Fallback: show whatever the token entity has
        setSheetEntity(entity)
      }
    } catch (err) {
      console.error('[MapPage] openEntitySheet error:', err)
    }
  }, [])

  // ── Token context menu ────────────────────────────────────────────────────
  const handleTokenContextMenu = (e, entity) => {
    e.preventDefault(); e.stopPropagation()
    setTokenCtxMenu({
      pos: { x: e.clientX, y: e.clientY },
      options: [
        {
          label: '📋 Ver Ficha',
          action: () => { setTokenCtxMenu(null); openEntitySheet(entity) },
        },
        {
          label: 'Editar HP',
          action: () => {
            const val = prompt(`HP de ${entity.name} (atual: ${entity.hp ?? 0}):`, entity.hp ?? 0)
            if (val !== null) {
              const newHp = parseInt(val) || 0
              setTableEntities(prev => prev.map(en =>
                en.tableId === entity.tableId ? { ...en, hp: newHp } : en
              ))
              // Sync HP to DB
              const etype = entity.entityType || ''
              const table = etype === 'npc' ? db.npcs
                : (etype === 'creature' || etype === 'enemy') ? db.creatures
                : (etype === 'hero' || etype === 'character' || etype === 'ally') ? db.characters
                : null
              if (table && entity.id) table.update(entity.id, { hp: newHp }).catch(() => {})
            }
          },
        },
        {
          label: entity.visionRadius ? `Visão: ${entity.visionRadius} quad.` : 'Configurar Visibilidade',
          action: () => { setTokenCtxMenu(null); setVisionModal({ entity }) },
        },
        {
          label: '🏷️ Condições',
          action: () => { setTokenCtxMenu(null); setConditionModal({ entity }) },
        },
        {
          label: targetedTokenId === entity.tableId ? '🎯 Desmarcar Alvo' : '🎯 Marcar como Alvo',
          action: () => {
            setTargetedTokenId(prev => prev === entity.tableId ? null : entity.tableId)
            setTokenCtxMenu(null)
          },
        },
        ...(entity.mountId ? [{
          label: '🚶 Desmontar da Montaria',
          action: () => {
            setTableEntities(prev => decoupleTokenFromMount(entity.tableId, prev))
            setTokenCtxMenu(null)
          },
        }] : tableEntities.filter(other => other.tableId !== entity.tableId && canEntityMount(entity, other)).map(mount => ({
          label: `🐎 Montar em ${mount.name}`,
          action: () => {
            setTableEntities(prev => coupleTokenToMount(entity.tableId, mount.tableId, prev))
            setTokenCtxMenu(null)
          },
        }))),
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
    // Middle-click = ping
    if (e.button === 1) {
      e.preventDefault()
      const world = toWorld(e.clientX, e.clientY)
      const pingData = { x: world.x, y: world.y, color: '#9B59E8', author: 'Mestre' }
      setPings(prev => [...prev, { id: Date.now() + Math.random(), ...pingData, startTime: Date.now() }])
      if (serverOnline) broadcast('map_ping', pingData)
      return
    }

    if (e.button !== 0) return
    if (tokenCtxMenu) { setTokenCtxMenu(null); return }
    const world = toWorld(e.clientX, e.clientY)

    if (e.shiftKey || activeTool === 'measure') {
      setInteractionKind('measure')
      setMeasurePts({ start: world, end: world })
      return
    }
    if (activeTool === 'select' || activeTool === 'pan') {
      // Check if clicking near a door — toggle its state
      if (activeTool === 'select') {
        const doorIdx = wallSegments.findIndex(w => {
          if (!w.isDoor) return false
          const midX = (w.x1 + w.x2) / 2, midY = (w.y1 + w.y2) / 2
          return Math.hypot(midX - world.x, midY - world.y) < 20
        })
        if (doorIdx !== -1) {
          const door = wallSegments[doorIdx]
          const nextState = { closed: 'open', open: 'locked', locked: 'closed' }
          const updated = [...wallSegments]
          updated[doorIdx] = { ...door, doorState: nextState[door.doorState] || 'closed' }
          setMapField('wallSegments', updated)
          return
        }
      }
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
      setMapField('markers', markers.filter(m =>
        Math.hypot(m.x - world.x, m.y - world.y) > 24
      ))
      return
    }
    if (activeTool === 'marker') {
      setNewMarkerPos({ x: Math.round(world.x), y: Math.round(world.y) })
      setEditingMarker(null)
      setMarkerModalOpen(true)
      return
    }
    if (activeTool === 'wall') {
      setInteractionKind('wall')
      setWallStart(world)
      setWallPreview({ x1: world.x, y1: world.y, x2: world.x, y2: world.y, color: '#FBBF24', width: 3 })
      return
    }
    if (activeTool === 'door') {
      setInteractionKind('wall')
      setWallStart(world)
      setWallPreview({ x1: world.x, y1: world.y, x2: world.x, y2: world.y, color: '#CD853F', width: 4, isDoor: true, doorState: 'closed' })
      return
    }
    if (activeTool === 'window') {
      setInteractionKind('wall')
      setWallStart(world)
      setWallPreview({ x1: world.x, y1: world.y, x2: world.x, y2: world.y, color: '#38BDF8', width: 3.5, isWindow: true, wallType: 'window' })
      return
    }
    if (activeTool === 'cliff') {
      setInteractionKind('wall')
      setWallStart(world)
      setWallPreview({ x1: world.x, y1: world.y, x2: world.x, y2: world.y, color: '#A855F7', width: 4, isOneWay: true, wallType: 'cliff' })
      return
    }
    if (activeTool === 'aoe') {
      setInteractionKind('aoe')
      setActiveAoe({
        shape: aoeConfig.shape || 'circle',
        radiusMeters: aoeConfig.radiusMeters || 6,
        color: aoeConfig.color || '#EF4444',
        x: world.x,
        y: world.y,
        angle: 0,
      })
      return
    }
    if (activeTool === 'text') {
      const text = window.prompt('Texto da etiqueta:')
      if (text?.trim()) {
        setMapField('textLabels', [...textLabels, { x: world.x, y: world.y, text: text.trim(), color: '#FFFFFF', fontSize: 14 }])
      }
      return
    }
    if (activeTool === 'fog_reveal') {
      setInteractionKind('fog_brush')
      applyFogBrush(world.x, world.y, true)
      return
    }
    if (activeTool === 'fog_hide') {
      setInteractionKind('fog_brush')
      applyFogBrush(world.x, world.y, false)
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
    if (activeTool === 'fog_reveal' || activeTool === 'fog_hide') {
      setBrushHoverPos(world)
    } else if (brushHoverPos) {
      setBrushHoverPos(null)
    }

    if (interactionKind === 'pan') {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    } else if (interactionKind === 'fog_brush') {
      applyFogBrush(world.x, world.y, activeTool === 'fog_reveal')
    } else if (interactionKind === 'token' && activeTokenId) {
      const rect = containerRef.current.getBoundingClientRect()
      let nx = (e.clientX - rect.left - offset.x - dragStart.x) / scale
      let ny = (e.clientY - rect.top  - offset.y - dragStart.y) / scale
      if (snapEnabled) {
        const s = snapPos(nx, ny, gridConfig.size, gridConfig.offsetX, gridConfig.offsetY)
        nx = s.x; ny = s.y
      }
      setTableEntities(prev => moveMountAndRiders(activeTokenId, nx, ny, prev))
      setDragWaypoints(prev => {
        if (prev.length <= 1) return [...prev.slice(0, 1), { x: nx, y: ny }]
        const next = [...prev]
        next[next.length - 1] = { x: nx, y: ny }
        return next
      })
    } else if (interactionKind === 'aoe' && activeAoe) {
      const angle = Math.atan2(world.y - activeAoe.y, world.x - activeAoe.x)
      setActiveAoe(prev => prev ? { ...prev, angle } : prev)
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
    setDragWaypoints([])
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
  const cursorMap = { select:'default', pan:'grab', measure:'crosshair', draw:'crosshair', erase:'cell', wall:'crosshair', door:'crosshair', aoe:'crosshair', text:'text', fog: fogEnabled ? 'cell' : 'default' }
  const cursor = interactionKind === 'token' ? 'grabbing' : interactionKind === 'pan' ? 'grabbing' : (cursorMap[activeTool] || 'default')

  const TAB_BAR_H = 34
  const TOOLBAR_H = 42

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <style>{`
        @keyframes pingWave {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ── Map Tabs (top) ─────────────────────────────────────────────────── */}
      {!tvModeActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: TAB_BAR_H,
          display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px',
          background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto', zIndex: 30,
        }}>
          {maps.map(m => (
            <div
              key={m.id}
              onClick={() => switchMap(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                background: m.id === activeMapId ? 'var(--bg-secondary)' : 'transparent',
                color: m.id === activeMapId ? 'var(--text-primary)' : 'var(--text-muted)',
                borderTop: m.id === activeMapId ? '1px solid var(--border-subtle)' : '1px solid transparent',
                borderLeft: m.id === activeMapId ? '1px solid var(--border-subtle)' : '1px solid transparent',
                borderRight: m.id === activeMapId ? '1px solid var(--border-subtle)' : '1px solid transparent',
                borderBottom: 'none',
              }}
            >
              <Map size={13} />
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
      )}

      {/* ── Tool Toolbar ─────────────────────────────────────────────────── */}
      {!tvModeActive && (
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
            aoeConfig={aoeConfig}
            onAoeConfigChange={setAoeConfig}
            onClearAoe={() => setActiveAoe(null)}
            currentWeather={currentWeather}
            onOpenWeatherModal={() => setWeatherModalOpen(true)}
            onOpenDungeonModal={() => setDungeonModalOpen(true)}
            fogBrushSize={fogBrushSize}
            onFogBrushSizeChange={setFogBrushSize}
            onOpenTVModal={() => setTvModalOpen(true)}
          />
        </div>
      )}

      {/* ── Floating Controls for Physical TV Mode ────────────────────────── */}
      {tvModeActive && (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 300, display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setTvModalOpen(true)}
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.75rem' }}
          >
            <Sliders size={13} /> Calibrar Grade
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setTvModeActive(false)}
            style={{ backdropFilter: 'blur(8px)', fontSize: '0.75rem' }}
          >
            ✕ Sair do Modo TV
          </button>
        </div>
      )}

      {/* ── Viewport ─────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: tvModeActive ? 0 : TAB_BAR_H + TOOLBAR_H,
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
              key={label.id || `lbl-${label.x}-${label.y}-${i}`}
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

          {/* Secret Master Map Markers */}
          {markers.map((marker) => {
            const typeDef = MARKER_TYPES[marker.type] || MARKER_TYPES.secret
            return (
              <div
                key={marker.id}
                style={{
                  position: 'absolute',
                  left: marker.x,
                  top: marker.y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingMarker(marker)
                  setMarkerModalOpen(true)
                }}
                title={`${marker.title}${marker.dc ? ` (CD ${marker.dc})` : ''}\n${marker.description || ''}`}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `${typeDef.color}30`,
                  border: `2px solid ${typeDef.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  boxShadow: `0 0 8px ${typeDef.color}66`,
                  backdropFilter: 'blur(4px)',
                }}>
                  {typeDef.icon}
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.85)',
                  color: typeDef.color,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 4,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${typeDef.color}44`,
                }}>
                  {marker.title} {marker.dc ? `[CD ${marker.dc}]` : ''}
                </div>
              </div>
            )
          })}

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
                onDoubleClick={e => { e.stopPropagation(); openEntitySheet(entity) }}
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

        {/* Condition modal */}
        {conditionModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }} onClick={() => setConditionModal(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--bg-secondary)', borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              padding: 20, width: 340, maxHeight: '80vh', overflowY: 'auto',
            }}>
              <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                🏷️ Condições — {conditionModal.entity.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CONDITIONS.map(cond => {
                  const active = (conditionModal.entity.conditions || []).includes(cond.id)
                  return (
                    <button
                      key={cond.id}
                      onClick={() => {
                        const tid = conditionModal.entity.tableId
                        setTableEntities(prev => prev.map(en => {
                          if (en.tableId !== tid) return en
                          const current = en.conditions || []
                          const next = active
                            ? current.filter(c => c !== cond.id)
                            : [...current, cond.id]
                          return { ...en, conditions: next }
                        }))
                        setConditionModal(prev => ({
                          ...prev,
                          entity: {
                            ...prev.entity,
                            conditions: active
                              ? (prev.entity.conditions || []).filter(c => c !== cond.id)
                              : [...(prev.entity.conditions || []), cond.id],
                          },
                        }))
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                        border: active ? `2px solid ${cond.color}` : '1px solid var(--border-subtle)',
                        background: active ? `${cond.color}22` : 'var(--bg-primary)',
                        color: active ? cond.color : 'var(--text-secondary)',
                        fontWeight: active ? 600 : 400,
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{cond.icon}</span>
                      <span>{cond.name}</span>
                    </button>
                  )
                })}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setConditionModal(null)}
                style={{ marginTop: 12, width: '100%' }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div style={{
          position:'absolute', bottom:0, right:0,
          background:'rgba(0,0,0,0.6)', color:'var(--text-muted)',
          fontSize:'0.68rem', padding:'2px 8px',
          fontFamily:'var(--font-mono)', borderTopLeftRadius:4,
        }}>
          {Math.round(scale * 100)}% · {tableEntities.length} tokens · {wallSegments.filter(w => !w.isDoor).length} paredes · {wallSegments.filter(w => w.isDoor).length} portas{activeAoe ? ` · 💥 ${tableEntities.filter((en, i) => isPointInAoe(en.mapX ?? defaultPos(i, gridConfig.size).x, en.mapY ?? defaultPos(i, gridConfig.size).y, activeAoe, gridConfig.size)).length} na área` : ''}
        </div>

        {/* Ping indicators */}
        {pings.map(ping => {
          const screenX = ping.x * scale + offset.x
          const screenY = ping.y * scale + offset.y
          return (
            <div key={ping.id} style={{
              position: 'absolute',
              left: screenX, top: screenY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 200,
            }}>
              {/* Expanding Ring 1 */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 48, height: 48,
                borderRadius: '50%',
                border: `3px solid ${ping.color}`,
                boxShadow: `0 0 12px ${ping.color}`,
                animation: 'pingWave 2.2s cubic-bezier(0, 0.2, 0.8, 1) forwards',
              }} />
              {/* Expanding Ring 2 */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 64, height: 64,
                borderRadius: '50%',
                border: `2px solid ${ping.color}`,
                animation: 'pingWave 2.2s cubic-bezier(0, 0.2, 0.8, 1) 0.3s forwards',
              }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 10, height: 10,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                backgroundColor: ping.color,
                boxShadow: `0 0 8px ${ping.color}`,
              }} />
              {/* Author label */}
              {ping.author && (
                <div style={{
                  position: 'absolute', left: '50%', top: 28,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.85)',
                  color: ping.color,
                  padding: '2px 8px', borderRadius: 4,
                  fontSize: '0.72rem', fontWeight: 600,
                  border: `1px solid ${ping.color}55`,
                }}>
                  📍 {ping.author}
                </div>
              )}
            </div>
          )
        })}

        {/* Fog Brush Cursor Indicator */}
        {(activeTool === 'fog_reveal' || activeTool === 'fog_hide') && brushHoverPos && (
          <div
            style={{
              position: 'absolute',
              left: brushHoverPos.x * scale + offset.x,
              top: brushHoverPos.y * scale + offset.y,
              width: fogBrushSize * gridConfig.size * scale,
              height: fogBrushSize * gridConfig.size * scale,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `2px dashed ${activeTool === 'fog_reveal' ? '#10B981' : '#EF4444'}`,
              backgroundColor: activeTool === 'fog_reveal' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.25)',
              pointerEvents: 'none',
              zIndex: 150,
              boxShadow: `0 0 10px ${activeTool === 'fog_reveal' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            }}
          />
        )}
        {/* Floating AoE Quick Trigger Button */}
        {activeAoe && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              const { shape, x, y, radiusMeters, angle = 0 } = activeAoe
              const radiusPx = (radiusMeters / METERS_PER_SQUARE) * gridConfig.size
              let captured = []
              if (shape === 'circle') captured = getTokensInCircleAoE({ x, y }, radiusPx, tableEntities, gridConfig.size)
              else if (shape === 'cone') captured = getTokensInConeAoE({ x, y }, radiusPx, angle, 90, tableEntities, gridConfig.size)
              else if (shape === 'line') {
                const end = { x: x + Math.cos(angle) * radiusPx, y: y + Math.sin(angle) * radiusPx }
                captured = getTokensInLineAoE({ x, y }, end, gridConfig.size, tableEntities, gridConfig.size)
              }
              setAoeCapturedTargets(captured)
              setAoeResolverOpen(true)
            }}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              zIndex: 160,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Zap size={16} /> Resolver Efeito da Área ({activeAoe.shape.toUpperCase()})
          </button>
        )}
      </div>

      {/* ── Entity Sheet Modal (double-click token) ───────────────────────── */}
      {sheetEntity && (
        <Modal
          isOpen={!!sheetEntity}
          onClose={() => setSheetEntity(null)}
          title={typeof sheetEntity.name === 'string' ? sheetEntity.name : (sheetEntity.name?.['pt-br'] ?? 'Ficha')}
        >
          {(sheetEntity.entityType === 'npc') ? (
            <NPCSheet npc={sheetEntity} />
          ) : (sheetEntity.entityType === 'creature' || sheetEntity.entityType === 'enemy') ? (
            <CreatureSheet creature={sheetEntity} />
          ) : (
            <NPCSheet npc={sheetEntity} />
          )}
        </Modal>
      )}

      {/* ── AoE Mass Effect Resolver Modal ──────────────────────────────────── */}
      {aoeResolverOpen && (
        <AoEResolverModal
          isOpen={aoeResolverOpen}
          onClose={() => setAoeResolverOpen(false)}
          targets={aoeCapturedTargets}
          aoeType={activeAoe?.shape || 'circle'}
          aoeRadiusMeters={activeAoe?.radiusMeters || 6}
          onApplyMassEffect={handleApplyMassEffect}
        />
      )}

      {/* ── Weather Preset Modal ────────────────────────────────────────────── */}
      {weatherModalOpen && (
        <WeatherModal
          isOpen={weatherModalOpen}
          onClose={() => setWeatherModalOpen(false)}
          currentWeather={currentWeather}
          onApplyWeather={(w) => {
            setCurrentWeather(w)
            if (serverOnline && broadcast) {
              broadcast('weather_change', { weather: w })
            }
          }}
        />
      )}

      {/* ── Secret Map Marker Modal ────────────────────────────────────────── */}
      {markerModalOpen && (
        <MapMarkerModal
          isOpen={markerModalOpen}
          marker={editingMarker}
          initialPos={newMarkerPos}
          onClose={() => { setMarkerModalOpen(false); setEditingMarker(null) }}
          onSave={(savedMarker) => {
            const updated = editingMarker
              ? markers.map(m => m.id === savedMarker.id ? savedMarker : m)
              : [...markers, savedMarker]
            setMapField('markers', updated)
          }}
          onDelete={(markerId) => {
            setMapField('markers', markers.filter(m => m.id !== markerId))
          }}
        />
      )}

      {/* ── Procedural Dungeon Modal ────────────────────────────────────────── */}
      {dungeonModalOpen && (
        <GenerateDungeonModal
          onGenerate={handleApplyDungeon}
          onClose={() => setDungeonModalOpen(false)}
        />
      )}

      {/* ── Physical Tabletop TV Display Modal ─────────────────────────────── */}
      {tvModalOpen && (
        <PhysicalTVModal
          isOpen={tvModalOpen}
          onClose={() => setTvModalOpen(false)}
          gridSizePx={gridConfig.size}
          hidePlayerTokens={hidePlayerTokens}
          onToggleHidePlayerTokens={setHidePlayerTokens}
          onApplyTVMode={handleApplyTVMode}
        />
      )}
    </div>
  )
}
