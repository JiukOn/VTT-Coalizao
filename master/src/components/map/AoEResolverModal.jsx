/* AoEResolverModal.jsx — Mass resolution of damage and conditions on AoE-captured targets */
import { useState } from 'react'
import { Zap, X, Shield, Heart, Flame, ShieldAlert, Swords, Dices } from 'lucide-react'
import { CONDITIONS } from '../../utils/conditionUtils.js'
import { getEntityName } from '@shared/utils/entityFormatting.js'
import { sfx } from '@shared/utils/sfxPlayer.js'

export default function AoEResolverModal({
  isOpen,
  onClose,
  targets = [],
  aoeType = 'circle',
  aoeRadiusMeters = 6,
  onApplyMassEffect,
}) {
  const [effectType, setEffectType] = useState('damage') // 'damage' | 'heal' | 'condition'
  const [amount, setAmount] = useState(6)
  const [diceCount, setDiceCount] = useState(2) // 2d4
  const [selectedCondition, setSelectedCondition] = useState('burning')
  const [excludedIds, setExcludedIds] = useState(new Set())

  if (!isOpen || targets.length === 0) return null

  const activeTargets = targets.filter(t => !excludedIds.has(t.tableId || t.id))

  const toggleExclude = (id) => {
    setExcludedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRollDice = () => {
    sfx.init()
    sfx.play('dice_roll')
    let total = 0
    for (let i = 0; i < diceCount; i++) {
      total += Math.floor(Math.random() * 4) + 1
    }
    setAmount(total)
  }

  const handleExecute = () => {
    sfx.init()
    sfx.play(effectType === 'heal' ? 'notification' : 'combat_hit')

    onApplyMassEffect?.({
      effectType,
      amount: parseInt(amount, 10) || 0,
      conditionId: selectedCondition,
      targets: activeTargets,
      summary: effectType === 'damage'
        ? `💥 **ÁREA DE EFEITO (${aoeType.toUpperCase()})**: ${amount} de dano aplicado em ${activeTargets.length} alvos!`
        : effectType === 'heal'
        ? `💚 **ÁREA DE CURA**: +${amount} PV restaurados em ${activeTargets.length} alvos!`
        : `⚡ **CONDIÇÃO EM MASSA**: Condição [${selectedCondition.toUpperCase()}] aplicada a ${activeTargets.length} alvos!`,
    })

    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, width: '100%', maxWidth: 540, padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Resolução de Área de Efeito ({aoeType.toUpperCase()})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeTargets.length} de {targets.length} alvo(s) no raio de {aoeRadiusMeters}m
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Action Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button
            className={`btn btn-sm ${effectType === 'damage' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEffectType('damage')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Flame size={14} /> Dano
          </button>
          <button
            className={`btn btn-sm ${effectType === 'heal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEffectType('heal')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Heart size={14} /> Cura
          </button>
          <button
            className={`btn btn-sm ${effectType === 'condition' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEffectType('condition')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ShieldAlert size={14} /> Condição
          </button>
        </div>

        {/* Input Parameters */}
        {effectType === 'condition' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              Selecione a Condição a Aplicar:
            </label>
            <select
              className="input select"
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              style={{ width: '100%' }}
            >
              {CONDITIONS.map(c => (
                <option key={c.id} value={c.id}>{c.label} ({c.desc})</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Valor de {effectType === 'damage' ? 'Dano' : 'Cura'}:
              </label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={e => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}
              />
            </div>
            {effectType === 'damage' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  className="input select"
                  value={diceCount}
                  onChange={e => setDiceCount(parseInt(e.target.value, 10) || 1)}
                  style={{ width: 75, height: 40 }}
                  title="Quantidade de dados D4"
                >
                  <option value={1}>1d4</option>
                  <option value={2}>2d4</option>
                  <option value={3}>3d4</option>
                  <option value={4}>4d4</option>
                  <option value={5}>5d4</option>
                  <option value={6}>6d4</option>
                </select>
                <button
                  className="btn btn-secondary"
                  onClick={handleRollDice}
                  title="Rolar dano em D4 (Canônico Coalizão)"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}
                >
                  <Dices size={16} /> Rolar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Target List with Toggle */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            Alvos Atingidos (clique para incluir/desmarcar):
          </label>
          <div style={{
            maxHeight: 160, overflowY: 'auto', background: 'var(--bg-tertiary)',
            borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {targets.map(t => {
              const id = t.tableId || t.id
              const isIncluded = !excludedIds.has(id)
              const name = getEntityName(t.name)
              return (
                <div
                  key={id}
                  onClick={() => toggleExclude(id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                    background: isIncluded ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isIncluded ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                    opacity: isIncluded ? 1 : 0.45,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isIncluded ? '☑' : '☐'} {name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PV: {t.hp ?? '?'}/{t.maxHp ?? '?'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={activeTargets.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Swords size={16} /> Aplicar em {activeTargets.length} Alvo(s)
          </button>
        </div>
      </div>
    </div>
  )
}
