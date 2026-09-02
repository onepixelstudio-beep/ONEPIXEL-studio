import { RenderResult } from './ExportTypes';
import { PixelProject } from '../../types';

/**
 * Cache manager responsible for storing pre-composited RenderResult instances.
 * Prevents repeating heavy pixel blending and Nearest-Neighbor scaling when
 * exporting a project to multiple formats sequentially.
 */
export class RenderCache {
  private static cache = new Map<string, { result: RenderResult; timestamp: number }>();

  /**
   * Generates a unique signature for the project and scale configuration
   * to ensure cache hits are completely accurate and safe against stale states.
   */
  public static getSignature(project: PixelProject, scale: number): string {
    // Collect active layers to ensure layer visibility and static toggles invalidate the cache
    const layerSig = project.layers
      .map((l) => `${l.id}:${l.visible ? 'v' : 'h'}:${l.opacity}:${l.isStatic ? 's' : 'd'}`)
      .join(',');

    // Unique combination of projectId, lastSaved timestamp, scale, frame counts and layers
    return `${project.id}_${project.lastSaved}_s${scale}_f${project.frames.length}_layers[${layerSig}]`;
  }

  /**
   * Retrieves a cached RenderResult if it matches the current project configuration exactly.
   */
  public static get(project: PixelProject, scale: number): RenderResult | null {
    const signature = this.getSignature(project, scale);
    const entry = this.cache.get(signature);
    if (!entry) return null;
    return entry.result;
  }

  /**
   * Stores a new RenderResult associated with the project configuration signature.
   */
  public static set(project: PixelProject, scale: number, result: RenderResult): void {
    const signature = this.getSignature(project, scale);
    this.cache.set(signature, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Manually invalidates/clears the entire cache or a specific project's cache.
   */
  public static invalidate(projectId?: string): void {
    if (projectId) {
      for (const [key] of this.cache.entries()) {
        if (key.startsWith(projectId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Returns the current count of cached results.
   */
  public static getCacheSize(): number {
    return this.cache.size;
  }
}
