/* MapToolbar.jsx — Top toolbar for the tactical map */
import { useState } from 'react'
import {
  Upload, Grid3X3, Eye, EyeOff, Pen, Eraser, Ruler, Move,
  MousePointer2, ZoomIn, ZoomOut, RotateCcw, Settings, Trash2,
  Minus, Type,
} from 'lucide-react'

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
}) {
  const [showGridPanel, setShowGridPanel] = useState(false)
  const gc = gridConfig

  const tools = [
    { id: 'select',  icon: MousePointer2, label: 'Selecionar token' },
    { id: 'pan',     icon: Move,          label: 'Mover mapa' },
    { id: 'measure', icon: Ruler,         label: 'Medir distância (ou SHIFT)' },
    { id: 'draw',    icon: Pen,           label: 'Desenhar no mapa' },
    { id: 'wall',    icon: Minus,         label: 'Parede / linha reta (snap 45°)' },
    { id: 'text',    icon: Type,          label: 'Etiqueta de texto' },
    { id: 'erase',   icon: Eraser,        label: 'Apagar desenhos, paredes e etiquetas' },
  ]

  const Divider = () => (
    <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', flexShrink: 0 }} />
  )

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(10px)', flexWrap: 'wrap',
    }}>

      {/* Map upload */}
      <label title="Carregar imagem de mapa (PNG, JPG, WebP)" style={{ cursor: 'pointer' }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={onUploadMap}
        />
        <span className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <Upload size={13} /> Mapa
        </span>
      </label>

      <Divider />

      {/* Tool buttons */}
      {tools.map(tool => (
        <button
          key={tool.id}
          title={tool.label}
          onClick={() => onToolChange(tool.id)}
          className={`btn btn-icon btn-sm ${activeTool === tool.id ? 'btn-primary' : 'btn-ghost'}`}
          style={{ width: 28, height: 28 }}
        >
          <tool.icon size={13} />
        </button>
      ))}

      {/* Draw options */}
      {activeTool === 'draw' && (
        <>
          <input
            type="color"
            value={drawColor}
            onChange={e => onDrawColorChange(e.target.value)}
            title="Cor do pincel"
            style={{ width: 26, height: 26, padding: 1, border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', background: 'var(--bg-tertiary)' }}
          />
          <input
            type="range"
            min={2}
            max={24}
            value={drawSize}
            onChange={e => onDrawSizeChange(parseInt(e.target.value))}
            title={`Tamanho: ${drawSize}px`}
            style={{ width: 60 }}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClearDrawing}
            title="Limpar todos os desenhos"
            style={{ display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Trash2 size={11} /> Limpar
          </button>
        </>
      )}

      {activeTool === 'erase' && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClearDrawing}
          title="Limpar todos os desenhos"
          style={{ display: 'flex', alignItems: 'center', gap: 3 }}
        >
          <Trash2 size={11} /> Limpar Tudo
        </button>
      )}

      <Divider />

      {/* Fog of War */}
      <button
        title={fogEnabled ? 'Desativar Névoa de Guerra' : 'Ativar Névoa de Guerra'}
        onClick={() => onFogToggle(!fogEnabled)}
        className={`btn btn-sm ${fogEnabled ? 'btn-primary' : 'btn-ghost'}`}
        style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem' }}
      >
        {fogEnabled ? <EyeOff size={12} /> : <Eye size={12} />}
        Névoa
      </button>

      {fogEnabled && (
        <>
          <button
            className="btn btn-sm btn-secondary"
            onClick={onRevealAll}
            title="Revelar todo o mapa"
            style={{ fontSize: '0.7rem' }}
          >
            Revelar Tudo
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onHideAll}
            title="Ocultar todo o mapa"
            style={{ fontSize: '0.7rem' }}
          >
            Ocultar
          </button>
        </>
      )}

      <Divider />

      {/* Grid toggle */}
      <button
        title="Mostrar/Ocultar Grid"
        onClick={() => onGridConfigChange({ ...gc, show: !gc.show })}
        className={`btn btn-icon btn-sm ${gc.show ? 'btn-primary' : 'btn-ghost'}`}
        style={{ width: 28, height: 28 }}
      >
        <Grid3X3 size={13} />
      </button>

      {/* Snap to Grid */}
      <button
        title="Snap to Grid — alinhar tokens ao centro do quadrado"
        onClick={() => onSnapChange(!snapToGrid)}
        className={`btn btn-sm ${snapToGrid ? 'btn-primary' : 'btn-ghost'}`}
        style={{ fontSize: '0.7rem', padding: '3px 7px' }}
      >
        Snap
      </button>

      {/* Grid settings panel */}
      <div style={{ position: 'relative' }}>
        <button
          title="Configurar Grid"
          className={`btn btn-icon btn-sm ${showGridPanel ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowGridPanel(v => !v)}
          style={{ width: 28, height: 28 }}
        >
          <Settings size={13} />
        </button>

        {showGridPanel && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 14, width: 248, zIndex: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
                {
                  label: `Espessura (${gc.lineWidth}px)`,
                  control: (
                    <input
                      type="range" min={1} max={5} value={gc.lineWidth}
                      onChange={e => onGridConfigChange({ ...gc, lineWidth: parseInt(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  ),
                },
                {
                  label: `Offset X (${gc.offsetX}px)`,
                  control: (
                    <input
                      type="range" min={0} max={gc.size - 1} value={gc.offsetX}
                      onChange={e => onGridConfigChange({ ...gc, offsetX: parseInt(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  ),
                },
                {
                  label: `Offset Y (${gc.offsetY}px)`,
                  control: (
                    <input
                      type="range" min={0} max={gc.size - 1} value={gc.offsetY}
                      onChange={e => onGridConfigChange({ ...gc, offsetY: parseInt(e.target.value) })}
                      style={{ width: 80 }}
                    />
                  ),
                },
              ].map(({ label, control }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.77rem', color: 'var(--text-secondary)',
                }}>
                  <span>{label}</span>
                  {control}
                </div>
              ))}

              <label style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: '0.77rem', color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox" checked={gc.showCoords}
                  onChange={e => onGridConfigChange({ ...gc, showCoords: e.target.checked })}
                />
                Mostrar coordenadas (A1, B2…)
              </label>
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Zoom */}
      <button className="btn btn-icon btn-sm btn-ghost" onClick={onZoomOut} title="Reduzir zoom" style={{ width: 26, height: 26 }}>
        <ZoomOut size={12} />
      </button>
      <span style={{
        fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)', minWidth: 38, textAlign: 'center',
      }}>
        {Math.round(scale * 100)}%
      </span>
      <button className="btn btn-icon btn-sm btn-ghost" onClick={onZoomIn} title="Aumentar zoom" style={{ width: 26, height: 26 }}>
        <ZoomIn size={12} />
      </button>
      <button className="btn btn-icon btn-sm btn-ghost" onClick={onResetView} title="Recentralizar mapa" style={{ width: 26, height: 26 }}>
        <RotateCcw size={12} />
      </button>

      {/* Status */}
      <span style={{
        marginLeft: 'auto',
        fontSize: '0.7rem', color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        {tokenCount} token{tokenCount !== 1 ? 's' : ''} · SHIFT = medir
      </span>
    </div>
  )
}
