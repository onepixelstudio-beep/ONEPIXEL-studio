import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectLibraryService } from '../ProjectLibraryService';
import { LibraryResource } from '../../types';

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

describe('ProjectLibraryService Tests (Local-Only Architecture)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should report cloud as unavailable in local-only mode', () => {
    expect(ProjectLibraryService.isCloudAvailable()).toBe(false);
  });

  it('should load default presets and user resources', async () => {
    const resources = await ProjectLibraryService.loadResources();
    expect(resources.length).toBeGreaterThan(0);
    const brushPresets = resources.filter(r => r.type === 'brush' && r.id.startsWith('preset-'));
    expect(brushPresets.length).toBeGreaterThanOrEqual(5);
  });

  it('should support hiding/deleting presets locally', async () => {
    const resourcesBefore = await ProjectLibraryService.loadResources();
    const presetId = resourcesBefore[0].id;
    expect(presetId.startsWith('preset-')).toBe(true);

    await ProjectLibraryService.deleteResource(presetId);

    const resourcesAfter = await ProjectLibraryService.loadResources();
    expect(resourcesAfter.some(r => r.id === presetId)).toBe(false);
  });

  it('should rename a library resource', async () => {
    const testRes: LibraryResource = {
      id: 'res-custom-1',
      name: 'Original Name',
      type: 'brush',
      data: { size: 1, pixels: [[true]] },
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const renamed = await ProjectLibraryService.renameResource(testRes, 'New Beautiful Name');
    expect(renamed.name).toBe('New Beautiful Name');
    expect(renamed.id).toBe('res-custom-1');
  });

  it('should duplicate a library resource with proper suffix', async () => {
    const testRes: LibraryResource = {
      id: 'res-custom-2',
      name: 'My Palette',
      type: 'palette',
      data: { colors: ['#ffffff'] },
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const duplicated = await ProjectLibraryService.duplicateResource(testRes, 'es');
    expect(duplicated.name).toBe('My Palette (Copia)');
    expect(duplicated.id).not.toBe(testRes.id);
  });

  it('should create and delete folder, moving internal resources to root', async () => {
    const folder = await ProjectLibraryService.createFolder('My Custom Sprites', 'project');
    expect(folder).toBeDefined();

    const res: LibraryResource = {
      id: 'project-item-1',
      name: 'Project 1',
      type: 'project',
      data: {},
      folderId: folder.id,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await ProjectLibraryService.saveResource(res);

    // Delete folder
    await ProjectLibraryService.deleteFolder(folder.id, [res]);

    // Check if the resource has been moved to root (folderId is undefined)
    const loadedResources = await ProjectLibraryService.loadResources();
    const loadedProject = loadedResources.find(r => r.id === 'project-item-1');
    expect(loadedProject).toBeDefined();
    expect(loadedProject?.folderId).toBeUndefined();
  });
});
