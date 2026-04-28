/* PlayerDashboard.jsx — Restricted player view (Fase 7A + 7B)
   Tabs: Dados | Iniciativa | Ficha | Combate | Mapa | Notas | Log
   Receives game state via WebSocket; sends dice rolls, token moves, notes.
*/
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dices, Activity, User, Swords, FileText, ScrollText,
  LogOut, Wifi, WifiOff, ChevronRight, RotateCcw,
  CheckSquare, Square, Map
} from 'lucide-react'
import { rollDice, classifyD20 } from '../utils/diceRoller.js'
import { getBonus } from '../utils/characterUtils.js'
import { resolveMeleeAttack, resolveRangedAttack, resolveMagicAttack } from '../utils/combatUtils.js'
import PlayerMap from '../components/map/PlayerMap.jsx'


// ── Types ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'dados',      label: 'Dados',      icon: Dices },
  { id: 'iniciativa', label: 'Iniciativa', icon: Activity },
  { id: 'ficha',      label: 'Ficha',      icon: User },
  { id: 'combate',    label: 'Combate',    icon: Swords },
  { id: 'mapa',       label: 'Mapa',       icon: Map },
  { id: 'notas',      label: 'Notas',      icon: FileText },
  { id: 'log',        label: 'Log',        icon: ScrollText },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function PlayerDashboard({ session, onDisconnect }) {
  const { ws, playerName, playerId, gameState: initialGameState } = session

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState('dados')
  const [wsStatus, setWsStatus]     = useState('connected')
  const [logEntries, setLogEntries] = useState([])
  const [notes, setNotes]           = useState('')
  const notesSaveTimer              = useRef(null)

  // Game state received from host
  const [order, setOrder]         = useState(initialGameState?.order || [])
  const [round, setRound]         = useState(initialGameState?.round || 1)
  const [currentIdx, setCurrentIdx] = useState(initialGameState?.currentIndex || 0)
  const [entityMap, setEntityMap] = useState(initialGameState?.entityMap || {})
  const [mapData, setMapData]     = useState(session.mapState || null)

  // Local character data (from entityMap, keyed by playerName)
  const myEntity = Object.values(entityMap).find(
    e => e.name?.toLowerCase() === playerName.toLowerCase() ||
         e.tableId === playerId
  ) || null

  // ── WebSocket event handler ───────────────────────────────────────────────
  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setLogEntries(prev => [{ id: Date.now() + Math.random(), time, msg }, ...prev].slice(0, 100))
  }, [])

  useEffect(() => {
    if (!ws) return
    ws.onmessage = (evt) => {
      try {
        const m = JSON.parse(evt.data)
        if (m.type === 'pong') return  // ignore keepalive responses
        handleServerMessage(m)
      } catch { /* ignore */ }
    }
    ws.onclose = () => setWsStatus('disconnected')
    ws.onerror = () => setWsStatus('error')

    // Keepalive ping for relay (wss://) connections — prevents proxy idle-timeout
    const keepalive = setInterval(() => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }))
    }, 25_000)

    return () => {
      clearInterval(keepalive)
      ws.onmessage = null
      ws.onclose   = null
      ws.onerror   = null
    }
  }, [ws])

  function handleServerMessage(msg) {
    switch (msg.type) {
      case 'game_state':
        setOrder(msg.data?.order || [])
        setRound(msg.data?.round || 1)
        setCurrentIdx(msg.data?.currentIndex || 0)
        setEntityMap(msg.data?.entityMap || {})
        break
      case 'turn_change':
        setOrder(msg.data?.order || order)
        setRound(msg.data?.round || round)
        setCurrentIdx(msg.data?.currentIndex ?? currentIdx)
        addLog(`▶️ Turno: ${msg.data?.currentEntityName || '?'} — Rodada ${msg.data?.round}`)
        break
      case 'entity_update':
        setEntityMap(prev => ({ ...prev, [msg.data?.id]: { ...(prev[msg.data?.id] || {}), ...msg.data?.changes } }))
        break
      case 'map_update':
        setMapData(msg.data)
        break
      case 'combat_event':
        addLog(`⚔️ ${msg.data?.summary || 'Evento de combate'}`)
        break
      default:
        break
    }
  }

  function wsSend(type, payload) {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ type, ...payload }))
    }
  }

  // ── Notes auto-save ───────────────────────────────────────────────────────
  function handleNotesChange(val) {
    setNotes(val)
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(() => {
      wsSend('notes_save', { notes: val })
    }, 3000)
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  function handleDisconnect() {
    ws?.close()
    onDisconnect()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-title)', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1rem' }}>
            ⚔️ VTT
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Modo Jogador</span>
          <span style={{
            background: 'var(--accent-subtle)', color: 'var(--accent-primary)',
            borderRadius: 4, padding: '1px 8px', fontSize: '0.78rem', fontWeight: 600,
          }}>
            {playerName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem',
            color: wsStatus === 'connected' ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {wsStatus === 'connected' ? 'Online' : 'Offline'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDisconnect}
            title="Sair da Sessão"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
          >
            <LogOut size={12} /> Sair
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content — map tab is full-bleed (no padding, no scroll) */}
      <div style={{
        flex: 1,
        overflow: activeTab === 'mapa' ? 'hidden' : 'auto',
        padding: activeTab === 'mapa' ? 0 : 16,
      }}>
        {activeTab === 'dados'      && <TabDados      wsSend={wsSend} playerName={playerName} addLog={addLog} />}
        {activeTab === 'iniciativa' && <TabIniciativa order={order} round={round} currentIdx={currentIdx} playerName={playerName} />}
        {activeTab === 'ficha'      && <TabFicha      entity={myEntity} playerName={playerName} />}
        {activeTab === 'combate'    && <TabCombate    myEntity={myEntity} entities={Object.values(entityMap)} wsSend={wsSend} playerName={playerName} addLog={addLog} />}
        {activeTab === 'mapa'       && <PlayerMap     mapData={mapData} myEntity={myEntity} wsSend={wsSend} entityMap={entityMap} />}
        {activeTab === 'notas'      && <TabNotas      notes={notes} onChange={handleNotesChange} />}
        {activeTab === 'log'        && <TabLog        entries={logEntries} />}
      </div>
    </div>
  )
}

