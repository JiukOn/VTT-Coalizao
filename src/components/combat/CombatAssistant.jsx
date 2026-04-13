/* CombatAssistant.jsx — Facilitates attack rolls between entities */
import { useState } from 'react'
import { Swords, Target, Crosshair, Sparkles } from 'lucide-react'
import { resolveMeleeAttack, resolveRangedAttack, resolveMagicAttack, resolveDodge } from '../../utils/combatUtils.js'
import { getBonus } from '../../utils/characterUtils.js'
import { rollDice } from '../../utils/diceRoller.js'

export default function CombatAssistant({ entities = [], onLogEntry }) {
  const [attackerId, setAttackerId] = useState('')
  const [defenderId, setDefenderId] = useState('')
  const [attackType, setAttackType] = useState('melee')
  const [isEvasion, setIsEvasion] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const handleResolve = () => {
    if (!attackerId || !defenderId) {
      onLogEntry?.('⚠️ Selecione um atacante e um alvo no Assistente de Combate.')
      return
    }

    const atk = entities.find(e => e.tableId === attackerId)
    const def = entities.find(e => e.tableId === defenderId)
    if (!atk || !def) return

    const atkFRC = atk.attributes?.frc ?? atk.frc ?? 0
    const atkPRE = atk.attributes?.pre ?? atk.pre ?? 0
    const atkENR = atk.attributes?.enr ?? atk.enr ?? 0

    const defFRC = def.attributes?.frc ?? def.frc ?? 0
    const defDEX = def.attributes?.dex ?? def.dex ?? 0
    const defRES = def.attributes?.res ?? def.res ?? 0

    let result
    let hit = false

    if (attackType === 'melee') {
      const defAttr = isEvasion ? defDEX : defFRC
      if (isEvasion) {
        // Forçado a esquiva
        const attackRoll = rollDice(1, 20)[0]
        const dodgeRes = resolveDodge(defDEX, attackRoll + getBonus(atkFRC))
        result = {
          attackTotal: attackRoll + getBonus(atkFRC),
          defendTotal: dodgeRes.dodgeTotal,
          hit: !dodgeRes.dodged
        }
      } else {
        result = resolveMeleeAttack(atkFRC, defFRC)
      }
      hit = result.hit
      onLogEntry?.(`⚔️ ${atk.name} ➔ ${def.name} [C. a C.]: Atk ${result.attackTotal} vs Def ${result.defendTotal}. ${hit ? '💥 ACERTOU' : '🛡️ DEFENDEU'}`)
    } 
    else if (attackType === 'ranged') {
      result = resolveRangedAttack(atkPRE, defDEX)
      hit = result.hit
      onLogEntry?.(`🏹 ${atk.name} ➔ ${def.name} [Distância]: Atk ${result.attackTotal} vs Def ${result.defendTotal}. ${hit ? '💥 ACERTOU' : '🛡️ DEFENDEU'}`)
    } 
    else if (attackType === 'magic') {
      result = resolveMagicAttack(atkPRE, atkENR, defRES)
      if (!result.formed) {
        onLogEntry?.(`✨ ${atk.name} ➔ ${def.name} [Mágico]: Formação (PRE) ${result.formationTotal} ➔ 💨 DISSIPOU!`)
        hit = false
      } else {
        hit = result.hit
        onLogEntry?.(`✨ ${atk.name} ➔ ${def.name} [Mágico]: Atk ${result.attackTotal} vs Def ${result.defendTotal}. ${hit ? '💥 ACERTOU' : '🛡️ DEFENDEU'}`)
      }
    }

    setLastResult({ type: attackType, hit, attacker: atk, defender: def, baseFrc: atkFRC })
  }

  const handleRollDamage = () => {
    if (!lastResult?.hit) return
    const damageRoll = rollDice(1, 4)[0]
    let bonus = 0

    // Typical Coalizão melee damage: 1d4 + FRC bonus
    if (lastResult.type === 'melee') {
      bonus = getBonus(lastResult.baseFrc)
    }

    const totalDmg = damageRoll + bonus
    onLogEntry?.(`🩸 ${lastResult.attacker.name} causou [ ${totalDmg} ] de dano em ${lastResult.defender.name} (1d4: ${damageRoll} ${bonus > 0 ? `+ ${bonus}` : ''})`)
    
    // Clear last result after rolling damage so they don't click endlessly
    setLastResult(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px', height: '100%' }}>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ATACANTE</label>
          <select className="input" style={{ width: '100%', fontSize: '0.8rem', padding: '4px' }} value={attackerId} onChange={e => setAttackerId(e.target.value)}>
            <option value="">Selecione...</option>
            {entities.map(e => <option key={e.tableId} value={e.tableId}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ALVO</label>
          <select className="input" style={{ width: '100%', fontSize: '0.8rem', padding: '4px' }} value={defenderId} onChange={e => setDefenderId(e.target.value)}>
            <option value="">Selecione...</option>
            {entities.map(e => <option key={e.tableId} value={e.tableId}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TIPO DE ATAQUE</label>
          <select className="input" style={{ width: '100%', fontSize: '0.8rem', padding: '4px' }} value={attackType} onChange={e => setAttackType(e.target.value)}>
            <option value="melee">Corpo a Corpo</option>
            <option value="ranged">À Distância</option>
            <option value="magic">Poder Mágico</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px', gap: '4px' }}>
          <input 
            type="checkbox" 
            id="evasion" 
            checked={isEvasion} 
            onChange={e => setIsEvasion(e.target.checked)} 
            disabled={attackType !== 'melee'}
          />
          <label htmlFor="evasion" style={{ fontSize: '0.75rem', cursor: 'pointer', color: attackType !== 'melee' ? 'var(--text-muted)' : 'inherit' }}>Esquiva?</label>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: '4px', width: '100%' }} onClick={handleResolve}>
        <Crosshair size={14} /> Resolver Ataque
      </button>

      {lastResult?.hit && (
        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--color-success)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '6px' }}>💥 ATAQUE ACERTOU!</div>
          <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={handleRollDamage}>
            🩸 Rolar Dano (1d4)
          </button>
        </div>
      )}

      {lastResult && !lastResult.hit && (
        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>🛡️ ATAQUE FALHOU</div>
        </div>
      )}

    </div>
  )
}
