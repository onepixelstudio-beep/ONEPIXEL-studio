import { PixelProject } from '../../types';
import { LocalPersistence } from './LocalPersistence';
import { MigrationManager } from './MigrationManager';

/**
 * PersistenceService
 * The absolute entry point for all persistence activities in the editor.
 * Orchestrates local caching and format migrations.
 */
export class PersistenceService {
  /**
   * Saves a project completely. Ensures that it is validated, migrated,
   * and saved locally.
   */
  public static async saveProject(
    project: PixelProject,
    _options?: { forceCloud?: boolean; forceLocalOnly?: boolean }
  ): Promise<{
    success: boolean;
    savedCloud: boolean;
    savedLocal: boolean;
    project: PixelProject;
  }> {
    try {
      // 1. Run migration/validation to make sure structure is perfectly canonical before saving
      const validatedProject = MigrationManager.migrate(project);
      validatedProject.lastSaved = Date.now();
      validatedProject.hasBeenSavedLocally = true;

      // 2. Local persistence write
      const savedLocal = LocalPersistence.saveProject(validatedProject);

      return {
        success: savedLocal,
        savedLocal,
        savedCloud: false,
        project: validatedProject
      };
    } catch (err) {
      console.error('[PersistenceService] Save project failure:', err);
      return {
        success: false,
        savedLocal: false,
        savedCloud: false,
        project
      };
    }
  }

  /**
   * Loads a project by ID, migrating the structure and caching it.
   */
  public static async loadProject(id: string): Promise<PixelProject | null> {
    try {
      const localCopy = LocalPersistence.loadProject(id);
      if (!localCopy) return null;

      // Ensure the project structure is fully migrated and sanitized
      const migrated = MigrationManager.migrate(localCopy);

      // Cache back locally if updated by migration
      LocalPersistence.saveProject(migrated);

      return migrated;
    } catch (err) {
      console.error(`[PersistenceService] Load project "${id}" failure:`, err);
      return null;
    }
  }

  /**
   * Deletes a project from local storage.
   */
  public static async deleteProject(id: string): Promise<{ success: boolean }> {
    try {
      const localSuccess = LocalPersistence.deleteProject(id);
      return { success: localSuccess };
    } catch (err) {
      console.error(`[PersistenceService] Delete project "${id}" failure:`, err);
      return { success: false };
    }
  }

  /**
   * Lists all projects stored locally, applying migrations and sorting by newest.
   */
  public static async listProjects(): Promise<PixelProject[]> {
    try {
      const localList = LocalPersistence.listProjects();
      const migratedList: PixelProject[] = [];

      localList.forEach(p => {
        try {
          migratedList.push(MigrationManager.migrate(p));
        } catch (e) {
          console.warn(`[PersistenceService] Failed to migrate local project ${p.id}:`, e);
        }
      });

      // Sort newest first
      return migratedList.sort((a, b) => b.lastSaved - a.lastSaved);
    } catch (err) {
      console.error('[PersistenceService] List projects failure:', err);
      return [];
    }
  }

  /**
   * Saves the active drawing session.
   */
  public static saveActiveSession(project: PixelProject): void {
    try {
      LocalPersistence.saveActiveSession(project);
    } catch (e) {
      console.warn('[PersistenceService] Failed to save active session:', e);
    }
  }

  /**
   * Loads the active drawing session, running a validation migration.
   */
  public static loadActiveSession(): PixelProject | null {
    try {
      const session = LocalPersistence.loadActiveSession();
      if (session) {
        return MigrationManager.migrate(session);
      }
    } catch (err) {
      console.error('[PersistenceService] Failed to load active session:', err);
    }
    return null;
  }

  /**
   * Clears the active session.
   */
  public static clearActiveSession(): void {
    LocalPersistence.clearActiveSession();
  }

  /**
   * Saves the autosave backup.
   */
  public static saveAutoSaveBackup(project: PixelProject): void {
    try {
      LocalPersistence.saveAutoSaveBackup(project);
    } catch (e) {
      console.warn('[PersistenceService] Failed to save autosave backup:', e);
    }
  }

  /**
   * Loads the autosave backup.
   */
  public static loadAutoSaveBackup(): PixelProject | null {
    try {
      const backup = LocalPersistence.loadAutoSaveBackup();
      if (backup) {
        return MigrationManager.migrate(backup);
      }
    } catch (err) {
      console.error('[PersistenceService] Failed to load autosave backup:', err);
    }
    return null;
  }

  /**
   * Clears the autosave backup.
   */
  public static clearAutoSaveBackup(): void {
    LocalPersistence.clearAutoSaveBackup();
  }
}
