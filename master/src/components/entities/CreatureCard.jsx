/* CreatureCard.jsx — Card view for a creature in the bestiary */
import { Skull } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

const SIZE_COLORS = {
  tiny:      'var(--text-muted)',
  small:     'var(--color-success)',
  medium:    'var(--color-warning)',
  large:     'var(--color-danger)',
  colossal:  'var(--color-critical)',
  world:     '#C084FC',
}

const ELEMENT_COLORS = {
  fire:      '#FF6B35',
  water:     '#60A5FA',
  ice:       '#93C5FD',
  lightning: '#FBBF24',
  wood:      '#4ADE80',
  earth:     '#D97706',
  stone:     '#A0826D',
  shadow:    '#C084FC',
  light:     '#FDE68A',
  air:       '#67E8F9',
  void:      '#8888A0',
}

export default function CreatureCard({ creature, onSelect, onContextMenu }) {
  const { t } = useLanguage()
  const name = t(creature.name)
  const sizeKey = (typeof creature.size === 'string' ? creature.size : '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const sizeColor = SIZE_COLORS[sizeKey] || 'var(--text-muted)'
  const elemName = t(creature.element)
  const elemKey = elemName ? elemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
  const elemColor = elemKey ? ELEMENT_COLORS[elemKey] || 'var(--accent-primary)' : null

  return (
    <div
      className="entity-card"
      onClick={() => onSelect?.({ ...creature, entityType: 'creature' })}
      onContextMenu={(e) => onContextMenu?.(e, { ...creature, entityType: 'creature' })}
      style={{ cursor: 'pointer' }}
    >
      <div className="entity-card-header">
        <div className="entity-avatar" style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', fontSize: '1.2rem' }}>
          {creature.imagePath ? (
            <img
              src={`/src/assets/criaturas/${creature.imagePath}`}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          ) : null}
          <Skull size={20} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="entity-card-name">{name}</div>
          <div className="entity-card-type" style={{ textTransform: 'capitalize' }}>
            {t(creature.type)} · {t(creature.diet) || ''}
          </div>
        </div>
      </div>

      <div className="entity-card-stats" style={{ marginTop: 6 }}>
        <span className="entity-stat">
          <span className="entity-stat-label" style={{ color: sizeColor }}>TAM</span>
          <span style={{ color: sizeColor, fontWeight: 600 }}>{t(creature.size) || '?'}</span>
        </span>
        {elemName && (
          <span className="entity-stat">
            <span className="entity-stat-label" style={{ color: elemColor }}>ELEM</span>
            <span style={{ color: elemColor, textTransform: 'capitalize' }}>{elemName}</span>
          </span>
        )}
        {creature.behavior && (
          <span className="entity-stat">
            <span className="entity-stat-label">COMP</span>
            <span style={{ textTransform: 'capitalize' }}>{t(creature.behavior)}</span>
          </span>
        )}
      </div>

      {t(creature.description) && (
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
          {t(creature.description)}
        </p>
      )}
    </div>
  )
}
