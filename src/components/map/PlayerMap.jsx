/* PlayerMap.jsx — Restricted map view for players */
import { useEffect, useRef, useState, useMemo } from 'react'
import { MAP_WIDTH, MAP_HEIGHT, computeVisionCells } from '../../utils/visionUtils.js'

export default function PlayerMap({ mapData, myEntity, wsSend, entityMap }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight - 120 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  const [draggingEntity, setDraggingEntity] = useState(null)

  // Cache the decoded map image so it's not re-created every render frame
  const mapImageRef = useRef(null)
  const [mapImageReady, setMapImageReady] = useState(false)

  useEffect(() => {
    const src = mapData?.imageData
    if (!src) { mapImageRef.current = null; setMapImageReady(false); return }
    setMapImageReady(false)
    const img = new Image()
    img.onload = () => { mapImageRef.current = img; setMapImageReady(true) }
    img.onerror = () => { mapImageRef.current = null; setMapImageReady(false) }
    img.src = src
  }, [mapData?.imageData])

  // Memoize my vision
  const myVision = useMemo(() => {
    if (!myEntity || !mapData?.gridConfig) return new Set()
    return computeVisionCells(myEntity, mapData.gridConfig, mapData.wallSegments || [])
  }, [myEntity, mapData])

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
  useEffect(() => {
    if (myEntity?.mapX && myEntity?.mapY) {
      setPan({
        x: canvasSize.w / 2 - myEntity.mapX * zoom,
        y: canvasSize.h / 2 - myEntity.mapY * zoom
      })
    }
  }, []) // only run once

  const handleWheel = (e) => {
    e.preventDefault()
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(Math.max(0.2, z * scaleAdjust), 4))
  }

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId)
    
    // Check if clicked on my token
    if (myEntity && mapData?.gridConfig) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      
      const tx = myEntity.mapX ?? 0
      const ty = myEntity.mapY ?? 0
      const size = mapData.gridConfig.size

      if (Math.abs(mouseX - tx) <= size / 2 && Math.abs(mouseY - ty) <= size / 2) {
        setDraggingEntity(myEntity.tableId || myEntity.id)
        return
      }
    }

    // Otherwise pan
    setIsPanning(true)
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handlePointerMove = (e) => {
    if (draggingEntity) {
      // Just visually dragging - wait for drop to send update
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      })
    }
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
      setDraggingEntity(null)
    }
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

    // 3. Draw Tokens (only visible ones)
    const entities = Object.values(entityMap || {})
    const sorted = entities.sort((a, b) => (a.elevation || 0) - (b.elevation || 0))

    sorted.forEach(e => {
      const tx = e.mapX ?? 0
      const ty = e.mapY ?? 0

      // Is token in my vision?
      const col = Math.floor((tx - offsetX) / size)
      const row = Math.floor((ty - offsetY) / size)
      const isMe = e.tableId === myEntity?.tableId || e.id === myEntity?.id

      if (!isMe && !myVision.has(`${col},${row}`) && mapData.fogEnabled) {
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
      ctx.fillText((e.name || '?').charAt(0).toUpperCase(), 0, 0)

      ctx.restore()
    })

    // 4. Draw Fog
    if (mapData.fogEnabled) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      for (let col = 0; col < Math.ceil(MAP_WIDTH / size); col++) {
        for (let row = 0; row < Math.ceil(MAP_HEIGHT / size); row++) {
          const key = `${col},${row}`
          // GM revealed or my vision?
          const isGMRevealed = mapData.revealedCells?.includes(key)
          const isVisibleToMe = myVision.has(key)
          
          if (!isGMRevealed && !isVisibleToMe) {
            ctx.fillRect(
              col * size + offsetX,
              row * size + offsetY,
              size,
              size
            )
          } else if (isGMRevealed && !isVisibleToMe) {
            // Semi-transparent for previously revealed but out of current sight
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
            ctx.fillRect(
              col * size + offsetX,
              row * size + offsetY,
              size,
              size
            )
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)' // reset
          }
        }
      }
    }

    ctx.restore()
  }, [mapData, entityMap, pan, zoom, myVision, myEntity, canvasSize, mapImageReady])

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
      />
      {/* Zoom controls overlay */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}>-</button>
        <button className="btn btn-secondary" onClick={() => setZoom(z => Math.min(4, z * 1.2))}>+</button>
      </div>
    </div>
  )
}
