import { useState, useEffect, useCallback } from 'react';
import { PreferencesSystem } from '../utils/architecture/PreferencesSystem';

// Safe localStorage wrapper to prevent crashes if cookies/localStorage are disabled/blocked in iframe sandboxes
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Error leyendo clave "${key}":`, e);
    }
    return null;
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Error escribiendo clave "${key}":`, e);
    }
    return false;
  }
};

export type ThemeType = 'standard' | 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = safeLocalStorage.getItem('onepixel_theme');
    if (saved && (saved === 'standard' || saved === 'dark' || saved === 'light')) {
      return saved as ThemeType;
    }
    try {
      const sysTheme = PreferencesSystem.getInstance().get('appearance.theme');
      if (sysTheme && (sysTheme === 'standard' || sysTheme === 'dark' || sysTheme === 'light')) {
        return sysTheme as ThemeType;
      }
    } catch (e) {}
    return 'standard';
  });

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    safeLocalStorage.setItem('onepixel_theme', newTheme);
    try {
      const sys = PreferencesSystem.getInstance();
      if (sys.get('appearance.theme') !== newTheme) {
        sys.set('appearance.theme', newTheme);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    safeLocalStorage.setItem('onepixel_theme', theme);
    try {
      const sys = PreferencesSystem.getInstance();
      if (sys.get('appearance.theme') !== theme) {
        sys.set('appearance.theme', theme);
      }
    } catch (e) {}
  }, [theme]);

  return {
    theme,
    setTheme
  };
}
