import { Layer, Frame, ProjectPixels, PixelProject } from '../../types';

interface ProjectLike {
  frames: Array<{ id: string; name?: string; durationMs?: number }>;
  layers: Layer[];
  pixels: ProjectPixels | Record<string, Record<string, string[]>>;
}

export interface EffectiveLayerResult {
  pixels: string[];
  sourceFrameId: string;
  isHeld: boolean;
  isStatic: boolean;
  hasOwnDrawing: boolean;
}

// WeakMap cache to quickly evaluate if a pixel array is empty in O(1) time
const emptyArrayCache = new WeakMap<string[], boolean>();

export class LayerResolutionService {
  /**
   * Evaluates if a pixel array is empty (undefined, empty array, or all empty/transparent strings)
   * with O(1) performance via WeakMap reference caching.
   */
  public static isPixelArrayEmpty(pixels: string[] | undefined): boolean {
    if (!pixels || pixels.length === 0) return true;
    let cached = emptyArrayCache.get(pixels);
    if (cached === undefined) {
      cached = !pixels.some(c => c !== '' && c !== undefined && c !== 'transparent');
      emptyArrayCache.set(pixels, cached);
    }
    return cached;
  }

  /**
   * Returns true if a specific frame-layer cell has user-drawn pixels.
   */
  public static hasCellDrawing(
    pixels: ProjectPixels | Record<string, Record<string, string[]>>,
    frameId: string,
    layerId: string
  ): boolean {
    const framePixels = pixels[frameId];
    if (!framePixels) return false;
    const layerPixels = framePixels[layerId];
    return !this.isPixelArrayEmpty(layerPixels);
  }

  /**
   * Resolves the effective pixels for a specific layer and frame.
   * Handles:
   * - Static layers (isStatic = true or Fondo layer)
   * - Keyframe holding (inherited previous drawing)
   * - Native frame drawing
   */
  public static getEffectiveLayerPixels(
    project: ProjectLike,
    frameId: string,
    layerId: string
  ): EffectiveLayerResult | null {
    if (!project || !project.layers || !project.frames || !project.pixels) {
      return null;
    }

    const layer = project.layers.find(l => l.id === layerId);
    if (!layer) return null;

    const framePixels = project.pixels[frameId] || {};
    const directPixels = framePixels[layerId];
    const hasOwnDrawing = !this.isPixelArrayEmpty(directPixels);

    // 1. Explicitly Static Layer
    if (layer.isStatic) {
      // Find the first frame with drawings for this static layer
      for (let i = 0; i < project.frames.length; i++) {
        const fid = project.frames[i].id;
        const p = project.pixels[fid]?.[layerId];
        if (!this.isPixelArrayEmpty(p)) {
          return {
            pixels: p!,
            sourceFrameId: fid,
            isHeld: fid !== frameId,
            isStatic: true,
            hasOwnDrawing: fid === frameId
          };
        }
      }
      // If no drawings in any frame, return current frame's pixels
      return {
        pixels: directPixels || [],
        sourceFrameId: frameId,
        isHeld: false,
        isStatic: true,
        hasOwnDrawing: false
      };
    }

    // 2. Animated Layer: return direct frame pixels (respecting explicit empty/drawn frames)
    return {
      pixels: directPixels || [],
      sourceFrameId: frameId,
      isHeld: false,
      isStatic: false,
      hasOwnDrawing: hasOwnDrawing
    };
  }

  /**
   * Resolves all effective layer pixels for a given frame.
   * Returns a map of layerId -> pixels array.
   */
  public static getEffectiveFramePixels(
    project: ProjectLike,
    frameId: string
  ): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    if (!project || !project.layers) return result;

    for (let i = 0; i < project.layers.length; i++) {
      const layer = project.layers[i];
      const effective = this.getEffectiveLayerPixels(project, frameId, layer.id);
      if (effective && effective.pixels) {
        result[layer.id] = effective.pixels;
      }
    }

    return result;
  }

  /**
   * Retrieves summary state of a layer across the project for Timeline/UI display.
   */
  public static getLayerAnimationSummary(
    project: ProjectLike,
    layerId: string
  ): { isStatic: boolean; keyframeFrameIds: string[]; totalKeyframes: number } {
    const layer = project.layers.find(l => l.id === layerId);
    const keyframes: string[] = [];

    project.frames.forEach(f => {
      if (this.hasCellDrawing(project.pixels, f.id, layerId)) {
        keyframes.push(f.id);
      }
    });

    const isStatic = !!layer?.isStatic;

    return {
      isStatic,
      keyframeFrameIds: keyframes,
      totalKeyframes: keyframes.length
    };
  }
}
