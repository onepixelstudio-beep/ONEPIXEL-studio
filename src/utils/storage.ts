import { telemetry } from './telemetry';

// Safe localStorage wrapper to prevent crashes if cookies/localStorage are disabled/blocked in iframe sandboxes
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val) {
          telemetry.logAction('LOCALSTORAGE_READ', `Read key: ${key}`, { valueLength: val.length });
        }
        return val;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Error leyendo clave "${key}":`, e);
      telemetry.logAction('LOCALSTORAGE_ERROR', `Failed reading key: ${key}`, { error: String(e) });
    }
    return null;
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        telemetry.logAction('LOCALSTORAGE_WRITE', `Wrote key: ${key}`, { valueLength: value.length });
        return true;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Error escribiendo clave "${key}":`, e);
      telemetry.logAction('LOCALSTORAGE_ERROR', `Failed writing key: ${key}`, { error: String(e) });
    }
    return false;
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        telemetry.logAction('LOCALSTORAGE_REMOVE', `Removed key: ${key}`);
        return true;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Error eliminando clave "${key}":`, e);
      telemetry.logAction('LOCALSTORAGE_ERROR', `Failed removing key: ${key}`, { error: String(e) });
    }
    return false;
  }
};
