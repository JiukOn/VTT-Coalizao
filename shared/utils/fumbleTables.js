/* fumbleTables.js — Dramatic complications and mishaps for Natural 1 / Fumble rolls */

export const FUMBLE_COMPLICATIONS = [
  {
    id: 'weapon_jammed',
    type: 'ranged',
    title: 'Arma Emperrada / Superaquecida',
    desc: 'O mecanismo da arma trava. Requer 1 Ação Menor para desarmar e desobstruir antes de poder atirar novamente.',
    severity: 'Moderada',
    color: '#F59E0B',
  },
  {
    id: 'loss_of_balance',
    type: 'melee',
    title: 'Perda Brutal de Equilíbrio',
    desc: 'O golpe passa no vazio e o combatente escorrega, caindo no chão e ficando com a condição Derrubado.',
    severity: 'Moderada',
    color: '#EF4444',
  },
  {
    id: 'friendly_fire',
    type: 'ranged',
    title: 'Ricochete / Fogo Amigo',
    desc: 'O projétil desvia num obstáculo e atinge um aliado a até 3m do alvo, causando metade do dano normal da arma.',
    severity: 'Grave',
    color: '#DC2626',
  },
  {
    id: 'disarmed',
    type: 'melee',
    title: 'Arma Desarmada / Escorregou',
    desc: 'A força do impacto faz o cabo escapar das mãos. A arma cai a 1.5m de distância no chão.',
    severity: 'Moderada',
    color: '#F59E0B',
  },
  {
    id: 'energy_backfire',
    type: 'magic',
    title: 'Sobrecarga de Retorno Neural',
    desc: 'O condutor psiônico falha e a energia rebate no invocador, causando 1d4 de dano de ENR direto e Atordoamento por 1 turno.',
    severity: 'Grave',
    color: '#9333EA',
  },
  {
    id: 'exposed_flank',
    type: 'all',
    title: 'Ponto Cego Totalmente Exposto',
    desc: 'A guarda se abre completamente. O próximo ataque recebido antes do seu próximo turno terá Vantagem.',
    severity: 'Leve',
    color: '#38BDF8',
  },
]

/**
 * Draws a random fumble complication based on attack/action type
 * @param {'melee'|'ranged'|'magic'|'all'} type
 * @returns {object}
 */
export function drawRandomFumble(type = 'all') {
  const pool = type === 'all'
    ? FUMBLE_COMPLICATIONS
    : FUMBLE_COMPLICATIONS.filter(f => f.type === type || f.type === 'all')

  const chosenList = pool.length > 0 ? pool : FUMBLE_COMPLICATIONS
  return chosenList[Math.floor(Math.random() * chosenList.length)]
}
