/* DiceRollerWidget.jsx — Interactive dice roller for the bottom bar */
import { useState, useCallback } from 'react'
import { rollDie, classifyD20, classifyD4 } from '../../utils/diceRoller.js'

export default function DiceRollerWidget({ onLogEntry }) {
  const [diceType, setDiceType] = useState('d20')
  const [diceCount, setDiceCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [results, setResults] = useState([])
  const [advantage, setAdvantage] = useState('none') // 'none' | 'advantage' | 'disadvantage'

  const roll = useCallback(() => {
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
      const total = chosen + modifier
      const entry = `🎲 ${diceType.toUpperCase()} (${advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}): [${r1}, ${r2}] → ${chosen}${modifier ? ` + ${modifier} = ${total}` : ''} — ${chosenResult.label}`
      onLogEntry?.(entry)
    } else {
      let rolledValues = []
      let totalSum = 0
      for(let i=0; i < diceCount; i++) {
        const r = rollDie(faces)
        rolledValues.push(r)
        totalSum += r
        rolls.push({ value: r, used: true, ...classifyFn(r) })
      }
      const total = totalSum + modifier
      const valuesStr = rolledValues.join(', ')
      const classesParsed = rolls.map(r => r.label)
      const entry = `🎲 ${diceCount}${diceType.toUpperCase()}: [${valuesStr}]${modifier ? ` + ${modifier} = ${total}` : (diceCount > 1 ? ` = ${total}` : '')} — ${classesParsed.join(', ')}`
      onLogEntry?.(entry)
    }

    setResults(prev => [...rolls.map((r, i) => ({ ...r, id: Date.now() + i, modifier })), ...prev].slice(0, 20))
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

  return (
    <div className="dice-roller">
      <div className="dice-controls">
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`dice-btn ${diceType === 'd20' ? 'active' : ''}`}
            onClick={() => setDiceType('d20')}
          >
            D20
          </button>
          <button
            className={`dice-btn ${diceType === 'd4' ? 'active' : ''}`}
            onClick={() => setDiceType('d4')}
          >
            D4
          </button>
        </div>

        <div className="dice-modifier">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Qtd:</span>
          <input
            className="input"
            type="number"
            min="1"
            max="10"
            value={diceCount}
            onChange={e => setDiceCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            style={{ width: '40px', padding: '2px 4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
        </div>

        <div className="dice-modifier">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mod:</span>
          <input
            className="input"
            type="number"
            value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)}
            style={{ width: '44px', padding: '2px 4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
        </div>

        {diceType === 'd20' && diceCount === 1 && (
          <select
            className="input select"
            value={advantage}
            onChange={e => setAdvantage(e.target.value)}
            style={{ fontSize: '0.7rem', padding: '2px 4px' }}
          >
            <option value="none">Normal</option>
            <option value="advantage">Vantagem</option>
            <option value="disadvantage">Desvantagem</option>
          </select>
        )}

        <button className="dice-roll-btn" onClick={roll}>
          🎲 ROLAR
        </button>
      </div>

      <div className="dice-results">
        {results.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Clique em ROLAR para começar.
          </div>
        )}
        {results.map(r => (
          <div
            key={r.id}
            className={`dice-result-card ${getCardClass(r.label)} ${!r.used ? 'not-used' : ''}`}
            style={!r.used ? { opacity: 0.4, filter: 'grayscale(.5)' } : {}}
          >
            <span className="dice-result-value">
              {r.value}{r.modifier ? <span style={{ fontSize: '.7em', opacity: .7 }}>+{r.modifier}</span> : ''}
            </span>
            <span className="dice-result-label">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