// ── Tab: Dados ─────────────────────────────────────────────────────────────────
function TabDados({ wsSend, playerName, addLog }) {
  const [history, setHistory] = useState([])

  function roll(sides, advantage = false) {
    let results = rollDice(advantage ? 2 : 1, sides)
    const used  = advantage ? Math.max(...results) : results[0]
    const cl    = sides === 20 ? classifyD20(used) : null

    const entry = {
      id: Date.now() + Math.random(),
      sides, results, used,
      label: cl?.label || '',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setHistory(prev => [entry, ...prev].slice(0, 30))
    addLog(`🎲 ${playerName} rolou 1d${sides}${advantage ? ' (vantagem)' : ''}: ${used}${cl ? ` (${cl.label})` : ''}`)
    wsSend('dice_roll', { data: { playerName, diceType: `1d${sides}`, result: used, advantage, raw: results } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Rolar Dados</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { sides: 20, label: '1d20', color: 'var(--accent-primary)' },
          { sides: 4,  label: '1d4',  color: '#60A5FA' },
        ].map(({ sides, label, color }) => (
          <div key={sides} style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${color}33`,
            borderRadius: 10,
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-title)', color, fontSize: '1rem', fontWeight: 700 }}>{label}</span>
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: color, borderColor: color }}
              onClick={() => roll(sides)}
            >
              Rolar
            </button>
            {sides === 20 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', fontSize: '0.72rem' }}
                onClick={() => roll(sides, true)}
              >
                Vantagem (maior de 2)
              </button>
            )}
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Histórico</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {history.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px',
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                fontSize: '0.82rem',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: 40 }}>{h.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', minWidth: 20 }}>
                  {h.used}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  1d{h.sides}{h.results.length > 1 ? ` (${h.results.join(', ')})` : ''}
                </span>
                {h.label && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.68rem',
                    color: h.used === 20 ? 'var(--color-success)' : h.used === 1 ? 'var(--color-danger)' : 'var(--text-muted)',
                  }}>
                    {h.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Iniciativa ────────────────────────────────────────────────────────────
function TabIniciativa({ order, round, currentIdx, playerName }) {
  if (order.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: '0.9rem' }}>
        <Activity size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
        <p>Nenhuma batalha em andamento.</p>
      </div>
    )
  }
  return (
    <div style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Ordem de Iniciativa</h3>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
          color: 'var(--accent-primary)', fontWeight: 700,
          background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: 4,
        }}>
          RODADA {round}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {order.map((entity, idx) => {
          const isActive = idx === currentIdx
          const isMe = entity.name?.toLowerCase() === playerName.toLowerCase()
          return (
            <div key={entity.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: isActive ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              borderLeft: `4px solid ${isActive ? 'var(--accent-primary)' : isMe ? '#60A5FA' : 'transparent'}`,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                minWidth: 28, textAlign: 'right',
              }}>
                {entity.initiativeTotal ?? '?'}
              </span>
              <span style={{
                flex: 1, fontWeight: isActive || isMe ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {entity.name}
              </span>
              {isMe && (
                <span style={{
                  fontSize: '0.68rem', background: '#60A5FA22',
                  color: '#60A5FA', borderRadius: 3, padding: '1px 6px',
                }}>
                  você
                </span>
              )}
              {isActive && (
                <span style={{
                  fontSize: '0.7rem', background: 'var(--accent-primary)',
                  color: '#fff', borderRadius: 3, padding: '1px 6px',
                }}>
                  ▶ turno
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Ficha ─────────────────────────────────────────────────────────────────
const ATTR_LABELS = { vit: 'VIT', dex: 'DEX', crm: 'CRM', frc: 'FRC', int: 'INT', res: 'RES', pre: 'PRE', enr: 'ENR' }

function TabFicha({ entity }) {
  const tVal = (val) => {
    if (val == null) return ''
    if (typeof val === 'object') return val['pt-br'] || val['en-us'] || ''
    return String(val)
  }

  if (!entity) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: '0.9rem' }}>
        <User size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
        <p>Dados do personagem não recebidos ainda.<br />Aguarde o Mestre iniciar a sessão.</p>
      </div>
    )
  }

  const attrs = entity.attributes || {}
  const effects = entity.effects || []

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center',
        background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.4rem',
        }}>
          {entity.name?.[0] || '?'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{entity.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {entity.class || entity.classId || 'Sem classe'}{entity.level ? ` · Nível ${entity.level}` : ''}
          </div>
        </div>
        {entity.hp != null && (
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
              {entity.hp}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>HP</div>
          </div>
        )}
      </div>

      {/* Attributes */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Atributos
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Object.entries(ATTR_LABELS).map(([key, label]) => {
            const val = attrs[key] ?? entity[key] ?? 0
            const bonus = getBonus(val)
            return (
              <div key={key} style={{
                textAlign: 'center', padding: '6px 4px',
                background: 'var(--bg-tertiary)', borderRadius: 6,
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: bonus > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>+{bonus}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Effects */}
      {effects.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Efeitos Ativos
          </h4>
          {effects.map((eff, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 4,
              background: 'rgba(251,191,36,0.1)', border: '1px solid #FBBF2444',
              marginBottom: 4, fontSize: '0.82rem',
            }}>
              <span style={{ flex: 1, color: '#FBBF24', fontWeight: 600 }}>{tVal(eff.name) || eff.id}</span>
              {eff.turnsRemaining != null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: eff.turnsRemaining <= 1 ? '#F87171' : '#FBBF24' }}>
                  {eff.turnsRemaining}t
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Combate ───────────────────────────────────────────────────────────────
function TabCombate({ myEntity, entities, wsSend, playerName, addLog }) {
  const [defenderId, setDefenderId] = useState('')
  const [attackType, setAttackType] = useState('melee')
  const [result, setResult]         = useState(null)
  const [rolling, setRolling]       = useState(false)

  function getAttr(entity, attr) {
    if (!entity) return 0
    const key = attr.toLowerCase()
    return parseInt(entity.attributes?.[key] ?? entity[key] ?? 0) || 0
  }

  function handleResolve() {
    if (!myEntity || !defenderId) return
    const defender = entities.find(e => String(e.tableId || e.id) === String(defenderId))
    if (!defender) return
    setRolling(true)
    setResult(null)

    setTimeout(() => {
      const aFRC = getAttr(myEntity, 'frc')
      const aPRE = getAttr(myEntity, 'pre')
      const aENR = getAttr(myEntity, 'enr')
      const dFRC = getAttr(defender, 'frc')
      const dDEX = getAttr(defender, 'dex')
      const dRES = getAttr(defender, 'res')

      let res
      if (attackType === 'melee')  res = { ...resolveMeleeAttack(aFRC, dFRC), typeLabel: 'Corpo a Corpo' }
      else if (attackType === 'ranged') res = { ...resolveRangedAttack(aPRE, dDEX), typeLabel: 'Distância' }
      else res = { ...resolveMagicAttack(aPRE, aENR, dRES), typeLabel: 'Mágico' }

      const [dmg] = rollDice(1, 4)
      if (res.hit) res.damage = dmg

      setResult({ ...res, defender })
      const summary = res.hit
        ? `${playerName} acertou ${defender.name} [${res.typeLabel}] — ${res.attackTotal} vs ${res.defendTotal} — 🗡️${dmg}`
        : `${playerName} errou ${defender.name} [${res.typeLabel}] — ${res.attackTotal} vs ${res.defendTotal}`
      addLog(`⚔️ ${summary}`)
      wsSend('combat_event', { data: { summary, attacker: playerName, defender: defender.name } })
      setRolling(false)
    }, 350)
  }

  const others = entities.filter(e => e.name?.toLowerCase() !== playerName.toLowerCase())

  return (
    <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Atacante: <strong style={{ color: 'var(--text-primary)' }}>{myEntity?.name || playerName}</strong>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="input-label">Alvo</label>
        <select className="input select" value={defenderId} onChange={e => { setDefenderId(e.target.value); setResult(null) }}>
          <option value="">— Selecione —</option>
          {others.map(e => (
            <option key={e.tableId || e.id} value={e.tableId || e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'melee', label: '⚔️ Corpo' }, { id: 'ranged', label: '🏹 Dist.' }, { id: 'magic', label: '✨ Mágico' }].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${attackType === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setAttackType(t.id); setResult(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleResolve}
        disabled={!myEntity || !defenderId || rolling}
      >
        {rolling ? '⏳ Rolando…' : <><ChevronRight size={14} /> Resolver Ataque</>}
      </button>

      {result && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: `1px solid ${result.hit ? 'var(--color-success)' : 'var(--color-danger)'}`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem',
        }}>
          <div style={{ fontWeight: 700, color: result.hit ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {result.hit ? `💥 ACERTO! Dano: ${result.damage} (1d4)` : '🛡️ ERROU!'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {result.attackTotal} vs {result.defendTotal} [{result.typeLabel}]
          </div>
        </div>
      )}

      {others.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>
          Nenhuma entidade disponível como alvo.
        </p>
      )}
    </div>
  )
}

// ── Tab: Notas ─────────────────────────────────────────────────────────────────
function TabNotas({ notes, onChange }) {
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Notas de Sessão</h3>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-salvo a cada 3s</span>
      </div>
      <textarea
        className="input"
        value={notes}
        onChange={e => onChange(e.target.value)}
        rows={14}
        placeholder="Anote aqui o que aconteceu, itens coletados, pistas encontradas..."
        style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
      />
    </div>
  )
}

// ── Tab: Log ───────────────────────────────────────────────────────────────────
function TabLog({ entries }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Log da Sessão</h3>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum evento registrado.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entries.map(e => (
            <div key={e.id} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '5px 0', borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: 42, flexShrink: 0 }}>{e.time}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{e.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
