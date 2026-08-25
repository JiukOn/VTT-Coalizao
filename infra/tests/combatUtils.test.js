import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as diceRoller from '../../shared/utils/diceRoller.js';
import { rollInitiative, resolveMeleeAttack, resolveRangedAttack, resolveMagicAttack, resolveDodge } from '../../shared/utils/combatUtils.js';

describe('combatUtils', () => {
  let rollDiceSpy;
  
  beforeEach(() => {
    rollDiceSpy = vi.spyOn(diceRoller, 'rollDice');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rollInitiative', () => {
    it('sorts entities by total descending', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([15]);
      const entities = [
        { id: '1', dex: 10 }, // bonus 2 -> total 12
        { id: '2', dex: 5 }   // bonus 1 -> total 16
      ];
      const result = rollInitiative(entities);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });
    it('adds DEX bonus to roll', () => {
      rollDiceSpy.mockReturnValue([10]);
      const entities = [{ id: '1', dex: 15 }];
      const result = rollInitiative(entities);
      expect(result[0].initiativeTotal).toBe(13); // 10 + 3
    });
    it('includes classification for each roll', () => {
      rollDiceSpy.mockReturnValue([20]);
      const entities = [{ id: '1', dex: 10 }];
      const result = rollInitiative(entities);
      expect(result[0].classification).toBeDefined();
    });
  });

  describe('resolveMeleeAttack', () => {
    it('hit when attackTotal > defendTotal', () => {
      rollDiceSpy.mockReturnValueOnce([15]).mockReturnValueOnce([10]);
      const result = resolveMeleeAttack(10, 10); // attackerFRC: 10, defenderFRC: 10
      expect(result.hit).toBe(true);
    });
    it('miss when attackTotal <= defendTotal', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([15]);
      const result = resolveMeleeAttack(10, 10);
      expect(result.hit).toBe(false);
    });
    it('negateBonus when defendTotal > attackTotal', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([15]);
      const result = resolveMeleeAttack(10, 10);
      expect(result.negateBonus).toBe(true);
    });
    it('uses FRC for both attacker and defender', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([10]);
      const result = resolveMeleeAttack(15, 5); // +3, +1
      expect(result.attackTotal).toBe(13);
      expect(result.defendTotal).toBe(11);
    });
  });

  describe('resolveRangedAttack', () => {
    it('hit when attackTotal > defendTotal', () => {
      rollDiceSpy.mockReturnValueOnce([15]).mockReturnValueOnce([10]);
      const result = resolveRangedAttack(10, 10); // attackerPRE, defenderDEX
      expect(result.hit).toBe(true);
    });
    it('miss when defendTotal >= attackTotal', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([15]);
      const result = resolveRangedAttack(10, 10);
      expect(result.hit).toBe(false);
    });
    it('uses PRE for attacker, DEX for defender', () => {
      rollDiceSpy.mockReturnValueOnce([10]).mockReturnValueOnce([10]);
      const result = resolveRangedAttack(20, 5); // +4, +1
      expect(result.attackTotal).toBe(14);
      expect(result.defendTotal).toBe(11);
    });
  });

  describe('resolveMagicAttack', () => {
    it('spell formation fails when formationTotal < 12', () => {
      rollDiceSpy.mockReturnValueOnce([5]);
      const result = resolveMagicAttack(10, 10, 10); // attackerPRE, attackerENR, defenderRES
      expect(result.formed).toBe(false);
    });
    it('spell formation succeeds when formationTotal >= 12', () => {
      rollDiceSpy.mockReturnValueOnce([15]).mockReturnValueOnce([10]).mockReturnValueOnce([10]);
      const result = resolveMagicAttack(10, 10, 10);
      expect(result.formed).toBe(true);
    });
    it('hit when ENR attack > RES defend (after formation)', () => {
      rollDiceSpy.mockReturnValueOnce([15]).mockReturnValueOnce([15]).mockReturnValueOnce([10]);
      const result = resolveMagicAttack(10, 15, 10); // INT +2 (wait, parameter is PRE? Ah, it says attackerPRE), ENR 15, RES 10
      expect(result.hit).toBe(true);
    });
  });

  describe('resolveDodge', () => {
    it('dodged when dodgeTotal > attackerRollTotal', () => {
      rollDiceSpy.mockReturnValueOnce([15]);
      const result = resolveDodge(10, 16); // defenderDEX
      expect(result.dodged).toBe(true);
    });
    it('not dodged when dodgeTotal <= attackerRollTotal', () => {
      rollDiceSpy.mockReturnValueOnce([10]);
      const result = resolveDodge(10, 15);
      expect(result.dodged).toBe(false);
    });
  });
});
