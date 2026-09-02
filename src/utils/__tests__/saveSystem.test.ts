import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalPersistence } from '../persistence/LocalPersistence';
import { LibraryResource } from '../../types';

// Define a safe mock localStorage behaving exactly like browser Storage
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

describe('Save System (Local Persistence)', () => {
  beforeEach(() => {
    // Clear mock localStorage before each test
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('should successfully save a resource locally', () => {
    const resource: LibraryResource = {
      id: 'test-resource-1',
      name: 'Sword Asset',
      type: 'project',
      data: { width: 16, height: 16, frames: [], layers: [], pixels: {} },
      tags: ['weapon', 'metal'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const saved = LocalPersistence.saveResource(resource);
    expect(saved).toBe(true);

    // Verify it was persisted to safe localStorage
    const savedString = localStorageMock.getItem('pixel_res_test-resource-1');
    expect(savedString).not.toBeNull();
    const savedResource = JSON.parse(savedString!);
    expect(savedResource.name).toBe('Sword Asset');
    expect(savedResource.userId).toBe('local');
    expect(savedResource.tags).toContain('weapon');
  });

  it('should load saved resources, excluding deleted ones', () => {
    const r1: LibraryResource = {
      id: 'test-r1',
      name: 'Shield',
      type: 'project',
      data: {},
      tags: ['defense'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const r2: LibraryResource = {
      id: 'test-r2',
      name: 'Helmet',
      type: 'project',
      data: {},
      tags: ['armor'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    LocalPersistence.saveResource(r1);
    LocalPersistence.saveResource(r2);

    let loaded = LocalPersistence.loadResources();
    expect(loaded.length).toBeGreaterThanOrEqual(2);
    expect(loaded.some(r => r.id === 'test-r1')).toBe(true);
    expect(loaded.some(r => r.id === 'test-r2')).toBe(true);

    // Delete one resource
    LocalPersistence.deleteResource('test-r1');

    loaded = LocalPersistence.loadResources();
    expect(loaded.some(r => r.id === 'test-r1')).toBe(false);
    expect(loaded.some(r => r.id === 'test-r2')).toBe(true);
  });

  it('should correctly mark and handle deletion tracking via local storage', () => {
    const r: LibraryResource = {
      id: 'preset-r-del-test',
      name: 'Preset Palette',
      type: 'palette',
      data: {},
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    LocalPersistence.saveResource(r);
    LocalPersistence.deleteResource('preset-r-del-test');

    const deletedIdsStr = localStorageMock.getItem('pixel_deleted_resources');
    expect(deletedIdsStr).not.toBeNull();
    const deletedIds = JSON.parse(deletedIdsStr!);
    expect(deletedIds).toContain('preset-r-del-test');
  });
});
