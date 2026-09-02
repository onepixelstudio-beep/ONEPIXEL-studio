import { PixelProject } from '../../types';

export const CURRENT_SCHEMA_VERSION = 1;
export const CURRENT_APP_VERSION = 'OnePixel Studio v1.1.0';

/**
 * MigrationManager
 * Responsible for checking, validating, and migrating project files
 * from legacy formats to the latest stable structure.
 */
export class MigrationManager {
  /**
   * Validates and migrates an incoming project payload to ensure it matches
   * the canonical format version and has all required structural properties.
   */
  public static migrate(raw: any): PixelProject {
    if (!raw || typeof raw !== 'object') {
      throw new Error('[MigrationManager] Raw data is not a valid object');
    }

    // 1. Create a deep copy to avoid mutations
    const project = JSON.parse(JSON.stringify(raw));

    // 2. Structural/Property Repair & Fallbacks
    project.id = project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    project.name = (project.name || '').trim() || 'Sin Título';
    project.width = typeof project.width === 'number' && project.width > 0 ? project.width : 32;
    project.height = typeof project.height === 'number' && project.height > 0 ? project.height : 32;
    project.fps = typeof project.fps === 'number' && project.fps > 0 ? project.fps : 12;
    project.lastSaved = typeof project.lastSaved === 'number' ? project.lastSaved : Date.now();

    // Reconstruct lists and make sure they are valid arrays
    project.layers = Array.isArray(project.layers) ? project.layers : [];
    project.frames = Array.isArray(project.frames) ? project.frames : [];
    project.pixels = (project.pixels && typeof project.pixels === 'object') ? project.pixels : {};
    project.tags = Array.isArray(project.tags) ? project.tags : [];

    // Check optional arrays
    if (project.animationClips !== undefined && !Array.isArray(project.animationClips)) {
      project.animationClips = undefined;
    }
    if (project.animationTags !== undefined && !Array.isArray(project.animationTags)) {
      project.animationTags = undefined;
    }
    if (project.guides !== undefined && !Array.isArray(project.guides)) {
      project.guides = undefined;
    }

    // Repair empty layers/frames
    if (project.layers.length === 0) {
      project.layers.push({
        id: 'layer-1',
        name: 'Capa 1',
        visible: true,
        opacity: 1,
        locked: false,
        blendMode: 'normal'
      });
    } else {
      // Validate each layer has essential properties
      project.layers.forEach((l: any, idx: number) => {
        if (!l || typeof l !== 'object') {
          project.layers[idx] = {
            id: `layer-${idx + 1}`,
            name: `Capa ${idx + 1}`,
            visible: true,
            opacity: 1,
            locked: false,
            blendMode: 'normal'
          };
        } else {
          l.id = l.id || `layer-${idx + 1}`;
          l.name = l.name || `Capa ${idx + 1}`;
          l.visible = typeof l.visible === 'boolean' ? l.visible : true;
          l.opacity = typeof l.opacity === 'number' ? l.opacity : 1;
          l.locked = typeof l.locked === 'boolean' ? l.locked : false;
          l.blendMode = l.blendMode || 'normal';
        }
      });
    }

    if (project.frames.length === 0) {
      project.frames.push({
        id: 'frame-1',
        name: 'Fotograma 1',
        durationMs: 100
      });
    } else {
      // Validate each frame has essential properties
      project.frames.forEach((f: any, idx: number) => {
        if (!f || typeof f !== 'object') {
          project.frames[idx] = {
            id: `frame-${idx + 1}`,
            name: `Fotograma ${idx + 1}`,
            durationMs: 100
          };
        } else {
          f.id = f.id || `frame-${idx + 1}`;
          f.name = f.name || `Fotograma ${idx + 1}`;
          f.durationMs = typeof f.durationMs === 'number' && f.durationMs > 0 ? f.durationMs : 100;
        }
      });
    }

    // 3. Schema & Versioning Upgrades
    const rawSchema = typeof project.schemaVersion === 'number' ? project.schemaVersion : 0;

    if (rawSchema < 1) {
      // Legacy project to Schema Version 1 migration
      project.schemaVersion = CURRENT_SCHEMA_VERSION;
      project.createdWith = project.createdWith || 'OnePixel Studio Legacy v0.9';
      project.lastSavedWith = CURRENT_APP_VERSION;
    } else {
      // Already at schema 1 or newer, but update the save application version
      project.schemaVersion = Math.max(project.schemaVersion, CURRENT_SCHEMA_VERSION);
      project.createdWith = project.createdWith || CURRENT_APP_VERSION;
      project.lastSavedWith = CURRENT_APP_VERSION;
    }

    // Ensure all pixel keys match actual frameId -> layerId configurations
    // In OnePixel Studio, pixels is a nested map: pixels[frameId][layerId] = string[]
    const expectedSize = project.width * project.height;
    const cleanedPixels: Record<string, any> = {};

    project.frames.forEach((f: any) => {
      cleanedPixels[f.id] = cleanedPixels[f.id] || {};
      project.layers.forEach((l: any) => {
        let colorsArray: any[] | undefined;

        // 1. Standard nested structure: pixels[frameId][layerId]
        if (project.pixels && project.pixels[f.id] && Array.isArray(project.pixels[f.id][l.id])) {
          colorsArray = project.pixels[f.id][l.id];
        }
        // 2. Legacy flat key: pixels["frameId_layerId"]
        else if (project.pixels && Array.isArray(project.pixels[`${f.id}_${l.id}`])) {
          colorsArray = project.pixels[`${f.id}_${l.id}`];
        }
        // 3. Legacy hyphen flat key: pixels["frameId-layerId"]
        else if (project.pixels && Array.isArray(project.pixels[`${f.id}-${l.id}`])) {
          colorsArray = project.pixels[`${f.id}-${l.id}`];
        }

        let finalArray: any[];
        if (Array.isArray(colorsArray)) {
          if (colorsArray.length !== expectedSize) {
            // Resize or pad colorsArray to expected size
            const padVal = colorsArray.length > 0 && typeof colorsArray[0] === 'number' ? 0 : '';
            finalArray = new Array(expectedSize).fill(padVal);
            for (let i = 0; i < Math.min(colorsArray.length, expectedSize); i++) {
              finalArray[i] = colorsArray[i] !== undefined ? colorsArray[i] : padVal;
            }
          } else {
            finalArray = colorsArray.map((c: any) => c !== undefined ? c : '');
          }
        } else {
          // Default empty layer pixels
          finalArray = new Array(expectedSize).fill('');
        }

        cleanedPixels[f.id][l.id] = finalArray;
        // Keep flat legacy alias for backward compatibility with older components & tests
        cleanedPixels[`${f.id}_${l.id}`] = finalArray;
      });
    });

    project.pixels = cleanedPixels;

    return project as PixelProject;
  }
}
