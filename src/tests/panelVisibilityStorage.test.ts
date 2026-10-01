import { describe, it, expect, beforeEach } from 'vitest';

describe('Panel Visibility LocalStorage Robustness Validation', () => {
  let mockStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => (key in mockStore ? mockStore[key] : null),
    setItem: (key: string, val: string) => {
      mockStore[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      mockStore = {};
    }
  };

  const getInitialPanelVisibility = (key: string, defaultValue = true): boolean => {
    try {
      const saved = mockLocalStorage.getItem(key);
      if (saved === null || saved === undefined || saved === 'null' || saved === 'undefined' || saved.trim() === '') {
        return defaultValue;
      }
      return saved === 'true';
    } catch {
      return defaultValue;
    }
  };

  beforeEach(() => {
    mockStore = {};
  });

  it('should fall back to defaultValue when key is not present in localStorage (null)', () => {
    expect(getInitialPanelVisibility('onepixel_sidebar_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_colors_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_tools_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_zen_mode_active', false)).toBe(false);
  });

  it('should safely fall back to defaultValue when key contains literal string "null"', () => {
    mockLocalStorage.setItem('onepixel_sidebar_visible', 'null');
    mockLocalStorage.setItem('onepixel_colors_visible', 'null');
    mockLocalStorage.setItem('onepixel_tools_visible', 'null');

    expect(getInitialPanelVisibility('onepixel_sidebar_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_colors_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_tools_visible', true)).toBe(true);
  });

  it('should safely fall back to defaultValue when key contains literal string "undefined"', () => {
    mockLocalStorage.setItem('onepixel_sidebar_visible', 'undefined');
    mockLocalStorage.setItem('onepixel_colors_visible', 'undefined');
    mockLocalStorage.setItem('onepixel_tools_visible', 'undefined');

    expect(getInitialPanelVisibility('onepixel_sidebar_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_colors_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_tools_visible', true)).toBe(true);
  });

  it('should correctly parse valid boolean representations ("true" and "false")', () => {
    mockLocalStorage.setItem('onepixel_sidebar_visible', 'true');
    mockLocalStorage.setItem('onepixel_colors_visible', 'false');

    expect(getInitialPanelVisibility('onepixel_sidebar_visible', true)).toBe(true);
    expect(getInitialPanelVisibility('onepixel_colors_visible', true)).toBe(false);
  });

  it('should safely handle whitespace-only entries', () => {
    mockLocalStorage.setItem('onepixel_sidebar_visible', '   ');
    expect(getInitialPanelVisibility('onepixel_sidebar_visible', true)).toBe(true);
  });
});
