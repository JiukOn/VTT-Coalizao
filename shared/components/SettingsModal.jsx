/* SettingsModal.jsx — Central Settings & Preferences Modal for Master and Player */
import { useState } from 'react'
import {
  Settings, Moon, Sun, Globe, Volume2, VolumeX,
  Palette, Layout, X, RefreshCw
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { sfx } from '@shared/utils/sfxPlayer.js'

const ACCENT_PRESETS = [
  { id: 'amber',   name: 'Âmbar Dourado (Padrão)', color: '#F59E0B', light: '#D97706', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'cyan',    name: 'Ciano Arcano',          color: '#38BDF8', light: '#0284C7', glow: 'rgba(56, 189, 248, 0.4)' },
  { id: 'crimson', name: 'Carmesim de Sangue',     color: '#EF4444', light: '#DC2626', glow: 'rgba(239, 68, 68, 0.4)' },
  { id: 'emerald', name: 'Esmeralda Élfica',       color: '#10B981', light: '#059669', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'violet',  name: 'Violeta Astral',         color: '#A855F7', light: '#7C3AED', glow: 'rgba(168, 85, 247, 0.4)' },
]

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useLanguage()
  
  const [selectedAccent, setSelectedAccent] = useState(() => {
    return localStorage.getItem('vtt_accent_color') || 'amber'
  })
  const [volume, setVolume] = useState(() => {
    return Math.round((sfx.getVolume ? sfx.getVolume() : 0.8) * 100)
  })
  const [isMuted, setIsMuted] = useState(() => sfx.isMuted())
  const [hotbarVisible, setHotbarVisible] = useState(() => {
    return localStorage.getItem('vtt_hotbar_visible') !== 'false'
  })

  // Apply accent color to document root
  const applyAccent = (accentId) => {
    const preset = ACCENT_PRESETS.find(p => p.id === accentId) || ACCENT_PRESETS[0]
    setSelectedAccent(preset.id)
    localStorage.setItem('vtt_accent_color', preset.id)
    document.documentElement.style.setProperty('--accent-primary', preset.color)
    document.documentElement.style.setProperty('--accent-glow', preset.glow)
    document.documentElement.style.setProperty('--accent-subtle', `${preset.color}22`)
  }

  // Handle audio volume change
  const handleVolumeChange = (newVol) => {
    setVolume(newVol)
    if (sfx.setVolume) sfx.setVolume(newVol / 100)
    if (newVol > 0 && isMuted) {
      setIsMuted(false)
      sfx.setMuted(false)
    }
  }

  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    sfx.setMuted(next)
    if (!next && sfx.play) sfx.play('notification')
  }

  const handleToggleHotbar = () => {
    const next = !hotbarVisible
    setHotbarVisible(next)
    localStorage.setItem('vtt_hotbar_visible', String(next))
    window.dispatchEvent(new CustomEvent('vtt:hotbar_toggle', { detail: next }))
  }

  const handleResetHotbarPos = () => {
    localStorage.removeItem('vtt_hotbar_pos')
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Settings size={20} color="var(--accent-primary)" />
            <span>Configurações Gerais</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 1: Appearance & Theme */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={15} color="var(--accent-primary)" /> Tema Visual & Aparência
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <button
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { if (theme !== 'dark') toggleTheme() }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
              >
                <Moon size={16} /> Modo Escuro (LitRPG)
              </button>
              <button
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { if (theme !== 'light') toggleTheme() }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
              >
                <Sun size={16} /> Modo Claro (Pergaminho)
              </button>
            </div>
          </div>

          {/* Section 2: Accent Color Palette */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              🎨 Cor de Destaque do HUD:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {ACCENT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyAccent(preset.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: selectedAccent === preset.id ? `2px solid ${preset.color}` : '1px solid var(--border-subtle)',
                    background: selectedAccent === preset.id ? `${preset.color}22` : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: preset.color, boxShadow: `0 0 8px ${preset.glow}` }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>
                    {preset.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Language & Localization */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={15} color="var(--accent-primary)" /> Idioma do Sistema
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <button
                className={`btn ${locale === 'pt-br' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLocale('pt-br')}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                🇧🇷 Português (Brasil)
              </button>
              <button
                className={`btn ${locale === 'en-us' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLocale('en-us')}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                🇺🇸 English (US)
              </button>
            </div>
          </div>

          {/* Section 4: Audio & Sound Effects */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Volume2 size={15} color="var(--accent-primary)" /> Áudio & Efeitos Sonoros (SFX)
            </h4>
            <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>Volume Geral: {volume}%</span>
                <button
                  className={`btn btn-sm ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={handleToggleMute}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {isMuted ? <><VolumeX size={13} /> Mudo</> : <><Volume2 size={13} /> Ativo</>}
                </button>
              </div>
              <input
                type="range"
                min={0} max={100}
                value={volume}
                onChange={e => handleVolumeChange(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>

          {/* Section 5: HUD & Interface Preferences */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layout size={15} color="var(--accent-primary)" /> Barra de Atalhos (Hotbar) & HUD
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Barra de Ações Rápidas (1-9)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exibe a barra flutuante de macros na tela</div>
                </div>
                <button
                  className={`btn btn-sm ${hotbarVisible ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleToggleHotbar}
                >
                  {hotbarVisible ? 'Visível' : 'Oculta'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Posição da Barra na Tela</span>
                <button className="btn btn-ghost btn-sm" onClick={handleResetHotbarPos} style={{ fontSize: '0.72rem' }}>
                  <RefreshCw size={11} /> Redefinir Posição
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-tertiary)',
        }}>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: 100 }}>
            Concluído
          </button>
        </div>

      </div>
    </div>
  )
}
