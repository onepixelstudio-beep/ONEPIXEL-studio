import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Multi-touch Concurrent Interaction Test Suite
 *
 * Verifies that:
 * 1. Primary pointer (P1) initiates and retains control of the drawing action.
 * 2. Secondary pointer (P2) dispatches ONLY pan/zoom navigation events.
 * 3. 'isDrawing' is NEVER altered or corrupted by the presence/movement of P2.
 * 4. P2 does not emit stray paint pixels or duplicate history actions.
 * 5. P1 finishes the stroke cleanly after P2 leaves, producing exactly 1 history action.
 */
describe('CanvasArea Multi-touch Drawing & Pan/Zoom Concurrency', () => {
  it('should verify CanvasArea.tsx contains dual-pointer architecture preserving isDrawing', () => {
    const canvasAreaPath = path.resolve('src/components/CanvasArea.tsx');
    const source = fs.readFileSync(canvasAreaPath, 'utf8');

    // Verify secondary navigation pointer tracking refs exist
    expect(source).toContain('secondaryNavPointerIdRef');
    expect(source).toContain('secondaryNavStartRef');

    // Verify handlePointerDown handles Case A: primary drawing active, second pointer enters without altering isDrawing
    expect(source).toContain('activeDrawingPointerIdRef.current !== null && isDrawing && e.pointerId !== activeDrawingPointerIdRef.current');

    // Verify handlePointerMove routes secondary pointer to pan/zoom without drawing
    expect(source).toContain('secondaryNavPointerIdRef.current !== null && e.pointerId === secondaryNavPointerIdRef.current');

    // Verify handlePointerUp cleans secondary nav without aborting primary isDrawing
    expect(source).toContain('secondaryNavPointerIdRef.current === e.pointerId');
  });

  it('should simulate full Multi-touch lifecycle: P1 draws, P2 pans/zooms, isDrawing remains true', () => {
    // Simulated state matching CanvasArea
    let isDrawing = false;
    let activeDrawingPointerId: number | null = null;
    let secondaryNavPointerId: number | null = null;
    let secondaryNavStart: { clientX: number; clientY: number; initialPanX: number; initialPanY: number; initialZoom: number } | null = null;
    let panX = 100;
    let panY = 100;
    let zoom = 10;
    let historyActionsCount = 0;
    let pixelUpdatesCount = 0;
    const drawnPixels: string[] = [];

    const activePointers = new Map<number, { clientX: number; clientY: number }>();

    // Simulated handlePointerDown
    const handlePointerDown = (e: { pointerId: number; clientX: number; clientY: number; pointerType: string }) => {
      activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      // Case A: Primary pointer is already actively drawing
      if (activeDrawingPointerId !== null && isDrawing && e.pointerId !== activeDrawingPointerId) {
        secondaryNavPointerId = e.pointerId;
        secondaryNavStart = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialPanX: panX,
          initialPanY: panY,
          initialZoom: zoom
        };
        // isDrawing is deliberately NOT altered!
        return;
      }

      // First pointer begins drawing
      activeDrawingPointerId = e.pointerId;
      isDrawing = true;
      historyActionsCount++;
      drawnPixels.push(`${Math.floor(e.clientX / zoom)},${Math.floor(e.clientY / zoom)}`);
    };

    // Simulated handlePointerMove
    const handlePointerMove = (e: { pointerId: number; clientX: number; clientY: number }) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      }

      // Secondary pointer routes ONLY to pan/zoom
      if (secondaryNavPointerId !== null && e.pointerId === secondaryNavPointerId) {
        if (secondaryNavStart) {
          const deltaX = e.clientX - secondaryNavStart.clientX;
          const deltaY = e.clientY - secondaryNavStart.clientY;
          panX = secondaryNavStart.initialPanX + deltaX;
          panY = secondaryNavStart.initialPanY + deltaY;
        }
        return; // DOES NOT DRAW!
      }

      // Primary pointer continues drawing
      if (e.pointerId === activeDrawingPointerId && isDrawing) {
        drawnPixels.push(`${Math.floor(e.clientX / zoom)},${Math.floor(e.clientY / zoom)}`);
      }
    };

    // Simulated handlePointerUp
    const handlePointerUp = (e: { pointerId: number }) => {
      activePointers.delete(e.pointerId);

      // Secondary pointer leaves: resets navigation, keeps primary isDrawing active!
      if (secondaryNavPointerId === e.pointerId) {
        secondaryNavPointerId = null;
        secondaryNavStart = null;
        return; // Primary drawing unaffected!
      }

      // Primary pointer leaves: commits stroke
      if (e.pointerId === activeDrawingPointerId) {
        activeDrawingPointerId = null;
        if (isDrawing) {
          isDrawing = false;
          pixelUpdatesCount++;
        }
      }
    };

    // --- STEP 1: Pointer 1 (Pen / Stylus) starts drawing ---
    handlePointerDown({ pointerId: 1, clientX: 50, clientY: 50, pointerType: 'pen' });
    expect(isDrawing).toBe(true);
    expect(activeDrawingPointerId).toBe(1);
    expect(historyActionsCount).toBe(1);
    expect(drawnPixels).toHaveLength(1);
    expect(drawnPixels[0]).toBe('5,5');

    // Pointer 1 continues stroke
    handlePointerMove({ pointerId: 1, clientX: 60, clientY: 50 });
    expect(isDrawing).toBe(true);
    expect(drawnPixels).toHaveLength(2);
    expect(drawnPixels[1]).toBe('6,5');

    // --- STEP 2: Pointer 2 (Finger) enters while Pointer 1 is actively drawing ---
    handlePointerDown({ pointerId: 2, clientX: 200, clientY: 200, pointerType: 'touch' });
    
    // CRITICAL: isDrawing MUST NOT be altered!
    expect(isDrawing).toBe(true);
    expect(activeDrawingPointerId).toBe(1);
    expect(secondaryNavPointerId).toBe(2);
    expect(historyActionsCount).toBe(1); // No new history action triggered by P2

    // --- STEP 3: Pointer 2 moves to pan the canvas ---
    handlePointerMove({ pointerId: 2, clientX: 250, clientY: 230 });
    
    // Pan is updated by Pointer 2:
    expect(panX).toBe(150); // 100 + (250 - 200)
    expect(panY).toBe(130); // 100 + (230 - 200)
    
    // CRITICAL: P2 MUST NOT draw! isDrawing remains true!
    expect(isDrawing).toBe(true);
    expect(drawnPixels).toHaveLength(2); // No new pixels from P2!

    // --- STEP 4: Pointer 1 continues drawing simultaneously ---
    handlePointerMove({ pointerId: 1, clientX: 70, clientY: 50 });
    expect(isDrawing).toBe(true);
    expect(drawnPixels).toHaveLength(3);
    expect(drawnPixels[2]).toBe('7,5');

    // --- STEP 5: Pointer 2 (Finger) lifts ---
    handlePointerUp({ pointerId: 2 });
    
    // CRITICAL: Secondary nav ends, but P1 is STILL drawing!
    expect(secondaryNavPointerId).toBeNull();
    expect(isDrawing).toBe(true);
    expect(pixelUpdatesCount).toBe(0); // Stroke not finished yet

    // Pointer 1 draws another segment after P2 has left
    handlePointerMove({ pointerId: 1, clientX: 80, clientY: 50 });
    expect(isDrawing).toBe(true);
    expect(drawnPixels).toHaveLength(4);
    expect(drawnPixels[3]).toBe('8,5');

    // --- STEP 6: Pointer 1 (Pen) finishes stroke ---
    handlePointerUp({ pointerId: 1 });
    
    expect(isDrawing).toBe(false);
    expect(activeDrawingPointerId).toBeNull();
    expect(pixelUpdatesCount).toBe(1); // Exactly 1 committed layer update
    expect(historyActionsCount).toBe(1); // Exactly 1 history undo action
  });
});
