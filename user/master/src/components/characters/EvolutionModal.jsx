/* EvolutionModal.jsx — Level 5 Class Evolution & Level 10 TransEvolution wizard (5.15) */
import { useState } from 'react'
import { Sparkles, Star, Crown, ArrowUp, Zap, Shield } from 'lucide-react'
import { ATTRIBUTES } from '../../utils/characterUtils'

// ── Evolution paths (Level 5) ─────────────────────────────────────────────────

const EVOLUTION_PATHS = [
  {
    id: 'focused',
    name: 'Evolução Focada',
    icon: ArrowUp,
    color: 'var(--accent-primary)',
    desc: 'Especializa-se no atributo primário da classe. O multiplicador do atributo mais alto sobe +0.2.',
    effect: 'Multiplicador primário ×+0.2 | Habilidade Legado ganha versão Evo',
  },
  {
    id: 'balanced',
    name: 'Evolução Equilibrada',
    icon: Shield,
    color: 'var(--color-info)',
    desc: 'Distribui o crescimento por todos os atributos. Ideal para personagens versáteis.',
    effect: 'Todos os multiplicadores ×+0.05 | +5 pontos de atributo extras',
  },
  {
    id: 'legacy',
    name: 'Evolução de Legado',
    icon: Star,
    color: 'var(--color-warning)',
    desc: 'Aprofunda a essência da classe. Habilidade Legado evolui para versão aprimorada (Evo+).',
    effect: 'Habilidade Legado ×2 de potência | +3 pontos de atributo no atributo CRM ou INT',
  },
]

// ── TransEvolution paths (Level 10) ──────────────────────────────────────────

const TRANSEVO_PATHS = [
  {
    id: 'ascendente',
    name: 'Ascendente',
    icon: Crown,
    color: 'var(--color-success)',
    desc: 'Atinge o ápice da classe original. Aperfeiçoa a habilidade Legado ao seu limite máximo e ganha resistência passiva.',
    effect: 'Habilidade Legado versão Máxima | +0.3 no multiplicador primário | Resistência elemental passiva',
    req: 'Soma de atributos base > 43',
  },
  {
    id: 'transcendente',
    name: 'Transcendente',
    icon: Sparkles,
    color: 'var(--accent-primary)',
    desc: 'Transcende os limites da classe. A classe é modificada em algo único, ganhando habilidade exclusiva de 3ª nível.',
    effect: 'Classe modificada (sufixo "Transcendente") | Nova habilidade exclusiva | Multiplicadores redistribuídos',
    req: 'Soma de atributos base > 43',
  },
  {
    id: 'descendente',
    name: 'Descendente',
    icon: Zap,
    color: 'var(--color-danger)',
    desc: 'Faz contrato com um ser Transcendente. Recebe poder imenso em troca de obrigações. Habilidade Assinatura única.',
    effect: 'Habilidade Assinatura do Transcendente | +0.5 num atributo | Penalidade em RES',
    req: 'Soma de atributos base > 43 + contrato roleplay',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAttrSum(char) {
  return Object.values(char.attributes || {}).reduce((s, v) => s + v, 0)
}

function getPrimaryAttr(char) {
  const mults = char.multipliers || {}
  let best = null; let bestMult = 0
  for (const [k, v] of Object.entries(mults)) {
    if (v > bestMult) { bestMult = v; best = k }
  }
  return best
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EvolutionModal({ character, onSave, onClose }) {
  const isLevel10 = character.level >= 10
  const attrSum = getAttrSum(character)
  const canTransEvo = attrSum > 43
  const paths = isLevel10 ? TRANSEVO_PATHS : EVOLUTION_PATHS
  const title = isLevel10 ? 'TransEvolução — Nível 10' : 'Evolução de Classe — Nível 5'

  const [selected, setSelected] = useState(character.evolution || null)
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (!selected) return
    const updated = { ...character, evolution: selected }

    // Apply mechanical effects
    if (!isLevel10) {
      if (selected === 'focused') {
        const pk = getPrimaryAttr(character)
        if (pk) {
          updated.multipliers = { ...character.multipliers, [pk]: +(((character.multipliers?.[pk] || 1) + 0.2).toFixed(2)) }
        }
      } else if (selected === 'balanced') {
        const newMults = {}
        for (const attr of ATTRIBUTES) {
          newMults[attr.key] = +(((character.multipliers?.[attr.key] || 1) + 0.05).toFixed(2))
        }
        updated.multipliers = newMults
      } else if (selected === 'legacy') {
        const newAttrs = { ...character.attributes }
        // +3 on whichever of crm/int is higher
        const crmVal = character.attributes?.crm || 0
        const intVal = character.attributes?.int || 0
        const target = intVal >= crmVal ? 'int' : 'crm'
        newAttrs[target] = newAttrs[target] + 3
        updated.attributes = newAttrs
      }
    }

    onSave(updated)
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <Sparkles size={48} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
        <h3 style={{ marginBottom: 8 }}>{isLevel10 ? 'TransEvolução' : 'Evolução'} Aplicada!</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          {character.name} agora é um <strong>{selected}</strong>.
        </p>
        <button className="btn btn-primary" onClick={onClose}>Fechar</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{title}</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4 }}>{character.name}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
          <span className="badge badge-warning">Nível {character.level}</span>
          <span className="badge badge-info">Soma base: {attrSum}</span>
          {isLevel10 && (
            <span className={`badge ${canTransEvo ? 'badge-success' : 'badge-danger'}`}>
              {canTransEvo ? '✓ Elegível' : '✗ Soma < 43'}
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {isLevel10
          ? 'Escolha o caminho de TransEvolução. Esta escolha é definitiva.'
          : 'Escolha o caminho de evolução da sua classe. Esta escolha é definitiva.'}
      </div>

      {/* Path cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {paths.map(path => {
          const Icon = path.icon
          const isSelected = selected === path.id
          const isLocked = isLevel10 && !canTransEvo
          return (
            <button
              key={path.id}
              onClick={() => !isLocked && setSelected(path.id)}
              disabled={isLocked}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                border: `2px solid ${isSelected ? path.color : 'var(--border-subtle)'}`,
                borderRadius: 8, padding: '10px 12px', cursor: isLocked ? 'not-allowed' : 'pointer',
                textAlign: 'left', opacity: isLocked ? 0.5 : 1,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <Icon size={20} style={{ color: path.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? path.color : 'var(--text-primary)' }}>
                  {path.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>{path.desc}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 5, fontStyle: 'italic' }}>
                  Efeito: {path.effect}
                </div>
                {path.req && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-warning)', marginTop: 3 }}>
                    Requisito: {path.req}
                  </div>
                )}
              </div>
              {isSelected && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: path.color, flexShrink: 0, marginTop: 2 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Confirm button */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selected || (isLevel10 && !canTransEvo)}
        >
          <Sparkles size={14} /> Confirmar {isLevel10 ? 'TransEvolução' : 'Evolução'}
        </button>
      </div>
    </div>
  )
}
