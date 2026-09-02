import { PixelProject } from '../../types';

export interface SerializedProjectData extends Omit<PixelProject, 'fileHandle'> {
  symmetry?: any;
  tiling?: any;
  referenceImage?: string | null;
  referenceOpacity?: number;
  referenceScale?: number;
  referenceX?: number;
  referenceY?: number;
  referenceAngle?: number;
  referenceVisible?: boolean;
  referenceLocked?: boolean;
  customPalette?: any;
  userId?: string;
}

/**
 * ProjectSerializer
 * Consolidated service responsible for converting an active project and its settings
 * into the official, unified serialized representation.
 */
export class ProjectSerializer {
  /**
   * Serializes a project and its workspace settings into a clean object ready for storage.
   * Explicitly strips volatile state (like undo/redo histories and file handles) 
   * to guarantee memory efficiency and prevent quota errors.
   */
  public static serializeToObj(
    project: PixelProject,
    options?: {
      symmetry?: any;
      tiling?: any;
      referenceImage?: string | null;
      referenceOpacity?: number;
      referenceScale?: number;
      referenceX?: number;
      referenceY?: number;
      referenceAngle?: number;
      referenceVisible?: boolean;
      referenceLocked?: boolean;
      customPalette?: any;
      extra?: Partial<PixelProject> & { userId?: string };
    }
  ): SerializedProjectData {
    // 1. Create a deep-ish clone of the core project structure, omitting any volatile properties.
    const cleanProject: SerializedProjectData = {
      id: project.id,
      name: project.name,
      width: project.width,
      height: project.height,
      layers: JSON.parse(JSON.stringify(project.layers)),
      frames: JSON.parse(JSON.stringify(project.frames)),
      pixels: JSON.parse(JSON.stringify(project.pixels)),
      fps: project.fps,
      tags: project.tags ? [...project.tags] : [],
      animationClips: project.animationClips ? JSON.parse(JSON.stringify(project.animationClips)) : undefined,
      animationTags: project.animationTags ? JSON.parse(JSON.stringify(project.animationTags)) : undefined,
      guides: project.guides ? JSON.parse(JSON.stringify(project.guides)) : undefined,
      folderId: project.folderId,
      lastSaved: project.lastSaved || Date.now(),
      isCloud: project.isCloud,
      hasBeenSavedLocally: project.hasBeenSavedLocally,
      hasBeenSavedCloud: project.hasBeenSavedCloud,
      hasDownloadedInitialFile: project.hasDownloadedInitialFile,
      fileFormat: project.fileFormat || 'onepixel',
      ...options?.extra,
    };

    // Remove any accidental properties that might be passed inside project
    const anyClean = cleanProject as any;
    delete anyClean.undoStack;
    delete anyClean.redoStack;
    delete anyClean.fileHandle;

    // 2. Mix in project-specific spatial/session configurations
    if (options) {
      if (options.symmetry !== undefined) cleanProject.symmetry = JSON.parse(JSON.stringify(options.symmetry));
      if (options.tiling !== undefined) cleanProject.tiling = JSON.parse(JSON.stringify(options.tiling));
      if (options.referenceImage !== undefined) cleanProject.referenceImage = options.referenceImage;
      if (options.referenceOpacity !== undefined) cleanProject.referenceOpacity = options.referenceOpacity;
      if (options.referenceScale !== undefined) cleanProject.referenceScale = options.referenceScale;
      if (options.referenceX !== undefined) cleanProject.referenceX = options.referenceX;
      if (options.referenceY !== undefined) cleanProject.referenceY = options.referenceY;
      if (options.referenceAngle !== undefined) cleanProject.referenceAngle = options.referenceAngle;
      if (options.referenceVisible !== undefined) cleanProject.referenceVisible = options.referenceVisible;
      if (options.referenceLocked !== undefined) cleanProject.referenceLocked = options.referenceLocked;
      if (options.customPalette !== undefined) cleanProject.customPalette = JSON.parse(JSON.stringify(options.customPalette));
    } else {
      // Fallback: copy what might already be on the project object if no explicit options were passed
      const projAny = project as any;
      if (projAny.symmetry !== undefined) cleanProject.symmetry = JSON.parse(JSON.stringify(projAny.symmetry));
      if (projAny.tiling !== undefined) cleanProject.tiling = JSON.parse(JSON.stringify(projAny.tiling));
      if (projAny.referenceImage !== undefined) cleanProject.referenceImage = projAny.referenceImage;
      if (projAny.referenceOpacity !== undefined) cleanProject.referenceOpacity = projAny.referenceOpacity;
      if (projAny.referenceScale !== undefined) cleanProject.referenceScale = projAny.referenceScale;
      if (projAny.referenceX !== undefined) cleanProject.referenceX = projAny.referenceX;
      if (projAny.referenceY !== undefined) cleanProject.referenceY = projAny.referenceY;
      if (projAny.referenceAngle !== undefined) cleanProject.referenceAngle = projAny.referenceAngle;
      if (projAny.referenceVisible !== undefined) cleanProject.referenceVisible = projAny.referenceVisible;
      if (projAny.referenceLocked !== undefined) cleanProject.referenceLocked = projAny.referenceLocked;
      if (projAny.customPalette !== undefined) cleanProject.customPalette = JSON.parse(JSON.stringify(projAny.customPalette));
    }

    return cleanProject;
  }

  /**
   * Serializes a project and its workspace settings directly into a JSON string.
   */
  public static serializeToString(
    project: PixelProject,
    options?: {
      symmetry?: any;
      tiling?: any;
      referenceImage?: string | null;
      referenceOpacity?: number;
      referenceScale?: number;
      customPalette?: any;
      extra?: Partial<PixelProject> & { userId?: string };
    },
    pretty: boolean = false
  ): string {
    const obj = this.serializeToObj(project, options);
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  }
}
