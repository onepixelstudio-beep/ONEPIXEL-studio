import { PixelProject, LibraryResource, LibraryFolder, ResourceType } from '../../types';

const PREFIX = 'pixel_proj_';
const RESOURCE_PREFIX = 'pixel_res_';
const FOLDER_PREFIX = 'pixel_fol_';
const DELETED_RESOURCES_KEY = 'pixel_deleted_resources';
const DELETED_FOLDERS_KEY = 'pixel_deleted_folders';
const SESSION_KEY = 'pixel_art_active_session';
const AUTOSAVE_KEY = 'pixel_art_autosave_backup';

/**
 * LocalPersistence
 * Handles all browser-level persistence including LocalStorage caches and session recoveries.
 */
export class LocalPersistence {
  /**
   * Safely writes a JSON object to LocalStorage under a specific key.
   */
  public static setItem(key: string, value: any): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (err: any) {
      if (err.name === 'QuotaExceededError' || err.code === 22 || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn(`[LocalPersistence] Storage quota exceeded for key "${key}"`);
      } else {
        console.error(`[LocalPersistence] Error setting key "${key}":`, err);
      }
    }
    return false;
  }

  /**
   * Safely reads a parsed JSON object from LocalStorage.
   */
  public static getItem<T = any>(key: string): T | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (e) {
      console.warn(`[LocalPersistence] Error reading key "${key}":`, e);
    }
    return null;
  }

  /**
   * Safely removes an item from LocalStorage.
   */
  public static removeItem(key: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn(`[LocalPersistence] Error removing key "${key}":`, e);
    }
    return false;
  }

  /**
   * Saves a project locally.
   */
  public static saveProject(project: PixelProject): boolean {
    return this.setItem(`${PREFIX}${project.id}`, project);
  }

  /**
   * Loads a project locally.
   */
  public static loadProject(id: string): PixelProject | null {
    return this.getItem<PixelProject>(`${PREFIX}${id}`);
  }

  /**
   * Deletes a project locally.
   */
  public static deleteProject(id: string): boolean {
    return this.removeItem(`${PREFIX}${id}`);
  }

  /**
   * Lists all projects stored locally.
   */
  public static listProjects(): PixelProject[] {
    const list: PixelProject[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
          if (key.startsWith(PREFIX)) {
            const proj = this.getItem<PixelProject>(key);
            if (proj) {
              list.push(proj);
            }
          }
        }
      }
    } catch (e) {
      console.error('[LocalPersistence] Error listing projects:', e);
    }
    return list;
  }

  /**
   * Saves the current active drawing session.
   */
  public static saveActiveSession(project: PixelProject): boolean {
    // Exclude volatile stacks like undo/redo
    const cleanProject = { ...project };
    delete (cleanProject as any).undoStack;
    delete (cleanProject as any).redoStack;
    delete (cleanProject as any).fileHandle;
    return this.setItem(SESSION_KEY, cleanProject);
  }

  /**
   * Loads the current active drawing session.
   */
  public static loadActiveSession(): PixelProject | null {
    return this.getItem<PixelProject>(SESSION_KEY);
  }

  /**
   * Clears the active session cache.
   */
  public static clearActiveSession(): void {
    this.removeItem(SESSION_KEY);
  }

  /**
   * Saves an autosave backup.
   */
  public static saveAutoSaveBackup(project: PixelProject): boolean {
    const cleanProject = { ...project };
    delete (cleanProject as any).undoStack;
    delete (cleanProject as any).redoStack;
    delete (cleanProject as any).fileHandle;
    return this.setItem(AUTOSAVE_KEY, cleanProject);
  }

  /**
   * Loads the latest autosave backup.
   */
  public static loadAutoSaveBackup(): PixelProject | null {
    return this.getItem<PixelProject>(AUTOSAVE_KEY);
  }

  /**
   * Clears the autosave backup.
   */
  public static clearAutoSaveBackup(): void {
    this.removeItem(AUTOSAVE_KEY);
  }

  // ==========================================
  // --- LOCAL RESOURCE & FOLDER MANAGEMENT ---
  // ==========================================

  /**
   * Saves a library resource locally.
   */
  public static saveResource(resource: LibraryResource): boolean {
    const data = {
      ...resource,
      userId: 'local',
      updatedAt: Date.now()
    };
    return this.setItem(`${RESOURCE_PREFIX}${resource.id}`, data);
  }

  /**
   * Loads all locally stored library resources.
   */
  public static loadResources(): LibraryResource[] {
    const localResources: LibraryResource[] = [];
    const deletedIds: string[] = this.getItem<string[]>(DELETED_RESOURCES_KEY) || [];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
          if (key.startsWith(RESOURCE_PREFIX)) {
            const item = this.getItem<LibraryResource>(key);
            if (item && item.id) {
              if (deletedIds.includes(item.id)) {
                this.removeItem(key);
              } else {
                localResources.push(item);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[LocalPersistence] Error loading resources:', e);
    }

    const seedResources: LibraryResource[] = [
      {
        id: 'seed-palette-1',
        name: 'GameBoy Retro',
        type: 'palette' as ResourceType,
        data: { colors: ['#071821', '#306850', '#86c06c', '#e0f8cf'] },
        tags: ['Classic', 'Retro', 'Monochrome'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'seed-palette-2',
        name: 'PICO-8 Fantasy',
        type: 'palette' as ResourceType,
        data: { colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'] },
        tags: ['Fantasy', 'Vibrant', '16-color'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'seed-brush-1',
        name: 'Sombreado Dither 50%',
        type: 'brush' as ResourceType,
        data: { size: 2, pixels: [[true, false], [false, true]] },
        tags: ['Brushes', 'Shader'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ].filter(res => !deletedIds.includes(res.id));

    if (localResources.length === 0 && seedResources.length > 0) {
      seedResources.forEach(res => {
        this.saveResource(res);
      });
      return seedResources;
    }

    return localResources.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Deletes a library resource locally.
   */
  public static deleteResource(id: string): boolean {
    this.removeItem(`${RESOURCE_PREFIX}${id}`);
    const deletedIds: string[] = this.getItem<string[]>(DELETED_RESOURCES_KEY) || [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      this.setItem(DELETED_RESOURCES_KEY, deletedIds);
    }
    return true;
  }

  /**
   * Saves a folder locally.
   */
  public static saveFolder(folder: LibraryFolder): boolean {
    const serialized = { ...folder, userId: 'local' };
    return this.setItem(`${FOLDER_PREFIX}${folder.id}`, serialized);
  }

  /**
   * Loads all locally stored folders.
   */
  public static loadFolders(): LibraryFolder[] {
    const localFolders: LibraryFolder[] = [];
    const deletedFolderIds: string[] = this.getItem<string[]>(DELETED_FOLDERS_KEY) || [];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        for (const key of keys) {
          if (key.startsWith(FOLDER_PREFIX)) {
            const item = this.getItem<LibraryFolder>(key);
            if (item && item.id) {
              if (deletedFolderIds.includes(item.id)) {
                this.removeItem(key);
              } else {
                localFolders.push(item);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[LocalPersistence] Error loading folders:', e);
    }

    return localFolders;
  }

  /**
   * Deletes a folder locally.
   */
  public static deleteFolder(id: string): boolean {
    this.removeItem(`${FOLDER_PREFIX}${id}`);
    const deletedFolderIds: string[] = this.getItem<string[]>(DELETED_FOLDERS_KEY) || [];
    if (!deletedFolderIds.includes(id)) {
      deletedFolderIds.push(id);
      this.setItem(DELETED_FOLDERS_KEY, deletedFolderIds);
    }
    return true;
  }
}
