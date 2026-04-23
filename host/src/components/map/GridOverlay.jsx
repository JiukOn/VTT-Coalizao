/* GridOverlay.jsx — Configurable grid settings panel component
   Renders a standalone config form for grid appearance.
   The actual visual grid is rendered via CSS in MapPage. */

export default function GridOverlay({ config, onConfigChange }) {
  const gc = config

  const Row = ({ label, children }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: '0.78rem', color: 'var(--text-secondary)',
    }}>
      <span>{label}</span>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row label="Mostrar Grid">
        <input
          type="checkbox"
          checked={gc.show}
          onChange={e => onConfigChange({ ...gc, show: e.target.checked })}
        />
      </Row>

      <Row label="Tamanho (px)">
        <input
          type="number" min={16} max={150} value={gc.size}
          onChange={e => onConfigChange({ ...gc, size: Math.max(16, parseInt(e.target.value) || 50) })}
          className="input"
          style={{ width: 60, padding: '2px 6px', fontSize: '0.78rem', textAlign: 'center' }}
        />
      </Row>

      <Row label="Cor">
        <input
          type="color" value={gc.color}
          onChange={e => onConfigChange({ ...gc, color: e.target.value })}
          style={{ width: 36, height: 22, padding: 1, border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer' }}
        />
      </Row>

      <Row label={`Opacidade (${Math.round(gc.opacity * 100)}%)`}>
        <input
          type="range" min={0.05} max={1} step={0.05} value={gc.opacity}
          onChange={e => onConfigChange({ ...gc, opacity: parseFloat(e.target.value) })}
          style={{ width: 80 }}
        />
      </Row>

      <Row label={`Espessura (${gc.lineWidth}px)`}>
        <input
          type="range" min={1} max={5} value={gc.lineWidth}
          onChange={e => onConfigChange({ ...gc, lineWidth: parseInt(e.target.value) })}
          style={{ width: 80 }}
        />
      </Row>

      <Row label={`Offset X (${gc.offsetX}px)`}>
        <input
          type="range" min={0} max={gc.size - 1} value={gc.offsetX}
          onChange={e => onConfigChange({ ...gc, offsetX: parseInt(e.target.value) })}
          style={{ width: 80 }}
        />
      </Row>

      <Row label={`Offset Y (${gc.offsetY}px)`}>
        <input
          type="range" min={0} max={gc.size - 1} value={gc.offsetY}
          onChange={e => onConfigChange({ ...gc, offsetY: parseInt(e.target.value) })}
          style={{ width: 80 }}
        />
      </Row>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer',
      }}>
        <input
          type="checkbox" checked={gc.showCoords}
          onChange={e => onConfigChange({ ...gc, showCoords: e.target.checked })}
        />
        Mostrar coordenadas (A1, B2…)
      </label>
    </div>
  )
}
