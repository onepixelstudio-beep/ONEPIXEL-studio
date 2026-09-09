import { describe, it, expect } from 'vitest';
import { computeResponsiveState } from '../ResponsiveContext';

describe('ResponsiveContext - Central Viewport Classification & Strategy Engine', () => {
  it('classifies 375x667 as Mobile Portrait with correct strategy', () => {
    const res = computeResponsiveState(375, 667);
    expect(res.device).toBe('mobile');
    expect(res.isMobile).toBe(true);
    expect(res.isMobilePortrait).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutStrategy.toolbarWidth).toBe(0);
    expect(res.layoutStrategy.rightDockWidth).toBe(0);
    expect(res.layoutStrategy.showProjectTabs).toBe(false);
    expect(res.layoutStrategy.showOptionBar).toBe(false);
  });

  it('classifies 390x844 as Mobile Portrait', () => {
    const res = computeResponsiveState(390, 844);
    expect(res.device).toBe('mobile');
    expect(res.isMobile).toBe(true);
    expect(res.isMobilePortrait).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
  });

  it('classifies 800x390 as Mobile Landscape', () => {
    const res = computeResponsiveState(800, 390);
    expect(res.device).toBe('mobile');
    expect(res.isMobile).toBe(true);
    expect(res.isMobileLandscape).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.orientation).toBe('landscape');
    expect(res.layoutStrategy.headerHeight).toBe(30);
  });

  it('classifies 768x1024 as Tablet Portrait (exact lower boundary)', () => {
    const res = computeResponsiveState(768, 1024);
    expect(res.device).toBe('tablet');
    expect(res.isMobile).toBe(false);
    expect(res.isTablet).toBe(true);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutStrategy.toolbarWidth).toBe(58);
    expect(res.layoutStrategy.rightDockWidth).toBe(252);
    expect(res.layoutStrategy.showProjectTabs).toBe(true);
    expect(res.layoutStrategy.showOptionBar).toBe(true);
    // Tall portrait has sufficient height, so not auto-collapsed
    expect(res.layoutStrategy.timelineAutoCollapsed).toBe(false);
  });

  it('classifies 820x1180 as Tablet Portrait', () => {
    const res = computeResponsiveState(820, 1180);
    expect(res.device).toBe('tablet');
    expect(res.isTablet).toBe(true);
    expect(res.isMobile).toBe(false);
    expect(res.orientation).toBe('portrait');
    expect(res.layoutStrategy.toolbarWidth).toBe(58);
    expect(res.layoutStrategy.rightDockWidth).toBe(252);
  });

  it('classifies 1024x768 as Tablet Landscape and auto-collapses timeline to preserve canvas', () => {
    const res = computeResponsiveState(1024, 768);
    expect(res.device).toBe('tablet');
    expect(res.isTablet).toBe(true);
    expect(res.isMobile).toBe(false);
    expect(res.isDesktop).toBe(false);
    expect(res.orientation).toBe('landscape');
    expect(res.layoutStrategy.toolbarWidth).toBe(58);
    expect(res.layoutStrategy.rightDockWidth).toBe(252);
    // Crucial rule: Tablet in landscape auto-collapses timeline so canvas has spacious vertical area
    expect(res.layoutStrategy.timelineAutoCollapsed).toBe(true);
  });

  it('classifies 1180x820 as Tablet Landscape', () => {
    // 1180 is >= 1100, so it transitions to Desktop
    const res = computeResponsiveState(1180, 820);
    expect(res.device).toBe('desktop');
    expect(res.isDesktop).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.orientation).toBe('landscape');
  });

  it('classifies 1100x800 as Desktop (exact desktop lower boundary)', () => {
    const res = computeResponsiveState(1100, 800);
    expect(res.device).toBe('desktop');
    expect(res.isDesktop).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.isMobile).toBe(false);
    expect(res.layoutStrategy.toolbarWidth).toBe(172); // compact desktop (< 1200)
    expect(res.layoutStrategy.rightDockWidth).toBe(240); // compact desktop (< 1200)
  });

  it('classifies 1280x800 as Desktop', () => {
    const res = computeResponsiveState(1280, 800);
    expect(res.device).toBe('desktop');
    expect(res.isDesktop).toBe(true);
    expect(res.isTablet).toBe(false);
    expect(res.layoutStrategy.toolbarWidth).toBe(198);
    expect(res.layoutStrategy.rightDockWidth).toBe(264);
  });

  it('classifies 1920x1080 as Large Desktop with spacious density', () => {
    const res = computeResponsiveState(1920, 1080);
    expect(res.device).toBe('desktop');
    expect(res.isLargeDesktop).toBe(true);
    expect(res.layoutStrategy.density).toBe('spacious');
    expect(res.layoutStrategy.layoutMode).toBe('desktop-wide');
  });
});
