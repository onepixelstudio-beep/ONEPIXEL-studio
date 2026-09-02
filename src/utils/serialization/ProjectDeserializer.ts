import { PixelProject } from '../../types';
import { SerializedProjectData } from './ProjectSerializer';

/**
 * ProjectDeserializer
 * Consolidated service responsible for reconstructing a PixelProject object 
 * from its serialized form (JSON string or object structure).
 */
export class ProjectDeserializer {
  /**
   * Reconstructs and sanitizes a project object from a serialized string or object.
   * Guarantees that volatile/transient properties are discarded or reinitialized safely.
   */
  public static deserialize(data: string | object): {
    project: PixelProject;
    symmetry: any;
    tiling: any;
    referenceImage: string | null;
    referenceOpacity: number;
    referenceScale: number;
    referenceX: number;
    referenceY: number;
    referenceAngle: number;
    referenceVisible: boolean;
    referenceLocked: boolean;
    customPalette: any;
  } {
    let parsed: any;

    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (err: any) {
        throw new Error(`[ProjectDeserializer] Failed to parse JSON: ${err.message}`);
      }
    } else if (typeof data === 'object' && data !== null) {
      // Create a copy to prevent mutating the original input object
      parsed = JSON.parse(JSON.stringify(data));
    } else {
      throw new Error('[ProjectDeserializer] Invalid input data type. Must be string or object.');
    }

    // Ensure we have a valid object structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('[ProjectDeserializer] Decoded data is not a valid object.');
    }

    // 1. Reconstruct the clean, core PixelProject object
    const project: PixelProject = {
      id: parsed.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: parsed.name || 'Sin Título',
      width: typeof parsed.width === 'number' ? parsed.width : 32,
      height: typeof parsed.height === 'number' ? parsed.height : 32,
      layers: Array.isArray(parsed.layers) ? parsed.layers : [],
      frames: Array.isArray(parsed.frames) ? parsed.frames : [],
      pixels: parsed.pixels && typeof parsed.pixels === 'object' ? parsed.pixels : {},
      fps: typeof parsed.fps === 'number' ? parsed.fps : 12,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      animationClips: Array.isArray(parsed.animationClips) ? parsed.animationClips : undefined,
      animationTags: Array.isArray(parsed.animationTags) ? parsed.animationTags : undefined,
      guides: Array.isArray(parsed.guides) ? parsed.guides : undefined,
      folderId: parsed.folderId,
      lastSaved: typeof parsed.lastSaved === 'number' ? parsed.lastSaved : Date.now(),
      isCloud: !!parsed.isCloud,
      hasBeenSavedLocally: !!parsed.hasBeenSavedLocally,
      hasBeenSavedCloud: !!parsed.hasBeenSavedCloud,
      hasDownloadedInitialFile: !!parsed.hasDownloadedInitialFile,
      fileFormat: parsed.fileFormat || 'onepixel',
      fileHandle: (typeof data === 'object' && data !== null) ? (data as any).fileHandle : undefined,
      isModified: false // Resets on load
    };

    // Ensure we have at least one layer and one frame if the project was empty/corrupt
    if (project.layers.length === 0) {
      project.layers = [{ id: 'layer-1', name: 'Capa 1', visible: true, opacity: 1, locked: false, blendMode: 'normal' }];
    }
    if (project.frames.length === 0) {
      project.frames = [{ id: 'frame-1', name: 'Fotograma 1', durationMs: 100 }];
    }

    // 2. Extracts workspace/session settings with safe fallbacks
    const symmetry = parsed.symmetry || {
      x: false,
      y: false,
      radial: false,
      radialCount: 4,
      centerX: project.width / 2,
      centerY: project.height / 2
    };

    const tiling = parsed.tiling || {
      active: false,
      repeatX: true,
      repeatY: true
    };

    const referenceImage = parsed.referenceImage || null;
    let referenceOpacity = typeof parsed.referenceOpacity === 'number' ? parsed.referenceOpacity : 0.5;
    if (referenceOpacity > 1) {
      referenceOpacity = referenceOpacity / 100;
    }
    const referenceScale = typeof parsed.referenceScale === 'number' ? parsed.referenceScale : 1.0;
    const referenceX = typeof parsed.referenceX === 'number' ? parsed.referenceX : 0;
    const referenceY = typeof parsed.referenceY === 'number' ? parsed.referenceY : 0;
    const referenceAngle = typeof parsed.referenceAngle === 'number' ? parsed.referenceAngle : 0;
    const referenceVisible = typeof parsed.referenceVisible === 'boolean' ? parsed.referenceVisible : true;
    const referenceLocked = typeof parsed.referenceLocked === 'boolean' ? parsed.referenceLocked : true;
    const customPalette = parsed.customPalette || null;

    return {
      project,
      symmetry,
      tiling,
      referenceImage,
      referenceOpacity,
      referenceScale,
      referenceX,
      referenceY,
      referenceAngle,
      referenceVisible,
      referenceLocked,
      customPalette
    };
  }
}
