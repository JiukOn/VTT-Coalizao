/* VoiceStatusBar.jsx — Integrated P2P voice chat toolbar and speaking indicator */
import { useState } from 'react'
import { Mic, MicOff, Headphones, VolumeX, Radio, Users } from 'lucide-react'

export default function VoiceStatusBar({
  activeUsers = [],
  isSpeaking = false,
  onToggleMute,
  onToggleDeafen,
}) {
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  const handleMuteClick = () => {
    const next = !isMuted
    setIsMuted(next)
    onToggleMute?.(next)
  }

  const handleDeafenClick = () => {
    const next = !isDeafened
    setIsDeafened(next)
    onToggleDeafen?.(next)
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: '0.75rem',
      color: 'var(--text-primary)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      position: 'relative',
    }}>
      {/* Speaking Indicator Beacon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isSpeaking ? '#10B981' : (isMuted ? '#EF4444' : '#64748B'),
          boxShadow: isSpeaking ? '0 0 8px #10B981' : 'none',
          transition: 'all 0.2s ease',
        }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isSpeaking ? '#10B981' : 'var(--text-muted)' }}>
          {isSpeaking ? 'Falando' : (isMuted ? 'Mudo' : 'Voz')}
        </span>
      </div>

      <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 2px' }} />

      {/* Mic Toggle Button */}
      <button
        onClick={handleMuteClick}
        style={{
          background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
          border: 'none',
          color: isMuted ? '#EF4444' : 'var(--text-primary)',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={isMuted ? 'Ativar Microfone' : 'Mutar Microfone'}
      >
        {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
      </button>

      {/* Deafen Toggle Button */}
      <button
        onClick={handleDeafenClick}
        style={{
          background: isDeafened ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
          border: 'none',
          color: isDeafened ? '#EF4444' : 'var(--text-primary)',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={isDeafened ? 'Ativar Áudio da Chamada' : 'Desativar Áudio da Chamada'}
      >
        {isDeafened ? <VolumeX size={13} /> : <Headphones size={13} />}
      </button>

      {/* Active Users in Voice Call */}
      {activeUsers.length > 0 && (
        <>
          <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 2px' }} />
          <button
            onClick={() => setShowUsers(!showUsers)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 4px',
            }}
            title="Participantes na chamada"
          >
            <Users size={12} />
            <span>{activeUsers.length}</span>
          </button>
        </>
      )}

      {/* Users Popover */}
      {showUsers && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 8,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: 8,
          minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 9999,
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Na Chamada de Voz
          </span>
          {activeUsers.map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <Radio size={11} style={{ color: u.isSpeaking ? '#10B981' : 'var(--text-muted)' }} />
              <span style={{ color: u.isSpeaking ? '#10B981' : 'var(--text-primary)', fontWeight: u.isSpeaking ? 700 : 400 }}>
                {u.name || u}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
