/* PlayerHandoutOverlay.jsx — Fullscreen cinematic handout viewer for players */
import { X, Sparkles } from 'lucide-react'

export default function PlayerHandoutOverlay({ handout, onClose }) {
  if (!handout) return null

  const isLetter = handout.type === 'letter' || !handout.type
  const isClue = handout.type === 'clue'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <style>{`
        @keyframes handoutPop {
          0% { transform: scale(0.85) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: isLetter ? '#281E16' : isClue ? '#18181B' : '#1E293B',
        border: `3px solid ${isLetter ? '#8B5A2B' : isClue ? '#7C3AED' : '#475569'}`,
        borderRadius: 12,
        width: '100%',
        maxWidth: 640,
        maxHeight: '90vh',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.7)',
        animation: 'handoutPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isLetter ? '#5C3C1E' : 'rgba(255,255,255,0.15)'}`,
          paddingBottom: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Sparkles size={13} />
              <span>Documento Revelado pelo Mestre</span>
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '1.6rem',
              fontFamily: isLetter ? 'serif' : 'var(--font-heading)',
              color: isLetter ? '#F2DEBA' : '#FFF',
              textShadow: isLetter ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
            }}>
              {handout.title}
            </h2>
            {handout.author && (
              <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: isLetter ? '#B8A484' : 'var(--text-muted)' }}>
                Por: {handout.author}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Image Attachment */}
        {handout.image && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={handout.image}
              alt={handout.title}
              style={{
                maxWidth: '100%',
                maxHeight: 280,
                borderRadius: 8,
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        )}

        {/* Text Content */}
        <div style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          fontFamily: isLetter ? 'serif' : isClue ? 'monospace' : 'var(--font-body)',
          color: isLetter ? '#E5D6BD' : 'var(--text-secondary)',
          padding: '8px 0',
        }}>
          {handout.content}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <button className="btn btn-primary" onClick={onClose}>
            Fechar Documento
          </button>
        </div>
      </div>
    </div>
  )
}
