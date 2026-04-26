/* CreatureSheet.jsx — Full creature sheet display (Phase 11) */
import { Skull, Zap, Shield, Package, Star } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

const ATTR_KEYS = ['vit', 'dex', 'crm', 'frc', 'int', 'res', 'pre', 'enr']
const ATTR_LABELS = { vit: 'VIT', dex: 'DEX', crm: 'CRM', frc: 'FRC', int: 'INT', res: 'RES', pre: 'PRE', enr: 'ENR' }

function getBonus(value) {
  return Math.floor((value || 0) / 5)
}

export default function CreatureSheet({ creature }) {
  const { t, ui } = useLanguage()

  if (!creature) return null

  const abilities = creature.abilities || {}
  const activeEntries = Object.entries(abilities.active || {}).filter(([, v]) => v)
  const passiveEntries = Object.entries(abilities.passive || {}).filter(([, v]) => v)
  const hasAbilities = activeEntries.length > 0 || passiveEntries.length > 0

  const drops = creature.drops || {}
  const dropEntries = Object.entries(drops).filter(([, v]) => v && v.item)

  return (
    <div className="character-sheet">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="cs-header">
        <div
          className="cs-avatar"
          style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}
        >
          {creature.imagePath ? (
            <img
              src={`/src/assets/criaturas/${creature.imagePath}`}
              alt={t(creature.name)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <Skull size={24} />
          )}
        </div>
        <div className="cs-identity">
          <h2 className="cs-name">{t(creature.name)}</h2>
          <div className="cs-meta">
            {creature.level != null && (
              <span className="badge badge-warning">Nível {creature.level}</span>
            )}
            {creature.size && (
              <span className="badge badge-secondary">{t(creature.size)}</span>
            )}
            {creature.element && (
              <span className="badge badge-info">{t(creature.element)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Meta Pills ──────────────────────────────────── */}
      {(creature.coreSize || creature.diet) && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '2px 0' }}>
            {creature.coreSize && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20,
                background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
              }}>
                <Star size={12} />
                <span>Núcleo: <strong style={{ color: 'var(--text-primary)' }}>{creature.coreSize}</strong></span>
              </div>
            )}
            {creature.diet && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20,
                background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
              }}>
                <span>Dieta: <strong style={{ color: 'var(--text-primary)' }}>{t(creature.diet)}</strong></span>
              </div>
            )}
          </div>
          <div className="divider" />
        </>
      )}

      {/* ── Description ─────────────────────────────────── */}
      {t(creature.description) && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><Skull size={16} /> Descrição</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {t(creature.description)}
            </p>
          </section>
          <div className="divider" />
        </>
      )}

      {/* ── Attributes Grid ─────────────────────────────── */}
      <section className="cs-section">
        <h3 className="cs-section-title"><Zap size={16} /> Atributos</h3>
        <div className="cs-attr-grid">
          {ATTR_KEYS.map(key => {
            const value = creature[key] || 0
            const bonus = getBonus(value)
            return (
              <div key={key} className="cs-attr-card">
                <div className="cs-attr-abbr">{ATTR_LABELS[key]}</div>
                <div className="cs-attr-final stat-value">{value}</div>
                <div className="cs-attr-bonus">+{bonus}</div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="divider" />

      {/* ── Abilities ───────────────────────────────────── */}
      {hasAbilities && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><Shield size={16} /> Habilidades</h3>

            {activeEntries.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ativas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {activeEntries.map(([slot, name]) => (
                    <span key={slot} className="badge badge-warning">{name}</span>
                  ))}
                </div>
              </div>
            )}

            {passiveEntries.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Passivas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {passiveEntries.map(([slot, name]) => (
                    <span key={slot} className="badge badge-info">{name}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
          <div className="divider" />
        </>
      )}

      {/* ── Item Drops ──────────────────────────────────── */}
      {dropEntries.length > 0 && (
        <section className="cs-section">
          <h3 className="cs-section-title"><Package size={16} /> Drops</h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 8,
                padding: '4px 10px',
                background: 'var(--bg-hover)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Item</span>
              <span style={{ textAlign: 'right' }}>Chance</span>
              <span style={{ textAlign: 'right' }}>Qtd.</span>
            </div>

            {dropEntries.map(([slot, drop]) => (
              <div
                key={slot}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 8,
                  padding: '5px 10px',
                  fontSize: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{drop.item}</span>
                <span
                  style={{
                    color: drop.chance === '100%' ? 'var(--color-success)' : 'var(--color-warning)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textAlign: 'right',
                  }}
                >
                  {drop.chance}
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    textAlign: 'right',
                    minWidth: 24,
                  }}
                >
                  x{drop.amount}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
