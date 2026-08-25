/* lingeringInjuries.js — Dramatic lingering injury and critical trauma tables for Coalizão RPG */

export const LINGERING_INJURIES = [
  {
    id: 'optical_trauma',
    name: 'Trauma Óptico / Cegueira Parcial',
    icon: '👁️',
    severity: 'grave',
    effect: 'Desvantagem em todos os testes de Precisão (PRE) e Percepção à distância até receber cirurgia médica.',
  },
  {
    id: 'motor_overload',
    name: 'Sobrecarga Motora / Membro Fraturado',
    icon: '🦾',
    severity: 'moderada',
    effect: 'Deslocamento reduzido em -2 metros (1 célula) e Desvantagem em testes de Atletismo/Acrobacia.',
  },
  {
    id: 'neural_concussion',
    name: 'Concussão Neural Severa',
    icon: '🧠',
    severity: 'moderada',
    effect: '-1 em todos os testes de Inteligência (INT) e Carisma (CRM) por 24 horas.',
  },
  {
    id: 'cracked_ribs',
    name: 'Costelas Fraturadas',
    icon: '🫁',
    severity: 'moderada',
    effect: 'Ações de corrida ou movimentação forçada causam 1 de dano de ENR imediato por esforço pulmonar.',
  },
  {
    id: 'bio_fissure',
    name: 'Fissura Bioquímica / Hemorragia Interna',
    icon: '⚡',
    severity: 'leve',
    effect: 'A recuperação de HP em descansos curtos é reduzida pela metade até sutura.',
  },
]

/**
 * Draws or rolls a lingering injury
 * @param {number} [index] Optional index or d20 roll
 * @returns {object} Selected injury
 */
export function rollLingeringInjury(index = null) {
  if (index !== null && index >= 0 && index < LINGERING_INJURIES.length) {
    return LINGERING_INJURIES[index]
  }
  const picked = Math.floor(Math.random() * LINGERING_INJURIES.length)
  return LINGERING_INJURIES[picked]
}
