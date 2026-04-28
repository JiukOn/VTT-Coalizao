/**
 * MasterToolsPanel.jsx — Ferramentas de suporte ao Mestre
 * Seção 5.12: Investigação e Furtividade
 * Seção 5.13: Descanso e Recuperação
 */
import { useState } from 'react'
import { Search, Eye, Moon, ChevronDown, ChevronRight, Dices } from 'lucide-react'

// ── Coalizão result classification ────────────────────────────────────────────
function classifyRoll(total) {
  if (total >= 20) return { label: 'Crítico',  color: '#4ADE80', emoji: '🌟' }
  if (total >= 13) return { label: 'Bom',      color: '#86EFAC', emoji: '✅' }
  if (total >= 10) return { label: 'Normal',   color: '#FBBF24', emoji: '🟡' }
  if (total >= 2)  return { label: 'Ruim',     color: '#F87171', emoji: '⚠️' }
  return               { label: 'Desastre',  color: '#EF4444', emoji: '💀' }
}

function rollD20() { return Math.floor(Math.random() * 20) + 1 }

// ── Investigation types ───────────────────────────────────────────────────────
const INVESTIGATION_TYPES = [
  { id: 'ambiente', label: 'Ambiente',  attr: 'PRE / INT', desc: 'Inspecionar o local, detectar pistas físicas.' },
  { id: 'pessoa',   label: 'Pessoa',    attr: 'CRM / INT', desc: 'Ler intenções, detectar mentiras, persuadir.' },
  { id: 'texto',    label: 'Texto',     attr: 'INT',       desc: 'Decifrar documentos, mapas, códigos.' },
  { id: 'logica',   label: 'Lógica',   attr: 'INT',       desc: 'Resolver enigmas, deduzir fatos encadeados.' },
]

const STEALTH_MODES = [
  { id: 'ambiental', label: 'Ambiental', attr: 'DEX',      desc: 'Mover-se sem ser visto/ouvido pelo ambiente.' },
  { id: 'social',    label: 'Social',    attr: 'CRM',      desc: 'Misturar-se na multidão, mentir identidade.' },
  { id: 'invasao',   label: 'Invasão',   attr: 'DEX/PRE',  desc: 'Infiltrar local guardado, neutralizar alertas.' },
]

const DIFFICULTIES = [
  { value: 8,  label: '8 — Muito Fácil' },
  { value: 12, label: '12 — Comum' },
  { value: 16, label: '16 — Complexa' },
  { value: 18, label: '18 — Oculta' },
  { value: 20, label: '20 — Quase Impossível' },
]

// ── Rest results (5.13) ───────────────────────────────────────────────────────
function getRestResult(roll, entity) {
  const maxHp = entity?.maxHp ?? entity?.vitMax ?? entity?.attributes?.vit ?? 10
  const curHp = entity?.hp ?? maxHp

  if (roll === 1) {
    return {
      label: 'Desastre',
      color: '#EF4444',
      emoji: '💀',
      desc: 'Noite terrível. Perde 1 HP adicional, nenhuma recuperação.',
      hpDelta: -1,
      removeEffect: false,
    }
  }
  if (roll <= 9) {
    return {
      label: 'Ruim',
      color: '#F87171',
      emoji: '⚠️',
      desc: 'Descanso agitado. Recupera 1 HP.',
      hpDelta: 1,
      removeEffect: false,
    }
  }
  if (roll <= 12) {
    const recover = Math.max(1, Math.round((maxHp - curHp) * 0.25))
    return {
      label: 'Normal',
      color: '#FBBF24',
      emoji: '🟡',
      desc: `Descanso adequado. Recupera ${recover} HP.`,
      hpDelta: recover,
      removeEffect: false,
    }
  }
  if (roll <= 19) {
    const recover = Math.max(1, Math.round((maxHp - curHp) * 0.5))
    return {
      label: 'Bom',
      color: '#86EFAC',
      emoji: '✅',
      desc: `Bom descanso. Recupera ${recover} HP e pode tentar remover 1 efeito psicológico.`,
      hpDelta: recover,
      removeEffect: true,
    }
  }
  return {
    label: 'Crítico',
    color: '#4ADE80',
    emoji: '🌟',
    desc: 'Descanso perfeito! HP totalmente restaurado. Remove 1 efeito ativo.',
    hpDelta: maxHp - curHp,
    removeEffect: true,
  }
}

