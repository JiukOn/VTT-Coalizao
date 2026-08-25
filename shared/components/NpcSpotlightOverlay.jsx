/* NpcSpotlightOverlay.jsx — Cinematic visual novel style dialogue overlay for Master & Players */
import { useEffect, useState } from 'react'
import { X, MessageSquareQuote } from 'lucide-react'

export default function NpcSpotlightOverlay({ dialogue, onDismiss }) {
  const [dismissedKey, setDismissedKey] = useState(null)

  useEffect(() => {
    if (dialogue) {
      const timer = setTimeout(() => {
        onDismiss?.()
      }, 10000) // Auto dismiss after 10s
      return () => clearTimeout(timer)
    }
  }, [dialogue, onDismiss])

  const key = dialogue ? `${dialogue.speakerName}_${dialogue.text}` : ''
  if (!dialogue || (key && dismissedKey === key)) return null

  const emotionGlow = {
    neutral: '#3B82F6',
    friendly: '#10B981',
    angry: '#EF4444',
    mysterious: '#A855F7',
  }[dialogue.emotion || 'neutral'] || '#3B82F6'

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: 680,
      zIndex: 99999,
      pointerEvents: 'auto',
      animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    }}>
      <div style={{
        background: 'rgba(18, 18, 26, 0.95)',
        border: `1.5px solid ${emotionGlow}`,
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px ${emotionGlow}44`,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={() => { setDismissedKey(key); onDismiss?.() }}
          title="Fechar"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>

        {/* Large Portrait / Avatar */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `2.5px solid ${emotionGlow}`,
          boxShadow: `0 0 12px ${emotionGlow}66`,
          backgroundColor: '#1E1E2D',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 26,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {dialogue.speakerAvatar ? (
            <img src={dialogue.speakerAvatar} alt={dialogue.speakerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            dialogue.speakerName?.[0] || '?'
          )}
        </div>

        {/* Dialogue Text Area */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: emotionGlow }}>
              {dialogue.speakerName}
            </span>
            {dialogue.speakerRole && (
              <span style={{
                fontSize: '0.72rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 8px',
                borderRadius: 10,
                color: 'var(--text-muted)',
              }}>
                {dialogue.speakerRole}
              </span>
            )}
          </div>

          <div style={{
            fontSize: '0.95rem',
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
          }}>
            <MessageSquareQuote size={18} style={{ color: emotionGlow, flexShrink: 0, marginTop: 2 }} />
            <span>"{dialogue.text}"</span>
          </div>
        </div>
      </div>
    </div>
  )
}
