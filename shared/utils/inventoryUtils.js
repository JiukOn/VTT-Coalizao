/* inventoryUtils.js — Encumbrance, capacity, and equipment calculations for Coalizao system */

/**
 * Calculates max weight carrying capacity based on Force (FRC) attribute
 * Formula: Force * 5 kg (minimum 30 kg)
 * @param {number} frc Force attribute value (default: 10)
 * @returns {number} Max weight in kg
 */
export function calculateMaxWeight(frc = 10) {
  const force = typeof frc === 'number' && !isNaN(frc) ? frc : 10
  return Math.max(30, Math.round(force * 5))
}

/**
 * Calculates total weight of an items array
 * @param {Array} items Array of item objects with { weight, quantity }
 * @returns {number} Total weight in kg rounded to 1 decimal
 */
export function calculateTotalWeight(items = []) {
  if (!Array.isArray(items)) return 0
  const total = items.reduce((sum, item) => {
    const w = typeof item.weight === 'number' ? item.weight : 0
    const q = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
    return sum + (w * q)
  }, 0)
  return Math.round(total * 10) / 10
}

/**
 * Evaluates encumbrance state based on current and maximum weight
 * @param {number} currentWeight Total weight in kg
 * @param {number} maxWeight Maximum carrying capacity in kg
 * @returns {{ status: 'light'|'medium'|'overburdened', label: string, color: string, movementPenalty: number }}
 */
export function getEncumbranceStatus(currentWeight = 0, maxWeight = 50) {
  const max = maxWeight > 0 ? maxWeight : 50
  const ratio = currentWeight / max

  if (ratio <= 0.6) {
    return {
      status: 'light',
      label: 'Carga Leve',
      color: '#10B981',
      movementPenalty: 0,
    }
  } else if (ratio <= 1.0) {
    return {
      status: 'medium',
      label: 'Carga Pesada',
      color: '#F59E0B',
      movementPenalty: 0,
    }
  } else {
    return {
      status: 'overburdened',
      label: 'Sobrecarga (-2m Deslocamento)',
      color: '#EF4444',
      movementPenalty: 2,
    }
  }
}

/**
 * Calculates calculated AC and weapon stats from equipped gear
 * @param {object} equipment Equipped items keyed by slot { mainHand, offHand, armor, accessory }
 * @param {number} baseDexBonus Character Dexterity bonus
 * @returns {{ totalAc: number, armorAc: number, shieldBonus: number, mainWeapon: object|null }}
 */
export function calculateEquippedBonuses(equipment = {}, baseDexBonus = 0) {
  let armorAc = 10 + (baseDexBonus || 0)
  let shieldBonus = 0

  if (equipment.armor) {
    const baseArmor = equipment.armor.ac ?? equipment.armor.armorValue ?? 12
    armorAc = baseArmor + (equipment.armor.dexCap != null ? Math.min(baseDexBonus, equipment.armor.dexCap) : baseDexBonus)
  }

  if (equipment.offHand && (equipment.offHand.type === 'shield' || equipment.offHand.shieldBonus)) {
    shieldBonus = equipment.offHand.shieldBonus ?? equipment.offHand.acBonus ?? 2
  }

  const accessoryAc = equipment.accessory?.acBonus ?? 0

  const totalAc = Math.max(10, armorAc + shieldBonus + accessoryAc)

  return {
    totalAc,
    armorAc,
    shieldBonus,
    mainWeapon: equipment.mainHand || null,
  }
}
