/* coalizaoConditions.js — Canonical conditions, curses and diseases from Coalizão RPG database */

export const COALIZAO_CONDITIONS = {
  sangralisia: {
    id: 'sangralisia',
    name: 'Sangralisia',
    category: 'maldicao',
    icon: '🩸',
    color: '#DC2626',
    desc: 'Quando sob efeito de Sangramento, deve rolar 1d4 >= 2; se falhar, fica paralisado e incapaz de se mover.',
    checkDice: '1d4',
    checkThreshold: 2,
  },
  steel_flu: {
    id: 'steel_flu',
    name: 'Gripe do Aço',
    category: 'doenca',
    icon: '⚙️',
    color: '#94A3B8',
    desc: 'Causa fraqueza e pele prateada. Se 1d20 <= 7 no início do turno, sofre 1 de dano. Transmissível pelo ar.',
    checkDice: '1d20',
    checkDamageThreshold: 7,
  },
  short_circuit: {
    id: 'short_circuit',
    name: 'Curto-Circuito',
    category: 'condicao',
    icon: '⚡',
    color: '#F59E0B',
    desc: 'Interferência elétrica grave. O afetado perde o controle e fica impedido de conjurar habilidades de Energia.',
  },
  florescence: {
    id: 'florescence',
    name: 'Florescência',
    category: 'maldicao',
    icon: '🌸',
    color: '#EC4899',
    desc: 'Crescimento vegetal parasita que brota na pele e drena vitalidade ao longo do tempo.',
  },
  burning: {
    id: 'burning',
    name: 'Queimadura',
    category: 'condicao',
    icon: '🔥',
    color: '#EA580C',
    desc: 'Chamas ativas causando 1d4 de dano de Fogo no início de cada rodada.',
  },
  freezing: {
    id: 'freezing',
    name: 'Congelamento',
    category: 'condicao',
    icon: '❄️',
    color: '#38BDF8',
    desc: 'Cristais de gelo cobrem o corpo, reduzindo o deslocamento em 50% e aplicando Desvantagem em testes de Destreza.',
  },
  bleeding: {
    id: 'bleeding',
    name: 'Sangramento',
    category: 'condicao',
    icon: '🩸',
    color: '#EF4444',
    desc: 'Hemorragia contínua que impede a regeneração natural e causa 1 de dano ao realizar ações físicas pesadas.',
  },
  unconscious: {
    id: 'unconscious',
    name: 'Inconsciente',
    category: 'condicao',
    icon: '💤',
    color: '#6B7280',
    desc: 'Incapacitado e desacordado. Falha automática em testes de Força e Destreza.',
  },
}

/**
 * Resolves periodic tick or trigger test for a Coalizão condition
 * @param {string} conditionId
 * @param {object} entity
 * @param {number} [diceRoll] Pre-rolled test result
 * @returns {{ canMove: boolean, damageTaken: number, message: string }}
 */
export function resolveConditionTick(conditionId, entity, diceRoll = null) {
  if (conditionId === 'sangralisia') {
    const d4 = diceRoll !== null ? diceRoll : Math.floor(Math.random() * 4) + 1
    const passed = d4 >= 2
    return {
      canMove: passed,
      damageTaken: 0,
      message: passed
        ? `🩸 **Sangralisia Superada** (1d4 [${d4}] >= 2): Movimento liberado.`
        : `🩸 **Sangralisia Ativada** (1d4 [${d4}] < 2): O personagem está paralisado e não pode se mover!`,
    }
  }

  if (conditionId === 'steel_flu') {
    const d20 = diceRoll !== null ? diceRoll : Math.floor(Math.random() * 20) + 1
    const takesDamage = d20 <= 7
    return {
      canMove: true,
      damageTaken: takesDamage ? 1 : 0,
      message: takesDamage
        ? `⚙️ **Gripe do Aço** (1d20 [${d20}] <= 7): O corpo prateado sofreu 1 de dano!`
        : `⚙️ **Gripe do Aço** (1d20 [${d20}] > 7): Resistiu ao espasmo metálico.`,
    }
  }

  if (conditionId === 'burning') {
    const d4 = diceRoll !== null ? diceRoll : Math.floor(Math.random() * 4) + 1
    return {
      canMove: true,
      damageTaken: d4,
      message: `🔥 **Queimadura** causou ${d4} de dano de Fogo neste turno.`,
    }
  }

  return { canMove: true, damageTaken: 0, message: '' }
}
