import { describe, it, expect } from 'vitest'
import { checkOpportunityAttack } from '../../shared/utils/opportunityAttack.js'

describe('Opportunity Attack Detection', () => {
  it('triggers when moving from inside melee reach to outside', () => {
    const enemyPos = { x: 100, y: 100 }
    const oldPos = { x: 120, y: 100 } // distance = 20px (<= 40px)
    const newPos = { x: 200, y: 100 } // distance = 100px (> 40px)

    const provoked = checkOpportunityAttack(oldPos, newPos, enemyPos, 1.5, 40)
    expect(provoked).toBe(true)
  })

  it('does not trigger when moving within melee reach', () => {
    const enemyPos = { x: 100, y: 100 }
    const oldPos = { x: 120, y: 100 } // dist = 20px
    const newPos = { x: 100, y: 120 } // dist = 20px

    const provoked = checkOpportunityAttack(oldPos, newPos, enemyPos, 1.5, 40)
    expect(provoked).toBe(false)
  })

  it('does not trigger when starting already outside melee reach', () => {
    const enemyPos = { x: 100, y: 100 }
    const oldPos = { x: 300, y: 300 } // dist = 282px
    const newPos = { x: 350, y: 350 } // dist = 353px

    const provoked = checkOpportunityAttack(oldPos, newPos, enemyPos, 1.5, 40)
    expect(provoked).toBe(false)
  })
})
