/* ============================================================
   VTP COALIZÃO — Dice Roller Utility
   Core dice rolling logic for D20 and D4 (only)
   ============================================================ */

/**
 * Rolls a single die with the given number of faces
 * @param {number} faces - Number of faces (20 or 4 only)
 * @returns {number} Result between 1 and faces
 */
export function rollDie(faces) {
  if (faces !== 20 && faces !== 4) {
    throw new Error(`Sistema Coalizão utiliza apenas D20 e D4. Dado D${faces} não é permitido.`)
  }
  return Math.floor(Math.random() * faces) + 1
}

/**
 * Rolls multiple dice
 * @param {number} count - Number of dice to roll
 * @param {number} faces - Number of faces per die (20 or 4)
 * @returns {number[]} Array of individual results
 */
export function rollDice(count, faces) {
  return Array.from({ length: count }, () => rollDie(faces))
}

/**
 * Classifies a D20 result according to Coalizão rules
 * @param {number} value - The die result (1-20)
 * @returns {{ label: string, type: string }}
 */
export function classifyD20(value) {
  if (value === 20) return { label: 'CRÍTICO!', type: 'critical' }
  if (value >= 13) return { label: 'Bom', type: 'good' }
  if (value >= 10) return { label: 'Normal', type: 'neutral' }
  if (value >= 2) return { label: 'Ruim', type: 'bad' }
  return { label: 'DESASTRE!', type: 'disaster' }
}

/**
 * Classifies a D4 result according to Coalizão rules
 * @param {number} value - The die result (1-4)
 * @returns {{ label: string, type: string }}
 */
export function classifyD4(value) {
  if (value === 4) return { label: 'Melhor', type: 'critical' }
  if (value === 3) return { label: 'Bom', type: 'good' }
  if (value === 2) return { label: 'Ruim', type: 'bad' }
  return { label: 'Pior', type: 'disaster' }
}

/**
 * Rolls with advantage (2 dice, take highest)
 */
export function rollAdvantage(faces) {
  const results = rollDice(2, faces)
  return {
    rolls: results,
    chosen: Math.max(...results),
    mode: 'vantagem',
  }
}

/**
 * Rolls with disadvantage (2 dice, take lowest)
 */
export function rollDisadvantage(faces) {
  const results = rollDice(2, faces)
  return {
    rolls: results,
    chosen: Math.min(...results),
    mode: 'desvantagem',
  }
}

/**
 * Calculates the attribute bonus from the final value
 * Bonus = floor(value / 5)
 */
export function calculateBonus(attributeValue) {
  return Math.floor(attributeValue / 5)
}

/**
 * Creates a complete roll result object for the log
 */
export function createRollResult({ diceType, count, results, modifier = 0, rollerName = 'Mestre', note = '' }) {
  const classify = diceType === 20 ? classifyD20 : classifyD4
  return {
    timestamp: new Date().toISOString(),
    diceType: `d${diceType}`,
    count,
    results: results.map(r => ({
      value: r,
      ...classify(r),
    })),
    modifier,
    total: results.reduce((a, b) => a + b, 0) + modifier,
    rollerName,
    note,
  }
}
