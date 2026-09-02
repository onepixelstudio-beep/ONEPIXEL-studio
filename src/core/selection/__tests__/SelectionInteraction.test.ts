import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectionHitTester } from '../SelectionHitTester';
import { CursorManager } from '../CursorManager';
import { SelectionInteractionController } from '../SelectionInteractionController';

describe('Selection Interaction Layer (Sprint 1.4)', () => {
  describe('SelectionHitTester', () => {
    const bounds = { x: 10, y: 10, width: 20, height: 20 };
    const containsPixelFn = (x: number, y: number) => x >= 10 && x < 30 && y >= 10 && y < 30;

    it('calculates 8 handle positions accurately', () => {
      const handles = SelectionHitTester.getHandlePositions(bounds);
      expect(handles).toHaveLength(8);

      const handleMap = Object.fromEntries(handles.map((h) => [h.id, { x: h.x, y: h.y }]));

      expect(handleMap['nw']).toEqual({ x: 10, y: 10 });
      expect(handleMap['n']).toEqual({ x: 20, y: 10 });
      expect(handleMap['ne']).toEqual({ x: 30, y: 10 });
      expect(handleMap['e']).toEqual({ x: 30, y: 20 });
      expect(handleMap['se']).toEqual({ x: 30, y: 30 });
      expect(handleMap['s']).toEqual({ x: 20, y: 30 });
      expect(handleMap['sw']).toEqual({ x: 10, y: 30 });
      expect(handleMap['w']).toEqual({ x: 10, y: 20 });
    });

    it('returns appropriate resize cursor for each handle', () => {
      expect(SelectionHitTester.getCursorForHandle('nw')).toBe('nwse-resize');
      expect(SelectionHitTester.getCursorForHandle('se')).toBe('nwse-resize');
      expect(SelectionHitTester.getCursorForHandle('ne')).toBe('nesw-resize');
      expect(SelectionHitTester.getCursorForHandle('sw')).toBe('nesw-resize');
      expect(SelectionHitTester.getCursorForHandle('n')).toBe('ns-resize');
      expect(SelectionHitTester.getCursorForHandle('s')).toBe('ns-resize');
      expect(SelectionHitTester.getCursorForHandle('e')).toBe('ew-resize');
      expect(SelectionHitTester.getCursorForHandle('w')).toBe('ew-resize');
    });

    it('detects handle hits correctly', () => {
      const hit = SelectionHitTester.testHit({ x: 10, y: 10 }, bounds, null, containsPixelFn, 1);
      expect(hit).toEqual({ type: 'handle', handle: 'nw' });
    });

    it('detects pivot hits correctly', () => {
      const pivot = { x: 20, y: 20 };
      const hit = SelectionHitTester.testHit({ x: 20, y: 20 }, bounds, pivot, containsPixelFn, 1);
      expect(hit).toEqual({ type: 'pivot' });
    });

    it('detects inside hits correctly', () => {
      const largeBounds = { x: 0, y: 0, width: 100, height: 100 };
      const largeContainsFn = (x: number, y: number) => x >= 0 && x < 100 && y >= 0 && y < 100;
      const hit = SelectionHitTester.testHit({ x: 50, y: 50 }, largeBounds, null, largeContainsFn, 1);
      expect(hit).toEqual({ type: 'inside' });
    });

    it('detects none when clicking far outside', () => {
      const hit = SelectionHitTester.testHit({ x: 100, y: 100 }, bounds, null, containsPixelFn, 1);
      expect(hit).toEqual({ type: 'none' });
    });

    it('handles NaN, null, and zoom scaling without errors', () => {
      expect(() => {
        SelectionHitTester.testHit({ x: NaN, y: 0 }, null, null, containsPixelFn, 2);
        SelectionHitTester.testHit({ x: 0, y: 0 }, bounds, null, containsPixelFn, 0);
      }).not.toThrow();
    });
  });

  describe('CursorManager', () => {
    beforeEach(() => {
      CursorManager.getInstance().reset();
    });

    it('is a singleton and updates cursor state', () => {
      const cm1 = CursorManager.getInstance();
      const cm2 = CursorManager.getInstance();
      expect(cm1).toBe(cm2);

      cm1.setCursor('crosshair');
      expect(cm2.getCursor()).toBe('crosshair');
    });

    it('notifies subscribers on cursor change', () => {
      const cm = CursorManager.getInstance();
      const listener = vi.fn();
      const unsub = cm.subscribe(listener);

      cm.setCursor('grab');
      expect(listener).toHaveBeenCalledWith('grab');

      unsub();
      cm.setCursor('move');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('SelectionInteractionController', () => {
    let controller: SelectionInteractionController;

    beforeEach(() => {
      controller = new SelectionInteractionController();
    });

    it('starts in idle state', () => {
      expect(controller.getState()).toBe('idle');
      expect(controller.getActiveHandle()).toBeNull();
      expect(controller.getDelta()).toEqual({ x: 0, y: 0 });
    });

    it('handles drag lifecycle for moving selection', () => {
      controller.startDrag({ x: 15, y: 15 }, { type: 'inside' });
      expect(controller.getState()).toBe('moving');

      controller.updateDrag({ x: 25, y: 35 });
      expect(controller.getDelta()).toEqual({ x: 10, y: 20 });

      const result = controller.endDrag();
      expect(result.state).toBe('moving');
      expect(result.delta).toEqual({ x: 10, y: 20 });
      expect(controller.getState()).toBe('idle');
    });

    it('handles drag lifecycle for handle resizing', () => {
      controller.startDrag({ x: 10, y: 10 }, { type: 'handle', handle: 'nw' });
      expect(controller.getState()).toBe('dragging_handle');
      expect(controller.getActiveHandle()).toBe('nw');

      controller.updateDrag({ x: 5, y: 5 });
      expect(controller.getDelta()).toEqual({ x: -5, y: -5 });

      const result = controller.endDrag();
      expect(result.handle).toBe('nw');
      expect(controller.getState()).toBe('idle');
    });

    it('manages center pivot position and resetPivot', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      controller.resetPivot(bounds);
      expect(controller.getPivot()).toEqual({ x: 50, y: 50 });

      controller.setPivot({ x: 30, y: 30 });
      expect(controller.getPivot()).toEqual({ x: 30, y: 30 });
    });

    it('handles rapid calls and invalid inputs gracefully', () => {
      expect(() => {
        controller.startDrag({ x: NaN, y: Infinity });
        controller.updateDrag({ x: null as unknown as number, y: 10 });
        controller.setPivot({ x: NaN, y: 0 });
        controller.endDrag();
      }).not.toThrow();
    });
  });
});
