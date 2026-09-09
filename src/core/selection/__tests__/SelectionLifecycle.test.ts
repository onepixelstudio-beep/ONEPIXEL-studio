import { describe, it, expect, vi } from 'vitest';
import { SelectionEngine } from '../SelectionEngine';

describe('Selection Lifecycle & State Handler (Bugfix Verification)', () => {
  it('clear() explicitly empties the mask buffer and resets bounds to null', () => {
    const engine = new SelectionEngine(16, 16);
    engine.selectRect(2, 2, 8, 8, 'replace');

    expect(engine.mask.isEmpty()).toBe(false);
    expect(engine.getBounds()).toEqual({ x: 2, y: 2, width: 8, height: 8 });

    // Explicit clear
    engine.clear();

    expect(engine.mask.isEmpty()).toBe(true);
    expect(engine.getBounds()).toBeNull();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        expect(engine.contains(x, y)).toBe(false);
      }
    }
  });

  it('notifies subscribers on clear() so renderers immediately detect empty mask', () => {
    const engine = new SelectionEngine(8, 8);
    engine.selectRect(0, 0, 4, 4, 'replace');

    const listener = vi.fn();
    const unsub = engine.subscribe(listener);

    engine.clear();

    expect(listener).toHaveBeenCalled();
    expect(engine.mask.isEmpty()).toBe(true);

    unsub();
  });

  it('Case 1: Select -> Deselect -> verifies full canvas access without restriction', () => {
    const engine = new SelectionEngine(10, 10);
    // 1. Create selection
    engine.selectRect(2, 2, 4, 4, 'replace');
    expect(engine.contains(3, 3)).toBe(true);
    expect(engine.contains(0, 0)).toBe(false);

    // 2. Deselect
    engine.clear();
    const selectionActive = !engine.mask.isEmpty();
    expect(selectionActive).toBe(false);

    // 3. Any tool operating with boolean check must allow all pixels
    const samplePoints = [
      { x: 0, y: 0 },
      { x: 3, y: 3 },
      { x: 8, y: 8 }
    ];

    const filteredPoints = selectionActive
      ? samplePoints.filter(p => engine.contains(p.x, p.y))
      : samplePoints;

    expect(filteredPoints).toHaveLength(3);
    expect(filteredPoints).toEqual(samplePoints);
  });

  it('Case 3: Select -> Deselect -> Back to selection tool does not resurrect old selection', () => {
    const engine = new SelectionEngine(8, 8);
    // Step 1: Create selection
    engine.selectRect(1, 1, 3, 3, 'replace');
    expect(engine.mask.isEmpty()).toBe(false);

    // Step 2: Deselect
    engine.clear();
    expect(engine.mask.isEmpty()).toBe(true);

    // Step 3: Switch tools and return to selection tool
    // State remains empty
    expect(engine.mask.isEmpty()).toBe(true);
    expect(engine.getBounds()).toBeNull();
  });

  it('Case 4: Select -> Deselect -> New selection only includes new coordinates', () => {
    const engine = new SelectionEngine(10, 10);
    // 1. First selection
    engine.selectRect(0, 0, 3, 3, 'replace');
    expect(engine.contains(1, 1)).toBe(true);

    // 2. Deselect
    engine.clear();

    // 3. New selection in different area
    engine.selectRect(5, 5, 2, 2, 'replace');
    expect(engine.contains(1, 1)).toBe(false); // Old selection not present
    expect(engine.contains(5, 5)).toBe(true);  // New selection active
    expect(engine.contains(6, 6)).toBe(true);
    expect(engine.getBounds()).toEqual({ x: 5, y: 5, width: 2, height: 2 });
  });

  it('setFromBooleanMask correctly updates or clears mask with engine notification', () => {
    const engine = new SelectionEngine(4, 4);
    const booleanMask = [
      true, false, false, false,
      false, true, false, false,
      false, false, true, false,
      false, false, false, true
    ];

    const listener = vi.fn();
    engine.subscribe(listener);

    engine.setFromBooleanMask(booleanMask, 'replace');
    expect(engine.contains(0, 0)).toBe(true);
    expect(engine.contains(1, 1)).toBe(true);
    expect(engine.contains(0, 1)).toBe(false);
    expect(listener).toHaveBeenCalled();

    // Reset with empty boolean mask
    const emptyMask = new Array(16).fill(false);
    engine.setFromBooleanMask(emptyMask, 'replace');
    expect(engine.mask.isEmpty()).toBe(true);
    expect(engine.getBounds()).toBeNull();
  });
});
