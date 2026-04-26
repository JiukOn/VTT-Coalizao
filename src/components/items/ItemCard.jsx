/* ItemCard.jsx — Item display card with stats, DP bar, modifications */
import { Swords, Shield, Package } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

const RARITY_COLORS = {
  comum:       'var(--text-muted)',
  sentimental: 'var(--color-success)',
  especial:    'var(--color-warning)',
  vivo:        '#34D399',
  mito:        'var(--color-critical)',
  amaldicoado:'var(--color-danger)',
}

const TYPE_ICONS = {
  arma:      Swords,
  escudo:    Shield,
  vestimenta:Package,
}

export default function ItemCard({ item, onSelect, onContextMenu }) {
  const { t } = useLanguage()
  const name = t(item.name)
  const rarity = (typeof item.rarity === 'string' ? item.rarity : t(item.rarity) || 'comum').toLowerCase()
  const rarityColor = RARITY_COLORS[rarity] || 'var(--text-muted)'
  const type = (typeof item.type === 'string' ? item.type : t(item.type) || t(item.category) || '').toLowerCase()
  const Icon = TYPE_ICONS[type] || Package
  const dpPercent = item.dpMax > 0 ? Math.round(((item.dp ?? item.dpMax) / item.dpMax) * 100) : 0

  return (
    <div
      className="entity-card"
      onClick={() => onSelect?.(item)}
      onContextMenu={(e) => onContextMenu?.(e, item)}
      style={{ cursor: 'pointer' }}
    >
      <div className="entity-card-header">
        <div className="entity-avatar" style={{ background: `${rarityColor}18`, color: rarityColor }}>
          <Icon size={18} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="entity-card-name" style={{ fontSize: '0.9rem' }}>{name}</div>
          <div className="entity-card-type" style={{ textTransform: 'capitalize' }}>
            {t(item.type) || t(item.category)}
            {item.subtype ? ` · ${t(item.subtype)}` : ''}
          </div>
        </div>
        {rarity !== 'comum' && (
          <span className="badge" style={{ background: `${rarityColor}18`, color: rarityColor, fontSize: '0.68rem' }}>
            {t(item.rarity)}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="entity-card-stats" style={{ marginTop: 6 }}>
        {item.damage && (
          <span className="entity-stat"><span className="entity-stat-label">DANO</span>{item.damage}</span>
        )}
        {item.defense != null && item.defense !== 0 && (
          <span className="entity-stat"><span className="entity-stat-label">DEF</span>{item.defense}</span>
        )}
        {item.range && (
          <span className="entity-stat"><span className="entity-stat-label">ALC</span>{item.range}</span>
        )}
      </div>

      {/* DP bar */}
      {item.dpMax > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>
            <span>Durabilidade</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{item.dp ?? item.dpMax}/{item.dpMax} DP</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-hover)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${dpPercent}%`,
              background: dpPercent > 50 ? 'var(--color-success)' : dpPercent > 20 ? 'var(--color-warning)' : 'var(--color-danger)',
              borderRadius: 2,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Modifications */}
      {item.modifications?.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {item.modifications.map((mod, i) => (
            <span key={i} className="badge" style={{ fontSize: '0.68rem', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
              {t(mod)}
            </span>
          ))}
        </div>
      )}

      {/* Bonuses — supports both item.bonuses and item.stats formats */}
      {(() => {
        const statObj = item.bonuses || item.stats || item.stats_bonuses || {}
        const entries = Object.entries(statObj).filter(([, v]) => v)
        if (!entries.length) return null
        return (
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {entries.map(([attr, val]) => (
              <span key={attr} className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                +{val} {attr.toUpperCase()}
              </span>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
