/* InitiativeTracker.jsx — Turn order panel with action checklist and round counter */
import { useState } from 'react'
import { ChevronRight, RotateCcw, CheckSquare, Square, Dices } from 'lucide-react'
import { rollInitiative } from '../../utils/combatUtils.js'

export default function InitiativeTracker({ entities = [], onLogEntry, onUpdateEntity }) {
  const [order, setOrder] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [actions, setActions] = useState({})

  const hasOrder = order.length > 0

  const handleRollInitiative = () => {
    if (entities.length === 0) {
      onLogEntry?.('⚠️ Adicione entidades à mesa antes de rolar iniciativa.')
      return
    }
    const toRoll = entities.map(e => ({
      id: e.tableId || e.id,
      name: e.name,
      dex: e.attributes?.dex ?? e.dex ?? 0,
    }))
    const rolled = rollInitiative(toRoll)
    setOrder(rolled)
    setCurrentIndex(0)
    setRound(1)
    setActions({})
    onLogEntry?.('⚔️ — Rodada 1 —')
    rolled.forEach(e => onLogEntry?.(
      `🎲 ${e.name}: Iniciativa ${e.initiativeTotal} (${e.initiativeRoll} + DEX${e.initiativeBonus >= 0 ? '+' : ''}${e.initiativeBonus}) — ${e.classification.label}`
    ))
  }

  const handleNextTurn = () => {
    const next = (currentIndex + 1) % order.length
    const newRound = next === 0 ? round + 1 : round

    // Tick down effects for the CURRENT entity before advancing
    const currentEntity = order[currentIndex]
    if (currentEntity && onUpdateEntity) {
      const fullEntity = entities.find(e => (e.tableId || e.id) === currentEntity.id)
      if (fullEntity?.effects?.length > 0) {
        const updatedEffects = []
        const expiredNames = []
        for (const eff of fullEntity.effects) {
          if (eff.turnsRemaining != null) {
            const remaining = eff.turnsRemaining - 1
            if (remaining <= 0) {
              expiredNames.push(eff.name || eff.id || 'Efeito')
            } else {
              updatedEffects.push({ ...eff, turnsRemaining: remaining })
              if (remaining === 1) {
                onLogEntry?.(`⏳ ${fullEntity.name}: efeito "${eff.name || eff.id}" expira no próximo turno.`)
              }
            }
          } else {
            updatedEffects.push(eff)
          }
        }
        if (expiredNames.length > 0) {
          onLogEntry?.(`✅ ${fullEntity.name}: efeito(s) expirado(s) — ${expiredNames.join(', ')}`)
          onUpdateEntity(fullEntity.tableId || fullEntity.id, { effects: updatedEffects })
        } else if (updatedEffects.some((e, i) => e.turnsRemaining !== fullEntity.effects[i]?.turnsRemaining)) {
          onUpdateEntity(fullEntity.tableId || fullEntity.id, { effects: updatedEffects })
        }
      }
    }

    // Stealth retest alert every 2 rounds when new round starts
    if (next === 0) {
      onLogEntry?.(`⚔️ — Rodada ${newRound} —`)
      if (newRound % 2 === 0) {
        const stealthEntities = entities.filter(e => e.effects?.some(ef => ef.id === 'stealth' || ef.name?.toLowerCase().includes('furtiv')))
        stealthEntities.forEach(e => onLogEntry?.(`👁️ ${e.name}: re-teste de furtividade necessário (rodada par).`))
      }
    } else {
      onLogEntry?.(`▶️ Turno: ${order[next]?.name}`)
    }

    // Reset actions for the NEXT entity (fix BUG-003)
    const nextEntityId = order[next]?.id
    setActions(prev => {
      const n = { ...prev }
      delete n[nextEntityId]
      return n
    })

    setCurrentIndex(next)
    setRound(newRound)
  }

  const toggleAction = (entityId, key) => {
    setActions(prev => ({
      ...prev,
      [entityId]: { ...(prev[entityId] || {}), [key]: !(prev[entityId]?.[key]) }
    }))
  }

  const handleReset = () => {
    setOrder([])
    setCurrentIndex(0)
    setRound(1)
    setActions({})
    onLogEntry?.('🔄 Iniciativa encerrada.')
  }

  if (!hasOrder) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {entities.length === 0 ? 'Adicione entidades à mesa.' : `${entities.length} entidade(s) pronta(s).`}
        </p>
        <button className="btn btn-primary btn-sm" onClick={handleRollInitiative} disabled={entities.length === 0}>
          <Dices size={13} /> Rolar Iniciativa
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
          RODADA {round}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-primary btn-sm" onClick={handleNextTurn}>
            <ChevronRight size={11} /> Próximo
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Encerrar">
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {order.map((entity, idx) => {
          const isActive = idx === currentIndex
          const entityActions = actions[entity.id] || {}
          const fullEntity = entities.find(e => (e.tableId || e.id) === entity.id)
          const activeEffects = fullEntity?.effects || []

          return (
            <div
              key={entity.id}
              style={{
                padding: '7px 8px',
                borderBottom: '1px solid var(--border-subtle)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--accent-primary)' : 'transparent'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', minWidth: 22, textAlign: 'right' }}>
                  {entity.initiativeTotal}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>
                  {entity.name}
                </span>
                {activeEffects.length > 0 && (
                  <span style={{ fontSize: '0.65rem', background: '#FBBF2433', color: '#FBBF24', borderRadius: 3, padding: '1px 4px' }}>
                    {activeEffects.length} ef.
                  </span>
                )}
              </div>

              {isActive && (
                <div style={{ marginTop: 5, paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { key: 'main', label: 'Ação Principal' },
                    { key: 'cognitive', label: 'Ação Cognitiva' },
                    { key: 'movement', label: 'Movimentar (1d4)' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleAction(entity.id, key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer',
                        color: entityActions[key] ? 'var(--color-success)' : 'var(--text-muted)',
                        fontSize: '0.72rem', padding: '1px 0', textDecoration: entityActions[key] ? 'line-through' : 'none',
                      }}
                    >
                      {entityActions[key] ? <CheckSquare size={11} /> : <Square size={11} />}
                      {label}
                    </button>
                  ))}

                  {activeEffects.length > 0 && (
                    <div style={{ marginTop: 3, borderTop: '1px solid var(--border-subtle)', paddingTop: 3 }}>
                      {activeEffects.map((eff, i) => (
                        <div key={i} style={{ fontSize: '0.68rem', color: '#FBBF24', display: 'flex', gap: 4 }}>
                          <span>✦ {eff.name || eff.id || 'Efeito'}</span>
                          {eff.turnsRemaining != null && (
                            <span style={{ color: eff.turnsRemaining <= 1 ? '#F87171' : 'var(--text-muted)' }}>
                              ({eff.turnsRemaining}t)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
