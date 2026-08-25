/* FumbleModal.jsx — Master modal for drawing dramatic fumble complications on Natural 1 */
import { useState } from 'react'
import { AlertTriangle, Shuffle, Send, X, ShieldAlert, Sparkles, Skull } from 'lucide-react'
import { drawRandomFumble, FUMBLE_COMPLICATIONS } from '@shared/utils/fumbleTables.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function FumbleModal({
  isOpen,
  onClose,
  fumbledEntity,
  onBroadcastFumble,
}) {
  const [currentFumble, setCurrentFumble] = useState(() => drawRandomFumble('all'))

  if (!isOpen) return null

  const handleShuffle = () => {
    sfx.init()
    sfx.play('dice_roll')
    setCurrentFumble(drawRandomFumble('all'))
  }

  const handleBroadcast = () => {
    sfx.init()
    sfx.play('turn_alert')
    const targetName = fumbledEntity?.name || 'O combatente'
    const chatMsg = `💀 **FALHA CRÍTICA (Nat 1) — ${targetName}**: **${currentFumble.title}**!\n> *${currentFumble.desc}*`
    onBroadcastFumble?.(chatMsg)
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
        maxWidth: 480,
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
              <Skull size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Complicação de Falha Crítica
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Incidente dramático para rolagens de 1 Natural
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Fumble Card */}
        {currentFumble && (
          <div style={{
            background: 'var(--bg-primary)',
            border: `1px solid ${currentFumble.color}44`,
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: currentFumble.color }}>
                {currentFumble.title}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 6,
                background: `${currentFumble.color}20`,
                color: currentFumble.color,
                border: `1px solid ${currentFumble.color}44`,
              }}>
                Gravidade: {currentFumble.severity}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {currentFumble.desc}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleShuffle}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shuffle size={14} /> Sortear Outra
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleBroadcast}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DC2626', border: 'none' }}
          >
            <Send size={14} /> Aplicar no Chat
          </button>
        </div>
      </div>
    </div>
  )
}
