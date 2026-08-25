/* InjuryModal.jsx — Master modal for lingering injuries and combat trauma table */
import { useState } from 'react'
import { Activity, Dice5, Send, X, AlertTriangle, ShieldAlert } from 'lucide-react'
import { LINGERING_INJURIES, rollLingeringInjury } from '@shared/utils/lingeringInjuries.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function InjuryModal({
  isOpen,
  onClose,
  onApplyInjury,
}) {
  const [selectedInjury, setSelectedInjury] = useState(() => rollLingeringInjury())

  if (!isOpen) return null

  const handleRoll = () => {
    sfx.init()
    sfx.play('dice_roll')
    setSelectedInjury(rollLingeringInjury())
  }

  const handleBroadcast = () => {
    sfx.init()
    sfx.play('combat_hit')
    const chatMsg = `🩸 **SEQUELA DE COMBATE APLICADA**: ${selectedInjury.icon} **${selectedInjury.name}**\n*Efeito:* ${selectedInjury.effect}`
    onApplyInjury?.(chatMsg)
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
        maxWidth: 500,
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
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Sequelas & Ferimentos Persistentes
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Traumas de combate para 0 HP ou dano massivo
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Injury Card */}
        <div style={{
          background: 'var(--bg-primary)',
          borderLeft: '4px solid #EF4444',
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
              <span style={{ fontSize: '1.4rem' }}>{selectedInjury.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedInjury.name}
              </span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              Severidade: {selectedInjury.severity}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {selectedInjury.effect}
          </p>
        </div>

        {/* Quick Picker List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
          {LINGERING_INJURIES.map(inj => (
            <button
              key={inj.id}
              onClick={() => setSelectedInjury(inj)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 6,
                border: selectedInjury.id === inj.id ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
                background: selectedInjury.id === inj.id ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{inj.icon}</span>
                <span>{inj.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inj.severity}</span>
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRoll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Dice5 size={14} /> Sortear Sequela (d20)
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleBroadcast}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EF4444', borderColor: '#EF4444' }}
          >
            <Send size={14} /> Aplicar no Chat
          </button>
        </div>
      </div>
    </div>
  )
}
