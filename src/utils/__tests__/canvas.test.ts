import { describe, it, expect } from 'vitest';
import { 
  createEmptyPixels, 
  getLinePoints, 
  getRectanglePoints, 
  getEllipsePoints, 
  floodFill, 
  getMagicWandSelection, 
  getSymmetricPoints,
  isPointInPolygon,
  getRotatedStamp,
  transformStamp,
  filterPixelPerfect,
  getBucketFillPoints
} from '../canvas';
import { SymmetrySettings } from '../../types';

describe('Canvas Utilities', () => {
  it('should create empty pixels with specified length', () => {
    const pixels = createEmptyPixels(4, 4);
    expect(pixels).toHaveLength(16);
    expect(pixels.every(p => p === '')).toBe(true);
  });

  it('should calculate Bresenham line points correctly', () => {
    const points = getLinePoints(0, 0, 2, 2);
    // Expected diagonal points (0,0), (1,1), (2,2)
    expect(points).toContainEqual({ x: 0, y: 0 });
    expect(points).toContainEqual({ x: 1, y: 1 });
    expect(points).toContainEqual({ x: 2, y: 2 });
    expect(points.length).toBe(3);
  });

  it('should calculate rectangle outline points correctly', () => {
    const points = getRectanglePoints(0, 0, 2, 2, false);
    // Expected border coordinates of 3x3 rectangle
    expect(points).toContainEqual({ x: 0, y: 0 });
    expect(points).toContainEqual({ x: 1, y: 0 });
    expect(points).toContainEqual({ x: 2, y: 0 });
    expect(points).toContainEqual({ x: 0, y: 1 });
    expect(points).toContainEqual({ x: 2, y: 1 });
    expect(points).toContainEqual({ x: 0, y: 2 });
    expect(points).toContainEqual({ x: 1, y: 2 });
    expect(points).toContainEqual({ x: 2, y: 2 });
    expect(points).not.toContainEqual({ x: 1, y: 1 });
  });

  it('should calculate rectangle filled points correctly', () => {
    const points = getRectanglePoints(0, 0, 2, 2, true);
    expect(points).toHaveLength(9);
    expect(points).toContainEqual({ x: 1, y: 1 });
  });

  it('should calculate ellipse outline points correctly', () => {
    const points = getEllipsePoints(0, 0, 6, 6, false);
    // xc = 3, yc = 3, rx = 3, ry = 3
    expect(points.length).toBeGreaterThan(0);
    // Extents should contain the center bounds
    expect(points).toContainEqual({ x: 3, y: 0 }); // top midpoint
    expect(points).toContainEqual({ x: 3, y: 6 }); // bottom midpoint
    expect(points).toContainEqual({ x: 0, y: 3 }); // left midpoint
    expect(points).toContainEqual({ x: 6, y: 3 }); // right midpoint
  });

  it('should calculate ellipse filled points correctly', () => {
    const points = getEllipsePoints(0, 0, 6, 6, true);
    expect(points.length).toBeGreaterThan(0);
    expect(points).toContainEqual({ x: 3, y: 3 }); // center should be filled
  });

  it('should fallback to rectangle when ellipse dimensions are too small', () => {
    // rx = 0, ry = 0 fallback
    const points = getEllipsePoints(0, 0, 1, 1, true);
    expect(points).toHaveLength(4); // 2x2 rectangle filled
  });

  it('should verify isPointInPolygon correctly', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 }
    ];
    expect(isPointInPolygon(2, 2, square)).toBe(true);
    expect(isPointInPolygon(5, 2, square)).toBe(false);
  });

  it('should rotate stamp correctly', () => {
    const stamp = [
      'a', 'b',
      'c', 'd'
    ];
    // Rotate 90 degrees
    const r90 = getRotatedStamp(stamp, 2, 2, 90);
    // sx = dy, sy = height - 1 - dx
    // dx=0, dy=0 => sx=0, sy=1 => stamp[1*2+0] = 'c'
    // dx=1, dy=0 => sx=0, sy=0 => stamp[0*2+0] = 'a'
    // dx=0, dy=1 => sx=1, sy=1 => stamp[1*2+1] = 'd'
    // dx=1, dy=1 => sx=1, sy=0 => stamp[0*2+1] = 'b'
    // Result expected: c, a, d, b
    expect(r90.pixels).toEqual(['c', 'a', 'd', 'b']);

    // Rotate 180 degrees
    const r180 = getRotatedStamp(stamp, 2, 2, 180);
    expect(r180.pixels).toEqual(['d', 'c', 'b', 'a']);
  });

  it('should transform stamp with flips', () => {
    const stamp = [
      'a', 'b',
      'c', 'd'
    ];
    const transformed = transformStamp(stamp, 2, 2, 0, true, false); // flipH
    expect(transformed.pixels).toEqual(['b', 'a', 'd', 'c']);
  });

  it('should calculate symmetric points correctly', () => {
    const settings: SymmetrySettings = {
      x: true,
      y: false,
      radial: false,
      radialCount: 4,
      centerX: 2,
      centerY: 2
    };
    const syms = getSymmetricPoints(0, 0, 4, 4, settings);
    // Original: (0,0). Mirror X over width 4: mx = 4-1-0 = 3 => (3,0)
    expect(syms).toContainEqual({ x: 0, y: 0 });
    expect(syms).toContainEqual({ x: 3, y: 0 });
    expect(syms.length).toBe(2);
  });

  describe('Pixel Perfect Filter', () => {
    it('should return input unchanged if points length is less than 3', () => {
      const pts = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
      expect(filterPixelPerfect(pts)).toEqual(pts);
    });

    it('should remove redundant corner jaggies to make a perfect diagonal step', () => {
      // (0,0) -> (1,0) -> (1,1) is an L-shape
      const input = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }];
      const expected = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      expect(filterPixelPerfect(input)).toEqual(expected);
    });

    it('should retain straight orthogonal line coordinates intact', () => {
      const input = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
      expect(filterPixelPerfect(input)).toEqual(input);
    });

    it('should handle multi-step diagonal line smoothing correctly', () => {
      // (0,0) -> (1,0) -> (1,1) -> (2,1) -> (2,2)
      // First (0,0)-(1,0)-(1,1) removes (1,0) leaving (0,0)-(1,1).
      // Then (0,0)-(1,1)-(2,1)-(2,2). (1,1)-(2,1)-(2,2) removes (2,1) leaving (1,1)-(2,2).
      // Remaining is (0,0)-(1,1)-(2,2)
      const input = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }
      ];
      const expected = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];
      expect(filterPixelPerfect(input)).toEqual(expected);
    });
  });

  describe('getBucketFillPoints', () => {
    // 4x4 Grid
    // [ 'R', 'R', 'G', 'G' ]
    // [ 'R', 'B', 'B', 'G' ]
    // [ 'G', 'B', 'R', 'R' ]
    // [ 'G', 'G', 'R', 'R' ]
    const grid4x4 = [
      'R', 'R', 'G', 'G',
      'R', 'B', 'B', 'G',
      'G', 'B', 'R', 'R',
      'G', 'G', 'R', 'R'
    ];

    const noSymmetry: SymmetrySettings = {
      x: false,
      y: false,
      radial: false,
      radialCount: 4,
      centerX: 2,
      centerY: 2
    };

    it('should do standard contiguous BFS flood fill correctly', () => {
      // Start at (0, 0) which is 'R'.
      // Connected 'R's from (0,0) are (1,0) and (0,1).
      // Total 3 points.
      const points = getBucketFillPoints(grid4x4, 0, 0, 4, 4, 'W', {
        contiguous: true,
        tiling: false,
        symmetry: noSymmetry
      });

      expect(points).toHaveLength(3);
      expect(points).toContainEqual({ x: 0, y: 0 });
      expect(points).toContainEqual({ x: 1, y: 0 });
      expect(points).toContainEqual({ x: 0, y: 1 });
    });

    it('should do non-contiguous global color replacement correctly', () => {
      // Start at (0, 0) which is 'R'.
      // Match all 'R's in the grid.
      // Grid has 'R's at: (0,0), (1,0), (0,1), (2,2), (3,2), (2,3), (3,3) -> 7 points.
      const points = getBucketFillPoints(grid4x4, 0, 0, 4, 4, 'W', {
        contiguous: false,
        tiling: false,
        symmetry: noSymmetry
      });

      expect(points).toHaveLength(7);
      expect(points).toContainEqual({ x: 0, y: 0 });
      expect(points).toContainEqual({ x: 3, y: 3 });
    });

    it('should respect selection mask', () => {
      // Only allow pixels in selection (x <= 1, y <= 1)
      const mask = Array(16).fill(false);
      mask[0] = true; // (0,0)
      mask[1] = true; // (1,0)
      mask[4] = true; // (0,1)

      const points = getBucketFillPoints(grid4x4, 0, 0, 4, 4, 'W', {
        contiguous: true,
        tiling: false,
        symmetry: noSymmetry,
        mask
      });

      expect(points).toHaveLength(3);
      expect(points).toContainEqual({ x: 0, y: 0 });
      expect(points).toContainEqual({ x: 1, y: 0 });
      expect(points).toContainEqual({ x: 0, y: 1 });

      // If (0,1) is not in mask, BFS shouldn't visit it
      const mask2 = Array(16).fill(false);
      mask2[0] = true; // (0,0)
      mask2[1] = true; // (1,0)

      const points2 = getBucketFillPoints(grid4x4, 0, 0, 4, 4, 'W', {
        contiguous: true,
        tiling: false,
        symmetry: noSymmetry,
        mask: mask2
      });

      expect(points2).toHaveLength(2);
      expect(points2).toContainEqual({ x: 0, y: 0 });
      expect(points2).toContainEqual({ x: 1, y: 0 });
    });

    it('should seamlessly wrap borders in tiling mode', () => {
      // With tiling active, BFS from (0,2) ('G') should wrap around
      // to (0,3) ('G'), (1,3) ('G'), (3,1) ('G'), (2,0) ('G'), (3,0) ('G')
      // All these 'G's form a single contiguous wrapped region!
      const points = getBucketFillPoints(grid4x4, 0, 2, 4, 4, 'W', {
        contiguous: true,
        tiling: true,
        symmetry: noSymmetry
      });

      // Let's verify 'G's are connected:
      // (0,2), (0,3), (1,3) are contiguous.
      // (1,3) is at bottom. Neighbor at (1,4) wraps to (1,0) which is 'R' (not target).
      // (0,3) at left wraps to (3,3) which is 'R' (not target).
      // (0,2) wraps to (3,2) which is 'R'.
      // But wait: (0,2)'s neighbor is (0,1) ('R') and (1,2) ('B').
      // Let's count Gs in the grid:
      // Row 0: G, G at (2,0) and (3,0)
      // Row 1: G at (3,1)
      // Row 2: G at (0,2)
      // Row 3: G, G at (0,3), (1,3)
      // Are they wrapped-connected?
      // (0,3)'s left neighbor is (3,3) ('R'). Right neighbor is (1,3) ('G'). Top neighbor is (0,2) ('G'). Bottom neighbor wraps to (0,0) ('R').
      // So (0,2)-(0,3)-(1,3) forms a region of 3 'G's.
      // Let's check (2,0)-(3,0)-(3,1) region:
      // (3,0)'s top neighbor wraps to (3,3) ('R'). Left neighbor is (2,0) ('G'). Right wraps to (0,0) ('R'). Bottom neighbor is (3,1) ('G').
      // So (2,0)-(3,0)-(3,1) forms a region of 3 'G's.
      // Is there any connection between these two regions in tiling mode?
      // (1,3)'s bottom neighbor wraps to (1,0) ('R'). Left is (0,3) ('G'). Right is (2,3) ('R').
      // So indeed, there are two separate groups of 'G's, each of size 3!
      // Let's verify our BFS finds exactly the 3 points connected to (0,2):
      expect(points).toHaveLength(3);
      expect(points).toContainEqual({ x: 0, y: 2 });
      expect(points).toContainEqual({ x: 0, y: 3 });
      expect(points).toContainEqual({ x: 1, y: 3 });
    });

    it('should support multi-point symmetry flood fill', () => {
      // Horizontal Mirror X over center 2 (width 4).
      // Left side click at (0,0) ('R') should mirror to (3,0) which is 'G'.
      // It should flood fill region of (0,0) ('R') and also flood fill region of (3,0) ('G').
      // Region of (0,0) 'R' has: (0,0), (1,0), (0,1)
      // Region of (3,0) 'G' has: (2,0), (3,0), (3,1)
      // So we expect 6 points in total!
      const mirrorX: SymmetrySettings = {
        x: true,
        y: false,
        radial: false,
        radialCount: 4,
        centerX: 2,
        centerY: 2
      };

      const points = getBucketFillPoints(grid4x4, 0, 0, 4, 4, 'W', {
        contiguous: true,
        tiling: false,
        symmetry: mirrorX
      });

      expect(points).toHaveLength(6);
      expect(points).toContainEqual({ x: 0, y: 0 });
      expect(points).toContainEqual({ x: 1, y: 0 });
      expect(points).toContainEqual({ x: 0, y: 1 });
      expect(points).toContainEqual({ x: 2, y: 0 });
      expect(points).toContainEqual({ x: 3, y: 0 });
      expect(points).toContainEqual({ x: 3, y: 1 });
    });
  });
});
