import { describe, it, expect, beforeEach } from 'vitest';
import { TransformEngine } from '../TransformEngine';
import { TransformTarget, createImageData } from '../TransformTypes';
import { SelectionEngine } from '../../selection/SelectionEngine';

describe('TransformEngine Infrastructure (Sprint 1.6)', () => {
  let engine: TransformEngine;
  let selectionEngine: SelectionEngine;
  let sampleTarget: TransformTarget;

  beforeEach(() => {
    selectionEngine = new SelectionEngine(50, 50);
    engine = new TransformEngine(selectionEngine);

    const img = createImageData(10, 10);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 200;
      img.data[i + 3] = 255;
    }

    sampleTarget = {
      type: 'selection',
      id: 'layer-1',
      bounds: { x: 5, y: 5, width: 10, height: 10 },
      imageData: img,
    };
  });

  it('manages session lifecycle correctly (start, update, commit)', () => {
    expect(engine.isSessionActive()).toBe(false);

    const state = engine.startSession(sampleTarget);
    expect(engine.isSessionActive()).toBe(true);
    expect(state.originalBounds).toEqual({ x: 5, y: 5, width: 10, height: 10 });

    engine.translate(10, 15);
    const activeState = engine.getActiveSession();
    expect(activeState?.isDirty).toBe(true);
    expect(activeState?.currentBounds.x).toBe(15);
    expect(activeState?.currentBounds.y).toBe(20);

    const result = engine.commitSession();
    expect(result).not.toBeNull();
    expect(result?.bounds.x).toBe(15);
    expect(result?.bounds.y).toBe(20);
    expect(engine.isSessionActive()).toBe(false);
  });

  it('cancels transformation cleanly without side effects', () => {
    engine.startSession(sampleTarget);
    engine.scale(2, 2);
    expect(engine.getActiveSession()?.isDirty).toBe(true);

    engine.cancelSession();
    expect(engine.isSessionActive()).toBe(false);
    expect(engine.getActiveSession()).toBeNull();
  });

  it('syncs translation with SelectionEngine on selection commit', () => {
    selectionEngine.selectRect(5, 5, 10, 10, 'replace');
    expect(selectionEngine.getBounds()).toEqual({ x: 5, y: 5, width: 10, height: 10 });

    engine.startSession(sampleTarget);
    engine.translate(20, 30);
    engine.commitSession();

    // SelectionEngine mask should be translated to (25, 35) via public API
    expect(selectionEngine.getBounds()).toEqual({ x: 25, y: 35, width: 10, height: 10 });
  });

  it('supports pivot and interpolation mode updates', () => {
    engine.startSession(sampleTarget);
    engine.setPivot({ x: 100, y: 100 });
    engine.setInterpolation('bilinear');

    const session = engine.getActiveSession();
    expect(session?.pivot).toEqual({ x: 100, y: 100 });
    expect(session?.interpolation).toBe('bilinear');
  });
});
