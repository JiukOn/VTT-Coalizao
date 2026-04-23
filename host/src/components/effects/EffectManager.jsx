/* EffectManager.jsx — Apply/remove effects and conditions from the Coalizão system */
import { useState, useMemo } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import { BASE_EFFECTS } from '@data/effects/index.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

const CAT_LABELS = {
  psicologicosAtivos:  'Psicológicos Ativos',
  psicologicosPassivos:'Psicológicos Passivos',
  doencas:             'Doenças',
  condicoes:           'Condições',
  maldicoes:           'Maldições',
  efeitosUnicos:       'Efeitos Únicos',
}

const CAT_COLORS = {
  psicologicosAtivos:  '#C084FC',
  psicologicosPassivos:'#8B5CF6',
  doencas:             '#F87171',
  condicoes:           '#FBBF24',
  maldicoes:           '#FB923C',
  efeitosUnicos:       '#60A5FA',
}

export default function EffectManager({ activeEffects = [], onApplyEffect, onRemoveEffect }) {
  const { t } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('condicoes')
  const [turns, setTurns] = useState(3)

  const allEffects = useMemo(() => {
    const effects = []
    Object.entries(BASE_EFFECTS).forEach(([cat, list]) => {
      list.forEach(eff => effects.push({ ...eff, _category: cat }))
    })
    return effects
  }, [])

  const categorized = useMemo(() => {
    const result = {}
    Object.entries(BASE_EFFECTS).forEach(([cat, list]) => {
      result[cat] = list
    })
    return result
  }, [])

  const activeEffectIds = useMemo(() => new Set(activeEffects.map(e => e.id)), [activeEffects])

  const handleApply = (effect) => {
    onApplyEffect?.({ ...effect, turnsRemaining: turns, appliedAt: Date.now() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Active effects */}
      {activeEffects.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Efeitos Ativos</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {activeEffects.map((eff, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem',
                }}
              >
                <Clock size={11} style={{ color: 'var(--color-warning)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{t(eff.name)}</span>
                {eff.turnsRemaining != null && (
                  <span style={{ color: 'var(--color-warning)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{eff.turnsRemaining}t</span>
                )}
                <button
                  onClick={() => onRemoveEffect?.(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0, display: 'flex' }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Object.keys(categorized).map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(cat)}
            style={activeCategory === cat ? {} : { borderColor: CAT_COLORS[cat], color: CAT_COLORS[cat] }}
          >
            {CAT_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Turn count selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Duração (turnos):</span>
        <input
          type="number"
          className="input"
          value={turns}
          onChange={e => setTurns(Math.max(1, parseInt(e.target.value) || 1))}
          min={1}
          max={99}
          style={{ width: 60, padding: '4px 8px', textAlign: 'center' }}
        />
      </div>

      {/* Effects list for active category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(categorized[activeCategory] || []).map(effect => {
          const alreadyActive = activeEffectIds.has(effect.id)
          const color = CAT_COLORS[activeCategory] || 'var(--accent-primary)'
          return (
            <div
              key={effect.id}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                padding: '8px 12px',
                background: alreadyActive ? `${color}10` : 'var(--bg-secondary)',
                border: `1px solid ${alreadyActive ? color : 'var(--border-subtle)'}`,
                borderRadius: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.83rem', color: alreadyActive ? color : 'var(--text-primary)' }}>
                  {t(effect.name)}
                </div>
                {effect.description && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                    {t(effect.description)}
                  </div>
                )}
                {effect.removalTest && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    Remoção: {effect.removalTest}
                  </div>
                )}
              </div>
              {onApplyEffect && (
                <button
                  className={`btn btn-sm ${alreadyActive ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => alreadyActive ? null : handleApply(effect)}
                  disabled={alreadyActive}
                  style={{ flexShrink: 0, fontSize: '0.72rem' }}
                >
                  {alreadyActive ? 'Ativo' : <><Plus size={10} /> Aplicar</>}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
