/* MapToolbar.jsx — Top toolbar for the tactical map */
import { useState } from 'react'
import {
  Upload, Grid3X3, Eye, EyeOff, Pen, Eraser, Ruler, Move,
  MousePointer2, ZoomIn, ZoomOut, RotateCcw, Settings, Trash2,
  Minus, Type, DoorOpen, Sparkles, CloudRain, MapPin, Castle, Paintbrush, Tv,
  Square, Layers, ChevronDown, Wrench, Shield
} from 'lucide-react'
import { compressToWebP } from '@shared/utils/imageCompressor.js'

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', flexShrink: 0, margin: '0 2px' }} />
}

export default function MapToolbar({
  activeTool,
  onToolChange,
  onUploadMap,
  gridConfig,
  onGridConfigChange,
  snapToGrid,
  onSnapChange,
  fogEnabled,
  onFogToggle,
  onRevealAll,
  onHideAll,
  onClearDrawing,
  drawColor,
  drawSize,
  onDrawColorChange,
  onDrawSizeChange,
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  tokenCount = 0,
  aoeConfig = { shape: 'circle', radiusMeters: 6, color: '#EF4444' },
  onAoeConfigChange = null,
  onClearAoe = null,
  currentWeather = 'none',
  onOpenWeatherModal = null,
  onOpenDungeonModal = null,
  fogBrushSize = 1,
  onFogBrushSizeChange = null,
  onOpenTVModal = null,
}) {
  const [showGridPanel, setShowGridPanel] = useState(false)
  const [wallMenuOpen, setWallMenuOpen] = useState(false)
  const gc = gridConfig

  const isWallTool = ['wall', 'door', 'window', 'cliff'].includes(activeTool)

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
      background: 'rgba(15, 15, 24, 0.92)', borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(12px)', flexWrap: 'wrap',
    }}>

      {/* Map upload */}
      <label title="Carregar imagem de mapa (PNG, JPG, WebP)" style={{ cursor: 'pointer' }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = async (event) => {
              const compressed = await compressToWebP(event.target.result, { maxWidth: 3000, maxHeight: 3000, quality: 0.8 })
              onUploadMap(compressed)
            }
            reader.readAsDataURL(file)
          }}
        />
        <span className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', height: 26, fontSize: '0.75rem' }}>
          <Upload size={12} /> Mapa
        </span>
      </label>

      {/* Procedural Dungeon */}
      {onOpenDungeonModal && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenDungeonModal}
          title="Gerar Masmorra Procedural com Paredes LoS automáticas via Python"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, fontSize: '0.75rem' }}
        >
          <Castle size={12} /> Masmorra
        </button>
      )}

      {/* Physical TV Mode button */}
      {onOpenTVModal && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenTVModal}
          title="Modo TV e Grade Física para Mesas Presenciais (miniaturas físicas de 25mm)"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, fontSize: '0.75rem' }}
        >
          <Tv size={12} /> TV
        </button>
      )}

      <Divider />

      {/* Core Interaction Tools */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          title="Selecionar e mover tokens"
          onClick={() => onToolChange('select')}
          className={`btn btn-sm ${activeTool === 'select' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ height: 26, padding: '0 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <MousePointer2 size={13} /> Selecionar
        </button>
        <button
          title="Mover e navegar pelo mapa (ou segure botão do meio)"
          onClick={() => onToolChange('pan')}
          className={`btn btn-sm ${activeTool === 'pan' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ height: 26, padding: '0 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Move size={13} /> Mover Mapa
        </button>
        <button
          title="Medir distância em metros (ou segure SHIFT)"
          onClick={() => onToolChange('measure')}
          className={`btn btn-sm ${activeTool === 'measure' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ height: 26, padding: '0 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Ruler size={13} /> Medir
        </button>
      </div>

      <Divider />

      {/* Walls & Structures Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className={`btn btn-sm ${isWallTool ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setWallMenuOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, height: 26, fontSize: '0.75rem' }}
          title="Ferramentas de Paredes, Portas e Sacadas"
        >
          {activeTool === 'door' ? <DoorOpen size={12} /> : activeTool === 'window' ? <Square size={12} /> : activeTool === 'cliff' ? <Layers size={12} /> : <Minus size={12} />}
          <span>{activeTool === 'door' ? 'Porta' : activeTool === 'window' ? 'Janela' : activeTool === 'cliff' ? 'Sacada' : 'Parede'}</span>
          <ChevronDown size={11} />
        </button>

        {wallMenuOpen && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 6, width: 220, zIndex: 300,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {[
              { id: 'wall',   label: 'Parede Sólida (Bloqueia LoS e Andar)', icon: Minus, color: '#FBBF24' },
              { id: 'door',   label: 'Porta Interativa (Abrir / Trancar)', icon: DoorOpen, color: '#CD853F' },
              { id: 'window', label: 'Janela / Vidro (Visão passa, bloqueia andar)', icon: Square, color: '#38BDF8' },
              { id: 'cliff',  label: 'Penhasco / Sacada (Visão unidirecional)', icon: Layers, color: '#A855F7' },
            ].map(w => (
              <button
                key={w.id}
                className={`btn btn-sm ${activeTool === w.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.72rem', height: 28 }}
                onClick={() => { onToolChange(w.id); setWallMenuOpen(false) }}
              >
                <w.icon size={13} style={{ color: w.color }} />
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drawing, Text, Marker, AoE */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          title="Desenhar no mapa"
          onClick={() => onToolChange('draw')}
          className={`btn btn-icon btn-sm ${activeTool === 'draw' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <Pen size={12} />
        </button>
        <button
          title="Área de Efeito / Magia (AoE)"
          onClick={() => onToolChange('aoe')}
          className={`btn btn-icon btn-sm ${activeTool === 'aoe' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <Sparkles size={12} />
        </button>
        <button
          title="Marcador / Nota Secreta do Mestre"
          onClick={() => onToolChange('marker')}
          className={`btn btn-icon btn-sm ${activeTool === 'marker' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <MapPin size={12} />
        </button>
        <button
          title="Etiqueta de texto"
          onClick={() => onToolChange('text')}
          className={`btn btn-icon btn-sm ${activeTool === 'text' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <Type size={12} />
        </button>
        <button
          title="Borracha / Apagar"
          onClick={() => onToolChange('erase')}
          className={`btn btn-icon btn-sm ${activeTool === 'erase' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <Eraser size={12} />
        </button>
      </div>

      {/* Draw options */}
      {activeTool === 'draw' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="color"
            value={drawColor}
            onChange={e => onDrawColorChange(e.target.value)}
            title="Cor do pincel"
            style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
          />
          <input
            type="range"
            min={2}
            max={24}
            value={drawSize}
            onChange={e => onDrawSizeChange(parseInt(e.target.value))}
            title={`Tamanho: ${drawSize}px`}
            style={{ width: 50 }}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClearDrawing}
            title="Limpar todos os desenhos"
            style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.7rem', height: 22 }}
          >
            <Trash2 size={10} /> Limpar
          </button>
        </div>
      )}

      {/* AoE options */}
      {activeTool === 'aoe' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            value={aoeConfig.shape || 'circle'}
            onChange={e => onAoeConfigChange?.({ ...aoeConfig, shape: e.target.value })}
            className="input"
            style={{ padding: '1px 4px', fontSize: '0.72rem', height: 24 }}
          >
            <option value="circle">🟣 Círculo</option>
            <option value="cone">🔺 Cone (90°)</option>
            <option value="line">📏 Linha</option>
          </select>
          <select
            value={aoeConfig.radiusMeters || 6}
            onChange={e => onAoeConfigChange?.({ ...aoeConfig, radiusMeters: parseFloat(e.target.value) })}
            className="input"
            style={{ padding: '1px 4px', fontSize: '0.72rem', height: 24 }}
          >
            <option value="3">3m (2q)</option>
            <option value="4.5">4.5m (3q)</option>
            <option value="6">6m (4q)</option>
            <option value="9">9m (6q)</option>
            <option value="12">12m (8q)</option>
            <option value="15">15m (10q)</option>
          </select>
          <input
            type="color"
            value={aoeConfig.color || '#EF4444'}
            onChange={e => onAoeConfigChange?.({ ...aoeConfig, color: e.target.value })}
            style={{ width: 22, height: 22, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
          />
          {onClearAoe && (
            <button className="btn btn-ghost btn-sm" onClick={onClearAoe} style={{ height: 22, fontSize: '0.7rem' }}>
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}

      <Divider />

      {/* Fog of War Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button
          title={fogEnabled ? 'Desativar Névoa de Guerra' : 'Ativar Névoa de Guerra'}
          onClick={() => onFogToggle(!fogEnabled)}
          className={`btn btn-sm ${fogEnabled ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', height: 26 }}
        >
          {fogEnabled ? <EyeOff size={12} /> : <Eye size={12} />}
          Névoa
        </button>

        {fogEnabled && (
          <>
            <button
              className={`btn btn-sm ${activeTool === 'fog_reveal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onToolChange(activeTool === 'fog_reveal' ? 'select' : 'fog_reveal')}
              title="Pincel para Revelar Névoa livremente"
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', height: 24, padding: '0 6px' }}
            >
              <Paintbrush size={11} /> Revelar
            </button>
            <button
              className={`btn btn-sm ${activeTool === 'fog_hide' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onToolChange(activeTool === 'fog_hide' ? 'select' : 'fog_hide')}
              title="Pincel para Ocultar / Cobrir com Névoa"
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', height: 24, padding: '0 6px' }}
            >
              <Eraser size={11} /> Ocultar
            </button>

            {(activeTool === 'fog_reveal' || activeTool === 'fog_hide') && onFogBrushSizeChange && (
              <select
                value={fogBrushSize}
                onChange={e => onFogBrushSizeChange(parseInt(e.target.value, 10))}
                className="input"
                style={{ padding: '2px 4px', fontSize: '0.7rem', height: 24, background: 'var(--bg-tertiary)' }}
                title="Tamanho do Pincel de Névoa"
              >
                <option value="1">1q (1.5m)</option>
                <option value="3">3q (4.5m)</option>
                <option value="5">5q (7.5m)</option>
              </select>
            )}

            <button className="btn btn-sm btn-ghost" onClick={onRevealAll} title="Revelar todo o mapa" style={{ fontSize: '0.68rem', height: 24, padding: '0 4px' }}>
              Tudo
            </button>
            <button className="btn btn-sm btn-ghost" onClick={onHideAll} title="Ocultar todo o mapa" style={{ fontSize: '0.68rem', height: 24, padding: '0 4px' }}>
              Zerar
            </button>
          </>
        )}
      </div>

      <Divider />

      {/* Grid Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button
          title="Mostrar/Ocultar Grid"
          onClick={() => onGridConfigChange({ ...gc, show: !gc.show })}
          className={`btn btn-icon btn-sm ${gc.show ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 26, height: 26 }}
        >
          <Grid3X3 size={13} />
        </button>
        <button
          title="Snap to Grid — alinhar tokens ao centro do quadrado"
          onClick={() => onSnapChange(!snapToGrid)}
          className={`btn btn-sm ${snapToGrid ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.7rem', padding: '0 6px', height: 26 }}
        >
          Snap
        </button>

        {/* Grid settings modal popup */}
        <div style={{ position: 'relative' }}>
          <button
            title="Configurar Grid"
            className={`btn btn-icon btn-sm ${showGridPanel ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowGridPanel(v => !v)}
            style={{ width: 26, height: 26 }}
          >
            <Settings size={13} />
          </button>

          {showGridPanel && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: 14, width: 248, zIndex: 300,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Configurar Grid
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  {
                    label: 'Tamanho (px)',
                    control: (
                      <input
                        type="number" min={16} max={150} value={gc.size}
                        onChange={e => onGridConfigChange({ ...gc, size: Math.max(16, parseInt(e.target.value) || 50) })}
                        className="input"
                        style={{ width: 60, padding: '2px 6px', fontSize: '0.78rem', textAlign: 'center' }}
                      />
                    ),
                  },
                  {
                    label: 'Cor',
                    control: (
                      <input
                        type="color" value={gc.color}
                        onChange={e => onGridConfigChange({ ...gc, color: e.target.value })}
                        style={{ width: 36, height: 22, padding: 1, border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer' }}
                      />
                    ),
                  },
                  {
                    label: `Opacidade (${Math.round(gc.opacity * 100)}%)`,
                    control: (
                      <input
                        type="range" min={0.05} max={1} step={0.05} value={gc.opacity}
                        onChange={e => onGridConfigChange({ ...gc, opacity: parseFloat(e.target.value) })}
                        style={{ width: 80 }}
                      />
                    ),
                  },
                ].map(({ label, control }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                    <span>{label}</span>
                    {control}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {onOpenWeatherModal && (
        <button
          className={`btn btn-icon btn-sm btn-ghost ${currentWeather !== 'none' ? 'active' : ''}`}
          onClick={onOpenWeatherModal}
          title="Clima Dinâmico e Partículas"
          style={{ width: 26, height: 26, color: currentWeather !== 'none' ? 'var(--accent-primary)' : 'inherit' }}
        >
          <CloudRain size={13} />
        </button>
      )}

      <Divider />

      {/* Zoom & View Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button className="btn btn-icon btn-sm btn-ghost" onClick={onZoomOut} title="Reduzir zoom" style={{ width: 24, height: 24 }}>
          <ZoomOut size={12} />
        </button>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button className="btn btn-icon btn-sm btn-ghost" onClick={onZoomIn} title="Aumentar zoom" style={{ width: 24, height: 24 }}>
          <ZoomIn size={12} />
        </button>
        <button className="btn btn-icon btn-sm btn-ghost" onClick={onResetView} title="Recentralizar mapa" style={{ width: 24, height: 24 }}>
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Token count status */}
      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {tokenCount} token{tokenCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
