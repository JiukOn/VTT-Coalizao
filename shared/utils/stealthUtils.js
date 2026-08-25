/* stealthUtils.js — Tactical stealth calculations, concealment and detection rules */

/**
 * Calculates stealth roll score
 * @param {number} dexBonus
 * @param {number} d20Roll
 * @returns {number}
 */
export function calculateStealthScore(dexBonus, d20Roll) {
  return (d20Roll ?? 10) + (dexBonus ?? 0)
}

/**
 * Checks if a stealthy entity is detected by an observer's passive perception
 * Passive Perception is usually: 10 + INT or PRE bonus
 * @param {number} stealthScore
 * @param {number} observerPassivePerception
 * @returns {boolean} True if detected (observer wins or ties), false if hidden
 */
export function isDetectedByPassivePerception(stealthScore, observerPassivePerception = 10) {
  return observerPassivePerception >= stealthScore
}

/**
 * Toggles or updates stealth mode state on an entity
 * @param {object} entity
 * @param {boolean} [forceActive]
 * @param {number} [score]
 * @returns {object} Updated entity copy
 */
export function toggleStealthMode(entity, forceActive = null, score = null) {
  if (!entity) return entity

  const currentlyActive = !!entity.stealth?.active
  const nextActive = forceActive !== null ? !!forceActive : !currentlyActive

  return {
    ...entity,
    stealth: {
      active: nextActive,
      score: nextActive ? (score ?? entity.stealth?.score ?? 15) : null,
    },
  }
}
