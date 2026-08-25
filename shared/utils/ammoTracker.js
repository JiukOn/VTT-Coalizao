/* ammoTracker.js — Tactical ammunition tracking and reloading system for ranged weapons */

/**
 * Gets the current ammo status of a weapon
 * @param {object} weapon
 * @returns {{ current: number, capacity: number, isRanged: boolean }}
 */
export function getWeaponAmmo(weapon) {
  if (!weapon) return { current: 0, capacity: 0, isRanged: false }

  const capacity = weapon.ammoCapacity ?? 12
  const current = weapon.currentAmmo ?? capacity
  const isRanged = weapon.type === 'ranged' || weapon.category === 'ranged' || !!weapon.range || !!weapon.ammoCapacity

  return {
    current: Math.max(0, current),
    capacity: Math.max(1, capacity),
    isRanged,
  }
}

/**
 * Consumes ammo from a weapon
 * @param {object} weapon
 * @param {number} count
 * @returns {{ updatedWeapon: object, success: boolean, remainingAmmo: number, message: string }}
 */
export function consumeWeaponAmmo(weapon, count = 1) {
  if (!weapon) {
    return { updatedWeapon: weapon, success: false, remainingAmmo: 0, message: 'Nenhuma arma selecionada.' }
  }

  const { current, capacity } = getWeaponAmmo(weapon)

  if (current < count) {
    return {
      updatedWeapon: weapon,
      success: false,
      remainingAmmo: current,
      message: '⚠️ Pente vazio! A arma precisa ser recarregada.',
    }
  }

  const remainingAmmo = current - count
  const updatedWeapon = {
    ...weapon,
    ammoCapacity: capacity,
    currentAmmo: remainingAmmo,
  }

  return {
    updatedWeapon,
    success: true,
    remainingAmmo,
    message: `🔫 Disparo realizado (${remainingAmmo}/${capacity} munições restantes).`,
  }
}

/**
 * Reloads a weapon to full capacity
 * @param {object} weapon
 * @param {number} [ammoAvailable] Optional total pool of ammo available
 * @returns {{ updatedWeapon: object, reloadedCount: number, message: string }}
 */
export function reloadWeaponAmmo(weapon, ammoAvailable = null) {
  if (!weapon) return { updatedWeapon: weapon, reloadedCount: 0, message: 'Nenhuma arma para recarregar.' }

  const { current, capacity } = getWeaponAmmo(weapon)
  const needed = capacity - current

  if (needed <= 0) {
    return { updatedWeapon: weapon, reloadedCount: 0, message: 'O pente já está cheio.' }
  }

  const reloadAmount = ammoAvailable !== null ? Math.min(needed, ammoAvailable) : needed
  const nextAmmo = current + reloadAmount

  const updatedWeapon = {
    ...weapon,
    ammoCapacity: capacity,
    currentAmmo: nextAmmo,
  }

  return {
    updatedWeapon,
    reloadedCount: reloadAmount,
    message: `🔄 Arma recarregada com sucesso (+${reloadAmount} munições ➔ ${nextAmmo}/${capacity})!`,
  }
}
