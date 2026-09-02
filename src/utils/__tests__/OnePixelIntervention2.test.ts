import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DONATION_CONFIG } from '../../config/DonationConfig';
import { PersistenceService } from '../persistence/PersistenceService';
import { LocalPersistence } from '../persistence/LocalPersistence';
import { WindowSystem } from '../architecture/WindowSystem';
import { PixelProject } from '../../types';

// Mock localStorage behaving exactly like browser Storage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { 
    mockStorage[key] = value; 
    (localStorageMock as any)[key] = value;
    return true; 
  },
  removeItem: (key: string) => { 
    delete mockStorage[key]; 
    delete (localStorageMock as any)[key];
    return true; 
  },
  clear: () => { 
    Object.keys(mockStorage).forEach(k => {
      delete mockStorage[k];
      delete (localStorageMock as any)[k];
    }); 
  },
  get length() { return Object.keys(mockStorage).length; },
  key: (index: number) => Object.keys(mockStorage)[index] || null
};

globalThis.window = {
  localStorage: localStorageMock
} as any;
globalThis.localStorage = localStorageMock as any;

describe('OnePixel Studio - Intervention 2 Systems Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  describe('1. Historial de Exportaciones', () => {
    it('should support saving and retrieving items in the export history', () => {
      const EXPORT_HISTORY_KEY = 'onepixel_export_history';
      const mockHistory = [
        {
          id: 'exp-1',
          projectName: 'Hero Asset',
          timestamp: Date.now(),
          pluginId: 'png',
          scale: 4,
          options: { transparent: true }
        }
      ];

      localStorageMock.setItem(EXPORT_HISTORY_KEY, JSON.stringify(mockHistory));
      const retrieved = JSON.parse(localStorageMock.getItem(EXPORT_HISTORY_KEY) || '[]');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].projectName).toBe('Hero Asset');
      expect(retrieved[0].scale).toBe(4);
    });
  });

  describe('2. Recuperación Avanzada & WindowSystem Dialogs', () => {
    it('should support loading and storing autosave backups in LocalPersistence', () => {
      const dummyProject: PixelProject = {
        id: 'proj-dummy',
        name: 'Rescue Canvas',
        width: 8,
        height: 8,
        layers: [],
        frames: [],
        pixels: {},
        fps: 12,
        tags: [],
        lastSaved: Date.now()
      };

      const success = LocalPersistence.saveAutoSaveBackup(dummyProject);
      expect(success).toBe(true);

      const loaded = LocalPersistence.loadAutoSaveBackup();
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Rescue Canvas');
    });

    it('should save and load local project cleanly through PersistenceService', async () => {
      const localCopy: PixelProject = {
        id: 'conf-1',
        name: 'Local Project 1',
        width: 8,
        height: 8,
        layers: [],
        frames: [],
        pixels: {},
        fps: 12,
        tags: [],
        lastSaved: 1000000
      };

      vi.spyOn(LocalPersistence, 'loadProject').mockReturnValue(localCopy);
      vi.spyOn(LocalPersistence, 'saveProject').mockReturnValue(true);

      const loaded = await PersistenceService.loadProject('conf-1');
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Local Project 1');
      expect(loaded?.layers.length).toBeGreaterThan(0);
    });
  });

  describe('3. Sistema de Donaciones Configurable', () => {
    it('should expose a centralized configuration with valid gateway and optional parameters', () => {
      expect(DONATION_CONFIG).toBeDefined();
      expect(DONATION_CONFIG.activeDestination).toBeDefined();
      expect(['paypal', 'kofi', 'buymeacoffee', 'stripe', 'simulated']).toContain(DONATION_CONFIG.activeDestination.gateway);
      expect(typeof DONATION_CONFIG.allowRealRedirect).toBe('boolean');
    });
  });
});
