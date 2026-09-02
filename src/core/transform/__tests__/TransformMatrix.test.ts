import { describe, it, expect } from 'vitest';
import { TransformMatrix } from '../TransformMatrix';

describe('TransformMatrix Module (Sprint 1.6)', () => {
  it('creates identity matrix correctly', () => {
    const id = TransformMatrix.identity();
    expect(id).toEqual({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
    expect(TransformMatrix.isIdentity(id)).toBe(true);
  });

  it('translates points correctly', () => {
    const m = TransformMatrix.createTranslate(10, -5);
    const p = TransformMatrix.transformPoint(m, { x: 5, y: 5 });
    expect(p).toEqual({ x: 15, y: 0 });
  });

  it('scales relative to pivot', () => {
    const pivot = { x: 10, y: 10 };
    const m = TransformMatrix.createScale(2, 3, pivot);
    const p = TransformMatrix.transformPoint(m, { x: 10, y: 10 });
    // Pivot should remain stationary
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(10);

    const corner = TransformMatrix.transformPoint(m, { x: 20, y: 20 });
    expect(corner.x).toBeCloseTo(30);
    expect(corner.y).toBeCloseTo(40);
  });

  it('rotates relative to pivot', () => {
    const pivot = { x: 0, y: 0 };
    const radians = Math.PI / 2; // 90 degrees
    const m = TransformMatrix.createRotate(radians, pivot);

    const p = TransformMatrix.transformPoint(m, { x: 10, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(10);
  });

  it('flips horizontally and vertically relative to pivot', () => {
    const pivot = { x: 10, y: 10 };
    const m = TransformMatrix.createFlip(true, true, pivot);

    const p = TransformMatrix.transformPoint(m, { x: 15, y: 15 });
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(5);
  });

  it('inverts affine matrices accurately', () => {
    const m = TransformMatrix.createRotate(Math.PI / 4, { x: 5, y: 5 });
    const inv = TransformMatrix.invert(m);
    const composed = TransformMatrix.multiply(m, inv);

    expect(TransformMatrix.isIdentity(composed)).toBe(true);
  });

  it('transforms bounding box rect correctly', () => {
    const m = TransformMatrix.createTranslate(10, 20);
    const bounds = { x: 0, y: 0, width: 30, height: 40 };
    const transformed = TransformMatrix.transformBounds(m, bounds);

    expect(transformed).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('reuses output objects without memory allocation', () => {
    const out = { a: 0, b: 0, c: 0, d: 0, tx: 0, ty: 0 };
    const res = TransformMatrix.identity(out);
    expect(res).toBe(out);
    expect(out).toEqual({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });
  });
});
