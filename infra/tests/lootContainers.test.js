import { describe, it, expect } from 'vitest'
import {
  createLootContainer,
  lootItemFromContainer,
  lootAllFromContainer,
  findNearbyLootContainers,
} from '../../shared/utils/lootContainers.js'

describe('Loot Containers System', () => {
  it('creates a new loot container with items and credits', () => {
    const container = createLootContainer({
      title: 'Cofre Secreto',
      credits: 120,
      items: [{ name: 'Rifle Laser', damage: '1d10' }],
      locked: true,
      dc: 15,
    })

    expect(container.id).toMatch(/^loot_/)
    expect(container.title).toBe('Cofre Secreto')
    expect(container.credits).toBe(120)
    expect(container.items.length).toBe(1)
    expect(container.locked).toBe(true)
    expect(container.dc).toBe(15)
  })

  it('transfers single item to player inventory', () => {
    const container = createLootContainer({
      items: [{ name: 'Faca Tática' }, { name: 'Granada' }],
    })
    const player = { name: 'Aurelio', inventory: [] }

    const { updatedContainer, updatedPlayer, lootedItem } = lootItemFromContainer(container, 0, player)

    expect(lootedItem.name).toBe('Faca Tática')
    expect(updatedContainer.items.length).toBe(1)
    expect(updatedPlayer.inventory.length).toBe(1)
    expect(updatedPlayer.inventory[0].name).toBe('Faca Tática')
  })

  it('loots all items and credits at once', () => {
    const container = createLootContainer({
      credits: 200,
      items: [{ name: 'Item 1' }, { name: 'Item 2' }],
    })
    const player = { name: 'Aurelio', inventory: [], credits: 50 }

    const { updatedContainer, updatedPlayer, lootedItemsCount, lootedCredits } = lootAllFromContainer(container, player)

    expect(lootedItemsCount).toBe(2)
    expect(lootedCredits).toBe(200)
    expect(updatedContainer.items.length).toBe(0)
    expect(updatedContainer.credits).toBe(0)
    expect(updatedPlayer.inventory.length).toBe(2)
    expect(updatedPlayer.credits).toBe(250)
  })

  it('finds nearby loot containers within interaction range', () => {
    const containers = [
      { id: 'c1', x: 100, y: 100 },
      { id: 'c2', x: 500, y: 500 },
    ]
    const nearby = findNearbyLootContainers({ x: 120, y: 100 }, containers, 40, 1.8)
    expect(nearby.length).toBe(1)
    expect(nearby[0].id).toBe('c1')
  })
})
