/* AttributeDistributor.jsx — Point buy system for 8 attributes */
import { Minus, Plus } from 'lucide-react'
import { ATTRIBUTES, getBonus } from '../../utils/characterUtils'

export default function AttributeDistributor({ attributes, onChange, totalPoints = 25, lockedAttrs = [] }) {
  // Locked attrs (e.g. ENR for Não Classificado) don't count toward points and can't be changed
  const usedPoints = Object.entries(attributes).reduce((sum, [k, v]) => lockedAttrs.includes(k) ? sum : sum + v, 0)
  const remaining = totalPoints - usedPoints
  const allUsed = remaining === 0

  function handleChange(key, delta) {
    if (lockedAttrs.includes(key)) return
    const current = attributes[key] || 0
    const next = current + delta
    if (next < 0) return
    if (delta > 0 && remaining <= 0) return
    onChange({ ...attributes, [key]: next })
  }

  return (
    <div className="attribute-distributor">
      <div className={`attr-points-counter ${allUsed ? 'attr-points-complete' : 'attr-points-remaining'}`}>
        <span className="attr-points-value">{usedPoints}/{totalPoints}</span>
        <span className="attr-points-label">pontos usados</span>
        {remaining > 0 && <span className="attr-points-hint">{remaining} restante{remaining !== 1 ? 's' : ''}</span>}
      </div>

      <div className="attr-grid">
        {ATTRIBUTES.map(attr => {
          const value = attributes[attr.key] || 0
          const bonus = getBonus(value)
          const isLocked = lockedAttrs.includes(attr.key)
          return (
            <div key={attr.key} className="attr-row" style={{ opacity: isLocked ? 0.45 : 1 }}>
              <div className="attr-info">
                <span className="attr-abbr">{attr.abbr}</span>
                <span className="attr-name">{attr.name}</span>
                {isLocked && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)', marginLeft: 4 }}>bloqueado</span>}
              </div>

              <div className="attr-controls">
                <button
                  className="btn btn-icon btn-sm attr-btn"
                  onClick={() => handleChange(attr.key, -1)}
                  disabled={value <= 0 || isLocked}
                  title="Diminuir"
                >
                  <Minus size={14} />
                </button>

                <span className="attr-value stat-value">{value}</span>

                <button
                  className="btn btn-icon btn-sm attr-btn"
                  onClick={() => handleChange(attr.key, 1)}
                  disabled={remaining <= 0 || isLocked}
                  title="Aumentar"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="attr-bonus">
                <span className="badge badge-accent">+{bonus}</span>
              </div>

              <div className="attr-bar-track">
                <div
                  className="attr-bar-fill"
                  style={{ width: `${Math.min((value / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
