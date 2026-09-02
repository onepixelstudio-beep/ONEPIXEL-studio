import { LibraryResource, LibraryFolder, ResourceType } from '../../types';
import { ProjectLibraryService } from '../ProjectLibraryService';

export interface UnifiedResource extends LibraryResource {
  category: 'project' | 'preset' | 'user_asset' | 'recent' | string;
  isTemplate?: boolean;
  recentLastOpened?: number;
  preview?: string;
}

export class UnifiedResourceSystem {
  private static instance: UnifiedResourceSystem | null = null;
  private recentLimit = 10;
  private readonly RECENT_STORAGE_KEY = 'onepixel_recent_projects_index';

  private constructor() {}

  public static getInstance(): UnifiedResourceSystem {
    if (!UnifiedResourceSystem.instance) {
      UnifiedResourceSystem.instance = new UnifiedResourceSystem();
    }
    return UnifiedResourceSystem.instance;
  }

  /**
   * Retrieves all resources unifies (presets + custom saved assets) of a specific type.
   */
  public async getResourcesByType(type: ResourceType): Promise<UnifiedResource[]> {
    const rawResources = await ProjectLibraryService.loadResources();
    return rawResources
      .filter(r => r.type === type)
      .map(r => ({
        ...r,
        category: r.id.startsWith('preset-') ? 'preset' : 'user_asset'
      }));
  }

  /**
   * Loads custom user folders.
   */
  public async getFolders(type?: ResourceType): Promise<LibraryFolder[]> {
    const folders = await ProjectLibraryService.loadFolders();
    if (type) {
      return folders.filter(f => f.type === type);
    }
    return folders;
  }

  /**
   * Saves or updates a resource canonical.
   */
  public async saveResource(resource: LibraryResource): Promise<void> {
    await ProjectLibraryService.saveResource(resource);
  }

  /**
   * Creates an independent duplicate of a resource.
   */
  public async duplicate(resource: LibraryResource, language: 'es' | 'en' | 'pt'): Promise<LibraryResource> {
    return await ProjectLibraryService.duplicateResource(resource, language);
  }

  /**
   * Deletes a resource.
   */
  public async delete(id: string): Promise<void> {
    await ProjectLibraryService.deleteResource(id);
    this.removeFromRecents(id);
  }

  /**
   * Recent Project Tracking
   */
  public getRecentProjects(): UnifiedResource[] {
    try {
      const data = localStorage.getItem(this.RECENT_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse recent projects index', e);
      return [];
    }
  }

  public registerRecentProject(id: string, name: string, preview?: string): void {
    const recents = this.getRecentProjects();
    const existingIdx = recents.findIndex(r => r.id === id);

    const updatedItem: UnifiedResource = {
      id,
      name,
      type: 'project',
      category: 'recent',
      data: {},
      tags: ['Reciente'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recentLastOpened: Date.now(),
      preview: preview || ''
    };

    if (existingIdx >= 0) {
      recents.splice(existingIdx, 1);
    }

    recents.unshift(updatedItem);

    // Enforce limit
    if (recents.length > this.recentLimit) {
      recents.pop();
    }

    try {
      localStorage.setItem(this.RECENT_STORAGE_KEY, JSON.stringify(recents));
    } catch (e) {
      console.error('Failed to save recent projects to localStorage', e);
    }
  }

  public removeFromRecents(id: string): void {
    const recents = this.getRecentProjects();
    const filtered = recents.filter(r => r.id !== id);
    try {
      localStorage.setItem(this.RECENT_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to update recent projects index after deletion', e);
    }
  }
}

export const unifiedResourceSystem = UnifiedResourceSystem.getInstance();
