/* heroicPoints.js — Heroic inspiration points management and epic actions */

const MAX_HEROIC_POINTS = 3

/**
 * Adds heroic inspiration points to a player entity
 * @param {object} entity
 * @param {number} amount
 * @returns {object} Updated entity copy
 */
export function awardHeroicPoint(entity, amount = 1) {
  if (!entity) return entity
  const current = entity.heroicPoints || 0
  const updated = Math.min(MAX_HEROIC_POINTS, current + amount)
  return {
    ...entity,
    heroicPoints: updated,
  }
}

/**
 * Consumes a heroic point to perform an epic action
 * @param {object} entity
 * @param {'super_advantage'|'energy_surge'} actionType
 * @returns {{ updatedEntity: object, success: boolean, message: string }}
 */
export function consumeHeroicPoint(entity, actionType = 'super_advantage') {
  if (!entity || (entity.heroicPoints || 0) <= 0) {
    return {
      updatedEntity: entity,
      success: false,
      message: 'Você não possui Pontos Heroicos disponíveis.',
    }
  }

  const newPoints = (entity.heroicPoints || 0) - 1

  if (actionType === 'energy_surge') {
    const curEnr = entity.enr ?? 0
    const maxEnr = entity.maxEnr ?? 20
    const nextEnr = Math.min(maxEnr, curEnr + 8)

    return {
      updatedEntity: {
        ...entity,
        heroicPoints: newPoints,
        enr: nextEnr,
      },
      success: true,
      message: `⚡ Ponto Heroico gasto: Sobrecarga de Energia (+8 ENR ➔ ${nextEnr}/${maxEnr}).`,
    }
  }

  // Default: Super-Advantage (3d20)
  return {
    updatedEntity: {
      ...entity,
      heroicPoints: newPoints,
    },
    success: true,
    message: '⭐ Ponto Heroico ativado: Super-Vantagem na próxima rolagem (3d20)!',
  }
}
