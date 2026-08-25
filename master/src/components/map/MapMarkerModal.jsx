/* MapMarkerModal.jsx — Master modal to create/edit secret notes and pins on tactical maps */
import { useState } from 'react'
import { MARKER_TYPES, createMapMarker } from '@shared/utils/mapMarkers.js'
import { MapPin, Trash2, Eye, EyeOff, X, Check } from 'lucide-react'

export default function MapMarkerModal({
  isOpen,
  onClose,
  marker = null,
  initialPos = { x: 100, y: 100 },
  onSave,
  onDelete,
}) {
  const [type, setType] = useState(marker?.type || 'secret')
  const [title, setTitle] = useState(marker?.title || '')
  const [description, setDescription] = useState(marker?.description || '')
  const [dc, setDc] = useState(marker?.dc !== undefined && marker?.dc !== null ? marker.dc : '')
  const [revealed, setRevealed] = useState(marker?.revealed || false)

  if (!isOpen) return null

  const handleSave = () => {
    const data = {
      ...(marker || createMapMarker({ x: initialPos.x, y: initialPos.y, type })),
      type,
      title: title.trim() || MARKER_TYPES[type]?.defaultTitle,
      description: description.trim(),
      dc: dc !== '' && !isNaN(dc) ? Number(dc) : null,
      revealed,
    }
    onSave?.(data)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 440,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: `${MARKER_TYPES[type]?.color || '#38BDF8'}20`, color: MARKER_TYPES[type]?.color || '#38BDF8', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              {MARKER_TYPES[type]?.icon || '📍'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {marker ? 'Editar Marcador Secreto' : 'Novo Marcador Secreto'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visível apenas na visão do Mestre</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {Object.values(MARKER_TYPES).map(t => {
            const isSel = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 4px',
                  borderRadius: 6,
                  border: `1px solid ${isSel ? t.color : 'var(--border-subtle)'}`,
                  background: isSel ? `${t.color}20` : 'var(--bg-primary)',
                  cursor: 'pointer',
                  color: isSel ? t.color : 'var(--text-muted)',
                }}
                title={t.label}
              >
                <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Título:</label>
              <input
                type="text"
                className="input"
                value={title}
                placeholder={MARKER_TYPES[type]?.defaultTitle}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>CD / DC:</label>
              <input
                type="number"
                className="input"
                value={dc}
                placeholder="Ex: 14"
                onChange={e => setDc(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notas Secretas do Mestre:</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              placeholder="Descreva a armadilha, mecanismo, tesouro ou texto narrativo da sala..."
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={revealed}
              onChange={e => setRevealed(e.target.checked)}
            />
            <span>Revelar este marcador para a visão dos jogadores</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          {marker && onDelete ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { onDelete(marker.id); onClose() }}
              style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={13} /> Excluir
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} /> Salvar Marcador
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
