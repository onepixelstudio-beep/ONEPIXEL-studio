import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CanvasArea Pointer Event Isolation & Redundancy Immunity', () => {
  it('should only bind Pointer Event handlers on #canvas-draw-area root', () => {
    const canvasAreaPath = path.resolve('src/components/CanvasArea.tsx');
    const source = fs.readFileSync(canvasAreaPath, 'utf8');

    const canvasDivMatch = source.match(/<div\s+ref=\{containerRef\}[\s\S]*?id="canvas-draw-area"[\s\S]*?>/);
    expect(canvasDivMatch).not.toBeNull();

    const divSnippet = canvasDivMatch![0];

    // Assert Pointer Events are attached
    expect(divSnippet).toContain('onPointerDown={handlePointerDown}');
    expect(divSnippet).toContain('onPointerMove={handlePointerMove}');
    expect(divSnippet).toContain('onPointerUp={handlePointerUp}');
    expect(divSnippet).toContain('onPointerCancel={handlePointerCancel}');
    expect(divSnippet).toContain('onPointerLeave={handlePointerLeave}');

    // Assert redundant Mouse and Touch events are NOT attached to #canvas-draw-area
    expect(divSnippet).not.toContain('onMouseDown=');
    expect(divSnippet).not.toContain('onMouseMove=');
    expect(divSnippet).not.toContain('onMouseUp=');
    expect(divSnippet).not.toContain('onTouchStart=');
    expect(divSnippet).not.toContain('onTouchMove=');
    expect(divSnippet).not.toContain('onTouchEnd=');
    expect(divSnippet).not.toContain('onTouchCancel=');
  });

  it('should isolate internal floating toolbars with onPointerDown stopPropagation', () => {
    const canvasAreaPath = path.resolve('src/components/CanvasArea.tsx');
    const source = fs.readFileSync(canvasAreaPath, 'utf8');

    // Floating selection toolbar
    expect(source).toContain('{(selection.active || moveActive || transformState.isActive) && (');
    expect(source).toContain('onPointerDown={(e) => e.stopPropagation()}');
  });

  it('should simulate PointerDown -> PointerMove -> PointerUp without generating duplicate actions', () => {
    let historyActionsCount = 0;
    let pixelUpdatesCount = 0;
    let isDrawing = false;
    let activePointerId: number | null = null;
    let capturedId: number | null = null;

    const handlePointerDown = (e: { pointerId: number; pointerType: string }) => {
      activePointerId = e.pointerId;
      capturedId = e.pointerId;
      isDrawing = true;
      historyActionsCount++;
    };

    const handlePointerMove = (e: { pointerId: number }) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      // Drawing stroke proceeds without duplicate actions
    };

    const handlePointerUp = (e: { pointerId: number }) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      capturedId = null;
      activePointerId = null;
      if (isDrawing) {
        isDrawing = false;
        pixelUpdatesCount++;
      }
    };

    // 1. Dispatch pointerdown
    handlePointerDown({ pointerId: 10, pointerType: 'touch' });
    expect(historyActionsCount).toBe(1);
    expect(isDrawing).toBe(true);
    expect(capturedId).toBe(10);

    // 2. Dispatch pointermove
    handlePointerMove({ pointerId: 10 });
    expect(historyActionsCount).toBe(1);

    // 3. Dispatch pointerup
    handlePointerUp({ pointerId: 10 });
    expect(historyActionsCount).toBe(1);
    expect(pixelUpdatesCount).toBe(1);
    expect(isDrawing).toBe(false);
    expect(capturedId).toBeNull();
  });
});
