/* PlayerMap.jsx — Restricted map view for players with dynamic lighting, touch gestures, weather and speaking aura */
import { useEffect, useRef, useState, useMemo } from 'react'
import { MapPin, Crosshair, ZoomIn, ZoomOut } from 'lucide-react'
import { MAP_WIDTH, MAP_HEIGHT, computeVisionCells } from '../../utils/visionUtils.js'
import { calculateLightCells, mergeVisionWithLights, calculateRouteDistance } from '@shared/utils/lightingUtils.js'
import { calculateMaxMovement } from '@shared/utils/aoeTargeting.js'
import { getTouchDistance, isLongPress } from '@shared/utils/touchUtils.js'
import { createWeatherSystem, updateWeatherParticles, drawWeatherParticles } from '@shared/utils/weatherEffects.js'

export default function PlayerMap({
  mapData,
  myEntity,
  wsSend,
  entityMap,
  pings = [],
  onPingsChange,
  playerName,
  targetedEntityId = null,
  onSelectTarget = null,
  speakingPlayerNames = [],
  weather = 'none',
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight - 120 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  const [draggingEntity, setDraggingEntity] = useState(null)
  const [dragStartPos, setDragStartPos]     = useState(null)
  const [dragCurrentPos, setDragCurrentPos] = useState(null)

  // Cache the decoded map image so it's not re-created every render frame
  const mapImageRef = useRef(null)
  const [mapImageReady, setMapImageReady] = useState(false)

  const [renderTick, setRenderTick] = useState(0)

  // Weather particles system
  const weatherParticlesRef = useRef([])

  useEffect(() => {
    weatherParticlesRef.current = createWeatherSystem(weather, canvasSize.w, canvasSize.h)
  }, [weather, canvasSize.w, canvasSize.h])

  useEffect(() => {
    if (weather === 'none') return
    let rafId
    const loop = () => {
      updateWeatherParticles(weatherParticlesRef.current, canvasSize.w, canvasSize.h, weather)
      setRenderTick(t => t + 1)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [weather, canvasSize.w, canvasSize.h])

  useEffect(() => {
    let rafId
    const loop = () => {
      const hasActivePings = pings.some(p => Date.now() - p.startTime < 2500)
      if (hasActivePings) {
        setRenderTick(t => t + 1)
        rafId = requestAnimationFrame(loop)
      } else if (pings.length > 0 && onPingsChange) {
        onPingsChange([])
      }
    }
    if (pings.length > 0) {
      rafId = requestAnimationFrame(loop)
    }
    return () => cancelAnimationFrame(rafId)
  }, [pings, onPingsChange])

  // Cancel dragging on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && draggingEntity) {
        setDraggingEntity(null)
        setDragStartPos(null)
        setDragCurrentPos(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [draggingEntity])

  useEffect(() => {
    const src = mapData?.imageData
    if (!src) { mapImageRef.current = null; return }
    const img = new Image()
    img.onload = () => { mapImageRef.current = img; setMapImageReady(true) }
    img.onerror = () => { mapImageRef.current = null; setMapImageReady(false) }
    img.src = src
    return () => { img.onload = null; img.onerror = null }
  }, [mapData?.imageData])

  const exploredCellsRef = useRef(new Set())

  // Memoize my vision
  const myVision = useMemo(() => {
    if (!myEntity || !mapData?.gridConfig) return new Set()
    return computeVisionCells(myEntity, mapData.gridConfig, mapData.wallSegments || [])
  }, [myEntity, mapData])

  // Dynamic light sources propagation
  const lightCells = useMemo(() => {
    if (!mapData?.gridConfig) return new Map()
    const allLights = [...(mapData.lightSources || [])]
    if (entityMap) {
      Object.values(entityMap).forEach(en => {
        if (en.lightRadius && en.lightRadius > 0) {
          allLights.push({ x: en.mapX ?? 0, y: en.mapY ?? 0, radius: en.lightRadius, color: en.lightColor || '#FBBF24' })
        }
      })
    }
    return calculateLightCells(allLights, mapData.wallSegments || [], mapData.gridConfig.size || 50)
  }, [mapData, entityMap])

  // Combined visible cells (natural vision + lit cells within LoS)
  const effectiveVision = useMemo(() => {
    if (!myVision) return new Set()
    const heroPos = myEntity ? { x: myEntity.mapX ?? 0, y: myEntity.mapY ?? 0 } : null
    return mergeVisionWithLights(myVision, lightCells, heroPos, mapData?.wallSegments || [], mapData?.gridConfig?.size || 50)
  }, [myVision, lightCells, myEntity, mapData])

  // Track explored cells
  useEffect(() => {
    if (effectiveVision.size > 0) {
      effectiveVision.forEach(cell => exploredCellsRef.current.add(cell))
    }
  }, [effectiveVision])

  // Track container size for canvas dimensions
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setCanvasSize({ w: Math.floor(width), h: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Center on my token initially
  const didInitialCenter = useRef(false)
  
  useEffect(() => {
    if (didInitialCenter.current || !myEntity || !canvasSize.w) return
    const tx = myEntity.mapX ?? (MAP_WIDTH / 2)
    const ty = myEntity.mapY ?? (MAP_HEIGHT / 2)
    queueMicrotask(() => {
      setPan({
        x: canvasSize.w / 2 - tx * zoom,
        y: canvasSize.h / 2 - ty * zoom
      })
    })
    didInitialCenter.current = true
  }, [myEntity, canvasSize, zoom])

  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(Math.max(z * zoomFactor, 0.2), 4))
  }

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId)

    // Middle-click = ping
    if (e.button === 1) {
      e.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      const pingData = { x: mouseX, y: mouseY, color: '#3B82F6', author: playerName || 'Jogador' }
      wsSend('map_ping', { data: pingData })
      return
    }

    if (e.button !== 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom
    const size = mapData?.gridConfig?.size || 50

    // 1. Check if clicked on my token (drag)
    if (myEntity) {
      const tx = myEntity.mapX ?? 0
      const ty = myEntity.mapY ?? 0
      if (Math.abs(mouseX - tx) <= size / 2 && Math.abs(mouseY - ty) <= size / 2) {
        setDraggingEntity(myEntity.tableId || myEntity.id)
        setDragStartPos({ x: tx, y: ty })
        setDragCurrentPos({ x: mouseX, y: mouseY })
        return
      }
    }

    // 2. Check if clicked on another visible token (target selection)
    if (entityMap && onSelectTarget) {
      const clickedEntity = Object.values(entityMap).find(en => {
        const isMe = (en.tableId && en.tableId === myEntity?.tableId) || (en.id && en.id === myEntity?.id)
        if (isMe) return false
        const ex = en.mapX ?? 0
        const ey = en.mapY ?? 0
        const cellKey = `${Math.floor(ex / size)},${Math.floor(ey / size)}`
        const isVisible = !mapData?.fogEnabled || effectiveVision.has(cellKey) || mapData?.revealedCells?.includes(cellKey)
        return isVisible && Math.abs(mouseX - ex) <= size / 2 && Math.abs(mouseY - ey) <= size / 2
      })

      if (clickedEntity) {
        onSelectTarget(clickedEntity.tableId || clickedEntity.id)
        return
      }
    }

    // Otherwise pan
    setIsPanning(true)
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handlePointerMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    if (draggingEntity) {
      setDragCurrentPos({ x: mouseX, y: mouseY })
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      })
    }
  }

  const touchStartDistRef = useRef(null)
  const touchStartTimeRef = useRef(null)
  const touchStartPosRef  = useRef(null)

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDistance(e.touches[0], e.touches[1])
    } else if (e.touches.length === 1) {
      touchStartTimeRef.current = Date.now()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const mouseX = (e.touches[0].clientX - rect.left - pan.x) / zoom
        const mouseY = (e.touches[0].clientY - rect.top - pan.y) / zoom
        touchStartPosRef.current = { x: mouseX, y: mouseY }
      }
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const newDist = getTouchDistance(e.touches[0], e.touches[1])
      const factor = newDist / touchStartDistRef.current
      setZoom(z => Math.min(Math.max(z * factor, 0.2), 4))
      touchStartDistRef.current = newDist
    }
  }

  const handleTouchEnd = () => {
    if (touchStartTimeRef.current && touchStartPosRef.current) {
      if (isLongPress(touchStartTimeRef.current, Date.now(), 500)) {
        const pingData = { x: touchStartPosRef.current.x, y: touchStartPosRef.current.y, color: '#10B981', author: playerName || 'Jogador' }
        wsSend('map_ping', { data: pingData })
      }
    }
    touchStartDistRef.current = null
    touchStartTimeRef.current = null
    touchStartPosRef.current = null
  }

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId)
    if (draggingEntity && mapData?.gridConfig) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom

      // Snap to grid
      const { size, offsetX: ox, offsetY: oy } = mapData.gridConfig
      const col = Math.round((mouseX - ox - size / 2) / size)
      const row = Math.round((mouseY - oy - size / 2) / size)
      const snappedX = col * size + ox + size / 2
      const snappedY = row * size + oy + size / 2

      wsSend('token_move', {
        data: { id: draggingEntity, changes: { mapX: snappedX, mapY: snappedY } }
      })
    }
    setDraggingEntity(null)
    setDragStartPos(null)
    setDragCurrentPos(null)
    setIsPanning(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cw = canvasSize.w
    const ch = canvasSize.h

    ctx.clearRect(0, 0, cw, ch)

    if (!mapData) {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = '#fff'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Aguardando mapa...', cw / 2, ch / 2)
      return
    }

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // 1. Draw Map Image
    if (mapImageRef.current) {
      ctx.drawImage(mapImageRef.current, 0, 0)
    } else {
      ctx.fillStyle = 'var(--bg-secondary)'
      ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
    }

    // 2. Draw Grid
    const { size, offsetX, offsetY, show: gridEnabled } = mapData.gridConfig
    if (gridEnabled) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1 / zoom
      ctx.beginPath()
      for (let x = offsetX; x <= MAP_WIDTH; x += size) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, MAP_HEIGHT)
      }
      for (let y = offsetY; y <= MAP_HEIGHT; y += size) {
        ctx.moveTo(0, y)
        ctx.lineTo(MAP_WIDTH, y)
      }
      ctx.stroke()
    }

    // 3. Draw Drawings (Paths)
    const drawPaths = mapData.drawPaths || []
    drawPaths.forEach(path => {
      if (!path.points || path.points.length < 2) return
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
      }
      ctx.strokeStyle = path.color || '#FF4444'
      ctx.lineWidth   = (path.size || 4) / zoom
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.stroke()
      ctx.restore()
    })

    // 4. Draw Wall Segments (physical barriers blocking LoS and interactive doors)
    const walls = mapData.wallSegments || []
    walls.forEach(w => {
      const mx = (w.x1 + w.x2) / 2
      const my = (w.y1 + w.y2) / 2
      const midKey = `${Math.floor(mx / size)},${Math.floor(my / size)}`
      const isVisible = !mapData.fogEnabled || myVision.has(midKey) || mapData.revealedCells?.includes(midKey)
      const isExplored = exploredCellsRef.current.has(midKey)

      if (isVisible || isExplored) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(w.x1, w.y1)
        ctx.lineTo(w.x2, w.y2)

        if (w.isDoor) {
          const doorColors = { open: '#4ADE80', closed: '#CD853F', locked: '#EF4444' }
          const color = isVisible ? (doorColors[w.doorState] || '#CD853F') : '#78716C'
          ctx.strokeStyle = color
          ctx.lineWidth   = (w.width || 4) / zoom
          ctx.lineCap     = 'round'
          if (isVisible && w.doorState === 'open') {
            ctx.setLineDash([6 / zoom, 8 / zoom])
            ctx.globalAlpha = 0.5
          }
          if (isVisible) {
            ctx.shadowColor = color
            ctx.shadowBlur  = 6
          }
          ctx.stroke()

          // Draw door icon marker at midpoint if visible
          if (isVisible) {
            ctx.shadowBlur = 0
            ctx.globalAlpha = 1
            const icon = w.doorState === 'open' ? '🚪' : w.doorState === 'locked' ? '🔒' : '🚪'
            ctx.font = `${14 / zoom}px serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(icon, mx, my)
          }
        } else {
          ctx.strokeStyle = isVisible ? (w.color || '#FBBF24') : '#78716C'
          ctx.lineWidth   = (w.width || 3) / zoom
          ctx.lineCap     = 'round'
          if (isVisible) {
            ctx.shadowColor = w.color || '#FBBF24'
            ctx.shadowBlur  = 4
          }
          ctx.stroke()
        }
        ctx.restore()
      }
    })

    // 5. Draw Tokens (only visible ones)
    const entities = Object.values(entityMap || {})
    const sorted = entities.sort((a, b) => (a.elevation || 0) - (b.elevation || 0))

    sorted.forEach(e => {
      const tx = e.mapX ?? 0
      const ty = e.mapY ?? 0

      // Is token in my vision?
      const cellKey = `${Math.floor(tx / size)},${Math.floor(ty / size)}`
      const isMe = (e.tableId && e.tableId === myEntity?.tableId) || (e.id && e.id === myEntity?.id)
      
      const isVisible = 
        isMe || 
        myVision.has(cellKey) || 
        mapData?.fogEnabled === false

      if (!isVisible) {
        return // Hidden by fog
      }

      ctx.save()
      ctx.translate(tx, ty)

      // Background
      ctx.beginPath()
      ctx.arc(0, 0, size / 2 - 2, 0, Math.PI * 2)
      ctx.fillStyle = isMe ? 'var(--accent-primary)' : '#444'
      ctx.fill()
      
      // Border
      ctx.lineWidth = isMe ? 4 / zoom : 2 / zoom
      ctx.strokeStyle = isMe ? '#fff' : '#222'
      ctx.stroke()

      // Avatar (just letter for now)
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${size / 2.5}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const nameStr = typeof e.name === 'string' ? e.name : (e.name?.pt || e.name?.en || '?')
      ctx.fillText((nameStr || '?')[0]?.toUpperCase() || '?', 0, 0)

      // Speaking Voice Aura
      if (speakingPlayerNames.includes(e.name)) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, size / 2 + 5 / zoom, 0, Math.PI * 2)
        ctx.strokeStyle = '#10B981'
        ctx.lineWidth = 3 / zoom
        ctx.shadowColor = '#10B981'
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()
      }

      // Condition rings
      const conditions = e.conditions || []
      if (conditions.length > 0) {
        const condColors = {
          bleeding: '#EF4444', poisoned: '#10B981', burning: '#F59E0B',
          frozen: '#06B6D4', stunned: '#FBBF24', blessed: '#A78BFA',
          invisible: '#94A3B8', frightened: '#7C3AED', prone: '#78716C',
          concentrating: '#3B82F6', shielded: '#60A5FA', exhausted: '#9CA3AF',
        }
        conditions.forEach((condId, idx) => {
          const color = condColors[condId] || '#FFFFFF'
          const ringRadius = size / 2 + 2 + (idx + 1) * 4
          ctx.beginPath()
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 2 / zoom
          ctx.globalAlpha = 0.7
          ctx.stroke()
          ctx.globalAlpha = 1.0
        })
      }

      ctx.restore()
    })

    // 5.1 Draw Target Crosshair & Tactical Line
    const targetEntity = targetedEntityId
      ? entityMap[targetedEntityId] || Object.values(entityMap || {}).find(en => en.tableId === targetedEntityId || en.id === targetedEntityId)
      : null

    if (targetEntity && myEntity) {
      const sx = myEntity.mapX ?? 0
      const sy = myEntity.mapY ?? 0
      const tx = targetEntity.mapX ?? 0
      const ty = targetEntity.mapY ?? 0

      const distPx = Math.hypot(tx - sx, ty - sy)
      const distSquares = distPx / size
      const distMeters = distSquares * 1.5

      // Color code by range: <= 1.5m (melee: green), <= 15m (short: yellow), > 15m (long: red)
      const rangeColor = distMeters <= 1.5 ? '#4ADE80' : distMeters <= 15 ? '#FBBF24' : '#F87171'

      // Tactical Line
      ctx.save()
      ctx.setLineDash([6 / zoom, 6 / zoom])
      ctx.strokeStyle = rangeColor
      ctx.lineWidth = 2.5 / zoom
      ctx.shadowColor = rangeColor
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(tx, ty)
      ctx.stroke()
      ctx.restore()

      // Distance Badge in the middle of the line
      ctx.save()
      const mx = (sx + tx) / 2
      const my = (sy + ty) / 2
      const badgeText = `🎯 ${distMeters.toFixed(1)}m`
      ctx.font = `bold ${12 / zoom}px sans-serif`
      const textW = ctx.measureText(badgeText).width
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.strokeStyle = rangeColor
      ctx.lineWidth = 1.5 / zoom
      ctx.beginPath()
      ctx.roundRect(mx - textW / 2 - 6 / zoom, my - 10 / zoom, textW + 12 / zoom, 20 / zoom, 4 / zoom)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = rangeColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(badgeText, mx, my)
      ctx.restore()

      // Target Crosshair
      ctx.save()
      ctx.translate(tx, ty)
      ctx.strokeStyle = '#EF4444'
      ctx.lineWidth = 2 / zoom
      ctx.shadowColor = '#EF4444'
      ctx.shadowBlur = 8
      // Outer ring
      ctx.beginPath()
      ctx.arc(0, 0, size / 2 + 8, 0, Math.PI * 2)
      ctx.stroke()
      // Cross lines
      ctx.beginPath()
      ctx.moveTo(0, -(size / 2 + 14))
      ctx.lineTo(0, -(size / 2 + 2))
      ctx.moveTo(0, size / 2 + 2)
      ctx.lineTo(0, size / 2 + 14)
      ctx.moveTo(-(size / 2 + 14), 0)
      ctx.lineTo(-(size / 2 + 2), 0)
      ctx.moveTo(size / 2 + 2, 0)
      ctx.lineTo(size / 2 + 14, 0)
      ctx.stroke()
      ctx.restore()
    }

    // 5.5. Draw Movement Route Preview during Dragging
    if (draggingEntity && dragStartPos && dragCurrentPos) {
      const startX = dragStartPos.x
      const startY = dragStartPos.y
      const endX = dragCurrentPos.x
      const endY = dragCurrentPos.y

      const { distanceMeters, formatted } = calculateRouteDistance(startX, startY, endX, endY, 1.5)
      const maxMove = calculateMaxMovement(myEntity)
      const routeColor = distanceMeters <= maxMove.normalMeters
        ? '#10B981' // Green (Normal)
        : distanceMeters <= maxMove.runMeters
        ? '#FBBF24' // Yellow (Dash / Run)
        : '#EF4444' // Red (Exceeded)

      ctx.save()
      // Dashed route line
      ctx.strokeStyle = routeColor
      ctx.lineWidth = 2.5 / zoom
      ctx.setLineDash([8 / zoom, 6 / zoom])
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.setLineDash([])

      // Destination snap indicator
      ctx.beginPath()
      ctx.arc(endX, endY, size / 2, 0, Math.PI * 2)
      ctx.strokeStyle = routeColor
      ctx.lineWidth = 1.5 / zoom
      ctx.stroke()

      // Route Distance Badge
      const mx = (startX + endX) / 2
      const my = (startY + endY) / 2
      const badgeText = `👣 ${formatted}`
      ctx.font = `bold ${12 / zoom}px sans-serif`
      const textW = ctx.measureText(badgeText).width
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.strokeStyle = routeColor
      ctx.lineWidth = 1.5 / zoom
      ctx.beginPath()
      ctx.roundRect(mx - textW / 2 - 6 / zoom, my - 10 / zoom, textW + 12 / zoom, 20 / zoom, 4 / zoom)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = routeColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(badgeText, mx, my)
      ctx.restore()
    }

    // 6. Draw Fog
    if (mapData.fogEnabled) {
      for (let col = 0; col < Math.ceil(MAP_WIDTH / size); col++) {
        for (let row = 0; row < Math.ceil(MAP_HEIGHT / size); row++) {
          const key = `${col},${row}`
          
          const isClear = effectiveVision.has(key) || mapData.revealedCells?.includes(key)
          
          if (isClear) {
            continue // 0% fog (fully clear)
          } else if (exploredCellsRef.current.has(key)) {
            // Shroud fog
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(col * size + offsetX, row * size + offsetY, size, size)
          } else {
            // Total Darkness
            ctx.fillStyle = 'rgba(0, 0, 0, 0.96)'
            ctx.fillRect(col * size + offsetX, row * size + offsetY, size, size)
          }
        }
      }
    }

    // 7. Draw Pings
    const now = Date.now()
    const activePings = (pings || []).filter(p => now - p.startTime < 2500)
    activePings.forEach(ping => {
      const elapsed = now - ping.startTime
      const progress = Math.min(elapsed / 2500, 1)
      const opacity = 1 - progress
      const ringSize = 10 + progress * 40

      ctx.save()
      ctx.globalAlpha = opacity
      // Center dot
      ctx.beginPath()
      ctx.arc(ping.x, ping.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = ping.color || '#3B82F6'
      ctx.fill()
      // Ring
      ctx.beginPath()
      ctx.arc(ping.x, ping.y, ringSize, 0, Math.PI * 2)
      ctx.strokeStyle = ping.color || '#3B82F6'
      ctx.lineWidth = 2 / zoom
      ctx.stroke()
      // Outer ring
      ctx.beginPath()
      ctx.arc(ping.x, ping.y, ringSize * 1.5, 0, Math.PI * 2)
      ctx.strokeStyle = ping.color || '#3B82F6'
      ctx.lineWidth = 1.5 / zoom
      ctx.globalAlpha = opacity * 0.4
      ctx.stroke()
      // Author text
      if (opacity > 0.3 && ping.author) {
        ctx.globalAlpha = opacity
        ctx.fillStyle = ping.color || '#3B82F6'
        ctx.font = `bold ${12 / zoom}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(`📍 ${ping.author}`, ping.x, ping.y + ringSize * 1.5 + 14 / zoom)
      }
      ctx.restore()
    })

    ctx.restore()

    // 6. Ambient Weather Particles Overlay (Screen Space)
    if (weather !== 'none') {
      drawWeatherParticles(ctx, weatherParticlesRef.current, weather)
    }
  }, [mapData, entityMap, pan, zoom, myVision, effectiveVision, myEntity, canvasSize, mapImageReady, pings, renderTick, targetedEntityId, draggingEntity, dragStartPos, dragCurrentPos, speakingPlayerNames, weather])

  return (
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 120px)', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{ cursor: draggingEntity ? 'grabbing' : (isPanning ? 'grabbing' : 'grab'), display: 'block', touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {/* Player Map Action Overlays */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(20, 20, 26, 0.85)', backdropFilter: 'blur(8px)',
        padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)',
      }}>
        {/* Quick Ping Tool */}
        <button
          className="btn btn-secondary btn-sm"
          title="Laser Ping (ou use o botão do meio do mouse)"
          onClick={() => {
            if (!myEntity) return
            const tx = myEntity.mapX ?? (MAP_WIDTH / 2)
            const ty = myEntity.mapY ?? (MAP_HEIGHT / 2)
            wsSend('map_ping', { data: { x: tx, y: ty, color: '#3B82F6', author: playerName || 'Jogador' } })
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px' }}
        >
          <MapPin size={13} style={{ color: '#3B82F6' }} /> Ping
        </button>

        {/* Recenter on Token */}
        <button
          className="btn btn-ghost btn-sm"
          title="Centralizar câmera no meu personagem"
          onClick={() => {
            if (!myEntity || !canvasSize.w) return
            const tx = myEntity.mapX ?? (MAP_WIDTH / 2)
            const ty = myEntity.mapY ?? (MAP_HEIGHT / 2)
            setPan({ x: canvasSize.w / 2 - tx * zoom, y: canvasSize.h / 2 - ty * zoom })
          }}
          style={{ padding: '4px 6px' }}
        >
          <Crosshair size={13} />
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* Zoom Controls */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}
          title="Reduzir zoom"
          style={{ padding: '4px 6px' }}
        >
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setZoom(z => Math.min(4, z * 1.2))}
          title="Aumentar zoom"
          style={{ padding: '4px 6px' }}
        >
          <ZoomIn size={13} />
        </button>
      </div>
    </div>
  )
}
