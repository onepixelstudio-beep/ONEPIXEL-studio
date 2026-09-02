import { describe, it, expect } from 'vitest';
import { PivotManager } from '../PivotManager';

describe('PivotManager Module (Sprint 1.6)', () => {
  it('calculates preset positions correctly for given bounds', () => {
    const bounds = { x: 10, y: 10, width: 100, height: 50 };
    const pm = new PivotManager(bounds);

    expect(pm.getPivot()).toEqual({ x: 60, y: 35 }); // center

    pm.applyPreset('top-left');
    expect(pm.getPivot()).toEqual({ x: 10, y: 10 });

    pm.applyPreset('bottom-right');
    expect(pm.getPivot()).toEqual({ x: 110, y: 60 });
  });

  it('supports custom pivot position', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    const pm = new PivotManager(bounds);

    pm.setPivot(25, 75);
    expect(pm.getPivot()).toEqual({ x: 25, y: 75 });
    expect(pm.getPreset()).toBe('custom');
  });

  it('notifies subscribers on pivot changes', () => {
    const bounds = { x: 0, y: 0, width: 50, height: 50 };
    const pm = new PivotManager(bounds);

    let notifiedPivot = { x: 0, y: 0 };
    pm.subscribe((p) => {
      notifiedPivot = p;
    });

    pm.applyPreset('top-right');
    expect(notifiedPivot).toEqual({ x: 50, y: 0 });
  });
});
