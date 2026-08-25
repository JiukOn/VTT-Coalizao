import { describe, it, expect } from 'vitest'
import { drawInitiativeCards, ACTION_CARDS } from '../../shared/utils/initiativeDeck.js'

describe('Initiative Action Deck System', () => {
  it('draws requested number of valid action cards', () => {
    const cards = drawInitiativeCards(3)

    expect(cards.length).toBe(3)
    expect(cards[0].id).toBeTypeOf('string')
    expect(cards[0].title).toBeTypeOf('string')
    expect(cards[0].effect).toBeTypeOf('string')
  })

  it('contains expected core card modifiers', () => {
    const blitz = ACTION_CARDS.find(c => c.id === 'blitz_strike')
    expect(blitz.initBonus).toBe(5)

    const defense = ACTION_CARDS.find(c => c.id === 'defensive_stance')
    expect(defense.initBonus).toBe(-2)
  })
})
