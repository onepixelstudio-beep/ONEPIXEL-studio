import React, { useState, useRef, useEffect } from 'react';
import { PixelProject, TilingSettings } from '../types';

// ============================================================================
// CANVAS SYSTEM — VIEWPORT GEOMETRY SUBSYSTEM
//
// CONTRACT:
// - Inputs: containerRef dimensions, project (width, height, id), tiling, manual user interactions (wheel, drag)
// - Responsibilities: Viewport measurement, calculateFitAndCenter, zoom/pan state management, smooth pan deltas
// - Strict Boundary: DO NOT own raster rendering, pixel manipulation, tool preview states, or layer composites.
// ============================================================================

export interface UseCanvasZoomPanProps {
  project: PixelProject;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasCommand?: { action: 'zoom_in' | 'zoom_out' | 'center' | null; timestamp: number };
  tiling: TilingSettings;
}

export function calculateFitAndCenter(
  containerWidth: number,
  containerHeight: number,
  projectWidth: number,
  projectHeight: number,
  isTiling: boolean,
  currentZoom?: number
) {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { zoom: currentZoom || 12, panX: 0, panY: 0 };
  }

  // Consistent, generous viewport margins (at least 48px or 10% of viewport)
  const paddingX = Math.max(48, Math.floor(containerWidth * 0.1));
  const paddingY = Math.max(48, Math.floor(containerHeight * 0.1));
  const maxCanvasW = Math.max(32, containerWidth - paddingX);
  const maxCanvasH = Math.max(32, containerHeight - paddingY);

  // Maximum fit scale that prevents any viewport clipping
  const fitZoom = Math.min(maxCanvasW / projectWidth, maxCanvasH / projectHeight);

  // Target standard comfortable visual dimension for the artboard on screen (~380px to 460px)
  const targetDimension = Math.min(440, Math.min(maxCanvasW, maxCanvasH));
  const idealScale = targetDimension / Math.max(projectWidth, projectHeight);

  let targetZoom: number;

  if (currentZoom !== undefined && currentZoom > 0 && (projectWidth * currentZoom <= maxCanvasW) && (projectHeight * currentZoom <= maxCanvasH)) {
    // Keep user-specified zoom if explicitly provided and within bounds
    targetZoom = currentZoom;
  } else if (fitZoom >= 1) {
    // Pixel-art scale: use clean integer multiples
    const desiredScale = Math.floor(Math.min(fitZoom, Math.max(1, idealScale)));
    targetZoom = Math.max(1, Math.min(24, desiredScale));
    // Guard against any overflow
    while (targetZoom > 1 && (projectWidth * targetZoom > maxCanvasW || projectHeight * targetZoom > maxCanvasH)) {
      targetZoom--;
    }
  } else {
    // High-resolution scale (e.g. 512, 1024, 1080): snap to nearest 0.05 step fitting viewport
    targetZoom = Math.max(0.05, +(Math.floor(fitZoom * 20) / 20).toFixed(2));
  }

  let panX = 0;
  let panY = 0;

  if (isTiling) {
    panX = (containerWidth - projectWidth * targetZoom) / 2 - projectWidth * targetZoom;
    panY = (containerHeight - projectHeight * targetZoom) / 2 - projectHeight * targetZoom;
  } else {
    panX = (containerWidth - projectWidth * targetZoom) / 2;
    panY = (containerHeight - projectHeight * targetZoom) / 2;
  }

  return { zoom: targetZoom, panX, panY };
}

