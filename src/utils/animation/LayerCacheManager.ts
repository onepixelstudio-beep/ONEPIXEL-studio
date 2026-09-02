import { PixelProject, Layer } from '../../types';
import { parseHexColor } from '../colorUtils';
import { animationEventBus } from './EventBus';
import { LayerResolutionService } from './LayerResolutionService';

interface CacheEntry {
  canvas: HTMLCanvasElement;
  pixelsArray: string[]; // Reference to the pixel array of this layer
  width: number;
  height: number;
}

interface FrameCacheEntry {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  fingerprint: string;
}

export class LayerCacheManager {
  private static instance: LayerCacheManager | null = null;
  private cache = new Map<string, CacheEntry>();
  private frameComposites = new Map<string, FrameCacheEntry>();
  private tintedFrameComposites = new Map<string, FrameCacheEntry>();
  private tempOverrideCanvas: HTMLCanvasElement | null = null;

  // WeakMap to assign a unique stable identifier to pixel array references for O(1) change detection
  private arrayIdMap = new WeakMap<string[], number>();
  private arrayIdCounter = 0;

  // Metrics
  private hits = 0;
  private misses = 0;
  private createdCount = 0;
  private reconstructedCount = 0;
  private invalidations = 0;

  private constructor() {
    // Listen to semantic events from EventBus
    animationEventBus.subscribe('DOCUMENT_CHANGED', () => {
      this.invalidations++;
    });
    animationEventBus.subscribe('TRANSACTION_END', () => {
      this.invalidations++;
    });
  }

  public static getInstance(): LayerCacheManager {
    if (!LayerCacheManager.instance) {
      LayerCacheManager.instance = new LayerCacheManager();
    }
    return LayerCacheManager.instance;
  }

  private getArrayId(arr: string[]): number {
    let id = this.arrayIdMap.get(arr);
    if (id === undefined) {
      id = ++this.arrayIdCounter;
      this.arrayIdMap.set(arr, id);
    }
    return id;
  }

  /**
   * Generates a unique key for a frame-layer combination
   */
  private getCacheKey(frameId: string, layerId: string): string {
    return `${frameId}_${layerId}`;
  }

  /**
   * Generates a composite fingerprint representing the combined structural state of a frame
   */
  private getFrameFingerprint(
    frameId: string,
    layers: Layer[],
    effectiveFramePixels: Record<string, string[]>
  ): string {
    return layers
      .map(layer => {
        const layerPixels = effectiveFramePixels[layer.id];
        const arrId = layerPixels ? this.getArrayId(layerPixels) : 0;
        return `${layer.id}:${layer.visible}:${layer.opacity}:${layer.isStatic}:${arrId}`;
      })
      .join('|');
  }

  /**
   * Retrieves (and builds if needed) the offscreen canvas for a specific layer.
   * If overridePixels is provided, it renders using those pixels onto a temporary,
   * non-persistent canvas to support high-frequency preview overrides (e.g. active transformations).
   */
  public getLayerCanvas(
    frameId: string,
    layerId: string,
    pixelsArray: string[],
    width: number,
    height: number,
    overridePixels?: string[]
  ): HTMLCanvasElement {
    if (overridePixels) {
      // For overrides like transformation previews, render to a temporary non-cached canvas
      if (!this.tempOverrideCanvas) {
        this.tempOverrideCanvas = document.createElement('canvas');
      }
      if (this.tempOverrideCanvas.width !== width || this.tempOverrideCanvas.height !== height) {
        this.tempOverrideCanvas.width = width;
        this.tempOverrideCanvas.height = height;
      }
      const ctx = this.tempOverrideCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        this.renderPixelsToContext(ctx, overridePixels, width, height);
      }
      return this.tempOverrideCanvas;
    }

    const key = this.getCacheKey(frameId, layerId);
    const cached = this.cache.get(key);

