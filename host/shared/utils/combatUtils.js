/* ============================================================
   VTP COALIZÃO — Combat Utility Functions
   Initiative, attack resolution, damage calculation
   ============================================================ */

import { rollDice, classifyD20 } from './diceRoller.js'
import { getBonus } from '../../../src/utils/characterUtils.js'

/**
 * Rolls initiative for a list of entities
 * @param {Array} entities - Array of { id, name, dex } objects
 * @returns {Array} Sorted array with initiative results
 */
export function rollInitiative(entities) {
  return entities
    .map(entity => {
      const roll = rollDice(1, 20)[0]
      const bonus = getBonus(entity.dex || 0)
      return {
        ...entity,
        initiativeRoll: roll,
        initiativeBonus: bonus,
        initiativeTotal: roll + bonus,
        classification: classifyD20(roll),
      }
    })
    .sort((a, b) => b.initiativeTotal - a.initiativeTotal)
}

/**
 * Resolves a melee attack (corpo a corpo)
 * Attacker: 1d20 + FRC vs Defender: 1d20 + FRC
 */
export function resolveMeleeAttack(attackerFRC, defenderFRC) {
  const attackRoll = rollDice(1, 20)[0]
  const defendRoll = rollDice(1, 20)[0]
  const attackTotal = attackRoll + getBonus(attackerFRC)
  const defendTotal = defendRoll + getBonus(defenderFRC)

  return {
    attackRoll, defendRoll,
    attackTotal, defendTotal,
    hit: attackTotal > defendTotal,
    negateBonus: defendTotal > attackTotal, // defender negates FRC bonus from damage
  }
}

/**
 * Resolves a ranged attack (distância)
 * Attacker: 1d20 + PRE vs Defender: 1d20 + DEX
 */
export function resolveRangedAttack(attackerPRE, defenderDEX) {
  const attackRoll = rollDice(1, 20)[0]
  const defendRoll = rollDice(1, 20)[0]
  const attackTotal = attackRoll + getBonus(attackerPRE)
  const defendTotal = defendRoll + getBonus(defenderDEX)

  return {
    attackRoll, defendRoll,
    attackTotal, defendTotal,
    hit: attackTotal > defendTotal,
  }
}

/**
 * Resolves a magic attack (mágico)
 * Step 1: 1d20 + PRE >= 12 (formation)
 * Step 2: 1d20 + ENR vs 1d20 + RES (hit)
 */
export function resolveMagicAttack(attackerPRE, attackerENR, defenderRES) {
  const formationRoll = rollDice(1, 20)[0]
  const formationTotal = formationRoll + getBonus(attackerPRE)
  const formed = formationTotal >= 12

  if (!formed) {
    return { formed: false, formationRoll, formationTotal, hit: false }
  }

  const attackRoll = rollDice(1, 20)[0]
  const defendRoll = rollDice(1, 20)[0]
  const attackTotal = attackRoll + getBonus(attackerENR)
  const defendTotal = defendRoll + getBonus(defenderRES)

  return {
    formed: true, formationRoll, formationTotal,
    attackRoll, defendRoll,
    attackTotal, defendTotal,
    hit: attackTotal > defendTotal,
  }
}

/**
 * Resolves a dodge attempt (esquiva)
 * Defender: 1d20 + DEX vs attacker's roll
 */
export function resolveDodge(defenderDEX, attackerRollTotal) {
  const dodgeRoll = rollDice(1, 20)[0]
  const dodgeTotal = dodgeRoll + getBonus(defenderDEX)

  return {
    dodgeRoll,
    dodgeTotal,
    dodged: dodgeTotal > attackerRollTotal,
  }
}
