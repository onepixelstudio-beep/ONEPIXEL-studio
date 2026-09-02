import { describe, it, expect } from 'vitest';
import { MatrixTransform } from '../MatrixTransform';

describe('MatrixTransform Core Mathematics', () => {
  // 2x3 grid:
  // 1 2 3
  // 4 5 6
  const grid = [1, 2, 3, 4, 5, 6];
  const w = 3;
  const h = 2;

  it('rotate90 should perform correct 90 degree clockwise matrix rotation', () => {
    // 4 1
    // 5 2
    // 6 3
    const res = MatrixTransform.rotate90(grid, w, h);
    expect(res.width).toBe(2);
    expect(res.height).toBe(3);
    expect(res.data).toEqual([4, 1, 5, 2, 6, 3]);
  });

  it('rotate180 should perform correct 180 degree matrix rotation', () => {
    // 6 5 4
    // 3 2 1
    const res = MatrixTransform.rotate180(grid, w, h);
    expect(res.width).toBe(3);
    expect(res.height).toBe(2);
    expect(res.data).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('rotate270 should perform correct 270 degree matrix rotation', () => {
    // 3 6
    // 2 5
    // 1 4
    const res = MatrixTransform.rotate270(grid, w, h);
    expect(res.width).toBe(2);
    expect(res.height).toBe(3);
    expect(res.data).toEqual([3, 6, 2, 5, 1, 4]);
  });

  it('flipHorizontal should reverse columns in each row', () => {
    // 3 2 1
    // 6 5 4
    const res = MatrixTransform.flipHorizontal(grid, w, h);
    expect(res.width).toBe(3);
    expect(res.height).toBe(2);
    expect(res.data).toEqual([3, 2, 1, 6, 5, 4]);
  });

  it('flipVertical should reverse rows', () => {
    // 4 5 6
    // 1 2 3
    const res = MatrixTransform.flipVertical(grid, w, h);
    expect(res.width).toBe(3);
    expect(res.height).toBe(2);
    expect(res.data).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it('scaleNearestNeighbor should scale correctly on integer factor', () => {
    const res = MatrixTransform.scaleNearestNeighbor(grid, w, h, 2, 2);
    expect(res.width).toBe(6);
    expect(res.height).toBe(4);
    // Double sized row 0
    expect(res.data.slice(0, 6)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(res.data.slice(6, 12)).toEqual([1, 1, 2, 2, 3, 3]);
    // Double sized row 1
    expect(res.data.slice(12, 18)).toEqual([4, 4, 5, 5, 6, 6]);
    expect(res.data.slice(18, 24)).toEqual([4, 4, 5, 5, 6, 6]);
  });
});
