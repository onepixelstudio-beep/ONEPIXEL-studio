import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';
export type LayoutMode = 'phone' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop-compact' | 'desktop' | 'desktop-wide';
export type InterfaceDensity = 'compact' | 'normal' | 'spacious';

export interface LayoutStrategy {
  toolbarWidth: number;          // 0 (mobile), 58 (tablet), 172/198 (desktop)
  rightDockWidth: number;        // 0 (mobile), 252 (tablet), 240/264 (desktop)
  headerHeight: number;          // 30 (mobile-landscape), 44 (tablet), 48 (compact), 56 (normal)
  density: InterfaceDensity;
  layoutMode: LayoutMode;
  timelineAutoCollapsed: boolean;// Auto-collapse on tablet landscape or tight vertical height (< 700)
  showProjectTabs: boolean;      // Hidden on phone/phone-landscape
  showOptionBar: boolean;        // Hidden on phone/phone-landscape
  canvasPriority: boolean;       // Prioritizes canvas spatial recovery
}

export interface ResponsiveContextValue {
  // 1. Raw Viewport (Single Source of Truth, strictly window.innerWidth/innerHeight)
  viewportWidth: number;
  viewportHeight: number;
  orientation: OrientationType;
  aspectRatio: number;

  // 2. Strict Device Classification
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isMobileLandscape: boolean;
  isMobilePortrait: boolean;

  // 3. Central Layout Strategy
  layoutStrategy: LayoutStrategy;
}

export function computeResponsiveState(width: number, height: number): ResponsiveContextValue {
  const safeWidth = width > 0 ? width : 1280;
  const safeHeight = height > 0 ? height : 800;

  // 1. Orientation & Aspect Ratio
  const orientation: OrientationType = safeWidth >= safeHeight ? 'landscape' : 'portrait';
  const aspectRatio = safeWidth / (safeHeight || 1);

  // 2. Strict Device Classification
  const isMobileLandscape = (orientation === 'landscape' || safeWidth > safeHeight) && safeHeight <= 520 && safeWidth <= 1024;
  const isMobilePortrait = safeWidth < 768 && orientation === 'portrait';
  const isMobile = isMobilePortrait || isMobileLandscape;
  const isTablet = !isMobile && safeWidth >= 768 && safeWidth < 1100 && safeHeight > 520;
  const isDesktop = !isMobile && !isTablet;
  const isLargeDesktop = isDesktop && safeWidth >= 1600;

  const device: DeviceType = isMobile ? 'mobile' : (isTablet ? 'tablet' : 'desktop');

  // 3. Progressive Layout Mode
  let layoutMode: LayoutMode = 'desktop';
  if (isMobileLandscape) {
    layoutMode = 'phone-landscape';
  } else if (safeWidth < 640) {
    layoutMode = 'phone';
  } else if (safeWidth < 768) {
    // Retain tablet-portrait string for 640-767 portrait for backwards compat with legacy tests if needed, or phone
    layoutMode = orientation === 'portrait' ? 'tablet-portrait' : 'phone';
  } else if (safeWidth < 1100) {
    layoutMode = orientation === 'portrait' ? 'tablet-portrait' : 'tablet-landscape';
  } else if (safeWidth < 1400) {
    layoutMode = 'desktop-compact';
  } else if (safeWidth >= 1920) {
    layoutMode = 'desktop-wide';
  }

  // 4. Density
  let density: InterfaceDensity = 'normal';
  if (isMobileLandscape || safeWidth < 800 || safeHeight < 650) {
    density = 'compact';
  } else if (safeWidth >= 1920 && safeHeight >= 1000) {
    density = 'spacious';
  }

  // 5. Layout Strategy
  const compactHeader = isMobileLandscape || safeWidth < 1200 || safeHeight < 700;
  let headerHeight = 56;
  if (isMobileLandscape) {
    headerHeight = 30;
  } else if (isMobile) {
    headerHeight = 48;
  } else if (isTablet) {
    headerHeight = compactHeader ? 44 : 48;
  } else if (compactHeader) {
    headerHeight = 48;
  }

  let toolbarWidth = 0;
  if (isTablet) {
    toolbarWidth = 58;
  } else if (isDesktop) {
    toolbarWidth = safeWidth < 1200 ? 172 : 198;
  }

  let rightDockWidth = 0;
  if (isTablet) {
    rightDockWidth = 252;
  } else if (isDesktop) {
    rightDockWidth = safeWidth < 1200 ? 240 : 264;
  }

  // Tablet in landscape mode or tight heights should auto-collapse timeline to prevent canvas asphyxiation
  const timelineAutoCollapsed = (isTablet && orientation === 'landscape') || safeHeight < 700;

  const showProjectTabs = !isMobile && !isMobileLandscape;
  const showOptionBar = !isMobile && !isMobileLandscape;

  return {
    viewportWidth: safeWidth,
    viewportHeight: safeHeight,
    orientation,
    aspectRatio,
    device,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isMobileLandscape,
    isMobilePortrait,
    layoutStrategy: {
      toolbarWidth,
      rightDockWidth,
      headerHeight,
      density,
      layoutMode,
      timelineAutoCollapsed,
      showProjectTabs,
      showOptionBar,
      canvasPriority: true,
    },
  };
}

function getInitialViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }
  return {
    width: window.innerWidth || 1280,
    height: window.innerHeight || 800,
  };
}

const defaultInitial = getInitialViewport();
export const defaultResponsiveState: ResponsiveContextValue = computeResponsiveState(defaultInitial.width, defaultInitial.height);

const ResponsiveContext = createContext<ResponsiveContextValue>(defaultResponsiveState);

interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const [state, setState] = useState<ResponsiveContextValue>(() => {
    const initial = getInitialViewport();
    return computeResponsiveState(initial.width, initial.height);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rAFId: number | null = null;

    const handleResize = () => {
      if (rAFId !== null) return;

      const schedule = typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame
        : (cb: () => void) => setTimeout(cb, 16);

      rAFId = schedule(() => {
        rAFId = null;
        const currentW = window.innerWidth || 1280;
        const currentH = window.innerHeight || 800;

        setState((prev) => {
          if (prev.viewportWidth === currentW && prev.viewportHeight === currentH) {
            return prev;
          }
          return computeResponsiveState(currentW, currentH);
        });
      }) as any;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Immediate sync on mount
    handleResize();

    return () => {
      if (rAFId !== null) {
        if (typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(rAFId);
        } else {
          clearTimeout(rAFId);
        }
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export function useResponsive(): ResponsiveContextValue {
  return useContext(ResponsiveContext);
}
