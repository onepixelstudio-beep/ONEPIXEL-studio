import React, { useEffect, useRef } from 'react';
import { ISelectionEngine } from './SelectionEngine';
import { SelectionInteractionController } from './SelectionInteractionController';
import { SelectionHitTester } from './SelectionHitTester';

export interface SelectionOverlayRendererProps {
  selectionEngine: ISelectionEngine;
  interactionController?: SelectionInteractionController;
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;
  overlayColor?: string;
  marchingAntsColor1?: string;
  marchingAntsColor2?: string;
  showBoundingBox?: boolean;
  showHandles?: boolean;
  showPivot?: boolean;
  className?: string;
}

export const SelectionOverlayRenderer: React.FC<SelectionOverlayRendererProps> = React.memo(({
  selectionEngine,
  interactionController,
  zoom,
  panX,
  panY,
  canvasWidth,
  canvasHeight,
  overlayColor = 'rgba(200, 169, 106, 0.22)',
  marchingAntsColor1 = '#FFFFFF',
  marchingAntsColor2 = '#000000',
  showBoundingBox = true,
  showHandles = true,
  showPivot = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dashOffsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const renderOverlay = () => {
      if (!canvas || !ctx || !isSubscribed) return;

      const dpr = window.devicePixelRatio || 1;
      const viewportWidth = canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 800);
      const viewportHeight = canvas.clientHeight || (canvas.parentElement ? canvas.parentElement.clientHeight : 600);

      const targetW = Math.max(1, Math.floor(viewportWidth * dpr));
      const targetH = Math.max(1, Math.floor(viewportHeight * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      const mask = selectionEngine.mask;
      if (mask.isEmpty()) {
        ctx.restore();
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        return;
      }

      const bounds = mask.getBounds();
      if (!bounds) {
        ctx.restore();
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        return;
      }

      ctx.imageSmoothingEnabled = false;

      // Viewport clipping range in canvas space to avoid iterating over off-screen pixels
      const minX = Math.max(0, Math.floor(-panX / zoom));
      const maxX = Math.min(canvasWidth, Math.ceil((viewportWidth - panX) / zoom));
      const minY = Math.max(0, Math.floor(-panY / zoom));
      const maxY = Math.min(canvasHeight, Math.ceil((viewportHeight - panY) / zoom));

      const startX = Math.max(bounds.x, minX);
      const endX = Math.min(bounds.x + bounds.width, maxX);
      const startY = Math.max(bounds.y, minY);
      const endY = Math.min(bounds.y + bounds.height, maxY);

      // 1. Translucent Overlay Fill on Selected Pixels
      if (startX < endX && startY < endY) {
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);
        ctx.fillStyle = overlayColor;

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const val = mask.getValue(x, y);
            if (val > 0) {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        ctx.restore();
      }

      // 2. Marching Ants Contour Lines (Batched Path Rendering in Screen Space)
      dashOffsetRef.current = (dashOffsetRef.current + 0.25) % 8;

      const path = new Path2D();

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (mask.getValue(x, y) === 0) continue;

          const topEmpty = y === 0 || mask.getValue(x, y - 1) === 0;
          const bottomEmpty = y === canvasHeight - 1 || mask.getValue(x, y + 1) === 0;
          const leftEmpty = x === 0 || mask.getValue(x - 1, y) === 0;
          const rightEmpty = x === canvasWidth - 1 || mask.getValue(x + 1, y) === 0;

          const px = panX + x * zoom;
          const py = panY + y * zoom;

          if (topEmpty) { path.moveTo(px, py); path.lineTo(px + zoom, py); }
          if (bottomEmpty) { path.moveTo(px, py + zoom); path.lineTo(px + zoom, py + zoom); }
          if (leftEmpty) { path.moveTo(px, py); path.lineTo(px, py + zoom); }
          if (rightEmpty) { path.moveTo(px + zoom, py); path.lineTo(px + zoom, py + zoom); }
        }
      }

      ctx.save();
      ctx.lineWidth = 1;

      // Pass 1: Solid background contour line
      ctx.strokeStyle = marchingAntsColor2;
      ctx.setLineDash([]);
      ctx.stroke(path);

      // Pass 2: Animated white dashed contour line
      ctx.strokeStyle = marchingAntsColor1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -dashOffsetRef.current;
      ctx.stroke(path);

      ctx.restore();

      // 3. Optional Bounding Box
      if (showBoundingBox) {
        ctx.save();
        ctx.strokeStyle = '#C8A96A';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const bx = panX + bounds.x * zoom;
        const by = panY + bounds.y * zoom;
        const bw = bounds.width * zoom;
        const bh = bounds.height * zoom;
        ctx.strokeRect(
          bx - 0.5,
          by - 0.5,
          bw + 1,
          bh + 1
        );
        ctx.restore();
      }

      // 4. Handles Rendering
      if (showHandles) {
        const handles = SelectionHitTester.getHandlePositions(bounds);
        const handleSizePx = 8;
        const halfSize = handleSizePx / 2;

        const activeHandle = interactionController?.getActiveHandle() ?? null;
        const hoverTarget = interactionController?.getHoverTarget();
        const hoverHandle = hoverTarget?.type === 'handle' ? hoverTarget.handle : null;

        handles.forEach((h) => {
          const hx = panX + h.x * zoom;
          const hy = panY + h.y * zoom;
          const isHovered = hoverHandle === h.id || activeHandle === h.id;

          ctx.save();
          ctx.beginPath();
          ctx.rect(hx - halfSize, hy - halfSize, handleSizePx, handleSizePx);

          ctx.fillStyle = isHovered ? '#FFD700' : '#FFFFFF';
          ctx.fill();

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = isHovered ? '#000000' : '#1E1E1E';
          ctx.stroke();
          ctx.restore();
        });
      }

      // 5. Transform Center Pivot Rendering
      if (showPivot) {
        let pivot = interactionController?.getPivot();
        if (!pivot) {
          pivot = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
          };
        }

        const px = panX + pivot.x * zoom;
        const py = panY + pivot.y * zoom;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Crosshair lines
        ctx.beginPath();
        ctx.moveTo(px - 8, py);
        ctx.lineTo(px + 8, py);
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px, py + 8);
        ctx.strokeStyle = '#C8A96A';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();

      // Only schedule continuous RAF if mask is not empty (marching ants animation)
      if (isSubscribed && !mask.isEmpty()) {
        animFrameRef.current = requestAnimationFrame(renderOverlay);
      } else {
        animFrameRef.current = null;
      }
    };

    // Trigger immediate render
    renderOverlay();

    // Subscribe to SelectionEngine and InteractionController changes
    const scheduleRender = () => {
      if (animFrameRef.current === null) {
        renderOverlay();
      }
    };

    const unsubEngine = selectionEngine.subscribe(scheduleRender);
    const unsubController = interactionController ? interactionController.subscribe(scheduleRender) : undefined;

    return () => {
      isSubscribed = false;
      unsubEngine();
      if (unsubController) unsubController();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    selectionEngine,
    interactionController,
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    overlayColor,
    marchingAntsColor1,
    marchingAntsColor2,
    showBoundingBox,
    showHandles,
    showPivot,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute left-0 top-0 w-full h-full z-20 ${className}`}
    />
  );
});

SelectionOverlayRenderer.displayName = 'SelectionOverlayRenderer';
