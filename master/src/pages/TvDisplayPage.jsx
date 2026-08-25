import { useState, useEffect, useRef, useMemo } from 'react'
import { Maximize2, Minimize2, ArrowLeft, Layers } from 'lucide-react'
import { db } from '@services/database.js'
import PlayerMap from '@player/components/map/PlayerMap.jsx'

export default function TvDisplayPage({ onExitTvMode }) {
  const [maps, setMaps] = useState([])
  const [selectedMapId, setSelectedMapId] = useState(null)
  const [characters, setCharacters] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const hideControlsTimer = useRef(null)

  // Load maps and characters
  useEffect(() => {
    async function loadData() {
      try {
        const allMaps = await db.maps.toArray()
        setMaps(allMaps)
        if (allMaps.length > 0) {
          setSelectedMapId(allMaps[0].id)
        }
        const allChars = await db.characters.toArray()
        setCharacters(allChars)
      } catch (err) {
        console.error('Error loading TV display data:', err)
      }
    }
    loadData()
  }, [])

  // Derived current active map
  const currentMap = useMemo(() => {
    if (!selectedMapId || maps.length === 0) return maps[0] || null
    return maps.find(m => m.id === selectedMapId) || maps[0] || null
  }, [selectedMapId, maps])

  // Mouse activity timer for hiding UI overlays
  const handleMouseMove = () => {
    setShowControls(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Build entity map from characters
  const entityMap = characters.reduce((acc, char) => {
    acc[char.id] = {
      id: char.id,
      tableId: char.id,
      name: char.name,
      mapX: char.mapX ?? 100,
      mapY: char.mapY ?? 100,
      avatar: char.avatar,
      hp: char.hp,
      maxHp: char.maxHp,
      enr: char.enr,
      ac: char.ac,
    }
    return acc
  }, {})

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        cursor: showControls ? 'default' : 'none',
      }}
    >
      {/* Map Surface */}
      <PlayerMap
        mapData={currentMap}
        myEntity={null}
        wsSend={() => {}}
        entityMap={entityMap}
        pings={[]}
        playerName="Telão"
      />

      {/* Floating Minimalist Control Bar (auto-hiding) */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 30,
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 9999,
      }}>
        {onExitTvMode && (
          <button
            onClick={onExitTvMode}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Voltar ao Painel
          </button>
        )}

        {/* Map Switcher */}
        {maps.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} style={{ color: 'var(--accent-primary)' }} />
            <select
              className="input"
              value={selectedMapId || ''}
              onChange={e => setSelectedMapId(Number(e.target.value))}
              style={{ padding: '2px 8px', fontSize: '0.75rem', height: 26, background: 'rgba(0,0,0,0.5)' }}
            >
              {maps.map(m => (
                <option key={m.id} value={m.id}>{m.name || `Mapa #${m.id}`}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="btn btn-ghost btn-sm"
          style={{ color: '#fff', padding: '4px 6px' }}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
  )
}
