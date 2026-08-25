/* AuraEmitterModal.jsx — Master modal for activating and managing canonical Coalizão tactical auras */
import { useState } from 'react'
import { Sparkles, Radio, Send, X, Shield, Zap, Eye, Flame } from 'lucide-react'
import { COALIZAO_AURAS } from '@shared/utils/coalizaoAuras.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function AuraEmitterModal({
  isOpen,
  onClose,
  onBroadcastAura,
}) {
  const [activeAuraKey, setActiveAuraKey] = useState('harmony')

  if (!isOpen) return null

  const aura = COALIZAO_AURAS[activeAuraKey] || COALIZAO_AURAS.harmony

  const handleBroadcast = () => {
    sfx.init()
    sfx.play('turn_alert')
    const chatMsg = `🌟 **AURA DA COALIZÃO ATIVA**: ${aura.icon} **${aura.name}** (Raio: ${aura.radiusMeters}m)\n*Efeito:* ${aura.desc}`
    onBroadcastAura?.(chatMsg)
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
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Auras Táticas da Coalizão
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Campos de ressonância e influência de área no combate
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Aura Card */}
        <div style={{
          background: 'var(--bg-primary)',
          borderLeft: `4px solid ${aura.color}`,
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
              <span style={{ fontSize: '1.4rem' }}>{aura.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {aura.name}
              </span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: aura.color,
              background: `${aura.color}20`,
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              Alcance: {aura.radiusMeters}m
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {aura.desc}
          </p>
        </div>

        {/* Aura Grid Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {Object.entries(COALIZAO_AURAS).map(([k, a]) => (
            <button
              key={k}
              onClick={() => setActiveAuraKey(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 6,
                border: activeAuraKey === k ? `1px solid ${a.color}` : '1px solid var(--border-subtle)',
                background: activeAuraKey === k ? `${a.color}15` : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{a.icon}</span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
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
            onClick={handleBroadcast}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} /> Ativar & Anunciar na Mesa
          </button>
        </div>
      </div>
    </div>
  )
}
