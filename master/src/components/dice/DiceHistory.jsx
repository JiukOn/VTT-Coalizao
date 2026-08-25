/* DiceHistory.jsx — Scrollable chronological dice roll history */
import { Trash2 } from 'lucide-react'

const TYPE_COLORS = {
  critical: 'var(--color-critical)',
  good:     'var(--color-success)',
  neutral:  'var(--color-warning)',
  bad:      'var(--color-danger)',
  disaster: 'var(--color-disaster)',
}

export default function DiceHistory({ history = [], onClear }) {
  if (history.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Nenhuma rolagem ainda.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{history.length} rolagem(ns)</span>
        {onClear && (
          <button className="btn btn-ghost btn-sm" onClick={onClear} style={{ fontSize: '0.75rem' }}>
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {[...history].reverse().map((roll, idx) => {
          const time = roll.timestamp ? new Date(roll.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
          const mainResult = roll.results?.[0]
          const color = mainResult ? TYPE_COLORS[mainResult.type] || 'var(--text-secondary)' : 'var(--text-secondary)'

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color, minWidth: 28, textAlign: 'center' }}>
                {roll.total ?? roll.results?.[0]?.value ?? '?'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {roll.count > 1 ? `${roll.count}${roll.diceType}` : roll.diceType}
                  {roll.modifier ? ` +${roll.modifier}` : ''}
                  {roll.results?.length > 1 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                      [{roll.results.map(r => r.value).join(', ')}]
                    </span>
                  )}
                </div>
                {mainResult && (
                  <div style={{ color, fontSize: '0.72rem' }}>{mainResult.label}</div>
                )}
              </div>
              {time && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>{time}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
