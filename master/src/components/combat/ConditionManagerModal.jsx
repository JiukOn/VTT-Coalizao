/* ConditionManagerModal.jsx — Master modal for applying and managing canonical Coalizão conditions & diseases */
import { useState } from 'react'
import { ShieldAlert, Send, X } from 'lucide-react'
import { COALIZAO_CONDITIONS, resolveConditionTick } from '@shared/utils/coalizaoConditions.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function ConditionManagerModal({
  isOpen,
  onClose,
  onBroadcastCondition,
}) {
  const [selectedCondKey, setSelectedCondKey] = useState('sangralisia')

  if (!isOpen) return null

  const cond = COALIZAO_CONDITIONS[selectedCondKey] || COALIZAO_CONDITIONS.sangralisia

  const handleApply = () => {
    sfx.init()
    sfx.play('turn_alert')
    const testResult = resolveConditionTick(selectedCondKey, {})
    const extraInfo = testResult.message ? `\n*Verificação:* ${testResult.message}` : ''
    const chatMsg = `🩸 **CONDIÇÃO OFICIAL DA COALIZÃO APLICADA**: ${cond.icon} **${cond.name}** [${cond.category.toUpperCase()}]\n*Efeito:* ${cond.desc}${extraInfo}`
    onBroadcastCondition?.(chatMsg)
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
        maxWidth: 520,
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
              background: 'rgba(220, 38, 38, 0.15)',
              color: '#DC2626',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Condições & Doenças Canônicas
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Gerencie estados especiais e maldições da Coalizão
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Condition Preview */}
        <div style={{
          background: 'var(--bg-primary)',
          borderLeft: `4px solid ${cond.color}`,
          borderTop: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: '0 8px 8px 0',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>{cond.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cond.name}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: cond.color,
              background: `${cond.color}20`,
              padding: '2px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}>
              {cond.category}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {cond.desc}
          </p>
        </div>

        {/* Conditions Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {Object.entries(COALIZAO_CONDITIONS).map(([k, c]) => (
            <button
              key={k}
              onClick={() => setSelectedCondKey(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 6,
                border: selectedCondKey === k ? `1px solid ${c.color}` : '1px solid var(--border-subtle)',
                background: selectedCondKey === k ? `${c.color}15` : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} /> Aplicar & Anunciar na Mesa
          </button>
        </div>
      </div>
    </div>
  )
}
