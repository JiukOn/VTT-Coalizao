/* merchantShop.js — NPC merchant shops, catalog presets, buy/sell transactions */

export const MERCHANT_CATALOGS = {
  weaponsmith: {
    id: 'weaponsmith',
    name: 'Arsenal do Sindicato',
    desc: 'Armas de fogo, lâminas reforçadas e munições militares.',
    items: [
      { id: 'item_knife', name: 'Faca Tática de Titânio', type: 'melee', damage: '1d6', cost: 45, weight: 1, icon: '🔪' },
      { id: 'item_pistol', name: 'Pistola Pesada .45', type: 'ranged', damage: '1d8', cost: 120, weight: 2, ammoCapacity: 12, icon: '🔫' },
      { id: 'item_rifle', name: 'Rifle de Assalto Cinético', type: 'ranged', damage: '1d10', cost: 280, weight: 4, ammoCapacity: 30, icon: '⚡' },
      { id: 'item_ammo', name: 'Cartuchos de Munição (x20)', type: 'ammo', cost: 25, weight: 0.5, icon: '📦' },
    ],
  },
  apothecary: {
    id: 'apothecary',
    name: 'Boticário Bioquímico',
    desc: 'Estimulantes neurais, curativos rápidos e antídotos.',
    items: [
      { id: 'item_medkit', name: 'Kit Médico de Campo', type: 'consumable', healHp: 10, cost: 60, weight: 1, icon: '🩹' },
      { id: 'item_stim', name: 'Estimulante de Adrenalina', type: 'consumable', healEnr: 8, cost: 50, weight: 0.5, icon: '🧪' },
      { id: 'item_antidote', name: 'Soro Universal Anticontaminação', type: 'consumable', cost: 40, weight: 0.5, icon: '💉' },
    ],
  },
}

/**
 * Purchases an item from merchant and transfers to player entity
 * @param {object} playerEntity
 * @param {object} item
 * @returns {{ updatedPlayer: object, success: boolean, message: string }}
 */
export function buyItemFromMerchant(playerEntity, item) {
  if (!playerEntity || !item) {
    return { updatedPlayer: playerEntity, success: false, message: 'Dados de compra inválidos.' }
  }

  const currentMoney = playerEntity.money ?? playerEntity.credits ?? 0
  const cost = item.cost || 0

  if (currentMoney < cost) {
    return {
      updatedPlayer: playerEntity,
      success: false,
      message: `Créditos insuficientes! Você precisa de ${cost} Cr$ (Possui ${currentMoney} Cr$).`,
    }
  }

  const updatedMoney = currentMoney - cost
  const currentInventory = Array.isArray(playerEntity.inventory) ? [...playerEntity.inventory] : []
  currentInventory.push({ ...item })

  const updatedPlayer = {
    ...playerEntity,
    money: updatedMoney,
    credits: updatedMoney,
    inventory: currentInventory,
  }

  return {
    updatedPlayer,
    success: true,
    message: `🛒 Compra realizada: **${item.name}** por ${cost} Cr$!`,
  }
}

/**
 * Sells an item from player inventory back to merchant for credits
 * @param {object} playerEntity
 * @param {number} itemIndex
 * @param {number} sellRate Default 50% (0.5)
 * @returns {{ updatedPlayer: object, success: boolean, earnedCredits: number, message: string }}
 */
export function sellItemToMerchant(playerEntity, itemIndex, sellRate = 0.5) {
  if (!playerEntity || !Array.isArray(playerEntity.inventory)) {
    return { updatedPlayer: playerEntity, success: false, earnedCredits: 0, message: 'Inventário inválido.' }
  }

  const inventory = [...playerEntity.inventory]
  if (itemIndex < 0 || itemIndex >= inventory.length) {
    return { updatedPlayer: playerEntity, success: false, earnedCredits: 0, message: 'Item não encontrado.' }
  }

  const [soldItem] = inventory.splice(itemIndex, 1)
  const baseCost = soldItem.cost || 20
  const earnedCredits = Math.max(1, Math.floor(baseCost * sellRate))

  const currentMoney = playerEntity.money ?? playerEntity.credits ?? 0
  const updatedMoney = currentMoney + earnedCredits

  const updatedPlayer = {
    ...playerEntity,
    money: updatedMoney,
    credits: updatedMoney,
    inventory,
  }

  return {
    updatedPlayer,
    success: true,
    earnedCredits,
    message: `💰 Venda concluída: **${soldItem.name}** vendido por +${earnedCredits} Cr$!`,
  }
}
