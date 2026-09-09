import { describe, it, expect, vi, beforeEach } from 'vitest';

// Setup window mock for node environment
const listeners: Record<string, Function[]> = {};
(globalThis as any).window = {
  innerWidth: 1280,
  innerHeight: 800,
  addEventListener: (type: string, fn: Function) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(fn);
  },
  removeEventListener: (type: string, fn: Function) => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter(f => f !== fn);
    }
  },
  dispatchEvent: (event: any) => {
    if (listeners[event.type]) {
      listeners[event.type].forEach(fn => fn(event));
    }
    return true;
  }
};
(globalThis as any).Event = class Event {
  constructor(public type: string) {}
};

// Simple lightweight React hook runner
let states: any[] = [];
let stateIndex = 0;
let effectCleanups: Array<(() => void) | void> = [];

vi.mock('react', async () => {
  const actual = await vi.importActual('react') as any;
  const mockReact = {
    ...actual,
    useState: (initial: any) => {
      const idx = stateIndex++;
      if (states[idx] === undefined) {
        states[idx] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (newVal: any) => {
        states[idx] = typeof newVal === 'function' ? newVal(states[idx]) : newVal;
      };
      return [states[idx], setState];
    },
    useRef: (initial: any) => {
      const idx = stateIndex++;
      if (!states[idx]) {
        states[idx] = { current: initial };
      }
      return states[idx];
    },
    useEffect: (fn: any) => {
      const cleanup = fn();
      if (cleanup) effectCleanups.push(cleanup);
    },
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
  };
  return {
    ...mockReact,
    default: mockReact,
  };
});

import { useAWE } from '../useAWE';

describe('useAWE - Responsive Viewport Classification & Decoupling', () => {
  beforeEach(() => {
    states = [];
    stateIndex = 0;
    effectCleanups.forEach((c) => { if (typeof c === 'function') c(); });
    effectCleanups = [];
  });

  const runUseAWE = (width: number, height: number, containerRef?: any) => {
    states = [];
    stateIndex = 0;
    (window as any).innerWidth = width;
    (window as any).innerHeight = height;
    window.dispatchEvent(new Event('resize'));
    return useAWE(containerRef);
  };

  it('classifies 375x667 as Mobile Portrait', () => {
    const res = runUseAWE(375, 667);
    expect(res.isMobile).toBe(true);
    expect(res.isMobilePortrait).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutMode).toBe('phone');
  });

  it('classifies 390x844 as Mobile Portrait', () => {
    const res = runUseAWE(390, 844);
    expect(res.isMobile).toBe(true);
    expect(res.isMobilePortrait).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutMode).toBe('phone');
  });

  it('classifies 768x1024 as Tablet Portrait (STABLE at boundary)', () => {
    const res = runUseAWE(768, 1024);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutMode).toBe('tablet-portrait');
  });

  it('classifies 820x1180 as Tablet Portrait', () => {
    const res = runUseAWE(820, 1180);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutMode).toBe('tablet-portrait');
  });

  it('classifies 1024x768 as Tablet Landscape', () => {
    const res = runUseAWE(1024, 768);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('landscape');
    expect(res.layoutMode).toBe('tablet-landscape');
  });

  it('classifies 1100x800 as Desktop (boundary)', () => {
    const res = runUseAWE(1100, 800);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(true);
    expect(res.orientation).toBe('landscape');
  });

  it('classifies 1280x800 as Desktop', () => {
    const res = runUseAWE(1280, 800);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(true);
    expect(res.orientation).toBe('landscape');
  });

  it('classifies 1920x1080 as Large Desktop', () => {
    const res = runUseAWE(1920, 1080);
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(true);
    expect(res.isLargeDesktop).toBe(true);
    expect(res.layoutMode).toBe('desktop-wide');
  });

  it('PREVENTS OSCILLATION LOOP: container padding change does NOT alter device classification', () => {
    // Simulated container with padding subtracting 8px (760x1016)
    const mockContainer = {
      getBoundingClientRect: () => ({ width: 760, height: 1016 }),
    };
    const containerRef = { current: mockContainer as any };

    const res = runUseAWE(768, 1024, containerRef);

    // Classification MUST remain Tablet, strictly derived from the 768px viewport!
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.viewportWidth).toBe(768);
    expect(res.viewportHeight).toBe(1024);
    // Container size is tracked separately
    expect(res.containerWidth).toBe(760);
    expect(res.containerHeight).toBe(1016);
  });

  it('UNIFIED SOURCE: useAWE with and without containerRef yield identical device classifications', () => {
    const withoutRef = runUseAWE(768, 1024);
    const withRef = runUseAWE(768, 1024, { current: null });

    expect(withoutRef.isMobile).toBe(withRef.isMobile);
    expect(withoutRef.isTablet).toBe(withRef.isTablet);
    expect(withoutRef.isDesktop).toBe(withRef.isDesktop);
    expect(withoutRef.orientation).toBe(withRef.orientation);
    expect(withoutRef.layoutMode).toBe(withRef.layoutMode);
  });
});