export function useCanvasZoomPan({
  project,
  containerRef,
  canvasCommand,
  tiling
}: UseCanvasZoomPanProps) {
  const [zoom, setZoom] = useState(12); // Grid multiplier
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Refs to guarantee fresh state values in stable effects without event listener churn
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const tilingRef = useRef(tiling);
  const projectRef = useRef(project);
  const lastCanvasCommandTimestampRef = useRef<number>(0);

  // Layout sizing tracking refs
  const prevWidthRef = useRef<number>(0);
  const prevHeightRef = useRef<number>(0);
  const lastProjectIdRef = useRef<string>(project.id);
  const lastProjectWidthRef = useRef<number>(project.width);
  const lastProjectHeightRef = useRef<number>(project.height);
  const lastTilingActiveRef = useRef<boolean>(tiling.active);

  useEffect(() => {
    zoomRef.current = zoom;
    panXRef.current = panX;
    panYRef.current = panY;
    tilingRef.current = tiling;
    projectRef.current = project;
  });

  // Handle outside canvas command signals (like header zoom buttons)
  useEffect(() => {
    if (!canvasCommand || !canvasCommand.action) return;
    if (canvasCommand.timestamp === lastCanvasCommandTimestampRef.current) return;
    lastCanvasCommandTimestampRef.current = canvasCommand.timestamp;

    const container = containerRef.current;
    if (!container) return;

    const currentZoom = zoomRef.current;
    const currentTiling = tilingRef.current;
    const currentProject = projectRef.current;

    if (canvasCommand.action === 'zoom_in') {
      setZoom(prev => {
        if (prev < 0.25) return Math.min(64, +(prev + 0.05).toFixed(2));
        if (prev < 1) return Math.min(64, +(prev + 0.1).toFixed(2));
        if (prev < 4) return Math.min(64, +(prev + 0.5).toFixed(2));
        if (prev < 16) return Math.min(64, prev + 1);
        if (prev < 32) return Math.min(64, prev + 2);
        return Math.min(64, prev + 4);
      });
    } else if (canvasCommand.action === 'zoom_out') {
      setZoom(prev => {
        if (prev <= 0.05) return 0.05;
        if (prev <= 0.25) return Math.max(0.05, +(prev - 0.05).toFixed(2));
        if (prev <= 1) return Math.max(0.25, +(prev - 0.1).toFixed(2));
        if (prev <= 4) return Math.max(1, +(prev - 0.5).toFixed(2));
        if (prev <= 16) return Math.max(4, prev - 1);
        if (prev <= 32) return Math.max(16, prev - 2);
        return Math.max(32, prev - 4);
      });
    } else if (canvasCommand.action === 'center') {
      if (currentTiling.active) {
        setPanX((container.clientWidth - currentProject.width * currentZoom) / 2 - currentProject.width * currentZoom);
        setPanY((container.clientHeight - currentProject.height * currentZoom) / 2 - currentProject.height * currentZoom);
      } else {
        setPanX((container.clientWidth - currentProject.width * currentZoom) / 2);
        setPanY((container.clientHeight - currentProject.height * currentZoom) / 2);
      }
    }
  }, [canvasCommand, containerRef]);

  // Center and fit canvas in container on mount, project change, or container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect structural changes in the project size/id or tiling to trigger a clean fit & center
    const sizeOrTilingChanged =
      lastProjectIdRef.current !== project.id ||
      lastProjectWidthRef.current !== project.width ||
      lastProjectHeightRef.current !== project.height ||
      lastTilingActiveRef.current !== tiling.active;

    if (sizeOrTilingChanged) {
      lastProjectIdRef.current = project.id;
      lastProjectWidthRef.current = project.width;
      lastProjectHeightRef.current = project.height;
      lastTilingActiveRef.current = tiling.active;
      prevWidthRef.current = 0;
      prevHeightRef.current = 0;
    }

    const performCenterAndFit = () => {
      const currentWidth = container.clientWidth;
      const currentHeight = container.clientHeight;

      if (currentWidth > 0 && currentHeight > 0) {
        const currentProject = projectRef.current;
        const currentTiling = tilingRef.current;

        // Initial placement for a newly loaded project or structured tiling/size changes
        if (prevWidthRef.current === 0 || prevHeightRef.current === 0) {
          const { zoom: targetZoom, panX: newPanX, panY: newPanY } = calculateFitAndCenter(
            currentWidth,
            currentHeight,
            currentProject.width,
            currentProject.height,
            currentTiling.active
          );

          setZoom(targetZoom);
          setPanX(newPanX);
          setPanY(newPanY);
          zoomRef.current = targetZoom;
          panXRef.current = newPanX;
          panYRef.current = newPanY;
        } else {
          // Subsequent fluid resizes of the container (sidebar toggles, window resizes)
          const dW = currentWidth - prevWidthRef.current;
          const dH = currentHeight - prevHeightRef.current;

          if (dW !== 0 || dH !== 0) {
            setPanX(prev => prev + dW / 2);
            setPanY(prev => prev + dH / 2);
            panXRef.current += dW / 2;
            panYRef.current += dH / 2;
          }
        }

        prevWidthRef.current = currentWidth;
        prevHeightRef.current = currentHeight;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      performCenterAndFit();
    });
    resizeObserver.observe(container);

    // Initial immediate placement
    performCenterAndFit();

    return () => {
      resizeObserver.disconnect();
    };
  }, [project.width, project.height, tiling.active, project.id, containerRef]);

  // Mouse Wheel zooming (registered as non-passive listener to allow e.preventDefault() to work correctly)
  // Highly optimized ref-driven event listener that registers once and never churns
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});

  useEffect(() => {
    wheelHandlerRef.current = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const currentZoom = zoomRef.current;
        const currentPanX = panXRef.current;
        const currentPanY = panYRef.current;

        // Distance from pan origin
        const dX = mouseX - currentPanX;
        const dY = mouseY - currentPanY;

        let targetZoom = currentZoom;
        const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        targetZoom = Math.min(64, Math.max(0.05, currentZoom * zoomFactor));

        if (targetZoom >= 2) {
          const nearestInt = Math.round(targetZoom);
          if (Math.abs(targetZoom - nearestInt) < 0.08) {
            targetZoom = nearestInt;
          } else {
            targetZoom = +targetZoom.toFixed(2);
          }
        } else {
          targetZoom = +targetZoom.toFixed(3);
        }

        if (targetZoom !== currentZoom) {
          const ratio = targetZoom / currentZoom;
          setZoom(targetZoom);
          setPanX(mouseX - dX * ratio);
          setPanY(mouseY - dY * ratio);
        }
      }
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelRaw = (e: WheelEvent) => {
      wheelHandlerRef.current(e);
    };

    container.addEventListener('wheel', onWheelRaw, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelRaw);
    };
  }, [containerRef]);

  const handleZoomIn = () => setZoom(prev => {
    if (prev < 0.25) return Math.min(64, +(prev + 0.05).toFixed(2));
    if (prev < 1) return Math.min(64, +(prev + 0.1).toFixed(2));
    if (prev < 4) return Math.min(64, +(prev + 0.5).toFixed(2));
    if (prev < 16) return Math.min(64, prev + 1);
    if (prev < 32) return Math.min(64, prev + 2);
    return Math.min(64, prev + 4);
  });
  const handleZoomOut = () => setZoom(prev => {
    if (prev <= 0.05) return 0.05;
    if (prev <= 0.25) return Math.max(0.05, +(prev - 0.05).toFixed(2));
    if (prev <= 1) return Math.max(0.25, +(prev - 0.1).toFixed(2));
    if (prev <= 4) return Math.max(1, +(prev - 0.5).toFixed(2));
    if (prev <= 16) return Math.max(4, prev - 1);
    if (prev <= 32) return Math.max(16, prev - 2);
    return Math.max(32, prev - 4);
  });

  const centerCanvas = () => {
    const container = containerRef.current;
    if (!container) return;
    if (tiling.active) {
      setPanX((container.clientWidth - project.width * zoom) / 2 - project.width * zoom);
      setPanY((container.clientHeight - project.height * zoom) / 2 - project.height * zoom);
    } else {
      setPanX((container.clientWidth - project.width * zoom) / 2);
      setPanY((container.clientHeight - project.height * zoom) / 2);
    }
  };

  const resetZoomAndCenter = () => {
    const container = containerRef.current;
    if (!container) return;
    const maxW = container.clientWidth - 48;
    const maxH = container.clientHeight - 48;
    const fitZoom = Math.min(maxW / project.width, maxH / project.height);
    let targetZoom = 12;
    if (project.width * 12 > maxW || project.height * 12 > maxH || project.width >= 512 || project.height >= 512) {
      if (fitZoom >= 2) {
        targetZoom = Math.min(16, Math.floor(fitZoom));
      } else if (fitZoom >= 1) {
        targetZoom = 1;
      } else {
        targetZoom = Math.max(0.05, +(Math.floor(fitZoom * 20) / 20).toFixed(2));
      }
    }
    setZoom(targetZoom);
    if (tiling.active) {
      setPanX((container.clientWidth - project.width * targetZoom) / 2 - project.width * targetZoom);
      setPanY((container.clientHeight - project.height * targetZoom) / 2 - project.height * targetZoom);
    } else {
      setPanX((container.clientWidth - project.width * targetZoom) / 2);
      setPanY((container.clientHeight - project.height * targetZoom) / 2);
    }
  };

  return {
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    handleZoomIn,
    handleZoomOut,
    centerCanvas,
    resetZoomAndCenter
  };
}
