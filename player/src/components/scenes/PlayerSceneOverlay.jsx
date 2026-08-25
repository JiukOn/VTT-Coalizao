/* PlayerSceneOverlay.jsx — Fullscreen cinematic scene / theater of the mind viewer for players */
import { X, Sparkles } from 'lucide-react'

export default function PlayerSceneOverlay({ scene, onClose }) {
  if (!scene) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.94)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 99999,
      padding: '24px 32px',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Top Bar with Title and Close */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={20} style={{ color: '#38BDF8' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              {scene.title}
            </h2>
            {scene.subtitle && (
              <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
                {scene.subtitle}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          title="Fechar Cenário"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Image Container */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
        position: 'relative',
      }}>
        <img
          src={scene.imageUrl}
          alt={scene.title}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '65vh',
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Bottom Narration Box */}
      {scene.description && (
        <div style={{
          width: '100%',
          maxWidth: 900,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 10,
          padding: '14px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.98rem',
            lineHeight: 1.6,
            color: '#E2E8F0',
            fontStyle: 'italic',
            letterSpacing: '0.01em',
          }}>
            &ldquo;{scene.description}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
