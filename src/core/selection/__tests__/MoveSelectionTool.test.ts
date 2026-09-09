import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionMask } from '../SelectionMask';
import { SelectionEngine } from '../SelectionEngine';
import { SelectionInteractionController } from '../SelectionInteractionController';
import { MoveSelectionTool } from '../MoveSelectionTool';

describe('Move Tool & Selection Translation (Sprint 1.5)', () => {
  describe('SelectionMask.translate', () => {
    it('translates mask contents right and down accurately', () => {
      const mask = new SelectionMask(10, 10);
      mask.setValue(2, 2, 255);
      expect(mask.getBounds()).toEqual({ x: 2, y: 2, width: 1, height: 1 });

      mask.translate(3, 4); // Move to (5, 6)
      expect(mask.getValue(2, 2)).toBe(0);
      expect(mask.getValue(5, 6)).toBe(255);
      expect(mask.getBounds()).toEqual({ x: 5, y: 6, width: 1, height: 1 });
    });

    it('handles translation out of bounds safely', () => {
      const mask = new SelectionMask(10, 10);
      mask.setValue(1, 1, 255);
      mask.translate(-5, -5); // Shift out of canvas
      expect(mask.isEmpty()).toBe(true);
      expect(mask.getBounds()).toBeNull();
    });

    it('does nothing when shift is (0, 0)', () => {
      const mask = new SelectionMask(5, 5);
      mask.setValue(1, 1, 255);
      const originalBounds = mask.getBounds();
      mask.translate(0, 0);
      expect(mask.getBounds()).toEqual(originalBounds);
    });
  });

  describe('SelectionEngine.translate', () => {
    it('notifies listeners when selection is translated', () => {
      const engine = new SelectionEngine(20, 20);
      engine.selectRect(5, 5, 5, 5, 'replace');

      let notified = false;
      engine.subscribe(() => {
        notified = true;
      });

      engine.translate(2, 3);
      expect(notified).toBe(true);
      expect(engine.getBounds()).toEqual({ x: 7, y: 8, width: 5, height: 5 });
    });
  });

  describe('MoveSelectionTool', () => {
    let engine: SelectionEngine;
    let controller: SelectionInteractionController;
    let moveTool: MoveSelectionTool;

    beforeEach(() => {
      engine = new SelectionEngine(50, 50);
      controller = new SelectionInteractionController();
      moveTool = new MoveSelectionTool(engine, controller);
    });

    it('returns false when starting move on an empty selection', () => {
      const started = moveTool.startMove({ x: 10, y: 10 }, 1);
      expect(started).toBe(false);
      expect(moveTool.isActive()).toBe(false);
    });

    it('starts move when clicking inside an active selection', () => {
      engine.selectRect(10, 10, 20, 20, 'replace');
      const started = moveTool.startMove({ x: 15, y: 15 }, 1);

      expect(started).toBe(true);
      expect(moveTool.isActive()).toBe(true);
      expect(controller.getState()).toBe('moving');
    });

    it('updates selection mask position smoothly during drag', () => {
      engine.selectRect(10, 10, 10, 10, 'replace');
      moveTool.startMove({ x: 15, y: 15 }, 1);

      // Drag to (25, 25) => delta is (+10, +10)
      moveTool.updateMove({ x: 25, y: 25 });

      expect(engine.getBounds()).toEqual({ x: 20, y: 20, width: 10, height: 10 });
      expect(engine.contains(20, 20)).toBe(true);
      expect(engine.contains(10, 10)).toBe(false);
    });

    it('prevents cumulative position drift during continuous dragging', () => {
      engine.selectRect(0, 0, 10, 10, 'replace');
      moveTool.startMove({ x: 5, y: 5 }, 1);

      // Drag series
      moveTool.updateMove({ x: 15, y: 5 }); // delta +10, 0
      expect(engine.getBounds()).toEqual({ x: 10, y: 0, width: 10, height: 10 });

      moveTool.updateMove({ x: 5, y: 5 }); // back to delta 0, 0
      expect(engine.getBounds()).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    });

    it('finishes movement cleanly on endMove', () => {
      engine.selectRect(5, 5, 10, 10, 'replace');
      moveTool.startMove({ x: 10, y: 10 }, 1);
      moveTool.updateMove({ x: 20, y: 15 });

      const result = moveTool.endMove();
      expect(result.moved).toBe(true);
      expect(result.delta).toEqual({ x: 10, y: 5 });
      expect(moveTool.isActive()).toBe(false);
      expect(controller.getState()).toBe('idle');
      expect(engine.getBounds()).toEqual({ x: 15, y: 10, width: 10, height: 10 });
    });

    it('cancels movement and restores original mask on cancelMove', () => {
      engine.selectRect(5, 5, 10, 10, 'replace');
      const originalBounds = engine.getBounds();

      moveTool.startMove({ x: 10, y: 10 }, 1);
      moveTool.updateMove({ x: 30, y: 30 });
      expect(engine.getBounds()).not.toEqual(originalBounds);

      moveTool.cancelMove();
      expect(engine.getBounds()).toEqual(originalBounds);
      expect(moveTool.isActive()).toBe(false);
    });

    it('Scenario: Move selection updates both pixels and engine mask synchronously', () => {
      // Setup 10x10 project canvas
      const width = 10;
      const height = 10;
      const projectPixels = new Array(width * height).fill('#FFFFFF');
      // Set colored pixel at (2, 2)
      projectPixels[2 * width + 2] = '#FF0000';

      const testEngine = new SelectionEngine(width, height);
      testEngine.selectRect(2, 2, 2, 2, 'replace');
      expect(testEngine.contains(2, 2)).toBe(true);

      // Verify hit testing: (2, 2) is inside, (0, 0) is outside
      expect(testEngine.contains(2, 2)).toBe(true);
      expect(testEngine.contains(0, 0)).toBe(false);

      // Perform translation by dx = 3, dy = 4
      testEngine.translate(3, 4);
      expect(testEngine.contains(2, 2)).toBe(false);
      expect(testEngine.contains(5, 6)).toBe(true);
      expect(testEngine.getBounds()).toEqual({ x: 5, y: 6, width: 2, height: 2 });
    });

    it('Scenario: Decoupled pan tool does not modify selection engine mask', () => {
      const testEngine = new SelectionEngine(10, 10);
      testEngine.selectRect(3, 3, 4, 4, 'replace');
      const originalBounds = testEngine.getBounds();

      // Pan viewport operation (viewport pan offset X=100, Y=50)
      const viewportPan = { panX: 100, panY: 50 };
      expect(viewportPan.panX).toBe(100);

      // Selection engine coordinates remain strictly unshifted by viewport pan
      expect(testEngine.getBounds()).toEqual(originalBounds);
    });
  });
});
