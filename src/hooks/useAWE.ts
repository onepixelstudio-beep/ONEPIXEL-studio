import { useState, useEffect, useRef, RefObject } from 'react';

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
  layoutMode: 'phone' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop-compact' | 'desktop' | 'desktop-wide';
  interfaceDensity: 'compact' | 'normal' | 'spacious';
  
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

  // 2. Local container dimensions (ONLY used for available content/canvas area, NEVER for device classification)
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(() => {
    if (containerRef?.current && typeof containerRef.current.getBoundingClientRect === 'function') {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height };
      }
    }
    return null;
  });

  const prevContainerSizeRef = useRef<{ width: number; height: number } | null>(containerDimensions);

  useEffect(() => {
    if (!containerRef?.current) return;
    if (typeof ResizeObserver === 'undefined') return;
    const element = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        const prev = prevContainerSizeRef.current;
        if (!prev || Math.abs(prev.width - width) > 0.5 || Math.abs(prev.height - height) > 0.5) {
          prevContainerSizeRef.current = { width, height };
          setContainerDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // --- RESPONSIVE CLASSIFICATION (Strictly derived from VIEWPORT) ---
  const { width, height } = viewport;

  // 1. Orientation & aspect ratio
  const orientation: 'portrait' | 'landscape' = width >= height ? 'landscape' : 'portrait';
  const aspectRatio = width / (height || 1);

  // 2. Precise viewport-based form-factor detection (Original Breakpoints Preserved):
  const isMobileLandscape = (orientation === 'landscape' || width > height) && height <= 520 && width <= 1024;
  const isMobilePortrait = width < 768 && orientation === 'portrait';
  const isMobile = isMobilePortrait || isMobileLandscape;
  const isTablet = !isMobile && width >= 768 && width < 1100 && height > 520;
  const isDesktop = !isMobile && width >= 1100;
  const isLargeDesktop = !isMobile && width >= 1600;

  // 3. Progressive layout mode
  let layoutMode: AWEResolve['layoutMode'] = 'desktop';
  if (isMobileLandscape) {
    layoutMode = 'phone-landscape';
  } else if (width < 640) {
    layoutMode = 'phone';
  } else if (width < 768) {
    layoutMode = 'tablet-portrait';
  } else if (width < 1100) {
    layoutMode = orientation === 'portrait' ? 'tablet-portrait' : 'tablet-landscape';
  } else if (width < 1400) {
    layoutMode = 'desktop-compact';
  } else if (width >= 1920) {
    layoutMode = 'desktop-wide';
  }

  // 4. Interface density
  let interfaceDensity: AWEResolve['interfaceDensity'] = 'normal';
  if (isMobileLandscape || width < 800 || height < 650) {
    interfaceDensity = 'compact';
  } else if (width >= 1920 && height >= 1000) {
    interfaceDensity = 'spacious';
  }

  // 5. Dynamic dimension recommendations to prioritize the Canvas area
  const compactHeader = isMobileLandscape || width < 1200 || height < 700;
  const headerHeight = isMobileLandscape ? 30 : (compactHeader ? 48 : 56);

  // Timeline recommendations (mobile uses drawer modal instead of occupying canvas height)
  const compactTimeline = height < 750 || width < 1000;
  let timelineHeight = 180;
  if (isMobile) {
    timelineHeight = 0;
  } else if (compactTimeline) {
    timelineHeight = 140;
  }

  // Sidebar dynamic scaling and collapse decisions
  const sidebarCollapsed = width < 1200;
  const hideSidebarLabels = width < 1400;
  const canShowBothSidebars = width >= 1280;

  // Width recommendations
  const toolbarWidth = isMobile ? 0 : (width < 1200 ? 172 : 198);
  const leftPanelWidth = isMobile ? 0 : (width < 1200 ? 172 : 198);
  const rightPanelWidth = isMobile ? 0 : (sidebarCollapsed ? 200 : 260);

  // 6. Calculate available drawing canvas area
  // Uses local container dimensions if available, or viewport dimensions as fallback
  const effectiveContainerWidth = containerDimensions ? containerDimensions.width : width;
  const effectiveContainerHeight = containerDimensions ? containerDimensions.height : height;

  const sidebarsWidth = toolbarWidth + (isMobile ? 0 : (canShowBothSidebars ? leftPanelWidth + rightPanelWidth : rightPanelWidth));
  const canvasAreaWidth = Math.max(280, effectiveContainerWidth - sidebarsWidth);
  const canvasAreaHeight = Math.max(200, effectiveContainerHeight - headerHeight - (isMobile ? 0 : timelineHeight));

  const compactToolbar = isMobile || width < 1200 || height < 700;

  return {
    width,
    height,
    viewportWidth: width,
    viewportHeight: height,
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
    layoutMode,
    interfaceDensity,
    headerHeight,
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
