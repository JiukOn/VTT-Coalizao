/* CombatLog.jsx — Scrollable combat action history */
import { Trash2 } from 'lucide-react'

export default function CombatLog({ entries = [], onClear }) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Nenhuma ação registrada.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{entries.length} entradas</span>
        {onClear && (
          <button className="btn btn-ghost btn-sm" onClick={onClear} style={{ fontSize: '0.72rem' }}>
            <Trash2 size={11} /> Limpar
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {[...entries].reverse().map((entry, idx) => {
          const isRound = entry.includes('Rodada')
          const isRoll = entry.includes('🎲')
          const isDanger = entry.includes('❌') || entry.includes('DESASTRE')
          const isCrit = entry.includes('CRÍTICO') || entry.includes('✅')

          return (
            <div
              key={idx}
              style={{
                padding: '5px 10px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: isRound ? 'var(--accent-primary)'
                      : isCrit ? 'var(--color-success)'
                      : isDanger ? 'var(--color-danger)'
                      : 'var(--text-secondary)',
                fontWeight: isRound ? 600 : 400,
                background: isRound ? 'var(--accent-subtle)' : 'transparent',
              }}
            >
              {typeof entry === 'string' ? entry : entry.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
