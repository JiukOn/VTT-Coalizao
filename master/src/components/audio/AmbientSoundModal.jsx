/* AmbientSoundModal.jsx — Master modal to manage and broadcast ambient soundscapes */
import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Radio, Sparkles, ShieldAlert, CloudRain, Trees, Castle, Beer, X } from 'lucide-react'
import { ambientSynth } from '@shared/utils/ambientSynth.js'

const THEMES = [
  { id: 'none',    name: 'Silêncio / Desativado', icon: VolumeX,       desc: 'Nenhum som de fundo',           color: '#71717A' },
  { id: 'dungeon', name: 'Masmorra Sombria',     icon: Castle,        desc: 'Ecos graves, goteiras e vento',  color: '#8B5CF6' },
  { id: 'forest',  name: 'Floresta Mística',     icon: Trees,         desc: 'Brisa suave e pássaros',        color: '#10B981' },
  { id: 'storm',   name: 'Tempestade & Trovões', icon: CloudRain,     desc: 'Chuva densa e relâmpagos',      color: '#3B82F6' },
  { id: 'tavern',  name: 'Taverna Medieval',     icon: Beer,          desc: 'Conversas e lareira quente',    color: '#F59E0B' },
  { id: 'battle',  name: 'Combate Intenso',      icon: ShieldAlert,   desc: 'Tambores de guerra e tensão',   color: '#EF4444' },
]

export default function AmbientSoundModal({ isOpen, onClose, onBroadcastTheme, currentTheme = 'none' }) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme)
  const [volume, setVolume] = useState(ambientSynth.getVolume())
  const [isMuted, setIsMuted] = useState(ambientSynth.isMuted())

  useEffect(() => {
    setSelectedTheme(currentTheme)
  }, [currentTheme])

  if (!isOpen) return null

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId)
    ambientSynth.play(themeId)
    if (onBroadcastTheme) {
      onBroadcastTheme(themeId, volume)
    }
  }

  const handleVolumeChange = (newVol) => {
    setVolume(newVol)
    ambientSynth.setVolume(newVol)
    if (onBroadcastTheme) {
      onBroadcastTheme(selectedTheme, newVol)
    }
  }

  const handleMuteToggle = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    ambientSynth.setMuted(nextMuted)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        width: '90%',
        maxWidth: 480,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Ambiência & Trilha Sonora</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Volume & Mute Controls */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '10px 14px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <button
            onClick={handleMuteToggle}
            style={{ background: 'none', border: 'none', color: isMuted ? '#EF4444' : 'var(--accent-primary)', cursor: 'pointer', display: 'flex' }}
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', minWidth: 32 }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Theme List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {THEMES.map(theme => {
            const Icon = theme.icon
            const isSelected = selectedTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${isSelected ? theme.color : 'var(--border-subtle)'}`,
                  background: isSelected ? `${theme.color}22` : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 10px ${theme.color}44` : 'none',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: `${theme.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: theme.color,
                  flexShrink: 0,
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? theme.color : 'var(--text-primary)' }}>
                    {theme.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {theme.desc}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <button className="btn btn-primary" onClick={onClose}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  )
}
