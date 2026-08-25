/* SkillCastModal.jsx — Interactive skill casting modal for Coalizão RPG abilities */
import { useState } from 'react'
import { Sparkles, Zap, Flame, Send, X, Shield, Clock } from 'lucide-react'
import { COALIZAO_SKILLS, castCoalizaoSkill } from '@shared/utils/coalizaoSkills.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function SkillCastModal({
  isOpen,
  onClose,
  playerEntity,
  onUpdatePlayer,
  addLog,
  wsSend,
}) {
  const [selectedSkillKey, setSelectedSkillKey] = useState('energy_blade')

  if (!isOpen || !playerEntity) return null

  const currentEnr = playerEntity.enr ?? 0
  const skill = COALIZAO_SKILLS[selectedSkillKey] || COALIZAO_SKILLS.energy_blade

  const handleCast = () => {
    sfx.init()
    const res = castCoalizaoSkill(playerEntity, selectedSkillKey)

    if (res.success) {
      sfx.play('turn_alert')
      onUpdatePlayer?.(res.updatedPlayer)
      addLog?.(res.message)
      if (wsSend) {
        wsSend('token_move', {
          data: {
            id: playerEntity.tableId || playerEntity.id,
            changes: {
              enr: res.updatedPlayer.enr,
              effects: res.updatedPlayer.effects,
            },
          },
        })
        wsSend('chat_message', { text: res.message, timestamp: new Date().toISOString() })
      }
      onClose()
    } else {
      sfx.play('combat_miss')
      addLog?.(res.message)
    }
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
        gap: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#A855F7',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Habilidades & Técnicas da Coalizão
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Energia disponível: <b style={{ color: '#A855F7' }}>{currentEnr} ENR</b>
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Skill Preview */}
        <div style={{
          background: 'var(--bg-primary)',
          borderLeft: '4px solid #A855F7',
          borderTop: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: '0 8px 8px 0',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>{skill.icon}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {skill.name}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#A855F7',
                background: 'rgba(168, 85, 247, 0.15)',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                ⚡ Custo: {skill.enrCost} ENR
              </span>
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                ⏱️ {skill.turnsDuration}t
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
            {skill.desc}
          </p>
        </div>

        {/* Skill Selector List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {Object.entries(COALIZAO_SKILLS).map(([k, s]) => (
            <button
              key={k}
              onClick={() => setSelectedSkillKey(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 6,
                border: selectedSkillKey === k ? '1px solid #A855F7' : '1px solid var(--border-subtle)',
                background: selectedSkillKey === k ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{s.icon}</span>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: currentEnr >= s.enrCost ? '#A855F7' : '#EF4444', fontWeight: 700 }}>
                {s.enrCost} ENR
              </span>
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleCast}
            disabled={currentEnr < skill.enrCost}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#A855F7', borderColor: '#A855F7' }}
          >
            <Zap size={14} /> Conjurar Habilidade (-{skill.enrCost} ENR)
          </button>
        </div>
      </div>
    </div>
  )
}
