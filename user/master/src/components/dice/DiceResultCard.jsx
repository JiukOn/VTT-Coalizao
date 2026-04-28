/* DiceResultCard.jsx — Single die result with classification and animation */
import { classifyD20, classifyD4 } from '../../utils/diceRoller.js'

const TYPE_COLORS = {
  critical: 'var(--color-critical)',
  good:     'var(--color-success)',
  neutral:  'var(--color-warning)',
  bad:      'var(--color-danger)',
  disaster: 'var(--color-disaster)',
}

export default function DiceResultCard({ value, diceType = 20, dimmed = false }) {
  const classify = diceType === 4 ? classifyD4 : classifyD20
  const { label, type } = classify(value)
  const color = TYPE_COLORS[type] || 'var(--text-secondary)'

  return (
    <div
      className={`dice-result-card result-${type} ${dimmed ? 'not-used' : ''}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 52,
        minHeight: 52,
        border: `2px solid ${dimmed ? 'var(--border-subtle)' : color}`,
        borderRadius: 8,
        padding: '6px 10px',
        background: dimmed ? 'transparent' : `${color}18`,
        opacity: dimmed ? 0.4 : 1,
        transition: 'all var(--transition-fast)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.4rem', color: dimmed ? 'var(--text-muted)' : color, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '0.65rem', color: dimmed ? 'var(--text-muted)' : color, marginTop: 2, fontWeight: 600, letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  )
}
