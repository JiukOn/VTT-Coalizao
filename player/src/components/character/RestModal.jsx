/* RestModal.jsx — Interactive modal for short and long rest recovery */
import { useState } from 'react'
import { Moon, Sun, Heart, Zap, Sparkles, Check, X, Shield, Clock } from 'lucide-react'
import { calculateShortRest, calculateLongRest } from '@shared/utils/restUtils.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function RestModal({
  isOpen,
  onClose,
  entity,
  onApplyRest,
}) {
  const [restType, setRestType] = useState('short') // 'short' | 'long'

  if (!isOpen || !entity) return null

  const isShort = restType === 'short'
  const preview = isShort ? calculateShortRest(entity) : calculateLongRest(entity)

  const handleConfirm = () => {
    sfx.init()
    sfx.play('turn_alert')
    onApplyRest?.(preview.updatedEntity, restType, preview)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
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
        borderRadius: 14,
        width: '100%',
        maxWidth: 460,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: isShort ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
              color: isShort ? '#3B82F6' : '#A855F7',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isShort ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Descanso & Recuperação
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Restaure HP, Energia e cure condições
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Rest Type Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => setRestType('short')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 8px',
              borderRadius: 8,
              border: `1px solid ${isShort ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              background: isShort ? 'var(--accent-subtle)' : 'var(--bg-primary)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isShort ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
              ☀️ Descanso Curto
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              1 hora de pausa
            </span>
          </button>

          <button
            onClick={() => setRestType('long')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 8px',
              borderRadius: 8,
              border: `1px solid ${!isShort ? '#A855F7' : 'var(--border-subtle)'}`,
              background: !isShort ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-primary)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: !isShort ? '#A855F7' : 'var(--text-primary)' }}>
              🌙 Descanso Longo
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              8 horas / pernoite
            </span>
          </button>
        </div>

        {/* Recovery Preview Cards */}
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vida (HP)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EF4444' }}>
                {entity.hp ?? 0} ➔ {preview.updatedEntity.hp} <span style={{ fontSize: '0.72rem', color: '#10B981' }}>(+{preview.hpGained})</span>
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Energia (ENR)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6' }}>
                {entity.enr ?? 0} ➔ {preview.updatedEntity.enr} <span style={{ fontSize: '0.72rem', color: '#10B981' }}>(+{preview.enrGained})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Long rest bonus info */}
        {!isShort && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Sparkles size={16} />
            <span>Recupera <strong>+1 Ponto Heroico</strong> e remove todas as condições de fadiga!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConfirm}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={14} /> Confirmar Descanso
          </button>
        </div>
      </div>
    </div>
  )
}
