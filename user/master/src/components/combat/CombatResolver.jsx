/* CombatResolver.jsx — Assisted combat resolution panel
   Coalizão rules:
     Corpo a Corpo: 1d20+FRC vs 1d20+FRC
     Distância:     1d20+PRE vs 1d20+DEX
     Mágico:        formação 1d20+PRE ≥ 12, depois 1d20+ENR vs 1d20+RES
     Dano:          1d4
*/
import { useState } from 'react'
import { Swords, Crosshair, Zap, ChevronRight, Check, X, AlertTriangle, RefreshCw } from 'lucide-react'
import { resolveMeleeAttack, resolveRangedAttack, resolveMagicAttack } from '../../utils/combatUtils.js'
import { rollDice, calculateBonus, classifyD20 } from '../../utils/diceRoller.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAttr(entity, attr) {
  if (!entity) return 0
  const key = attr.toLowerCase()
  if (entity.attributes) {
    const v = entity.attributes[key]
    if (v !== undefined) return parseInt(v) || 0
  }
  const v = entity[key]
  return parseInt(v) || 0
}

function bStr(val) {
  const b = calculateBonus(val)
  return b >= 0 ? `+${b}` : `${b}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RollRow({ label, roll, attrVal, attrLabel, total, classification }) {
  const typeColors = {
    critical: 'var(--color-success)',
    good:     '#86efac',
    neutral:  'var(--color-warning)',
    bad:      '#fca5a5',
    disaster: 'var(--color-danger)',
  }
  const color = typeColors[classification?.type] || 'var(--text-secondary)'
  const bonus = calculateBonus(attrVal)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', padding: '2px 0' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color }}>
        🎲{roll}
      </span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
        {bonus >= 0 ? '+' : ''}{bonus} {attrLabel}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, marginLeft: 2 }}>
        = {total}
      </span>
      {classification && (
        <span style={{ fontSize: '0.68rem', color, opacity: 0.8, marginLeft: 2 }}>
          ({classification.label})
        </span>
      )}
    </div>
  )
}

// ── Attack types ──────────────────────────────────────────────────────────────

const ATTACK_TYPES = [
  {
    id: 'melee',
    label: 'Corpo',
    fullLabel: 'Corpo a Corpo',
    icon: Swords,
    desc: 'FRC vs FRC',
    color: '#F87171',
    attackAttr: 'frc',
    defendAttr: 'frc',
    attrLabel: 'FRC',
  },
  {
    id: 'ranged',
    label: 'Dist.',
    fullLabel: 'Distância',
    icon: Crosshair,
    desc: 'PRE vs DEX',
    color: '#60A5FA',
    attackAttr: 'pre',
    defendAttr: 'dex',
    attrLabel: 'PRE/DEX',
  },
  {
    id: 'magic',
    label: 'Mágico',
    fullLabel: 'Mágico',
    icon: Zap,
    desc: 'PRE≥12 → ENR vs RES',
    color: '#C084FC',
    attackAttr: 'enr',
    defendAttr: 'res',
    attrLabel: 'ENR/RES',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function CombatResolver({ entities = [], onLogEntry, onApplyDamage }) {
  const [attackerId,    setAttackerId]    = useState('')
  const [defenderId,    setDefenderId]    = useState('')
  const [attackType,    setAttackType]    = useState('melee')
  const [result,        setResult]        = useState(null)
  const [rolling,       setRolling]       = useState(false)
  const [damageApplied, setDamageApplied] = useState(false)

  const attacker = entities.find(e => String(e.tableId) === String(attackerId))
  const defender = entities.find(e => String(e.tableId) === String(defenderId))
  const canResolve = attackerId && defenderId && attackerId !== defenderId && !rolling

  const reset = () => {
    setResult(null)
    setDamageApplied(false)
  }

  // ── Resolve combat ────────────────────────────────────────────────────────

  const handleResolve = () => {
    if (!canResolve) return
    setRolling(true)
    setResult(null)
    setDamageApplied(false)

    // Brief delay for "rolling" feel
    setTimeout(() => {
      const aFRC = getAttr(attacker, 'frc')
      const aPRE = getAttr(attacker, 'pre')
      const aENR = getAttr(attacker, 'enr')
      const dFRC = getAttr(defender, 'frc')
      const dDEX = getAttr(defender, 'dex')
      const dRES = getAttr(defender, 'res')

      let res = {}

      if (attackType === 'melee') {
        const raw = resolveMeleeAttack(aFRC, dFRC)
        res = {
          ...raw,
          type: 'melee',
          typeLabel: 'Corpo a Corpo',
          attackAttrVal: aFRC,
          attackAttrLabel: 'FRC',
          defendAttrVal: dFRC,
          defendAttrLabel: 'FRC',
          attackClassification: classifyD20(raw.attackRoll),
          defendClassification: classifyD20(raw.defendRoll),
        }
      } else if (attackType === 'ranged') {
        const raw = resolveRangedAttack(aPRE, dDEX)
        res = {
          ...raw,
          type: 'ranged',
          typeLabel: 'Distância',
          attackAttrVal: aPRE,
          attackAttrLabel: 'PRE',
          defendAttrVal: dDEX,
          defendAttrLabel: 'DEX',
          attackClassification: classifyD20(raw.attackRoll),
          defendClassification: classifyD20(raw.defendRoll),
        }
      } else {
        const raw = resolveMagicAttack(aPRE, aENR, dRES)
        res = {
          ...raw,
          type: 'magic',
          typeLabel: 'Mágico',
          formationAttrVal: aPRE,
          attackAttrVal:    aENR,
          attackAttrLabel:  'ENR',
          defendAttrVal:    dRES,
          defendAttrLabel:  'RES',
          formationClassification: raw.formed ? classifyD20(raw.formationRoll) : classifyD20(raw.formationRoll),
          attackClassification: raw.formed ? classifyD20(raw.attackRoll) : null,
          defendClassification: raw.formed ? classifyD20(raw.defendRoll) : null,
        }
      }

      // Roll 1d4 damage if hit
      if (res.hit) {
        const [dmg] = rollDice(1, 4)
        res.damageRoll  = dmg
        res.damageDealt = dmg
      }

      // Build log entry
      const an = attacker?.name ?? 'Atacante'
      const dn = defender?.name ?? 'Defensor'
      if (res.type === 'magic' && !res.formed) {
        onLogEntry?.(`❌ ${an} falhou na Formação Mágica (${res.formationTotal} < 12)`)
      } else if (res.hit) {
        onLogEntry?.(
          `✅ ${an} → ${dn} [${res.typeLabel}]: ${res.attackTotal} vs ${res.defendTotal} ` +
          `— 🗡️ ${res.damageDealt} dano (1d4)`
        )
      } else {
        onLogEntry?.(`❌ ${an} errou ${dn} [${res.typeLabel}]: ${res.attackTotal} vs ${res.defendTotal}`)
      }

      setResult(res)
      setRolling(false)
    }, 380)
  }

  // ── Apply damage ──────────────────────────────────────────────────────────

  const handleApplyDamage = () => {
    if (!result?.hit || !defenderId || damageApplied) return
    onApplyDamage?.(defenderId, result.damageDealt)
    setDamageApplied(true)
    const dn = defender?.name ?? 'Defensor'
    onLogEntry?.(`🩸 ${dn}: −${result.damageDealt} HP`)
  }

  // ── Dodge test ────────────────────────────────────────────────────────────

  const handleDodgeTest = () => {
    if (!result?.hit || !defender) return
    const dDEX = getAttr(defender, 'dex')
    const [dodgeRoll] = rollDice(1, 20)
    const bonus       = calculateBonus(dDEX)
    const dodgeTotal  = dodgeRoll + bonus
    const dodged      = dodgeTotal > result.attackTotal
    const dn          = defender?.name ?? 'Defensor'
    onLogEntry?.(
      dodged
        ? `🛡️ ${dn} esquivou! DEX: 🎲${dodgeRoll}${bStr(dDEX)} = ${dodgeTotal} > ${result.attackTotal}`
        : `💥 ${dn} não esquivou. DEX: 🎲${dodgeRoll}${bStr(dDEX)} = ${dodgeTotal} ≤ ${result.attackTotal}`
    )
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const hitColor = result?.hit
    ? 'var(--color-success)'
    : result?.type === 'magic' && result?.formed === false
      ? 'var(--color-warning)'
      : 'var(--color-danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>

      {/* Attacker / Defender selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 5, alignItems: 'center' }}>
        <select
          className="input select"
          value={attackerId}
          onChange={e => { setAttackerId(e.target.value); reset() }}
          style={{ fontSize: '0.73rem', padding: '3px 5px' }}
        >
          <option value="">— Atacante —</option>
          {entities.map(e => (
            <option key={e.tableId} value={e.tableId}>{e.name}</option>
          ))}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'center', fontWeight: 700 }}>VS</span>
        <select
          className="input select"
          value={defenderId}
          onChange={e => { setDefenderId(e.target.value); reset() }}
          style={{ fontSize: '0.73rem', padding: '3px 5px' }}
        >
          <option value="">— Defensor —</option>
          {entities.map(e => (
            <option key={e.tableId} value={e.tableId}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Attack type selector */}
      <div style={{ display: 'flex', gap: 4 }}>
        {ATTACK_TYPES.map(t => {
          const Icon = t.icon
          const active = attackType === t.id
          return (
            <button
              key={t.id}
              title={`${t.fullLabel}: ${t.desc}`}
              onClick={() => { setAttackType(t.id); reset() }}
              className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                padding: '4px 3px', fontSize: '0.65rem',
                borderColor: active ? undefined : t.color,
                color: active ? undefined : t.color,
              }}
            >
              <Icon size={11} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Resolve button */}
      <button
        className="btn btn-primary"
        onClick={handleResolve}
        disabled={!canResolve}
        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
      >
        {rolling
          ? <><RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Rolando…</>
          : <><ChevronRight size={13} /> Resolver Combate</>
        }
      </button>

      {/* Result panel */}
      {result && (
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'var(--bg-tertiary)',
          border: `1px solid ${hitColor}`,
          borderRadius: 6, padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>

          {/* Type badge */}
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {result.typeLabel}
          </div>

          {/* Magic formation step */}
          {result.type === 'magic' && (
            <RollRow
              label="Formação:"
              roll={result.formationRoll}
              attrVal={result.formationAttrVal}
              attrLabel="PRE"
              total={result.formationTotal}
              classification={result.formationClassification}
            />
          )}

          {/* Magic formation failed banner */}
          {result.type === 'magic' && !result.formed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 4,
              background: 'rgba(251,191,36,0.1)', border: '1px solid var(--color-warning)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-warning)',
            }}>
              <AlertTriangle size={12} /> Formação falhou — abaixo de 12
            </div>
          )}

          {/* Attack / Defense rolls (show if not magic-failed) */}
          {(result.type !== 'magic' || result.formed) && (
            <>
              <RollRow
                label={`${attacker?.name ?? 'Ataque'}:`}
                roll={result.attackRoll}
                attrVal={result.attackAttrVal}
                attrLabel={result.attackAttrLabel}
                total={result.attackTotal}
                classification={result.attackClassification}
              />
              <RollRow
                label={`${defender?.name ?? 'Defesa'}:`}
                roll={result.defendRoll}
                attrVal={result.defendAttrVal}
                attrLabel={result.defendAttrLabel}
                total={result.defendTotal}
                classification={result.defendClassification}
              />
            </>
          )}

          {/* Hit / Miss verdict */}
          {(result.type !== 'magic' || result.formed !== false) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 8px', borderRadius: 4,
              background: result.hit ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${hitColor}`,
            }}>
              {result.hit
                ? <Check size={13} color="var(--color-success)" />
                : <X     size={13} color="var(--color-danger)" />
              }
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: hitColor, flex: 1 }}>
                {result.hit ? 'ACERTO!' : 'ERROU!'}
              </span>
              {result.hit && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#F87171', fontWeight: 700 }}>
                  🗡️ {result.damageRoll} (1d4)
                </span>
              )}
            </div>
          )}

          {/* Action buttons (only when hit) */}
          {result.hit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!damageApplied ? (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleApplyDamage}
                  style={{ fontSize: '0.73rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  🩸 Aplicar {result.damageDealt} dano em {defender?.name ?? 'Defensor'}
                </button>
              ) : (
                <div style={{ fontSize: '0.73rem', color: 'var(--color-success)', textAlign: 'center', padding: '2px 0' }}>
                  ✅ Dano aplicado em {defender?.name}.
                </div>
              )}

              <button
                className="btn btn-sm btn-ghost"
                onClick={handleDodgeTest}
                title="Rolar esquiva para o defensor (1d20+DEX vs total do ataque)"
                style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                🛡️ Testar Esquiva ({defender?.name ?? 'Defensor'})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !rolling && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center',
          padding: '0 8px',
        }}>
          {entities.length === 0
            ? 'Adicione entidades à mesa para resolver combate.'
            : 'Selecione atacante e defensor, depois clique em Resolver.'}
        </div>
      )}
    </div>
  )
}