    if (cached) {
      // Check if size or pixel reference changed
      if (
        cached.width === width &&
        cached.height === height &&
        cached.pixelsArray === pixelsArray
      ) {
        this.hits++;
        return cached.canvas;
      }

      // Reconstruct existing canvas (Cache Miss due to stale data)
      this.misses++;
      this.reconstructedCount++;
      cached.width = width;
      cached.height = height;
      cached.pixelsArray = pixelsArray;
      if (cached.canvas.width !== width || cached.canvas.height !== height) {
        cached.canvas.width = width;
        cached.canvas.height = height;
      }
      const ctx = cached.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        this.renderPixelsToContext(ctx, pixelsArray, width, height);
      }
      return cached.canvas;
    }

    // Cache Miss - Create new canvas
    this.misses++;
    this.createdCount++;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.renderPixelsToContext(ctx, pixelsArray, width, height);
    }

    this.cache.set(key, {
      canvas,
      pixelsArray,
      width,
      height,
    });

    return canvas;
  }

  /**
   * Directly sets/syncs the cached canvas pixels and pixelsArray reference for a layer.
   * Ensures that when a stroke or operation is committed, LayerCacheManager adopts the new
   * array reference without wiping or reconstructing the canvas, preventing flicker/disappearance.
   */
  public syncLayerCanvas(
    frameId: string,
    layerId: string,
    pixelsArray: string[],
    width: number,
    height: number
  ): void {
    const key = this.getCacheKey(frameId, layerId);
    const cached = this.cache.get(key);

    if (cached && cached.width === width && cached.height === height) {
      cached.pixelsArray = pixelsArray;
      return;
    }

    // If not cached yet or dimension changed, create/reconstruct
    this.getLayerCanvas(frameId, layerId, pixelsArray, width, height);
  }

  /**
   * Fast path to update specific modified pixels on a cached layer canvas in near O(1) time.
   * Avoids scanning the full array while maintaining exact color, alpha and rendering fidelity.
   */
  public updateLayerCanvasPixels(
    frameId: string,
    layerId: string,
    pixelsArray: string[],
    modifiedPixels: Array<{ x: number; y: number; color: string }>,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const key = this.getCacheKey(frameId, layerId);
    const cached = this.cache.get(key);

    if (!cached || cached.width !== width || cached.height !== height) {
      return this.getLayerCanvas(frameId, layerId, pixelsArray, width, height);
    }

    const ctx = cached.canvas.getContext('2d');
    if (ctx) {
      for (let i = 0; i < modifiedPixels.length; i++) {
        const { x, y, color } = modifiedPixels[i];
        if (x >= 0 && x < width && y >= 0 && y < height) {
          ctx.clearRect(x, y, 1, 1);
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    cached.pixelsArray = pixelsArray;
    return cached.canvas;
  }

  /**
   * Retrieves (and builds if needed) a fully composited offscreen canvas representing the entire frame.
   * Leverages the cached layer canvases underneath to perform lightning-fast composition.
   */
  public getFrameCompositeCanvas(
    frameId: string,
    layers: Layer[],
    pixels: Record<string, Record<string, string[]>>,
    width: number,
    height: number,
    frames?: Array<{ id: string }>
  ): HTMLCanvasElement {
    const projectLike = {
      frames: frames || Object.keys(pixels).map(id => ({ id })),
      layers,
      pixels
    };
    const effectiveFramePixels = LayerResolutionService.getEffectiveFramePixels(projectLike, frameId);
    const fingerprint = this.getFrameFingerprint(frameId, layers, effectiveFramePixels);
    const cached = this.frameComposites.get(frameId);

    if (
      cached &&
      cached.width === width &&
      cached.height === height &&
      cached.fingerprint === fingerprint
    ) {
      this.hits++;
      return cached.canvas;
    }

    this.misses++;
    this.reconstructedCount++;

    let entry = cached;
    if (!entry) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      entry = { canvas, width, height, fingerprint };
      this.frameComposites.set(frameId, entry);
    } else {
      entry.width = width;
      entry.height = height;
      entry.fingerprint = fingerprint;
      if (entry.canvas.width !== width || entry.canvas.height !== height) {
        entry.canvas.width = width;
        entry.canvas.height = height;
      }
    }

    const ctx = entry.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      // Draw visible layers from bottom to top (back-to-front)
      for (let l = layers.length - 1; l >= 0; l--) {
        const layer = layers[l];
        if (!layer.visible) continue;

        const layerPixels = effectiveFramePixels[layer.id];
        if (!layerPixels || LayerResolutionService.isPixelArrayEmpty(layerPixels)) continue;

        const layerCanvas = this.getLayerCanvas(frameId, layer.id, layerPixels, width, height);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layerCanvas, 0, 0);
        ctx.restore();
      }
    }

    return entry.canvas;
  }

  /**
   * Retrieves (and builds if needed) a tinted and composited offscreen canvas representing the entire frame.
   * Leverages caching to perform this once per state change.
   */
  public getTintedFrameCompositeCanvas(
    frameId: string,
    layers: Layer[],
    pixels: Record<string, Record<string, string[]>>,
    width: number,
    height: number,
    tintColor: string,
    tintMode: boolean,
    frames?: Array<{ id: string }>
  ): HTMLCanvasElement {
    const projectLike = {
      frames: frames || Object.keys(pixels).map(id => ({ id })),
      layers,
      pixels
    };
    const effectiveFramePixels = LayerResolutionService.getEffectiveFramePixels(projectLike, frameId);
    const fingerprint = `${this.getFrameFingerprint(frameId, layers, effectiveFramePixels)}|tint:${tintColor}:${tintMode}`;
    const cacheKey = `${frameId}_${tintColor}_${tintMode}`;
    const cached = this.tintedFrameComposites.get(cacheKey);

    if (
      cached &&
      cached.width === width &&
      cached.height === height &&
      cached.fingerprint === fingerprint
    ) {
      this.hits++;
      return cached.canvas;
    }

    this.misses++;
    this.reconstructedCount++;

    let entry = cached;
    if (!entry) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      entry = { canvas, width, height, fingerprint };
      this.tintedFrameComposites.set(cacheKey, entry);
    } else {
      entry.width = width;
      entry.height = height;
      entry.fingerprint = fingerprint;
      if (entry.canvas.width !== width || entry.canvas.height !== height) {
        entry.canvas.width = width;
        entry.canvas.height = height;
      }
    }

    const ctx = entry.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw standard composite onto this canvas
      const baseComposite = this.getFrameCompositeCanvas(frameId, layers, pixels, width, height, frames);
      ctx.drawImage(baseComposite, 0, 0);

      // 2. Apply tint
      if (tintMode && tintColor) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = tintColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    return entry.canvas;
  }

  /**
   * Internal helper to blit color strings onto a 2D canvas context
   */
  private renderPixelsToContext(
    ctx: CanvasRenderingContext2D,
    pixelsArray: string[],
    width: number,
    height: number
  ): void {
    if (!pixelsArray || width <= 0 || height <= 0) return;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const totalPixels = Math.min(pixelsArray.length, width * height);

    for (let i = 0; i < totalPixels; i++) {
      const color = pixelsArray[i];
      if (color) {
        const parsed = parseHexColor(color);
        if (parsed) {
          const idx = i * 4;
          data[idx] = parsed.r;
          data[idx + 1] = parsed.g;
          data[idx + 2] = parsed.b;
          data[idx + 3] = parsed.a;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Explicitly invalidates the cache for a specific layer in a frame
   */
  public invalidateLayer(frameId: string, layerId: string): void {
    const key = this.getCacheKey(frameId, layerId);
    this.cache.delete(key);
    this.frameComposites.delete(frameId);
    this.invalidations++;
  }

  /**
   * Prunes the cache to release memory for any frame/layer that no longer exists in the project
   */
  public prune(project: PixelProject): void {
    const activeKeys = new Set<string>();
    const activeFrameIds = new Set<string>();
    
    // Collect all valid keys from current project structure
    for (const frame of project.frames) {
      activeFrameIds.add(frame.id);
      for (const layer of project.layers) {
        activeKeys.add(this.getCacheKey(frame.id, layer.id));
      }
    }

    // Delete any cached canvases that are no longer part of the project
    for (const [key] of this.cache) {
      if (!activeKeys.has(key)) {
        this.cache.delete(key);
      }
    }

    // Prune stale frame composites
    for (const [frameId] of this.frameComposites) {
      if (!activeFrameIds.has(frameId)) {
        this.frameComposites.delete(frameId);
      }
    }

    // Prune tinted frame composites
    for (const [key] of this.tintedFrameComposites) {
      const parts = key.split('_');
      const fid = parts[0];
      if (!activeFrameIds.has(fid)) {
        this.tintedFrameComposites.delete(key);
      }
    }
  }

  /**
   * Resets the entire cache manager, releasing memory and metrics
   */
  public clear(): void {
    this.cache.clear();
    this.frameComposites.clear();
    this.tintedFrameComposites.clear();
    this.tempOverrideCanvas = null;
    this.hits = 0;
    this.misses = 0;
    this.createdCount = 0;
    this.reconstructedCount = 0;
    this.invalidations = 0;
  }

  /**
   * Returns diagnostic stats
   */
  public getMetrics() {
    let estimatedMemoryBytes = 0;
    for (const entry of this.cache.values()) {
      estimatedMemoryBytes += entry.width * entry.height * 4;
    }
    for (const entry of this.frameComposites.values()) {
      estimatedMemoryBytes += entry.width * entry.height * 4;
    }
    for (const entry of this.tintedFrameComposites.values()) {
      estimatedMemoryBytes += entry.width * entry.height * 4;
    }

    const totalRequests = this.hits + this.misses;

    return {
      activeCanvasesCount: this.cache.size,
      activeFrameCompositesCount: this.frameComposites.size,
      activeTintedCompositesCount: this.tintedFrameComposites.size,
      createdCount: this.createdCount,
      reconstructedCount: this.reconstructedCount,
      invalidations: this.invalidations,
      hits: this.hits,
      misses: this.misses,
      estimatedMemoryBytes,
      cacheHitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
    };
  }
}

export const layerCacheManager = LayerCacheManager.getInstance();
