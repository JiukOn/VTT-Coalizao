/* lootContainers.js — Utilities for map loot containers, chests, and player inventory looting */

/**
 * Creates a new loot container object
 * @param {object} params
 * @param {string} params.title Container name (e.g. 'Baú de Madeira Reforçado')
 * @param {number} params.credits Currency/credits contained
 * @param {Array<object>} params.items List of inventory items
 * @param {boolean} params.locked Whether the chest is locked
 * @param {number|null} params.dc Disarm/lockpick DC
 * @returns {object}
 */
export function createLootContainer({
  title = 'Baú de Espólios',
  credits = 0,
  items = [],
  locked = false,
  dc = null,
} = {}) {
  return {
    id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    credits: Math.max(0, credits),
    items: Array.isArray(items) ? [...items] : [],
    locked: !!locked,
    dc: dc !== null && !isNaN(dc) ? Number(dc) : null,
    opened: false,
  }
}

/**
 * Transfers a single item from container to player entity inventory
 * @param {object} container
 * @param {number} itemIndex
 * @param {object} playerEntity
 * @returns {{ updatedContainer: object, updatedPlayer: object, lootedItem: object|null }}
 */
export function lootItemFromContainer(container, itemIndex, playerEntity) {
  if (!container || !playerEntity || !Array.isArray(container.items)) {
    return { updatedContainer: container, updatedPlayer: playerEntity, lootedItem: null }
  }

  const items = [...container.items]
  if (itemIndex < 0 || itemIndex >= items.length) {
    return { updatedContainer: container, updatedPlayer: playerEntity, lootedItem: null }
  }

  const [lootedItem] = items.splice(itemIndex, 1)
  const currentInventory = Array.isArray(playerEntity.inventory) ? [...playerEntity.inventory] : []
  currentInventory.push(lootedItem)

  const updatedContainer = {
    ...container,
    items,
    opened: true,
  }

  const updatedPlayer = {
    ...playerEntity,
    inventory: currentInventory,
  }

  return { updatedContainer, updatedPlayer, lootedItem }
}

/**
 * Transfers all items and credits from container to player entity
 * @param {object} container
 * @param {object} playerEntity
 * @returns {{ updatedContainer: object, updatedPlayer: object, lootedItemsCount: number, lootedCredits: number }}
 */
export function lootAllFromContainer(container, playerEntity) {
  if (!container || !playerEntity) {
    return { updatedContainer: container, updatedPlayer: playerEntity, lootedItemsCount: 0, lootedCredits: 0 }
  }

  const itemsToTransfer = Array.isArray(container.items) ? [...container.items] : []
  const creditsToTransfer = container.credits || 0

  const currentInventory = Array.isArray(playerEntity.inventory) ? [...playerEntity.inventory] : []
  const updatedInventory = [...currentInventory, ...itemsToTransfer]

  const currentMoney = playerEntity.money || playerEntity.credits || 0
  const updatedMoney = currentMoney + creditsToTransfer

  const updatedContainer = {
    ...container,
    items: [],
    credits: 0,
    opened: true,
  }

  const updatedPlayer = {
    ...playerEntity,
    inventory: updatedInventory,
    money: updatedMoney,
    credits: updatedMoney,
  }

  return {
    updatedContainer,
    updatedPlayer,
    lootedItemsCount: itemsToTransfer.length,
    lootedCredits: creditsToTransfer,
  }
}

/**
 * Finds loot containers near player position (within maxDistanceMeters)
 * @param {{x: number, y: number}} playerPos
 * @param {Array<object>} containers List of containers with {x, y} coordinates
 * @param {number} gridSize Grid cell pixel size (default: 40)
 * @param {number} maxDistanceMeters Maximum distance in meters to interact (default: 1.8m)
 * @returns {Array<object>}
 */
export function findNearbyLootContainers(playerPos, containers = [], gridSize = 40, maxDistanceMeters = 1.8) {
  if (!playerPos || !Array.isArray(containers)) return []

  const maxDistPx = (maxDistanceMeters / 1.5) * gridSize

  return containers.filter(c => {
    if (c.x == null || c.y == null) return false
    const dist = Math.hypot(c.x - playerPos.x, c.y - playerPos.y)
    return dist <= maxDistPx
  })
}
