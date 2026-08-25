/* craftingWorkshop.js — Weapon attachment modifications and crafting upgrades */

export const WEAPON_ATTACHMENTS = {
  holo_sight: {
    id: 'holo_sight',
    name: 'Mira Holográfica Reticular',
    type: 'sight',
    attackBonus: 1,
    cost: 75,
    icon: '🔭',
    desc: '+1 bônus em rolagens de ataque com armas de tiro.',
  },
  extended_barrel: {
    id: 'extended_barrel',
    name: 'Cano Estendido de Titânio',
    type: 'barrel',
    rangeBonus: 6,
    cost: 90,
    icon: '📏',
    desc: '+6 metros de alcance efetivo.',
  },
  suppressor: {
    id: 'suppressor',
    name: 'Supressor Tático Acústico',
    type: 'muzzle',
    silent: true,
    cost: 110,
    icon: '🔇',
    desc: 'O primeiro disparo em modo furtivo não revela a posição do atirador.',
  },
  extended_mag: {
    id: 'extended_mag',
    name: 'Célula de Munição Estendida',
    type: 'magazine',
    capacityBonus: 6,
    cost: 65,
    icon: '🔋',
    desc: '+6 tiros na capacidade máxima do pente/bateria.',
  },
}

/**
 * Installs an attachment onto a weapon
 * @param {object} weapon
 * @param {string} attachmentId
 * @returns {{ updatedWeapon: object, success: boolean, message: string }}
 */
export function installWeaponAttachment(weapon, attachmentId) {
  if (!weapon) return { updatedWeapon: weapon, success: false, message: 'Nenhuma arma selecionada.' }

  const attachment = WEAPON_ATTACHMENTS[attachmentId]
  if (!attachment) return { updatedWeapon: weapon, success: false, message: 'Módulo de acessório não reconhecido.' }

  const currentAttachments = Array.isArray(weapon.attachments) ? [...weapon.attachments] : []

  if (currentAttachments.some(a => a.id === attachmentId)) {
    return { updatedWeapon: weapon, success: false, message: 'Este módulo já está instalado nesta arma.' }
  }

  // Calculate new stats
  const nextAttachments = [...currentAttachments, { ...attachment }]
  const attackBonus = (weapon.baseAttackBonus || 0) + (attachment.attackBonus || 0)
  const ammoCapacity = (weapon.ammoCapacity || 12) + (attachment.capacityBonus || 0)
  const currentAmmo = Math.min(weapon.currentAmmo ?? ammoCapacity, ammoCapacity)

  const updatedWeapon = {
    ...weapon,
    baseAttackBonus: weapon.baseAttackBonus || weapon.attackBonus || 0,
    attackBonus: attackBonus,
    ammoCapacity,
    currentAmmo,
    attachments: nextAttachments,
  }

  return {
    updatedWeapon,
    success: true,
    message: `🔧 Módulo **${attachment.name}** instalado com sucesso em **${weapon.name}**!`,
  }
}

/**
 * Removes an attachment from a weapon
 * @param {object} weapon
 * @param {string} attachmentId
 * @returns {{ updatedWeapon: object, success: boolean, message: string }}
 */
export function removeWeaponAttachment(weapon, attachmentId) {
  if (!weapon || !Array.isArray(weapon.attachments)) {
    return { updatedWeapon: weapon, success: false, message: 'Nenhum módulo para remover.' }
  }

  const attachment = WEAPON_ATTACHMENTS[attachmentId]
  const nextAttachments = weapon.attachments.filter(a => a.id !== attachmentId)

  const attackBonus = Math.max(0, (weapon.attackBonus || 0) - (attachment?.attackBonus || 0))
  const ammoCapacity = Math.max(1, (weapon.ammoCapacity || 12) - (attachment?.capacityBonus || 0))
  const currentAmmo = Math.min(weapon.currentAmmo ?? ammoCapacity, ammoCapacity)

  const updatedWeapon = {
    ...weapon,
    attackBonus,
    ammoCapacity,
    currentAmmo,
    attachments: nextAttachments,
  }

  return {
    updatedWeapon,
    success: true,
    message: `🔩 Módulo removido de **${weapon.name}**.`,
  }
}
