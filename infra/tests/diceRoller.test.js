import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rollDie, rollDice, classifyD20, classifyD4,
  rollAdvantage, rollDisadvantage, calculateBonus, createRollResult
} from '../../shared/utils/diceRoller.js';

describe('diceRoller', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rollDie', () => {
    it('returns 1-20 for D20', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      expect(rollDie(20)).toBe(20);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollDie(20)).toBe(1);
    });
    it('returns 1-4 for D4', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      expect(rollDie(4)).toBe(4);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollDie(4)).toBe(1);
    });
    it('throws for invalid die (D6, D8, D12)', () => {
      expect(() => rollDie(6)).toThrow();
      expect(() => rollDie(8)).toThrow();
      expect(() => rollDie(12)).toThrow();
    });
    it('uses Math.random internally', () => {
      const spy = vi.spyOn(Math, 'random');
      rollDie(20);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('rollDice', () => {
    it('rolls multiple dice and returns array of results', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const results = rollDice(3, 20);
      expect(results).toHaveLength(3);
      expect(results).toEqual([11, 11, 11]);
    });
  });

  describe('classifyD20', () => {
    it('20 → critical', () => expect(classifyD20(20).type).toBe('critical'));
    it('13-19 → good (test 13 and 19)', () => {
      expect(classifyD20(13).type).toBe('good');
      expect(classifyD20(19).type).toBe('good');
    });
    it('10-12 → neutral (test 10 and 12)', () => {
      expect(classifyD20(10).type).toBe('neutral');
      expect(classifyD20(12).type).toBe('neutral');
    });
    it('2-9 → bad (test 2 and 9)', () => {
      expect(classifyD20(2).type).toBe('bad');
      expect(classifyD20(9).type).toBe('bad');
    });
    it('1 → disaster', () => expect(classifyD20(1).type).toBe('disaster'));
  });

  describe('classifyD4', () => {
    it('4 → critical', () => expect(classifyD4(4).type).toBe('critical'));
    it('3 → good', () => expect(classifyD4(3).type).toBe('good'));
    it('2 → bad', () => expect(classifyD4(2).type).toBe('bad'));
    it('1 → disaster', () => expect(classifyD4(1).type).toBe('disaster'));
  });

  describe('rollAdvantage / rollDisadvantage', () => {
    it('advantage picks highest of 2 rolls', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.2) // 5
        .mockReturnValueOnce(0.8); // 17
      expect(rollAdvantage(20).chosen).toBe(17);
    });
    it('disadvantage picks lowest of 2 rolls', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.8) // 17
        .mockReturnValueOnce(0.2); // 5
      expect(rollDisadvantage(20).chosen).toBe(5);
    });
  });

  describe('calculateBonus', () => {
    it.each([
      [0, 0], [4, 0], [5, 1], [9, 1], [10, 2], [24, 4], [25, 5]
    ])('getBonus(%i) = %i', (input, expected) => {
      expect(calculateBonus(input)).toBe(expected);
    });
  });

  describe('createRollResult', () => {
    it('creates properly formatted result with timestamp', () => {
      const res = createRollResult({ diceType: 20, count: 1, results: [15], modifier: 2, rollerName: 'Hero', note: 'Attack' });
      expect(res.timestamp).toBeDefined();
      expect(res.rollerName).toBe('Hero');
      expect(res.note).toBe('Attack');
      expect(res.diceType).toBe('d20');
    });
    it('includes classifications for each die', () => {
      const res = createRollResult({ diceType: 20, count: 2, results: [20, 1], modifier: 0, rollerName: 'Hero' });
      expect(res.results.map(r => r.type)).toEqual(['critical', 'disaster']);
    });
    it('calculates total with modifier', () => {
      const res = createRollResult({ diceType: 20, count: 2, results: [10, 5], modifier: 3, rollerName: 'Hero' });
      expect(res.total).toBe(18);
    });
  });
});
