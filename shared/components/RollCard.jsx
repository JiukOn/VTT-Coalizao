/* RollCard.jsx — Rich visual card for dice rolls, attacks, and 1-click damage application */
import { useState } from 'react'
import { Dices, Swords, Sparkles, Skull, Check, Flame } from 'lucide-react'

const CLASSIFICATION_THEMES = {
  critical: {
    bg: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(251, 191, 36, 0.25) 100%)',
    border: '#FBBF24',
    badgeBg: '#FBBF24',
    badgeText: '#000',
    glow: '0 0 16px rgba(251, 191, 36, 0.4)',
    icon: Sparkles,
  },
  good: {
    bg: 'rgba(74, 222, 128, 0.12)',
    border: '#4ADE80',
    badgeBg: '#4ADE80',
    badgeText: '#000',
    glow: '0 0 8px rgba(74, 222, 128, 0.25)',
    icon: Check,
  },
  neutral: {
    bg: 'rgba(251, 191, 36, 0.08)',
    border: '#FBBF24',
    badgeBg: '#FBBF24',
    badgeText: '#000',
    glow: 'none',
    icon: Dices,
  },
  bad: {
    bg: 'rgba(248, 113, 113, 0.1)',
    border: '#F87171',
    badgeBg: '#F87171',
    badgeText: '#000',
    glow: 'none',
    icon: Swords,
  },
  disaster: {
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(0, 0, 0, 0.4) 100%)',
    border: '#EF4444',
    badgeBg: '#EF4444',
    badgeText: '#FFF',
    glow: '0 0 16px rgba(239, 68, 68, 0.4)',
    icon: Skull,
  },
}

export default function RollCard({
  rollerName = 'Jogador',
  avatar = null,
  diceType = '1d20',
  result = 0,
  raw = [],
  modifier = 0,
  classification = null,
  targetName = null,
  targetId = null,
  onApplyDamage = null,
  time = '',
  note = '',
}) {
  const [applied, setApplied] = useState(false)
  const classKey = classification?.type || 'neutral'
  const theme = CLASSIFICATION_THEMES[classKey] || CLASSIFICATION_THEMES.neutral
  const IconComp = theme.icon

  const handleDamageClick = () => {
    if (applied || !onApplyDamage) return
    onApplyDamage(targetId, result, targetName)
    setApplied(true)
  }

  return (
    <div style={{
      background: theme.bg,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      margin: '6px 0',
      boxShadow: theme.glow,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header: Roller info + Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#fff', fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {avatar ? <img src={avatar} alt={rollerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : rollerName[0].toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            {rollerName}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {diceType}
          </span>
        </div>
        {time && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {time}
          </span>
        )}
      </div>

      {/* Main Result Body */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        {/* Formula details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {raw.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Dado: <strong style={{ color: 'var(--text-primary)' }}>[{raw.join(', ')}]</strong>
              {modifier !== 0 && (
                <span> {modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}</span>
              )}
            </span>
          )}
          {note && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {note}
            </span>
          )}
        </div>

        {/* Large Total Result + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: theme.border,
            textShadow: `0 0 10px ${theme.border}55`,
          }}>
            {result}
          </div>

          {classification?.label && (
            <div style={{
              background: theme.badgeBg,
              color: theme.badgeText,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              <IconComp size={12} />
              {classification.label}
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Combat Action Button */}
      {targetName && onApplyDamage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 8,
          marginTop: 2,
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Alvo: <strong style={{ color: '#F87171' }}>{targetName}</strong>
          </span>
          <button
            onClick={handleDamageClick}
            disabled={applied}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: applied ? 'rgba(255,255,255,0.1)' : 'var(--color-danger, #EF4444)',
              color: applied ? 'var(--text-muted)' : '#FFF',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: applied ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Flame size={12} />
            {applied ? '✓ Dano Aplicado' : `Aplicar ${result} de Dano`}
          </button>
        </div>
      )}
    </div>
  )
}
