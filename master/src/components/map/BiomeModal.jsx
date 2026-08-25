/* BiomeModal.jsx — Master modal for selecting canonical Coalizão biomes and environmental climates */
import { useState } from 'react'
import { Trees, Send, X } from 'lucide-react'
import { COALIZAO_BIOMES } from '@shared/utils/coalizaoBiomes.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function BiomeModal({
  isOpen,
  onClose,
  onSelectBiome,
}) {
  const [selectedBiomeKey, setSelectedBiomeKey] = useState('ash_forest')

  if (!isOpen) return null

  const biome = COALIZAO_BIOMES[selectedBiomeKey] || COALIZAO_BIOMES.ash_forest

  const handleApply = () => {
    sfx.init()
    sfx.play('turn_alert')
    const chatMsg = `🌲 **BIOMA DA CENA DEFINIDO**: ${biome.icon} **${biome.name}**\n*Efeitos Ambientais:* ${biome.desc}`
    onSelectBiome?.(biome, chatMsg)
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
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trees size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Biomas & Climas da Coalizão
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Defina o ambiente e condições climáticas do mapa atual
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Biome Preview */}
        <div style={{
          background: 'var(--bg-primary)',
          borderLeft: `4px solid ${biome.color}`,
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
              <span style={{ fontSize: '1.4rem' }}>{biome.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {biome.name}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: biome.color,
              background: `${biome.color}20`,
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              Clima: {biome.weather}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {biome.desc}
          </p>
        </div>

        {/* Biomes Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {Object.entries(COALIZAO_BIOMES).map(([k, b]) => (
            <button
              key={k}
              onClick={() => setSelectedBiomeKey(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 6,
                border: selectedBiomeKey === k ? `1px solid ${b.color}` : '1px solid var(--border-subtle)',
                background: selectedBiomeKey === k ? `${b.color}15` : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600 }}>{b.name}</div>
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
            <Send size={14} /> Aplicar Bioma na Cena
          </button>
        </div>
      </div>
    </div>
  )
}
