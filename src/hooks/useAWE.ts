import { useState, useEffect, RefObject } from 'react';
import { computeResponsiveState, LayoutMode, InterfaceDensity } from '../context/ResponsiveContext';

export interface AWEResolve {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  containerWidth: number;
  containerHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  
  // Specific mobile orientation form factors
  isMobileLandscape: boolean;
  isMobilePortrait: boolean;
  
  // Dynamic layout modes based on actual space
  layoutMode: LayoutMode;
  interfaceDensity: InterfaceDensity;
  
  // Computed recommendations for layout spacing (in pixels)
  headerHeight: number;
  timelineHeight: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  toolbarWidth: number;
  
  // Available drawing canvas workspace boundaries
  canvasAreaWidth: number;
  canvasAreaHeight: number;
  
  // Responsive flags for sub-components
  compactToolbar: boolean;
  compactHeader: boolean;
  compactTimeline: boolean;
  sidebarCollapsed: boolean;
  hideSidebarLabels: boolean;
  canShowBothSidebars: boolean;
}

// Global shared viewport state ensuring a single source of truth across all components
interface ViewportState {
  width: number;
  height: number;
}

function getInitialViewport(): ViewportState {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }
  return {
    width: window.innerWidth || 1280,
    height: window.innerHeight || 800,
  };
}

let currentViewport: ViewportState = getInitialViewport();
const viewportListeners = new Set<(vp: ViewportState) => void>();

function notifyViewportChange() {
  if (typeof window === 'undefined') return;
  const newWidth = window.innerWidth || 1280;
  const newHeight = window.innerHeight || 800;
  if (newWidth !== currentViewport.width || newHeight !== currentViewport.height) {
    currentViewport = { width: newWidth, height: newHeight };
    viewportListeners.forEach((listener) => listener(currentViewport));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', notifyViewportChange, { passive: true });
  window.addEventListener('orientationchange', notifyViewportChange, { passive: true });
}

export function useAWE(containerRef?: RefObject<HTMLElement | null>): AWEResolve {
  // 1. Stable viewport state (Single Source of Truth for Responsive Breakpoints)
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth || 1280,
        height: window.innerHeight || 800,
      };
    }
    return currentViewport;
  });

  useEffect(() => {
    const syncViewport = () => {
      if (typeof window !== 'undefined') {
        const vw = window.innerWidth || 1280;
        const vh = window.innerHeight || 800;
        if (vw !== currentViewport.width || vh !== currentViewport.height) {
          currentViewport = { width: vw, height: vh };
        }
      }
      setViewport(currentViewport);
    };

    const listener = (vp: ViewportState) => {
      setViewport(vp);
    };
    viewportListeners.add(listener);

    // Immediate sync on mount
    syncViewport();

    return () => {
      viewportListeners.delete(listener);
    };
  }, []);

  // Container dimensions (only read if containerRef passed, strictly for containerWidth/Height metrics, NEVER for device classification)
  let effectiveContainerWidth = viewport.width;
  let effectiveContainerHeight = viewport.height;
  if (containerRef?.current && typeof containerRef.current.getBoundingClientRect === 'function') {
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      effectiveContainerWidth = rect.width;
      effectiveContainerHeight = rect.height;
    }
  }

  // --- RESPONSIVE CLASSIFICATION (Delegated strictly to computeResponsiveState single source of truth) ---
  const responsive = computeResponsiveState(viewport.width, viewport.height);
  const {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    orientation,
    aspectRatio,
    isMobileLandscape,
    isMobilePortrait,
    layoutStrategy,
  } = responsive;

  // Derived legacy layout recommendations
  const compactHeader = isMobileLandscape || viewport.width < 1200 || viewport.height < 700;
  const compactToolbar = isMobile || viewport.width < 1200 || viewport.height < 700;
  const compactTimeline = viewport.height < 750 || viewport.width < 1000;
  const sidebarCollapsed = viewport.width < 1200;
  const hideSidebarLabels = viewport.width < 1400;
  const canShowBothSidebars = viewport.width >= 1280;

  const timelineHeight = isMobile ? 0 : (compactTimeline ? 140 : 180);
  const toolbarWidth = isMobile ? 0 : (isTablet ? 58 : (viewport.width < 1200 ? 172 : 198));
  const leftPanelWidth = toolbarWidth;
  const rightPanelWidth = isMobile ? 0 : (isTablet ? 252 : (sidebarCollapsed ? 200 : 260));

  const sidebarsWidth = toolbarWidth + (isMobile ? 0 : (canShowBothSidebars ? leftPanelWidth + rightPanelWidth : rightPanelWidth));
  const canvasAreaWidth = Math.max(280, effectiveContainerWidth - sidebarsWidth);
  const canvasAreaHeight = Math.max(200, effectiveContainerHeight - layoutStrategy.headerHeight - (isMobile ? 0 : timelineHeight));

  return {
    width: viewport.width,
    height: viewport.height,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    containerWidth: effectiveContainerWidth,
    containerHeight: effectiveContainerHeight,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    orientation,
    aspectRatio,
    isMobileLandscape,
    isMobilePortrait,
    layoutMode: layoutStrategy.layoutMode,
    interfaceDensity: layoutStrategy.density,
    headerHeight: layoutStrategy.headerHeight,
    timelineHeight,
    leftPanelWidth,
    rightPanelWidth,
    toolbarWidth,
    canvasAreaWidth,
    canvasAreaHeight,
    compactToolbar,
    compactHeader,
    compactTimeline,
    sidebarCollapsed,
    hideSidebarLabels,
    canShowBothSidebars,
  };
}

