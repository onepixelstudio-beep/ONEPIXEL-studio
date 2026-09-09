import { describe, it, expect, vi } from 'vitest';
import { SelectionEngine } from '../SelectionEngine';
import { getLinePoints, getRectanglePoints, getEllipsePoints, getBucketFillPoints } from '../../../utils/canvas';
import { ToolType } from '../../../types';

describe('Tool Pipeline & Tool Switch Integration Audit', () => {
  const WIDTH = 16;
  const HEIGHT = 16;

  interface SimulationState {
    currentTool: ToolType;
    selectionEngine: SelectionEngine;
    selectionState: { active: boolean; pixels: boolean[] };
    pixels: string[];
    isDrawing: boolean;
    drawStart: { x: number; y: number } | null;
    activeStrokePixels: string[] | null;
    history: string[][];
    historyIndex: number;
  }

  const createInitialState = (): SimulationState => ({
    currentTool: 'pen',
    selectionEngine: new SelectionEngine(WIDTH, HEIGHT),
    selectionState: { active: false, pixels: [] },
    pixels: new Array(WIDTH * HEIGHT).fill(''),
    isDrawing: false,
    drawStart: null,
    activeStrokePixels: null,
    history: [new Array(WIDTH * HEIGHT).fill('')],
    historyIndex: 0,
  });

  const isSelectionTool = (tool: ToolType) =>
    ['rect_select', 'ellipse_select', 'lasso_select', 'wand'].includes(tool);

  // Simulates the stabilized tool switch handler in CanvasArea.tsx
  const switchTool = (state: SimulationState, nextTool: ToolType) => {
    if (state.currentTool === nextTool) return;
    state.currentTool = nextTool;

    // Reset temporary drawing state on tool change
    state.isDrawing = false;
    state.drawStart = null;
    state.activeStrokePixels = null;

    // Reinicio al Cambiar de Herramienta:
    // If switching to a non-selection tool, clear any active selection mask
    if (!isSelectionTool(nextTool)) {
      const hasActive = !state.selectionEngine.mask.isEmpty() || state.selectionState.active;
      if (hasActive) {
        state.selectionEngine.clear();
        state.selectionState = { active: false, pixels: [] };
      }
    }
  };

  // Simulates start of stroke (handleMouseDown)
  const startStroke = (state: SimulationState, coord: { x: number; y: number }, color: string) => {
    state.isDrawing = true;
    state.drawStart = coord;
    state.activeStrokePixels = [...state.pixels];

    // Paint initial point
    applyPaintPoint(state, coord, color);
  };

  // Simulates dragging stroke (handleMouseMove)
  const moveStroke = (state: SimulationState, from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
    if (!state.isDrawing || !state.activeStrokePixels) return;
    const points = getLinePoints(from.x, from.y, to.x, to.y);
    for (const pt of points) {
      applyPaintPoint(state, pt, color);
    }
  };

  // Applies point paint respecting selection mask
  const applyPaintPoint = (state: SimulationState, pt: { x: number; y: number }, color: string) => {
    if (pt.x < 0 || pt.x >= WIDTH || pt.y < 0 || pt.y >= HEIGHT) return;
    const idx = pt.y * WIDTH + pt.x;

    // If selection is active, filter by mask
    if (state.selectionState.active && !state.selectionEngine.contains(pt.x, pt.y)) {
      return;
    }

    if (state.currentTool === 'eraser') {
      state.activeStrokePixels![idx] = '';
    } else {
      state.activeStrokePixels![idx] = color;
    }
  };

  // Simulates end of stroke (handleMouseUp) with History commit
  const endStroke = (state: SimulationState) => {
    if (state.isDrawing && state.activeStrokePixels) {
      state.pixels = [...state.activeStrokePixels];

      // Commit to history
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push([...state.pixels]);
      state.historyIndex++;
    }
    state.isDrawing = false;
    state.drawStart = null;
    state.activeStrokePixels = null;
  };

  const undo = (state: SimulationState) => {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.pixels = [...state.history[state.historyIndex]];
    }
  };

  const redo = (state: SimulationState) => {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.pixels = [...state.history[state.historyIndex]];
    }
  };

  describe('Lápiz (Pen)', () => {
    it('paints continuous strokes without selection and commits to history', () => {
      const state = createInitialState();
      switchTool(state, 'pen');

      startStroke(state, { x: 2, y: 2 }, '#FF0000');
      moveStroke(state, { x: 2, y: 2 }, { x: 4, y: 2 }, '#FF0000');
      endStroke(state);

      expect(state.pixels[2 * WIDTH + 2]).toBe('#FF0000');
      expect(state.pixels[2 * WIDTH + 3]).toBe('#FF0000');
      expect(state.pixels[2 * WIDTH + 4]).toBe('#FF0000');
      expect(state.historyIndex).toBe(1);

      // Verify Undo & Redo
      undo(state);
      expect(state.pixels[2 * WIDTH + 2]).toBe('');
      redo(state);
      expect(state.pixels[2 * WIDTH + 2]).toBe('#FF0000');
    });

    it('paints after creating a selection and then explicitly deselecting', () => {
      const state = createInitialState();
      switchTool(state, 'rect_select');
      state.selectionEngine.selectRect(1, 1, 4, 4, 'replace');
      state.selectionState = { active: true, pixels: new Array(WIDTH * HEIGHT).fill(false) };

      // Explicit deselect
      state.selectionEngine.clear();
      state.selectionState = { active: false, pixels: [] };

      switchTool(state, 'pen');

      // Pen should be able to paint outside the former selection area (e.g. at 10, 10)
      startStroke(state, { x: 10, y: 10 }, '#00FF00');
      endStroke(state);

      expect(state.pixels[10 * WIDTH + 10]).toBe('#00FF00');
    });

    it('paints after switching directly from Selection to Pen without manual deselect', () => {
      const state = createInitialState();
      switchTool(state, 'rect_select');
      state.selectionEngine.selectRect(2, 2, 4, 4, 'replace');
      state.selectionState = { active: true, pixels: new Array(WIDTH * HEIGHT).fill(false) };

      // Switch to pen - should auto-deactivate selection
      switchTool(state, 'pen');
      expect(state.selectionEngine.mask.isEmpty()).toBe(true);
      expect(state.selectionState.active).toBe(false);

      // Paint anywhere
      startStroke(state, { x: 0, y: 0 }, '#0000FF');
      moveStroke(state, { x: 0, y: 0 }, { x: 0, y: 2 }, '#0000FF');
      endStroke(state);

      expect(state.pixels[0]).toBe('#0000FF');
      expect(state.pixels[WIDTH]).toBe('#0000FF');
      expect(state.pixels[2 * WIDTH]).toBe('#0000FF');
    });
  });

  describe('Borrador (Eraser)', () => {
    it('erases painted pixels during stroke and supports Undo/Redo', () => {
      const state = createInitialState();
      // First paint some pixels
      switchTool(state, 'pen');
      startStroke(state, { x: 5, y: 5 }, '#FFFF00');
      moveStroke(state, { x: 5, y: 5 }, { x: 7, y: 5 }, '#FFFF00');
      endStroke(state);

      expect(state.pixels[5 * WIDTH + 5]).toBe('#FFFF00');
      expect(state.pixels[5 * WIDTH + 6]).toBe('#FFFF00');
      expect(state.pixels[5 * WIDTH + 7]).toBe('#FFFF00');

      // Now switch to Eraser and erase
      switchTool(state, 'eraser');
      startStroke(state, { x: 5, y: 5 }, '');
      moveStroke(state, { x: 5, y: 5 }, { x: 6, y: 5 }, '');
      endStroke(state);

      expect(state.pixels[5 * WIDTH + 5]).toBe('');
      expect(state.pixels[5 * WIDTH + 6]).toBe('');
      expect(state.pixels[5 * WIDTH + 7]).toBe('#FFFF00'); // Untouched point remains

      // Undo eraser stroke
      undo(state);
      expect(state.pixels[5 * WIDTH + 5]).toBe('#FFFF00');
      expect(state.pixels[5 * WIDTH + 6]).toBe('#FFFF00');

      // Redo eraser stroke
      redo(state);
      expect(state.pixels[5 * WIDTH + 5]).toBe('');
      expect(state.pixels[5 * WIDTH + 6]).toBe('');
    });

    it('erases cleanly after switching from Selection', () => {
      const state = createInitialState();
      state.pixels[3 * WIDTH + 3] = '#AABBCC';

      switchTool(state, 'rect_select');
      state.selectionEngine.selectRect(0, 0, 2, 2, 'replace');
      state.selectionState = { active: true, pixels: [] };

      // Switch to eraser: selection is purged
      switchTool(state, 'eraser');
      expect(state.selectionEngine.mask.isEmpty()).toBe(true);

      startStroke(state, { x: 3, y: 3 }, '');
      endStroke(state);

      expect(state.pixels[3 * WIDTH + 3]).toBe('');
    });
  });

  describe('Bote de pintura (Bucket)', () => {
    it('fills contiguous area without interfering with subsequent tool switches', () => {
      const state = createInitialState();
      // Fill empty canvas with a color using getBucketFillPoints
      const fillPoints = getBucketFillPoints(
        state.pixels,
        0,
        0,
        WIDTH,
        HEIGHT,
        '#000000',
        {
          contiguous: true,
          tiling: false,
          symmetry: { x: false, y: false, radial: false, radialCount: 4, centerX: 8, centerY: 8 }
        }
      );
      expect(fillPoints.length).toBe(WIDTH * HEIGHT);

      for (const p of fillPoints) {
        state.pixels[p.y * WIDTH + p.x] = '#000000';
      }

      // Switch from Bucket to Pen
      switchTool(state, 'pen');
      expect(state.currentTool).toBe('pen');

      // Draw over the filled canvas
      startStroke(state, { x: 1, y: 1 }, '#FFFFFF');
      endStroke(state);
      expect(state.pixels[1 * WIDTH + 1]).toBe('#FFFFFF');
    });
  });

  describe('Formas (Line, Rectangle, Ellipse)', () => {
    it('calculates and commits rectangle shape on mouseup', () => {
      const state = createInitialState();
      switchTool(state, 'rectangle');

      const points = getRectanglePoints(1, 1, 4, 4, false);
      for (const p of points) {
        state.pixels[p.y * WIDTH + p.x] = '#112233';
      }

      expect(state.pixels[1 * WIDTH + 1]).toBe('#112233');
      expect(state.pixels[1 * WIDTH + 4]).toBe('#112233');
      expect(state.pixels[4 * WIDTH + 1]).toBe('#112233');
      expect(state.pixels[4 * WIDTH + 4]).toBe('#112233');
      expect(state.pixels[2 * WIDTH + 2]).toBe(''); // hollow
    });

    it('calculates and commits ellipse shape', () => {
      const points = getEllipsePoints(2, 2, 6, 6, false);
      expect(points.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Transition Matrix (Comprehensive Verification)', () => {
    const transitions: [ToolType, ToolType][] = [
      ['rect_select', 'pen'],
      ['rect_select', 'eraser'],
      ['rect_select', 'bucket'],
      ['pen', 'eraser'],
      ['eraser', 'pen'],
      ['pen', 'bucket'],
      ['bucket', 'pen'],
      ['bucket', 'rect_select'],
      ['rect_select', 'pan'],
      ['pan', 'pen'],
    ];

    it.each(transitions)('transitions cleanly from %s to %s without getting locked', (fromTool, toTool) => {
      const state = createInitialState();
      // Pre-seed some pixels so eraser has something to erase if tested
      state.pixels[8 * WIDTH + 8] = '#AABBCC';

      switchTool(state, fromTool);

      if (isSelectionTool(fromTool)) {
        state.selectionEngine.selectRect(2, 2, 3, 3, 'replace');
        state.selectionState = { active: true, pixels: new Array(WIDTH * HEIGHT).fill(true) };
      }

      switchTool(state, toTool);
      expect(state.currentTool).toBe(toTool);
      expect(state.isDrawing).toBe(false);

      if (!isSelectionTool(toTool)) {
        // Selection must be clean
        expect(state.selectionEngine.mask.isEmpty()).toBe(true);
        expect(state.selectionState.active).toBe(false);

        // Drawing tool must be able to perform a complete stroke
        startStroke(state, { x: 8, y: 8 }, '#123456');
        endStroke(state);
        if (toTool === 'eraser') {
          expect(state.pixels[8 * WIDTH + 8]).toBe('');
        } else {
          expect(state.pixels[8 * WIDTH + 8]).toBe('#123456');
        }
      }
    });
  });
});
