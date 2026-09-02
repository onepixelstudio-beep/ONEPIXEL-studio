import { PixelProject } from '../../types';
import { LocalPersistence } from './LocalPersistence';

/**
 * AutoSaveManager
 * Manages periodic automatic backups of the current project to the safe offline backup slot.
 */
export class AutoSaveManager {
  private static timerId: any = null;
  private static getProjectFn: (() => PixelProject | null) | null = null;
  private static onSaveCompletedFn: (() => void) | null = null;
  private static lastSavedTime = 0;
  private static lastProjectStateStr = '';

  /**
   * Starts the background auto-save cycle.
   * @param getProject A function returning the active project.
   * @param onSaveCompleted A callback triggered after a successful autosave.
   * @param intervalMs The frequency of check cycles (defaults to 30,000ms = 30 seconds).
   */
  public static start(
    getProject: () => PixelProject | null,
    onSaveCompleted?: () => void,
    intervalMs: number = 30000
  ): void {
    this.stop();

    this.getProjectFn = getProject;
    this.onSaveCompletedFn = onSaveCompleted || null;
    this.lastSavedTime = Date.now();

    this.timerId = setInterval(() => {
      this.checkAndSave();
    }, intervalMs);
  }

  /**
   * Stops the background auto-save cycle.
   */
  public static stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.getProjectFn = null;
    this.onSaveCompletedFn = null;
  }

  /**
   * Triggers an immediate autosave backup.
   */
  public static triggerImmediateAutoSave(project: PixelProject): void {
    LocalPersistence.saveAutoSaveBackup(project);
    this.lastSavedTime = Date.now();
    this.lastProjectStateStr = this.hashProjectState(project);
  }

  /**
   * Evaluates if there are active modifications and runs the safe autosave write.
   */
  private static checkAndSave(): void {
    if (!this.getProjectFn) return;

    const project = this.getProjectFn();
    if (!project) return;

    // Only save if the project has been modified or is structurally different
    const currentHash = this.hashProjectState(project);
    if (currentHash === this.lastProjectStateStr) {
      return;
    }

    try {
      LocalPersistence.saveAutoSaveBackup(project);
      this.lastSavedTime = Date.now();
      this.lastProjectStateStr = currentHash;

      if (this.onSaveCompletedFn) {
        this.onSaveCompletedFn();
      }
    } catch (e) {
      console.warn('[AutoSaveManager] Auto-save background check failed:', e);
    }
  }

  /**
   * Computes a quick hash/signature of the project's drawing content
   * to avoid writing redundant unchanged states to disk.
   */
  private static hashProjectState(project: PixelProject): string {
    try {
      // Create a signature based on layer/frame IDs, pixel keys, and modified status
      const pixelKeysCount = Object.keys(project.pixels || {}).length;
      const layersCount = project.layers?.length || 0;
      const framesCount = project.frames?.length || 0;
      const isMod = !!project.isModified;
      return `${project.id}_${project.name}_${layersCount}_${framesCount}_${pixelKeysCount}_${isMod}`;
    } catch (e) {
      return String(Date.now());
    }
  }
}
