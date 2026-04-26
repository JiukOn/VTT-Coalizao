/* AbilityCard.jsx — Ability display card with full details */
import { Clock, Zap, Star, BookOpen } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

const CAT_COLORS = {
  legado:      '#C084FC',
  ativa:       '#F87171',
  passiva:     '#4ADE80',
  mito:        '#FBBF24',
  unica:       '#60A5FA',
  descendencia:'#FB923C',
}

const CAT_LABELS = {
  legado: 'Legado', ativa: 'Ativa', passiva: 'Passiva',
  mito: 'Mito', unica: 'Uso Único', descendencia: 'Descendência',
}

export default function AbilityCard({ ability, onSelect, onContextMenu }) {
  const { t } = useLanguage()
  const catKey = (ability.category || '').toLowerCase().replace(/\s/g, '')
  const color = CAT_COLORS[catKey] || 'var(--accent-primary)'
  const catLabel = CAT_LABELS[catKey] || ability.category
  const name = t(ability.name)
  const desc = t(ability.description)

  return (
    <div
      className="entity-card"
      onClick={() => onSelect?.(ability)}
      onContextMenu={(e) => onContextMenu?.(e, ability)}
      style={{ cursor: 'pointer' }}
    >
      <div className="entity-card-header">
        <div className="entity-avatar" style={{ background: `${color}18`, color, fontSize: '1.1rem' }}>
          <Zap size={18} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="entity-card-name">{name}</div>
          <div className="entity-card-type">
            {catKey === 'legado' ? (t(ability.classLink) || t(ability.class) || catLabel) : catLabel}
          </div>
        </div>
        <span className="badge" style={{ background: `${color}18`, color, fontSize: '0.7rem', flexShrink: 0 }}>
          {catLabel}
        </span>
      </div>

      {desc && (
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {desc}
        </p>
      )}

      <div className="entity-card-stats" style={{ marginTop: 6 }}>
        {t(ability.cost) && t(ability.cost) !== '—' && (
          <span className="entity-stat"><span className="entity-stat-label"><Zap size={10} /></span>{t(ability.cost)}</span>
        )}
        {t(ability.test) && t(ability.test) !== '—' && (
          <span className="entity-stat"><span className="entity-stat-label">TESTE</span>{t(ability.test)}</span>
        )}
        {t(ability.duration) && t(ability.duration) !== '—' && (
          <span className="entity-stat"><span className="entity-stat-label"><Clock size={10} /></span>{t(ability.duration)}</span>
        )}
        {(t(ability.req) || t(ability.requirements)) && (
          <span className="entity-stat"><span className="entity-stat-label"><Star size={10} /></span>{t(ability.req) || t(ability.requirements)}</span>
        )}
      </div>
    </div>
  )
}
