import { describe, it, expect } from 'vitest';
import {
  LEVEL_POINTS, ATTRIBUTES, getBonus, getTotalPointsForLevel,
  calculateShortMovement, createBlankCharacter
} from '../../shared/utils/characterUtils.js';

describe('characterUtils', () => {
  describe('ATTRIBUTES', () => {
    it('has exactly 8 attributes', () => {
      expect(ATTRIBUTES.length).toBe(8);
    });
    it('includes all required keys: vit, dex, crm, frc, int, res, pre, enr', () => {
      const keys = ATTRIBUTES.map(attr => attr.key);
      const expectedKeys = ['vit', 'dex', 'crm', 'frc', 'int', 'res', 'pre', 'enr'];
      expectedKeys.forEach(key => {
        expect(keys).toContain(key);
      });
    });
  });

  describe('getBonus', () => {
    it.each([
      [0, 0], [4, 0], [5, 1], [9, 1], [10, 2], [24, 4], [25, 5]
    ])('getBonus(%i) = %i', (input, expected) => {
      expect(getBonus(input)).toBe(expected);
    });
  });

  describe('getTotalPointsForLevel', () => {
    it('level 1 = 25', () => {
      expect(getTotalPointsForLevel(1)).toBe(25);
    });
    it('level 5 = 35', () => {
      expect(getTotalPointsForLevel(5)).toBe(35);
    });
    it('level 10 = 48', () => {
      expect(getTotalPointsForLevel(10)).toBe(48);
    });
    it('level 11 = 48 (capped at 10)', () => {
      expect(getTotalPointsForLevel(11)).toBe(48);
    });
  });

  describe('calculateShortMovement', () => {
    it('d4=1 always returns 4', () => {
      expect(calculateShortMovement(1, 0)).toBe(4);
      expect(calculateShortMovement(1, 5)).toBe(4);
    });
    it('d4=4 returns dexBonus*4', () => {
      expect(calculateShortMovement(4, 2)).toBe(8);
      expect(calculateShortMovement(4, 3)).toBe(12);
    });
    it('d4=2 returns ceil(4 + dexBonus*4/2)', () => {
      expect(calculateShortMovement(2, 3)).toBe(10); // Math.ceil(4 + 12/2) = 10
      expect(calculateShortMovement(2, 2)).toBe(8);  // Math.ceil(4 + 8/2) = 8
    });
    it('d4=3 returns floor(dexBonus*4 - 4/2)', () => {
      expect(calculateShortMovement(3, 3)).toBe(10); // Math.floor(12 - 2) = 10
      expect(calculateShortMovement(3, 2)).toBe(6);  // Math.floor(8 - 2) = 6
    });
  });

  describe('createBlankCharacter', () => {
    it('creates template with campaign ID', () => {
      const char = createBlankCharacter('camp-123');
      expect(char.campaignId).toBe('camp-123');
    });
    it('has 8 equipment slots', () => {
      const char = createBlankCharacter('camp-123');
      expect(Object.keys(char.equipment).length).toBe(8);
    });
    it('has all 8 attributes at 0', () => {
      const char = createBlankCharacter('camp-123');
      expect(char.attributes.vit).toBe(0);
      expect(char.attributes.dex).toBe(0);
      expect(char.attributes.crm).toBe(0);
      expect(char.attributes.frc).toBe(0);
      expect(char.attributes.int).toBe(0);
      expect(char.attributes.res).toBe(0);
      expect(char.attributes.pre).toBe(0);
      expect(char.attributes.enr).toBe(0);
    });
    it('has default token color', () => {
      const char = createBlankCharacter('camp-123');
      expect(char.tokenColor).toBeDefined();
    });
  });
});
