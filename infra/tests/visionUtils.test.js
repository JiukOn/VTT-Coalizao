import { describe, it, expect } from 'vitest';
import {
  MAP_WIDTH, MAP_HEIGHT, segmentsIntersect, isBlockedByWall, computeVisionCells
} from '../../shared/utils/visionUtils.js';

describe('visionUtils', () => {
  describe('segmentsIntersect', () => {
    it('detects crossing segments', () => {
      expect(segmentsIntersect(0, 0, 10, 10, 0, 10, 10, 0)).toBe(true);
    });
    it('returns false for parallel segments', () => {
      expect(segmentsIntersect(0, 0, 10, 0, 0, 10, 10, 10)).toBe(false);
    });
    it('returns false for collinear non-overlapping segments', () => {
      expect(segmentsIntersect(0, 0, 5, 0, 6, 0, 10, 0)).toBe(false);
    });
    it('returns false for almost-touching endpoints (epsilon test)', () => {
      expect(segmentsIntersect(0, 0, 5, 5, 5.0001, 5.0001, 10, 10)).toBe(false);
    });
  });

  describe('isBlockedByWall', () => {
    it('returns false when no walls', () => {
      expect(isBlockedByWall(0, 0, 10, 10, [])).toBe(false);
    });
    it('returns true when ray crosses a wall', () => {
      const walls = [{ x1: 5, y1: 0, x2: 5, y2: 10 }];
      expect(isBlockedByWall(0, 5, 10, 5, walls)).toBe(true);
    });
    it('returns false when ray doesnt cross any wall', () => {
      const walls = [{ x1: 5, y1: 6, x2: 5, y2: 10 }];
      expect(isBlockedByWall(0, 5, 10, 5, walls)).toBe(false);
    });
    it('checks all walls in array', () => {
      const walls = [
        { x1: 0, y1: 20, x2: 10, y2: 20 },
        { x1: 5, y1: 0, x2: 5, y2: 10 }
      ];
      expect(isBlockedByWall(0, 5, 10, 5, walls)).toBe(true);
    });
    it('allows line of sight through windows/glass', () => {
      const walls = [{ x1: 5, y1: 0, x2: 5, y2: 10, isWindow: true, wallType: 'window' }];
      expect(isBlockedByWall(0, 5, 10, 5, walls)).toBe(false);
    });
    it('allows vision looking down from a one-way cliff but blocks looking up', () => {
      // Wall drawn downwards from (5, 0) to (5, 10)
      // High ground (left side: x < 5) -> looking down to right (x > 5)
      const cliff = [{ x1: 5, y1: 0, x2: 5, y2: 10, isOneWay: true, wallType: 'cliff' }];
      
      // Observer at (2, 5) looking down at (8, 5) -> sideOrigin = 0*(5-0) - 10*(2-5) = 30 > 0 -> Clear!
      expect(isBlockedByWall(2, 5, 8, 5, cliff)).toBe(false);

      // Observer at (8, 5) looking up at (2, 5) -> sideOrigin = 0*(5-0) - 10*(8-5) = -30 <= 0 -> Blocked!
      expect(isBlockedByWall(8, 5, 2, 5, cliff)).toBe(true);
    });
  });

  describe('computeVisionCells', () => {
    const gridConfig = { size: 50, offsetX: 0, offsetY: 0 };

    it('returns empty set when radius is 0', () => {
      const entity = { mapX: 100, mapY: 100, visionRadius: 0 };
      expect(computeVisionCells(entity, gridConfig, []).size).toBe(0);
    });
    it('returns cells within circular radius', () => {
      const entity = { mapX: 100, mapY: 100, visionRadius: 2 };
      const cells = computeVisionCells(entity, gridConfig, []);
      expect(cells.size).toBeGreaterThan(0);
      expect(cells.has('2,2')).toBe(true); // Center cell
    });
    it('excludes cells blocked by walls', () => {
      const entity = { mapX: 100, mapY: 100, visionRadius: 2 };
      const walls = [{ x1: 125, y1: 0, x2: 125, y2: 200 }]; // Wall blocks right
      const cells = computeVisionCells(entity, gridConfig, walls);
      expect(cells.has('3,2')).toBe(false);
    });
    it('limits to map boundaries', () => {
      const entity = { mapX: 0, mapY: 0, visionRadius: 2 };
      const cells = computeVisionCells(entity, gridConfig, []);
      expect(cells.has('-1,-1')).toBe(false);
    });
    it('supports cone vision with angle', () => {
      const entity = { mapX: 100, mapY: 100, visionRadius: 2, visionAngle: 0, visionCone: true };
      const cells = computeVisionCells(entity, gridConfig, []);
      expect(cells.has('3,0')).toBe(true); // Should see ahead (in extended cone, dist ~106)
      expect(cells.has('0,0')).toBe(false); // Should not see behind (outside base radius, not in cone)
    });
  });
});
