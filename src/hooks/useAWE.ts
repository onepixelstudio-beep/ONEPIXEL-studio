import { useState, useEffect, RefObject } from 'react';

export interface AWEResolve {
  width: number;
  height: number;
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

export function useAWE(containerRef?: RefObject<HTMLElement | null>): AWEResolve {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    // If a container ref is provided, measure that container's bounding rect
    if (containerRef && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        // Avoid setting 0 sizes during unmount or hidden states
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      // Fallback or initial measure
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
      
      return () => resizeObserver.disconnect();
    } else {
      // Fallback to window measurements
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [containerRef]);

  const { width, height } = dimensions;

  // 1. Orientation & aspect ratio
  const orientation: 'portrait' | 'landscape' = width >= height ? 'landscape' : 'portrait';
  const aspectRatio = width / (height || 1);

  // 2. Precise viewport-based form-factor detection:
  // In mobile landscape, viewport height is critically constrained (typically 320px to 480px, max 520px with mobile browser chrome).
  // Phone landscape width is typically between 560px and 1024px.
  // In contrast, tablets in landscape have heights of at least 600px (e.g. iPad 1024x768, 1280x800).
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
  // We collapse sidebars or make them extremely compact when the screen is too narrow
  const sidebarCollapsed = width < 1200;
  const hideSidebarLabels = width < 1400;
  const canShowBothSidebars = width >= 1280;

  // Width recommendations (mobile moves sidebars to bottom dock panels)
  const toolbarWidth = isMobile ? 0 : (width < 1200 ? 172 : 198);
  const leftPanelWidth = isMobile ? 0 : (width < 1200 ? 172 : 198);
  const rightPanelWidth = isMobile ? 0 : (sidebarCollapsed ? 200 : 260);

  // 6. Calculate available drawing canvas area
  // Left Panel, Right Panel, Toolbar can be stacked, hidden, or active.
  const sidebarsWidth = toolbarWidth + (isMobile ? 0 : (canShowBothSidebars ? leftPanelWidth + rightPanelWidth : rightPanelWidth));
  const canvasAreaWidth = Math.max(280, width - sidebarsWidth);
  const canvasAreaHeight = Math.max(200, height - headerHeight - (isMobile ? 0 : timelineHeight));

  const compactToolbar = isMobile || width < 1200 || height < 700;

  return {
    width,
    height,
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
