import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationManager, CURRENT_SCHEMA_VERSION, CURRENT_APP_VERSION } from '../persistence/MigrationManager';
import { LocalPersistence } from '../persistence/LocalPersistence';
import { PersistenceService } from '../persistence/PersistenceService';
import { AutoSaveManager } from '../persistence/AutoSaveManager';
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

describe('Persistence Subsystem Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  describe('MigrationManager', () => {
    it('should upgrade older schema version and set app version strings', () => {
      const legacyProject = {
        id: 'legacy-1',
        name: 'Legacy Project',
        width: 16,
        height: 16,
        layers: [],
        frames: [],
        pixels: {}
      };

      const migrated = MigrationManager.migrate(legacyProject);
      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated.createdWith).toBe('OnePixel Studio Legacy v0.9');
      expect(migrated.lastSavedWith).toBe(CURRENT_APP_VERSION);
      expect(migrated.layers.length).toBe(1);
      expect(migrated.frames.length).toBe(1);
    });

    it('should fill in missing/corrupted pixel arrays for expected dimensions', () => {
      const corruptProject = {
        id: 'corrupt-1',
        name: 'Empty Pixels',
        width: 2,
        height: 2,
        layers: [{ id: 'l1' }],
        frames: [{ id: 'f1' }],
        pixels: {
          'f1_l1': [1] // only 1 pixel instead of 4
        }
      };

      const migrated = MigrationManager.migrate(corruptProject);
      expect(migrated.pixels['f1_l1']).toEqual([1, 0, 0, 0]);
    });
  });

  describe('LocalPersistence', () => {
    it('should successfully save and load project, and list projects', () => {
      const project: PixelProject = {
        id: 'p-local-1',
        name: 'Local Sprite',
        width: 8,
        height: 8,
        layers: [],
        frames: [],
        pixels: {},
        fps: 12,
        tags: [],
        lastSaved: Date.now()
      };

      LocalPersistence.saveProject(project);
      const loaded = LocalPersistence.loadProject('p-local-1');
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Local Sprite');

      const list = LocalPersistence.listProjects();
      expect(list.some(p => p.id === 'p-local-1')).toBe(true);

      LocalPersistence.deleteProject('p-local-1');
      expect(LocalPersistence.loadProject('p-local-1')).toBeNull();
    });

    it('should successfully save and load active session and autosave backup', () => {
      const project: PixelProject = {
        id: 'session-1',
        name: 'Active Canvas',
        width: 8,
        height: 8,
        layers: [],
        frames: [],
        pixels: {},
        fps: 12,
        tags: [],
        lastSaved: Date.now()
      };

      LocalPersistence.saveActiveSession(project);
      const loadedSession = LocalPersistence.loadActiveSession();
      expect(loadedSession?.name).toBe('Active Canvas');

      LocalPersistence.saveAutoSaveBackup(project);
      const loadedBackup = LocalPersistence.loadAutoSaveBackup();
      expect(loadedBackup?.name).toBe('Active Canvas');
    });
  });

  describe('PersistenceService', () => {
    it('should coordinate multi-tier save and apply migration automatically', async () => {
      const p: PixelProject = {
        id: 'ps-1',
        name: 'Super Project',
        width: 4,
        height: 4,
        layers: [],
        frames: [],
        pixels: {},
        fps: 8,
        tags: [],
        lastSaved: Date.now()
      };

      const result = await PersistenceService.saveProject(p);
      expect(result.success).toBe(true);
      expect(result.savedLocal).toBe(true);
      
      // Loaded copy should have correct structure (migrated)
      const loaded = await PersistenceService.loadProject('ps-1');
      expect(loaded).not.toBeNull();
      expect(loaded?.layers.length).toBe(1);
      expect(loaded?.frames.length).toBe(1);
      expect(loaded?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('AutoSaveManager', () => {
    it('should run background auto-save only when project state signature changes', () => {
      const p: PixelProject = {
        id: 'asm-1',
        name: 'AutoSave Project',
        width: 4,
        height: 4,
        layers: [{ id: 'l1', name: 'Capa 1', visible: true, opacity: 1, locked: false, blendMode: 'normal' }],
        frames: [{ id: 'f1', name: 'F1', durationMs: 100 }],
        pixels: {},
        fps: 8,
        tags: [],
        lastSaved: Date.now()
      };

      let currentProj: PixelProject | null = p;
      let savedCount = 0;

      AutoSaveManager.start(
        () => currentProj,
        () => { savedCount++; },
        1000 // 1s
      );

      // Run 1 cycle
      vi.advanceTimersByTime(1000);
      expect(savedCount).toBe(1); // Saved on first run because signature changed from empty

      // Run 2nd cycle with same state
      vi.advanceTimersByTime(1000);
      expect(savedCount).toBe(1); // No redundant save

      // Mutate state
      currentProj = {
        ...p,
        name: 'AutoSave Project (Edited)'
      };

      // Run 3rd cycle
      vi.advanceTimersByTime(1000);
      expect(savedCount).toBe(2); // Saved because name changed!

      AutoSaveManager.stop();
    });
  });
});
