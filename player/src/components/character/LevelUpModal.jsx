/* LevelUpModal.jsx — Step-by-step interactive wizard for hero character progression */
import { useState } from 'react'
import { Sparkles, Heart, Zap, Plus, Minus, ArrowRight, Check, X, Shield, Award } from 'lucide-react'
import { ATTRIBUTES, getBonus } from '../../utils/characterUtils.js'
import { calculateMaxHpOnLevelUp, calculateMaxEnrOnLevelUp, applyLevelUp } from '@shared/utils/levelProgression.js'

export default function LevelUpModal({
  isOpen,
  onClose,
  entity,
  onApply,
}) {
  const [pointsAvailable, setPointsAvailable] = useState(1)
  const [allocatedPoints, setAllocatedPoints] = useState({})

  if (!isOpen || !entity) return null

  const currentLevel = entity.level || 1
  const nextLevel = currentLevel + 1

  const currentAttrs = entity.attributes || {}
  const previewAttrs = { ...currentAttrs }
  for (const [k, v] of Object.entries(allocatedPoints)) {
    previewAttrs[k] = (previewAttrs[k] || 0) + v
  }

  const curMaxHp = entity.maxHp ?? entity.vitMax ?? 20
  const nextMaxHp = calculateMaxHpOnLevelUp(curMaxHp, previewAttrs.vit ?? 2)

  const curMaxEnr = entity.maxEnr ?? 20
  const nextMaxEnr = calculateMaxEnrOnLevelUp(curMaxEnr, previewAttrs.enr ?? 2)

  const handleAddPoint = (attrKey) => {
    if (pointsAvailable <= 0) return
    setPointsAvailable(p => p - 1)
    setAllocatedPoints(prev => ({
      ...prev,
      [attrKey]: (prev[attrKey] || 0) + 1,
    }))
  }

  const handleRemovePoint = (attrKey) => {
    if (!allocatedPoints[attrKey] || allocatedPoints[attrKey] <= 0) return
    setPointsAvailable(p => p + 1)
    setAllocatedPoints(prev => {
      const next = { ...prev }
      if (next[attrKey] <= 1) delete next[attrKey]
      else next[attrKey] -= 1
      return next
    })
  }

  const handleFinish = () => {
    const updated = applyLevelUp(entity, {
      attributeIncreases: allocatedPoints,
    })
    onApply?.(updated)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        width: '100%',
        maxWidth: 480,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header with Level Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff',
              width: 38,
              height: 38,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
            }}>
              <Award size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Evolução de Nível! <Sparkles size={16} style={{ color: '#F59E0B' }} />
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Nível {currentLevel} ➔ Nível {nextLevel}
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Resources Preview (HP and ENR Gain) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Heart size={20} style={{ color: '#EF4444' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vida Máxima</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EF4444' }}>
                {curMaxHp} ➔ {nextMaxHp} <span style={{ fontSize: '0.75rem', color: '#10B981' }}>(+{nextMaxHp - curMaxHp})</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Zap size={20} style={{ color: '#3B82F6' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Energia Máxima</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6' }}>
                {curMaxEnr} ➔ {nextMaxEnr} <span style={{ fontSize: '0.75rem', color: '#10B981' }}>(+{nextMaxEnr - curMaxEnr})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attribute Points Distribution */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Distribuir Pontos de Atributo:
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              background: pointsAvailable > 0 ? '#10B98120' : 'rgba(255,255,255,0.08)',
              color: pointsAvailable > 0 ? '#10B981' : 'var(--text-muted)',
              border: `1px solid ${pointsAvailable > 0 ? '#10B98144' : 'transparent'}`,
            }}>
              {pointsAvailable} ponto{pointsAvailable !== 1 ? 's' : ''} restante{pointsAvailable !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {ATTRIBUTES.map(attr => {
              const val = previewAttrs[attr.key] ?? 0
              const bonus = getBonus(val)
              const added = allocatedPoints[attr.key] || 0

              return (
                <div
                  key={attr.key}
                  style={{
                    background: added > 0 ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: `1px solid ${added > 0 ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {attr.abbr}
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {val}
                    <span style={{ fontSize: '0.7rem', color: bonus >= 0 ? '#10B981' : '#EF4444', marginLeft: 3 }}>
                      ({bonus >= 0 ? `+${bonus}` : bonus})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-icon btn-xs btn-ghost"
                      onClick={() => handleRemovePoint(attr.key)}
                      disabled={added === 0}
                      style={{ width: 20, height: 20 }}
                    >
                      <Minus size={10} />
                    </button>
                    <button
                      className="btn btn-icon btn-xs btn-primary"
                      onClick={() => handleAddPoint(attr.key)}
                      disabled={pointsAvailable === 0}
                      style={{ width: 20, height: 20 }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleFinish}
            disabled={pointsAvailable > 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={14} /> Concluir Evolução
          </button>
        </div>
      </div>
    </div>
  )
}
