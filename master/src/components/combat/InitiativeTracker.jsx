/* InitiativeTracker.jsx — Turn order panel with action checklist, threat level, round counter and encounter rewards */
import { useState, useEffect } from 'react'
import { ChevronRight, RotateCcw, CheckSquare, Square, Dices, Award, Coins, X, Clock } from 'lucide-react'
import { rollInitiative } from '../../utils/combatUtils.js'
import { sfx } from '@shared/utils/sfxPlayer.js'
import { useServer } from '../../context/ServerContext.jsx'
import { calculateEncounterThreat } from '@shared/utils/encounterUtils.js'
import LootGeneratorModal from './LootGeneratorModal.jsx'

export default function InitiativeTracker({ entities = [], onLogEntry, onUpdateEntity }) {
  const [order, setOrder] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [actions, setActions] = useState({})
  const [rewardModalOpen, setRewardModalOpen] = useState(false)
  const [lootModalOpen, setLootModalOpen]     = useState(false)
  const [customXp, setCustomXp] = useState(150)
  const [rewardReason, setRewardReason] = useState('Vitória em Combate')
  const { serverOnline, broadcast } = useServer()

  // Tactical Turn Timer
  const [turnTimerLimit, setTurnTimerLimit] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)

  const hasOrder = order.length > 0

  useEffect(() => {
    if (!hasOrder || turnTimerLimit === 0 || !timerRunning) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          sfx.init()
          sfx.play('turn_alert')
          return 0
        }
        if (prev === 11) {
          sfx.init()
          sfx.play('turn_alert')
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [hasOrder, turnTimerLimit, timerRunning])

  // Calculate live threat rating
  const heroes = entities.filter(e => e.type === 'hero' || e.isPlayer || e.class || e.classId)
  const enemies = entities.filter(e => !heroes.includes(e))
  const threat = calculateEncounterThreat(heroes, enemies)

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
    setTimeLeft(turnTimerLimit)
    setTimerRunning(true)
    onLogEntry?.('⚔️ — Rodada 1 —')
    rolled.forEach(e => onLogEntry?.(
      `🎲 ${e.name}: Iniciativa ${e.initiativeTotal} (${e.initiativeRoll} + DEX${e.initiativeBonus >= 0 ? '+' : ''}${e.initiativeBonus}) — ${e.classification.label}`
    ))
  }

  const handleNextTurn = () => {
    sfx.init()
    sfx.play('turn_alert')
    setTimeLeft(turnTimerLimit)
    setTimerRunning(true)

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

  const handleDistributeRewards = () => {
    if (serverOnline && broadcast) {
      broadcast('award_xp', { amount: customXp, reason: rewardReason })
    }
    onLogEntry?.(`🏆 XP de Encontro Distribuído: +${customXp} XP (${rewardReason})`)
    sfx.init()
    sfx.play('turn_alert')
    setRewardModalOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            RODADA {round}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
              background: `${threat.color}18`,
              color: threat.color,
              border: `1px solid ${threat.color}44`,
            }}
            title={threat.description}
          >
            {threat.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const nextLimit = turnTimerLimit === 0 ? 30 : (turnTimerLimit === 30 ? 60 : (turnTimerLimit === 60 ? 90 : 0))
              setTurnTimerLimit(nextLimit)
              setTimeLeft(nextLimit)
              if (nextLimit > 0 && hasOrder) setTimerRunning(true)
            }}
            title="Temporizador de Turno (clique para alternar: 30s, 60s, 90s, Desligado)"
            style={{ color: timeLeft <= 10 && turnTimerLimit > 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem' }}
          >
            <Clock size={11} /> {turnTimerLimit === 0 ? 'Off' : `${timeLeft}s`}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setLootModalOpen(true)}
            title="Gerador de Pilhagem e Tesouros"
            style={{ color: '#F59E0B' }}
          >
            <Coins size={11} /> Loot
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setRewardModalOpen(true)}
            title="Distribuir XP do Encontro"
            style={{ color: '#38BDF8' }}
          >
            <Award size={11} /> XP
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleNextTurn}>
            <ChevronRight size={11} /> Próximo
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Encerrar">
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Turn Timer Progress Bar */}
      {hasOrder && turnTimerLimit > 0 && (
        <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, (timeLeft / turnTimerLimit) * 100))}%`,
            background: timeLeft <= 10 ? '#EF4444' : (timeLeft <= 25 ? '#F59E0B' : '#10B981'),
            transition: 'width 1s linear, background 0.3s ease',
          }} />
        </div>
      )}

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
                        <div key={eff.id || `${eff.name || 'eff'}-${i}`} style={{ fontSize: '0.68rem', color: '#FBBF24', display: 'flex', gap: 4 }}>
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

      {/* Encounter Rewards Modal */}
      {rewardModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '18px 22px',
            width: '90%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} style={{ color: '#F59E0B' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Recompensa de Encontro</h4>
              </div>
              <button onClick={() => setRewardModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Quantidade de XP por Jogador:</label>
                <input
                  type="number"
                  className="input"
                  value={customXp}
                  onChange={e => setCustomXp(parseInt(e.target.value) || 0)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Motivo / Descrição:</label>
                <input
                  type="text"
                  className="input"
                  value={rewardReason}
                  onChange={e => setRewardReason(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRewardModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDistributeRewards}>
                Distribuir aos Jogadores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Combat Loot Generator Modal */}
      <LootGeneratorModal
        isOpen={lootModalOpen}
        onClose={() => setLootModalOpen(false)}
        onBroadcastChatMessage={(msg) => {
          onLogEntry?.(msg)
          if (serverOnline && broadcast) {
            broadcast('chat_message', { text: msg, timestamp: new Date().toISOString() })
          }
        }}
      />
    </div>
  )
}
