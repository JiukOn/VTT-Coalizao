/* opposedRolls.js — Opposed attribute check resolver for tactical combat */
import { rollDice, classifyD20 } from './diceRoller.js'

/**
 * Resolves an opposed attribute check between two combatants
 * @param {object} params
 * @param {string} params.attackerName Name of the initiating character
 * @param {string} params.attackerAttr Label of attacker attribute (e.g. FRC, DEX, INT)
 * @param {number} params.attackerBonus Attacker modifier bonus
 * @param {string} params.defenderName Name of the defending character
 * @param {string} params.defenderAttr Label of defender attribute (e.g. FRC, RES, PRE)
 * @param {number} params.defenderBonus Defender modifier bonus
 * @returns {object} Full opposed roll resolution
 */
export function resolveOpposedCheck({
  attackerName = 'Atacante',
  attackerAttr = 'FRC',
  attackerBonus = 0,
  defenderName = 'Defensor',
  defenderAttr = 'FRC',
  defenderBonus = 0,
} = {}) {
  const [attackerDie] = rollDice(1, 20)
  const [defenderDie] = rollDice(1, 20)

  const attackerTotal = attackerDie + (attackerBonus || 0)
  const defenderTotal = defenderDie + (defenderBonus || 0)

  const attackerClass = classifyD20(attackerDie)
  const defenderClass = classifyD20(defenderDie)

  const diff = attackerTotal - defenderTotal
  let winner = 'draw'
  let outcomeText = ''

  if (diff > 0) {
    winner = 'attacker'
    outcomeText = `⚔️ **${attackerName}** venceu a disputa contra **${defenderName}** por uma margem de +${diff}!`
  } else if (diff < 0) {
    winner = 'defender'
    outcomeText = `🛡️ **${defenderName}** resistiu e superou a tentativa de **${attackerName}** por ${Math.abs(diff)} pontos!`
  } else {
    winner = 'draw'
    outcomeText = `⚖️ **Empate Tático!** Ambos obtiveram total de ${attackerTotal}.`
  }

  return {
    attacker: {
      name: attackerName,
      attr: attackerAttr,
      bonus: attackerBonus,
      die: attackerDie,
      total: attackerTotal,
      classification: attackerClass,
    },
    defender: {
      name: defenderName,
      attr: defenderAttr,
      bonus: defenderBonus,
      die: defenderDie,
      total: defenderTotal,
      classification: defenderClass,
    },
    diff,
    winner,
    outcomeText,
  }
}
