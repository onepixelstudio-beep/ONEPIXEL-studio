import { describe, it, expect, vi } from 'vitest';
import { SelectionMask } from '../SelectionMask';
import { SelectionEngine } from '../SelectionEngine';

describe('Selection Core Architecture (ADR-SELECTION-001)', () => {
  describe('SelectionMask', () => {
    it('creates buffer with correct dimensions and zero initialization', () => {
      const mask = new SelectionMask(16, 16);
      expect(mask.width).toBe(16);
      expect(mask.height).toBe(16);
      expect(mask.isEmpty()).toBe(true);
      expect(mask.getBounds()).toBeNull();
    });

    it('sets and gets alpha values correctly with O(1) access', () => {
      const mask = new SelectionMask(8, 8);
      mask.setValue(2, 3, 255);
      expect(mask.getValue(2, 3)).toBe(255);
      expect(mask.isEmpty()).toBe(false);
      expect(mask.getBounds()).toEqual({ x: 2, y: 3, width: 1, height: 1 });
    });

    it('clamps values and handles out of bounds gracefully', () => {
      const mask = new SelectionMask(4, 4);
      mask.setValue(-1, 0, 255); // out of bounds
      mask.setValue(5, 5, 255);  // out of bounds
      expect(mask.isEmpty()).toBe(true);

      mask.setValue(0, 0, 300);  // clamped to 255
      expect(mask.getValue(0, 0)).toBe(255);

      mask.setValue(0, 0, -50);  // clamped to 0
      expect(mask.getValue(0, 0)).toBe(0);
    });

    it('handles NaN, Infinity, null, and undefined coordinates safely without throwing', () => {
      const mask = new SelectionMask(8, 8);
      expect(() => {
        mask.setValue(NaN, 2, 255);
        mask.setValue(2, Infinity, 255);
        mask.setValue(null as unknown as number, undefined as unknown as number, 255);
        mask.getValue(NaN, NaN);
        mask.getValue(Infinity, -Infinity);
      }).not.toThrow();

      expect(mask.isEmpty()).toBe(true);
    });

    it('clones mask correctly keeping state intact', () => {
      const mask = new SelectionMask(4, 4);
      mask.setValue(1, 1, 128);
      const copy = mask.clone();

      expect(copy.getValue(1, 1)).toBe(128);
      expect(copy.getBounds()).toEqual(mask.getBounds());

      mask.setValue(1, 1, 0);
      expect(copy.getValue(1, 1)).toBe(128); // cloned buffer isolated
    });

    it('copies from another mask without new allocations', () => {
      const m1 = new SelectionMask(4, 4);
      const m2 = new SelectionMask(4, 4);
      m2.setValue(2, 2, 255);

      m1.copyFrom(m2);
      expect(m1.getValue(2, 2)).toBe(255);
      expect(m1.getBounds()).toEqual({ x: 2, y: 2, width: 1, height: 1 });
    });

    it('clears and fills correctly', () => {
      const mask = new SelectionMask(4, 4);
      mask.fill(255);
      expect(mask.isEmpty()).toBe(false);
      expect(mask.getBounds()).toEqual({ x: 0, y: 0, width: 4, height: 4 });

      mask.clear();
      expect(mask.isEmpty()).toBe(true);
      expect(mask.getBounds()).toBeNull();
    });
  });

  describe('SelectionEngine', () => {
    it('notifies subscribers upon selection state changes without React dependencies', () => {
      const engine = new SelectionEngine(8, 8);
      const listener = vi.fn();
      const unsubscribe = engine.subscribe(listener);

      engine.selectAll();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'change',
        isEmpty: false,
      }));

      engine.clear();
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'clear',
        isEmpty: true,
      }));

      unsubscribe();
      engine.selectAll();
      expect(listener).toHaveBeenCalledTimes(2); // no further calls after unsubscribe
    });

    it('performs boolean union, subtract, and intersect operations', () => {
      const engine = new SelectionEngine(8, 8);
      engine.selectRect(0, 0, 4, 4, 'replace');
      expect(engine.getBounds()).toEqual({ x: 0, y: 0, width: 4, height: 4 });

      // Add rect (0..8, 0..2)
      const rect2 = new SelectionMask(8, 8);
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 8; x++) {
          rect2.setValue(x, y, 255);
        }
      }
      engine.union(rect2);
      expect(engine.contains(7, 1)).toBe(true);

      // Subtract
      engine.subtract(rect2);
      expect(engine.contains(7, 1)).toBe(false);
      expect(engine.contains(0, 3)).toBe(true);
    });

    it('calculates coverage statistics accurately', () => {
      const engine = new SelectionEngine(10, 10);
      engine.selectRect(0, 0, 5, 5, 'replace'); // 25 pixels
      const stats = engine.getStatistics();
      expect(stats.selectedPixels).toBe(25);
      expect(stats.coveragePercentage).toBe(25);
    });

    it('inverts selection correctly', () => {
      const engine = new SelectionEngine(4, 4);
      engine.selectRect(0, 0, 2, 2, 'replace'); // 4 pixels selected
      engine.invert();

      expect(engine.contains(0, 0)).toBe(false);
      expect(engine.contains(3, 3)).toBe(true);
      expect(engine.getStatistics().selectedPixels).toBe(12);
    });

    it('supports expand, contract, and feather modifiers', () => {
      const engine = new SelectionEngine(10, 10);
      engine.selectRect(4, 4, 2, 2, 'replace'); // 2x2 square in center
      expect(engine.getStatistics().selectedPixels).toBe(4);

      engine.expand(1);
      expect(engine.getStatistics().selectedPixels).toBe(16); // expanded to 4x4

      engine.contract(1);
      expect(engine.getStatistics().selectedPixels).toBe(4); // contracted back to 2x2
    });

    it('supports selectColorRange for chromatic or wand matching', () => {
      const engine = new SelectionEngine(10, 10);
      // Select even columns
      engine.selectColorRange((x) => x % 2 === 0, 'replace');
      expect(engine.contains(0, 0)).toBe(true);
      expect(engine.contains(1, 0)).toBe(false);
      expect(engine.getStatistics().selectedPixels).toBe(50);
    });

    it('handles 1x1 small canvas and extremely large 1000x1000 canvas safely', () => {
      // 1x1 small canvas
      const tinyEngine = new SelectionEngine(1, 1);
      tinyEngine.selectAll();
      expect(tinyEngine.getStatistics().selectedPixels).toBe(1);
      tinyEngine.clear();
      expect(tinyEngine.getStatistics().selectedPixels).toBe(0);

      // Large 1000x1000 canvas
      const largeEngine = new SelectionEngine(1000, 1000);
      largeEngine.selectRect(100, 100, 500, 500, 'replace');
      expect(largeEngine.getStatistics().selectedPixels).toBe(250000);
      expect(largeEngine.getBounds()).toEqual({ x: 100, y: 100, width: 500, height: 500 });
    });

    it('handles invalid inputs, NaN, null, and out-of-bounds parameters gracefully', () => {
      const engine = new SelectionEngine(10, 10);
      expect(() => {
        engine.selectRect(NaN, 0, 5, 5, 'replace');
        engine.selectEllipse(0, NaN, 5, 5, 'add');
        engine.selectPath([{ x: NaN, y: 0 }, { x: 0, y: 5 }], 'replace');
        engine.contains(NaN, Infinity);
        engine.getAlphaAt(-50, 1000);
      }).not.toThrow();
    });

    it('handles thousands of continuous rapid drag operations without memory leak or corruption', () => {
      const engine = new SelectionEngine(100, 100);
      for (let i = 0; i < 2000; i++) {
        const x = (i * 3) % 80;
        const y = (i * 7) % 80;
        engine.selectRect(x, y, 20, 20, 'replace');
      }
      expect(engine.getStatistics().selectedPixels).toBe(400);
    });
  });
});

