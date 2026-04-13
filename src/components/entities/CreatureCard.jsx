/* CreatureCard.jsx — Card view for a creature in the bestiary */
import { Skull } from 'lucide-react'

const SIZE_LABELS = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  colossal: 'Colossal',
}

const SIZE_COLORS = {
  pequeno: 'var(--color-success)',
  medio:   'var(--color-warning)',
  grande:  'var(--color-danger)',
  colossal:'var(--color-critical)',
}

const ELEMENT_COLORS = {
  fogo:     '#FF6B35',
  agua:     '#60A5FA',
  gelo:     '#93C5FD',
  eletrico: '#FBBF24',
  madeira:  '#4ADE80',
  areia:    '#D97706',
  maligno:  '#C084FC',
  neutro:   '#8888A0',
}

export default function CreatureCard({ creature, onSelect, onContextMenu }) {
  const sizeKey = (creature.size || '').toLowerCase()
  const sizeLabel = SIZE_LABELS[sizeKey] || creature.size || '?'
  const sizeColor = SIZE_COLORS[sizeKey] || 'var(--text-muted)'
  const elemColor = creature.element ? ELEMENT_COLORS[creature.element.toLowerCase()] || 'var(--accent-primary)' : null

  return (
    <div
      className="entity-card"
      onClick={() => onSelect?.(creature)}
      onContextMenu={(e) => onContextMenu?.(e, creature)}
      style={{ cursor: 'pointer' }}
    >
      <div className="entity-card-header">
        <div className="entity-avatar" style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', fontSize: '1.2rem' }}>
          {creature.imagePath ? (
            <img
              src={`/src/assets/criaturas/${creature.imagePath}`}
              alt={creature.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          ) : null}
          <Skull size={20} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="entity-card-name">{creature.name}</div>
          <div className="entity-card-type" style={{ textTransform: 'capitalize' }}>
            {creature.type} · {creature.diet || ''}
          </div>
        </div>
      </div>

      <div className="entity-card-stats" style={{ marginTop: 6 }}>
        <span className="entity-stat">
          <span className="entity-stat-label" style={{ color: sizeColor }}>TAM</span>
          <span style={{ color: sizeColor, fontWeight: 600 }}>{sizeLabel}</span>
        </span>
        {creature.element && (
          <span className="entity-stat">
            <span className="entity-stat-label" style={{ color: elemColor }}>ELEM</span>
            <span style={{ color: elemColor, textTransform: 'capitalize' }}>{creature.element}</span>
          </span>
        )}
        {creature.behavior && (
          <span className="entity-stat">
            <span className="entity-stat-label">COMP</span>
            <span style={{ textTransform: 'capitalize' }}>{creature.behavior}</span>
          </span>
        )}
      </div>

      {creature.description && (
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          marginTop: 6,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {creature.description}
        </p>
      )}
    </div>
  )
}
