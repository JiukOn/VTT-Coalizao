/* DiceRollerWidget.jsx — Interactive, Full-Featured Dice Roller for Coalizão RPG */
import { useState, useCallback } from 'react'
import { rollDie, classifyD20, classifyD4 } from '../../utils/diceRoller.js'
import { sfx } from '@shared/utils/sfxPlayer.js'
import { Dices, Sparkles, RotateCcw } from 'lucide-react'

const ATTR_SHORTCUTS = [
  { label: 'FRC', value: 0 },
  { label: 'DEX', value: 0 },
  { label: 'VIT', value: 0 },
  { label: 'INT', value: 0 },
  { label: 'CRM', value: 0 },
  { label: 'RES', value: 0 },
  { label: 'PRE', value: 0 },
  { label: 'ENR', value: 0 },
]

export default function DiceRollerWidget({ onLogEntry }) {
  const [diceType, setDiceType] = useState('d20')
  const [diceCount, setDiceCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [results, setResults] = useState([])
  const [advantage, setAdvantage] = useState('none') // 'none' | 'advantage' | 'disadvantage'

  const roll = useCallback((customMod = null) => {
    sfx.init()
    sfx.play('dice_roll')
    
    const activeMod = customMod !== null ? customMod : modifier
    const faces = diceType === 'd20' ? 20 : 4
    const classifyFn = diceType === 'd20' ? classifyD20 : classifyD4

    let rolls = []
    
    // Advantage only applies if count is 1 and it's a d20
    if (diceCount === 1 && advantage !== 'none' && diceType === 'd20') {
      const r1 = rollDie(faces)
      const r2 = rollDie(faces)
      const chosen = advantage === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2)
      rolls = [
        { value: r1, used: r1 === chosen, ...classifyFn(r1) },
        { value: r2, used: r2 === chosen, ...classifyFn(r2) },
      ]
      const chosenResult = classifyFn(chosen)
      const total = chosen + activeMod
      const entry = `🎲 ${diceType.toUpperCase()} (${advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}): [${r1}, ${r2}] → ${chosen}${activeMod ? ` + ${activeMod} = ${total}` : ''} — ${chosenResult.label}`
      onLogEntry?.(entry)
    } else {
      let rolledValues = []
      let totalSum = 0
      for (let i = 0; i < diceCount; i++) {
        const r = rollDie(faces)
        rolledValues.push(r)
        totalSum += r
        rolls.push({ value: r, used: true, ...classifyFn(r) })
      }
      const total = totalSum + activeMod
      const valuesStr = rolledValues.join(', ')
      const classesParsed = rolls.map(r => r.label)
      const entry = `🎲 ${diceCount}${diceType.toUpperCase()}: [${valuesStr}]${activeMod ? ` + ${activeMod} = ${total}` : (diceCount > 1 ? ` = ${total}` : '')} — ${classesParsed.join(', ')}`
      onLogEntry?.(entry)
    }

    setResults(prev => [...rolls.map((r, i) => ({ ...r, id: Date.now() + i + Math.random(), modifier: activeMod })), ...prev].slice(0, 30))
  }, [diceType, diceCount, modifier, advantage, onLogEntry])

  const getCardClass = (classification) => {
    const cl = classification?.toLowerCase().replace(/[!]/g, '') || ''
    if (cl.includes('crítico') || cl.includes('melhor')) return 'critical'
    if (cl.includes('bom')) return 'good'
    if (cl.includes('normal')) return 'normal'
    if (cl.includes('ruim') || cl.includes('pior')) return 'bad'
    if (cl.includes('desastre')) return 'disaster'
    return ''
  }

  const clearHistory = () => setResults([])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '900px', margin: '0 auto', padding: '8px 16px', gap: 10 }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        {/* Dice Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`btn btn-sm ${diceType === 'd20' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDiceType('d20')}
            style={{ fontWeight: 700, padding: '4px 12px' }}
          >
            D20 (Testes)
          </button>
          <button
            className={`btn btn-sm ${diceType === 'd4' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDiceType('d4')}
            style={{ fontWeight: 700, padding: '4px 12px' }}
          >
            D4 (Dano/Efeitos)
          </button>
        </div>

        {/* Quantity & Modifier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Quantidade:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={diceCount}
              onChange={e => setDiceCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="input"
              style={{ width: 50, textAlign: 'center', fontSize: '0.85rem', padding: '2px 4px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Bônus / Mod:</span>
            <input
              type="number"
              value={modifier}
              onChange={e => setModifier(parseInt(e.target.value) || 0)}
              className="input"
              style={{ width: 54, textAlign: 'center', fontSize: '0.85rem', padding: '2px 4px' }}
            />
          </div>

          {diceType === 'd20' && diceCount === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Modo:</span>
              <select
                className="input select"
                value={advantage}
                onChange={e => setAdvantage(e.target.value)}
                style={{ fontSize: '0.78rem', padding: '2px 6px' }}
              >
                <option value="none">Normal (1d20)</option>
                <option value="advantage">Vantagem (2d20 Maior)</option>
                <option value="disadvantage">Desvantagem (2d20 Menor)</option>
              </select>
            </div>
          )}
        </div>

        {/* Roll Action Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => roll()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 18px', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)' }}
        >
          <Dices size={16} /> ROLAR DADO
        </button>
      </div>

      {/* Results History */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)', padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} color="var(--accent-primary)" /> Resultados Recentes
          </span>
          {results.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearHistory}
              style={{ fontSize: '0.7rem', padding: '2px 6px', height: 20, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={11} /> Limpar
            </button>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden', display: 'flex', alignItems: 'center', gap: 10 }}>
          {results.length === 0 ? (
            <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px 0' }}>
              Selecione o dado e clique em <strong>ROLAR DADO</strong> para iniciar os testes.
            </div>
          ) : (
            results.map(r => (
              <div
                key={r.id}
                className={`dice-result-card ${getCardClass(r.label)} ${!r.used ? 'not-used' : ''}`}
                style={{
                  minWidth: 80,
                  padding: '8px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  ...(!r.used ? { opacity: 0.4, filter: 'grayscale(0.6)' } : {}),
                }}
              >
                <span className="dice-result-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {r.value}{r.modifier ? <span style={{ fontSize: '0.7em', opacity: 0.75 }}>+{r.modifier}</span> : ''}
                </span>
                <span className="dice-result-label" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                  {r.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
