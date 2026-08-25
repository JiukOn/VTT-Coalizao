/* DiceThrowOverlay.jsx — 3D animated dice throw projection overlay */
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function DiceThrowOverlay({
  diceType = '1d20',
  result = 20,
  raw = [20],
  onFinish = null,
  duration = 900,
}) {
  const [phase, setPhase] = useState('rolling') // 'rolling' -> 'landed' -> 'fading'
  const isD4 = diceType.includes('d4')

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('landed'), duration * 0.65)
    const timer2 = setTimeout(() => setPhase('fading'), duration)
    const timer3 = setTimeout(() => onFinish && onFinish(), duration + 200)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [duration, onFinish])

  const isCrit = result === 20 || result === 4
  const isDisaster = result === 1

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)',
      opacity: phase === 'fading' ? 0 : 1,
      transition: 'opacity 0.25s ease',
    }}>
      <style>{`
        @keyframes diceTumble {
          0% { transform: scale(0.2) rotateX(0deg) rotateY(0deg) translateY(200px); }
          50% { transform: scale(1.3) rotateX(720deg) rotateY(540deg) translateY(-80px); }
          80% { transform: scale(0.9) rotateX(1080deg) rotateY(900deg) translateY(20px); }
          100% { transform: scale(1) rotateX(1440deg) rotateY(1080deg) translateY(0); }
        }
        @keyframes dicePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); filter: drop-shadow(0 0 25px rgba(251,191,36,0.9)); }
          100% { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(251,191,36,0.6)); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        animation: phase === 'rolling' ? `diceTumble ${duration * 0.65}ms cubic-bezier(0.25, 1, 0.5, 1) forwards` : 'dicePop 0.3s ease forwards',
      }}>
        {/* Dice Shape */}
        <div style={{
          width: isD4 ? 80 : 90,
          height: isD4 ? 80 : 90,
          borderRadius: isD4 ? '16px' : '20px',
          background: isCrit
            ? 'linear-gradient(135deg, #FBBF24 0%, #10B981 100%)'
            : isDisaster
            ? 'linear-gradient(135deg, #EF4444 0%, #7F1D1D 100%)'
            : 'linear-gradient(135deg, #9B59E8 0%, #6366F1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isCrit
            ? '0 0 30px #FBBF24'
            : isDisaster
            ? '0 0 30px #EF4444'
            : '0 0 20px rgba(155,89,232,0.6)',
          border: '3px solid rgba(255,255,255,0.4)',
          transform: isD4 ? 'rotate(45deg)' : 'none',
        }}>
          <span style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            color: '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            transform: isD4 ? 'rotate(-45deg)' : 'none',
          }}>
            {phase === 'rolling' ? (raw[0] || '?') : result}
          </span>
        </div>

        {/* Dice Type Label */}
        {phase === 'landed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.85)',
            border: `1px solid ${isCrit ? '#FBBF24' : isDisaster ? '#EF4444' : 'var(--accent-primary)'}`,
            padding: '4px 12px',
            borderRadius: 20,
            color: isCrit ? '#FBBF24' : isDisaster ? '#EF4444' : '#FFF',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}>
            {isCrit && <Sparkles size={14} />}
            <span>{diceType.toUpperCase()} ➔ {result} {isCrit ? '(CRÍTICO!)' : isDisaster ? '(DESASTRE!)' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
