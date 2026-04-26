/* NPCSheet.jsx — Full NPC character sheet display (Phase 10) */
import { User, Shield, Zap, Star, Package, Heart, Swords } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'

const ATTR_KEYS = ['vit', 'dex', 'crm', 'frc', 'int', 'res', 'pre', 'enr']
const ATTR_LABELS = { vit: 'VIT', dex: 'DEX', crm: 'CRM', frc: 'FRC', int: 'INT', res: 'RES', pre: 'PRE', enr: 'ENR' }

const EQUIP_SLOTS = [
  'Head', 'Face', 'Neck', 'Chest', 'Back',
  'Right Hand', 'Left Hand', 'Hand Accessories', 'Legs', 'Feet',
]

function getBonus(value) {
  return Math.floor((value || 0) / 5)
}

export default function NPCSheet({ npc }) {
  const { t, ui } = useLanguage()

  if (!npc) return null

  const abilities = npc.abilities || {}
  const hasAbilities = !!(
    abilities.legacy ||
    Object.values(abilities.active || {}).some(v => v) ||
    Object.values(abilities.passive || {}).some(v => v) ||
    abilities.myth
  )

  const equipment = npc.equipment || {}
  const filledEquipSlots = EQUIP_SLOTS.filter(slot => equipment[slot])

  const inventory = npc.inventory || {}
  const inventoryItems = Object.entries(inventory)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ slot: k, item: v }))

  return (
    <div className="character-sheet">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="cs-header">
        <div
          className="cs-avatar"
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}
        >
          {npc.avatar
            ? <img src={npc.avatar} alt={t(npc.name)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <User size={24} />
          }
        </div>
        <div className="cs-identity">
          <h2 className="cs-name">{t(npc.name)}</h2>
          <div className="cs-meta">
            {npc.level != null && (
              <span className="badge badge-warning">Nível {npc.level}</span>
            )}
            {npc.classId && (
              <span className="badge badge-accent">{npc.classId}</span>
            )}
            {npc.species && (
              <span className="badge badge-info">{npc.species}</span>
            )}
            {npc.age > 0 && (
              <span className="badge badge-secondary">{npc.age} anos</span>
            )}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Description ─────────────────────────────────── */}
      {t(npc.description) && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><User size={16} /> Descrição</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {t(npc.description)}
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
            const value = npc[key] || 0
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

      {/* ── Equipment ───────────────────────────────────── */}
      {filledEquipSlots.length > 0 && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><Shield size={16} /> Equipamento</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-xs)',
              }}
            >
              {filledEquipSlots.map(slot => (
                <div
                  key={slot}
                  className="cs-equip-slot cs-equip-filled"
                  style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <span className="cs-equip-label">{slot}</span>
                  <span className="cs-equip-item">{equipment[slot]}</span>
                </div>
              ))}
            </div>
          </section>
          <div className="divider" />
        </>
      )}

      {/* ── Abilities ───────────────────────────────────── */}
      {hasAbilities && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><Swords size={16} /> Habilidades</h3>

            {abilities.legacy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-accent">Legado</span>
                <span style={{ fontSize: '0.875rem' }}>{abilities.legacy}</span>
              </div>
            )}

            {Object.entries(abilities.active || {}).some(([, v]) => v) && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ativas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {Object.entries(abilities.active).map(([slot, name]) =>
                    name ? (
                      <span key={slot} className="badge badge-warning">{name}</span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {Object.entries(abilities.passive || {}).some(([, v]) => v) && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Passivas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {Object.entries(abilities.passive).map(([slot, name]) =>
                    name ? (
                      <span key={slot} className="badge badge-info">{name}</span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {abilities.myth && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge" style={{ background: 'rgba(192,132,252,0.18)', color: '#C084FC', border: '1px solid rgba(192,132,252,0.3)' }}>Mito</span>
                <span style={{ fontSize: '0.875rem' }}>{abilities.myth}</span>
              </div>
            )}
          </section>
          <div className="divider" />
        </>
      )}

      {/* ── Benefit / Harm ──────────────────────────────── */}
      {(npc.possibleBenefit || npc.possibleHarm) && (
        <>
          <section className="cs-section">
            <h3 className="cs-section-title"><Heart size={16} /> Benefício / Malefício</h3>
            {npc.possibleBenefit && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700, flexShrink: 0 }}>+</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t(npc.possibleBenefit)}</span>
              </div>
            )}
            {npc.possibleHarm && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-danger)', fontWeight: 700, flexShrink: 0 }}>−</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t(npc.possibleHarm)}</span>
              </div>
            )}
          </section>
          <div className="divider" />
        </>
      )}

      {/* ── Inventory ───────────────────────────────────── */}
      {inventoryItems.length > 0 && (
        <section className="cs-section">
          <h3 className="cs-section-title"><Package size={16} /> Inventário</h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-xs)',
            }}
          >
            {inventoryItems.map(({ slot, item }) => (
              <div
                key={slot}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  background: 'var(--bg-hover)',
                  borderRadius: 6,
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', minWidth: 16, fontSize: '0.75rem' }}>{slot}.</span>
                <span style={{ color: 'var(--text-primary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
