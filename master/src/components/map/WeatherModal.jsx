/* WeatherModal.jsx — Master modal to set ambient weather effects and particles on tactical maps */
import { useState } from 'react'
import { CloudRain, CloudSnow, Flame, CloudFog, Sun, Zap, X, Check } from 'lucide-react'

const WEATHER_PRESETS = [
  { id: 'none', label: 'Céu Limpo', icon: Sun, color: '#FBBF24', description: 'Sem efeitos climáticos ou partículas.' },
  { id: 'rain', label: 'Chuva Torrencial', icon: CloudRain, color: '#38BDF8', description: 'Gotas de chuva rápidas com vento lateral.' },
  { id: 'acid_rain', label: 'Tempestade Ácida', icon: Zap, color: '#A3E635', description: 'Chuva tóxica e corrosiva verde fluorescente.' },
  { id: 'snow', label: 'Nevasca / Gelo', icon: CloudSnow, color: '#E2E8F0', description: 'Flocos de neve flutuando e girando suavemente.' },
  { id: 'embers', label: 'Brasas Vulcânicas', icon: Flame, color: '#F97316', description: 'Fagulhas e fagulhas incandescentes subindo do chão.' },
  { id: 'fog', label: 'Névoa Espessa', icon: CloudFog, color: '#94A3B8', description: 'Nuvens volumétricas densas ocultando o horizonte.' },
]

export default function WeatherModal({ isOpen, onClose, currentWeather = 'none', onApplyWeather }) {
  const [selected, setSelected] = useState(currentWeather)

  if (!isOpen) return null

  const handleApply = () => {
    onApplyWeather?.(selected)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
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
        borderRadius: 12,
        width: '100%',
        maxWidth: 440,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#38BDF820', color: '#38BDF8', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudRain size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Clima & Partículas Animadas</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Efeitos visuais dinâmicos sobre o mapa</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Presets Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {WEATHER_PRESETS.map(preset => {
            const Icon = preset.icon
            const isSel = selected === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => setSelected(preset.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: isSel ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                  border: `1px solid ${isSel ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: `${preset.color}15`,
                  color: preset.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {preset.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {preset.description}
                  </div>
                </div>
                {isSel && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
              </button>
            )
          })}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleApply}>
            Aplicar Clima à Sessão
          </button>
        </div>
      </div>
    </div>
  )
}
