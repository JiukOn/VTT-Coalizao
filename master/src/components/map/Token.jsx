/* Token.jsx — Entity token on the tactical map */

const FACTION_COLORS = {
  hero:       'var(--color-success)',
  character:  'var(--color-success)',
  ally:       'var(--color-success)',
  npc:        'var(--color-warning)',
  creature:   'var(--color-danger)',
  enemy:      'var(--color-danger)',
}

const FACTION_COLORS_HEX = {
  hero:      '#4ADE80',
  character: '#4ADE80',
  ally:      '#4ADE80',
  npc:       '#FBBF24',
  creature:  '#F87171',
  enemy:     '#F87171',
}

const SIZE_MULTIPLIERS = {
  pequeno:  0.75,
  medio:    1,
  grande:   1.5,
  colossal: 2,
}

import { useState, useEffect, useRef } from 'react'
import { CONDITIONS, CONDITION_ICONS } from '../../utils/conditionUtils.js'
import { getEntityName, getEntityInitials } from '@shared/utils/entityFormatting.js'

export default function Token({
  entity,
  gridSize = 50,
  isActive = false,
  isSelected = false,
  position,
  onMouseDown,
  onClick,
  onDoubleClick,
  onContextMenu,
  showVision = false,   // true when fog is enabled and token has visionRadius
}) {
  const factionKey = entity.entityType || (entity.type === 'terrestre' || entity.type === 'aquatico' || entity.type === 'voador' ? 'creature' : 'npc')
  const factionColor = FACTION_COLORS[factionKey] || 'var(--accent-primary)'
  const factionHex = FACTION_COLORS_HEX[factionKey] || '#9B59E8'

  const sizeKey = (entity.size || 'medio').toLowerCase()
  const mult = SIZE_MULTIPLIERS[sizeKey] ?? 1
  const tokenSize = Math.round(gridSize * mult)
  const fontSize = Math.round(tokenSize * 0.38)

  const hp = entity.hp ?? null
  const maxHp = entity.maxHp ?? entity.vitMax ?? hp
  const hpPercent = (hp != null && maxHp != null && maxHp > 0) ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : null
  const hpColor = hpPercent === null ? null
    : hpPercent > 60 ? '#4ADE80'
    : hpPercent > 30 ? '#FBBF24'
    : '#F87171'

  // ── Floating Damage / Heal Tracking ─────────────────────────────────────────
  const prevHpRef = useRef(hp)
  const [floatingDiff, setFloatingDiff] = useState(null)

  useEffect(() => {
    if (prevHpRef.current != null && hp != null && prevHpRef.current !== hp) {
      const diff = hp - prevHpRef.current
      const isHeal = diff > 0
      const text = isHeal ? `+${diff}` : `${diff}`
      const color = isHeal ? '#4ADE80' : '#EF4444'
      const id = Date.now()
      queueMicrotask(() => setFloatingDiff({ text, color, id }))
      const timer = setTimeout(() => setFloatingDiff(null), 1800)
      prevHpRef.current = hp
      return () => clearTimeout(timer)
    }
    prevHpRef.current = hp
  }, [hp])

  const activeEffects = entity.effects || []
  const activeConditions = entity.conditions || []
  const hasAura = entity.auraActive

  // Vision circle radius in pixels
  const visionRadius = entity.visionRadius   // in grid squares (optional)
  const visionPx = visionRadius ? visionRadius * gridSize : null

  const borderColor = isSelected ? '#9B59E8' : factionHex
  const borderWidth = isSelected ? 3 : 2
  const glowColor = isSelected ? 'rgba(155,89,232,0.6)' : `${factionHex}44`

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: tokenSize,
        height: tokenSize,
        transform: 'translate(-50%, -50%)',
        zIndex: isActive ? 100 : isSelected ? 50 : 10,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Vision circle — shown when fog is active and token has visionRadius */}
      {showVision && visionPx !== null && (
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width:  visionPx * 2,
          height: visionPx * 2,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1px dashed ${factionHex}99`,
          background: `radial-gradient(circle, ${factionHex}08 0%, ${factionHex}03 60%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: -1,
        }} />
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse-ring {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
          @keyframes floatUpFade {
            0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
            20% { transform: translate(-50%, -10px) scale(1.25); opacity: 1; }
            80% { transform: translate(-50%, -26px) scale(1); opacity: 0.95; }
            100% { transform: translate(-50%, -36px) scale(0.9); opacity: 0; }
          }
        `}
      </style>

      {/* Floating Damage / Heal Indicator */}
      {floatingDiff && (
        <div
          key={floatingDiff.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: -20,
            transform: 'translateX(-50%)',
            color: floatingDiff.color,
            fontWeight: 800,
            fontSize: Math.max(15, Math.round(tokenSize * 0.38)),
            textShadow: '0 0 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            zIndex: 150,
            animation: 'floatUpFade 1.8s ease-out forwards',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {floatingDiff.text}
        </div>
      )}

      {/* Aura / Condition rings */}
      {hasAura && activeConditions.length === 0 && (
        <div style={{
          position: 'absolute',
          inset: -Math.round(tokenSize * 0.35),
          borderRadius: '50%',
          border: `2px solid ${factionColor}`,
          opacity: 0.35,
          pointerEvents: 'none',
        }} />
      )}

      {activeConditions.map((condId, idx) => {
        const cond = CONDITIONS.find(c => c.id === condId)
        if (!cond) return null
        const offset = 4 + (idx * 4)
        return (
          <div key={condId} style={{
            position: 'absolute',
            inset: -offset,
            borderRadius: '50%',
            border: `2px solid ${cond.color}`,
            opacity: 0.5,
            pointerEvents: 'none',
            animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
        )
      })}

      {/* HP bar */}
      {hpPercent !== null && (
        <div style={{
          position: 'absolute',
          top: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: tokenSize + 4,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 2,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <div style={{
            width: `${hpPercent}%`,
            height: '100%',
            backgroundColor: hpColor,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Token body */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: isActive
          ? `0 0 0 2px ${factionHex}, 0 4px 16px rgba(0,0,0,0.6)`
          : `0 0 8px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5)`,
        backgroundColor: '#16161F',
        backgroundImage: entity.avatar ? `url(${entity.avatar})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 700,
        color: factionColor,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {!entity.avatar && getEntityInitials(entity.name)}
      </div>

      {/* Name label */}
      <div style={{
        position: 'absolute',
        bottom: -(hpPercent !== null ? 22 : 18),
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '1px 5px',
        borderRadius: 3,
        fontSize: Math.max(8, Math.round(tokenSize * 0.18)),
        fontWeight: 600,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}>
        {getEntityName(entity.name)}
        {hp !== null && (
          <span style={{ color: hpColor, fontFamily: 'monospace' }}>
            {hp}{maxHp != null ? `/${maxHp}` : ''}
          </span>
        )}
      </div>

      {/* Effect badge (legacy) */}
      {activeEffects.length > 0 && activeConditions.length === 0 && (
        <div style={{
          position: 'absolute',
          top: -3,
          right: -3,
          background: '#FBBF24',
          color: '#000',
          borderRadius: '50%',
          width: 14,
          height: 14,
          fontSize: 8,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {activeEffects.length}
        </div>
      )}

      {/* Conditions bar */}
      {activeConditions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: -(hpPercent !== null ? 36 : 32),
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          background: 'rgba(0,0,0,0.85)',
          padding: '2px 4px',
          borderRadius: 4,
          pointerEvents: 'none',
        }}>
          {activeConditions.map(condId => {
            const cond = CONDITIONS.find(c => c.id === condId)
            return cond ? (
              <span key={condId} style={{ fontSize: '10px', lineHeight: 1 }} title={cond.name}>
                {cond.icon}
              </span>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