// ── Sub-panel: Investigation ──────────────────────────────────────────────────
function InvestigationPanel() {
  const [tab, setTab]         = useState('investigacao')
  const [invType, setInvType] = useState('ambiente')
  const [stlMode, setStlMode] = useState('ambiental')
  const [difficulty, setDiff] = useState(12)
  const [bonus, setBonus]     = useState(0)
  const [oppBonus, setOppBonus] = useState(0)
  const [result, setResult]   = useState(null)

  const rollInvestigation = () => {
    const d20 = rollD20()
    const total = d20 + parseInt(bonus) || d20
    const classification = classifyRoll(total)
    const success = total >= difficulty
    setResult({
      type: 'investigation',
      d20, bonus: parseInt(bonus) || 0, total,
      difficulty,
      success,
      classification,
      typeLabel: INVESTIGATION_TYPES.find(t => t.id === invType)?.label,
    })
  }

  const rollStealth = () => {
    const d20att = rollD20()
    const d20def = rollD20()
    const attTotal = d20att + (parseInt(bonus) || 0)
    const defTotal = d20def + (parseInt(oppBonus) || 0)
    const success = attTotal > defTotal
    setResult({
      type: 'stealth',
      d20att, d20def,
      attTotal, defTotal,
      success,
      modeLabel: STEALTH_MODES.find(m => m.id === stlMode)?.label,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tab switch */}
      <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, gap: 3 }}>
        {[
          { id: 'investigacao', label: '🔍 Investigação' },
          { id: 'furtividade',  label: '👁️ Furtividade' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null) }}
            style={{
              flex: 1, padding: '6px 0', fontSize: '0.8rem', fontWeight: tab === t.id ? 700 : 400,
              background: tab === t.id ? 'var(--accent-primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'investigacao' ? (
        <>
          {/* Type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="input-label">Tipo de Investigação</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {INVESTIGATION_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setInvType(t.id)}
                  style={{
                    padding: '7px 8px', fontSize: '0.75rem', textAlign: 'left',
                    background: invType === t.id ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    border: `1px solid ${invType === t.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, cursor: 'pointer', color: invType === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.attr}</div>
                </button>
              ))}
            </div>
            {invType && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: 5 }}>
                {INVESTIGATION_TYPES.find(t => t.id === invType)?.desc}
              </div>
            )}
          </div>

          {/* Difficulty + Bonus */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">Dificuldade (CD)</label>
              <select className="input" value={difficulty} onChange={e => setDiff(Number(e.target.value))} style={{ fontSize: '0.82rem' }}>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">Bônus</label>
              <input className="input" type="number" value={bonus} onChange={e => setBonus(e.target.value)} style={{ textAlign: 'center' }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={rollInvestigation} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dices size={15} /> Rolar Investigação
          </button>
        </>
      ) : (
        <>
          {/* Stealth mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="input-label">Modo de Furtividade</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STEALTH_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setStlMode(m.id)}
                  style={{
                    padding: '7px 10px', fontSize: '0.78rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: stlMode === m.id ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    border: `1px solid ${stlMode === m.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 6, cursor: 'pointer',
                    color: stlMode === m.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.attr}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">Bônus Atacante</label>
              <input className="input" type="number" value={bonus} onChange={e => setBonus(e.target.value)} style={{ textAlign: 'center' }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="input-label">Bônus Defensor</label>
              <input className="input" type="number" value={oppBonus} onChange={e => setOppBonus(e.target.value)} style={{ textAlign: 'center' }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={rollStealth} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={15} /> Rolar Furtividade
          </button>
        </>
      )}

      {/* Result box */}
      {result && (
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'var(--bg-tertiary)',
          border: `1px solid ${result.success ? '#4ADE8040' : '#F8717140'}`,
        }}>
          {result.type === 'investigation' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: result.classification.color }}>
                  {result.classification.emoji} {result.classification.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  D20({result.d20}) + {result.bonus} = <strong style={{ color: 'var(--text-primary)' }}>{result.total}</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {result.typeLabel} · CD {result.difficulty}
              </div>
              <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 600, color: result.success ? '#4ADE80' : '#F87171' }}>
                {result.success ? '✔ Sucesso' : '✘ Falhou'}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: result.success ? '#4ADE80' : '#F87171' }}>
                  {result.success ? '✔ Furtividade bem-sucedida' : '✘ Detectado!'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                {result.modeLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Atacante: D20({result.d20att}) + bônus = <strong style={{ color: 'var(--text-primary)' }}>{result.attTotal}</strong>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Defensor: D20({result.d20def}) + bônus = <strong style={{ color: 'var(--text-primary)' }}>{result.defTotal}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-panel: Rest ───────────────────────────────────────────────────────────
function RestPanel({ tableEntities = [], onUpdateTableEntity }) {
  const [restLog, setRestLog] = useState([])

  const handleRest = (entity) => {
    const roll = rollD20()
    const res  = getRestResult(roll, entity)

    // Apply HP delta
    if (res.hpDelta !== 0 && onUpdateTableEntity) {
      const curHp  = entity.hp ?? entity.vitMax ?? 0
      const maxHp  = entity.maxHp ?? entity.vitMax ?? curHp
      const newHp  = Math.min(maxHp, Math.max(0, curHp + res.hpDelta))
      const updates = { hp: newHp }

      // Remove first active effect on Bom/Crítico if effects exist
      if (res.removeEffect && entity.effects?.length > 0) {
        updates.effects = entity.effects.slice(1)
      }

      onUpdateTableEntity(entity.tableId || entity.id, updates)
    }

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setRestLog(prev => [{
      id: Date.now(),
      time,
      name: entity.name,
      roll,
      label: res.label,
      color: res.color,
      emoji: res.emoji,
      desc: res.desc,
    }, ...prev].slice(0, 20))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tableEntities.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
          Adicione entidades à mesa para usar o descanso.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tableEntities.map(entity => (
            <div key={entity.tableId} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)', borderRadius: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, color: 'var(--accent-primary)',
                fontSize: '0.85rem', flexShrink: 0,
              }}>
                {entity.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }} className="line-clamp-1">{entity.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  HP: {entity.hp ?? '?'} / {entity.maxHp ?? entity.vitMax ?? '?'}
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleRest(entity)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
              >
                <Moon size={12} /> Descansar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rest log */}
      {restLog.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Log de Descanso
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {restLog.map(entry => (
              <div key={entry.id} style={{
                padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem',
                background: 'var(--bg-tertiary)', border: `1px solid ${entry.color}22`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{entry.name}</span>
                  <span style={{ color: entry.color, fontFamily: 'var(--font-mono)' }}>
                    {entry.emoji} {entry.label} (D20: {entry.roll})
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{entry.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main export: collapsible panel with both tools ────────────────────────────
export default function MasterToolsPanel({ tableEntities = [], onUpdateTableEntity }) {
  const [open, setOpen]     = useState(false)
  const [activeTab, setTab] = useState('investigacao')

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header — click to collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} style={{ color: 'var(--accent-primary)' }} />
          Ferramentas do Mestre
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Tab selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
            {[
              { id: 'investigacao', label: '🔍 Investigação / Furtividade', icon: Search },
              { id: 'descanso',     label: '🌙 Descanso / Recuperação',    icon: Moon },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'investigacao' && <InvestigationPanel />}
          {activeTab === 'descanso' && (
            <RestPanel
              tableEntities={tableEntities}
              onUpdateTableEntity={onUpdateTableEntity}
            />
          )}
        </div>
      )}
    </div>
  )
}
