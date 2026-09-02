/**
 * PatternRenderer.ts
 *
 * Architectural facade for rendering tiling patterns, textures, and assets.
 * Encapsulates the PatternCache and coordinates pattern strategies following the Open/Closed Principle.
 */

import { AssetResource } from '../../types';
import { AssetPatternService, PatternContext, PatternCache, PatternConfig } from './AssetPatternService';

/**
 * Strategy interface for calculating coordinate tiling/mapping.
 * Allows adding new repeating strategies (e.g., radial, hexagonal, noise) without modifying the renderer.
 */
export interface PatternStrategy {
  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null;
}

/**
 * Concrete Pattern Strategies
 */

export class RepeatStrategy implements PatternStrategy {
  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
    const tx = ((rx % tileW) + tileW) % tileW;
    const ty = ((ry % tileH) + tileH) % tileH;
    return { tx, ty };
  }
}

export class RepeatXStrategy implements PatternStrategy {
  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
    if (ry < 0 || ry >= tileH) return null;
    const tx = ((rx % tileW) + tileW) % tileW;
    return { tx, ty: ry };
  }
}

export class RepeatYStrategy implements PatternStrategy {
  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
    if (rx < 0 || rx >= tileW) return null;
    const ty = ((ry % tileH) + tileH) % tileH;
    return { tx: rx, ty };
  }
}

export class MirrorStrategy implements PatternStrategy {
  private getMirrorCoord(coord: number, size: number): number {
    const doubleSize = size * 2;
    const norm = ((coord % doubleSize) + doubleSize) % doubleSize;
    return norm < size ? norm : doubleSize - 1 - norm;
  }

  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
    const tx = this.getMirrorCoord(rx, tileW);
    const ty = this.getMirrorCoord(ry, tileH);
    return { tx, ty };
  }
}

export class NoneStrategy implements PatternStrategy {
  getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
    if (rx < 0 || rx >= tileW || ry < 0 || ry >= tileH) return null;
    return { tx: rx, ty: ry };
  }
}

export type PatternSource = 
  | AssetResource 
  | { pixels: string[]; width: number; height: number; name?: string };

/**
 * PatternRenderer Facade
 */
export class PatternRenderer {
  private static strategies = new Map<string, PatternStrategy>([
    ['repeat', new RepeatStrategy()],
    ['repeat-x', new RepeatXStrategy()],
    ['repeat-y', new RepeatYStrategy()],
    ['mirror', new MirrorStrategy()],
    ['none', new NoneStrategy()],
  ]);

  // Private internal cache map to encapsulate caching logic completely
  private static cacheMap = new Map<string, PatternCache>();

  /**
   * Registers a new custom strategy.
   * This respects the Open/Closed Principle, allowing future expansion (e.g. radial, hexagonal) at runtime.
   */
  public static registerStrategy(name: string, strategy: PatternStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Clears the internal pattern cache map
   */
  public static clearCache(): void {
    this.cacheMap.clear();
  }

  /**
   * Retrieves or builds the PatternCache for a given asset/source and context
   */
  private static getOrCreateCache(source: PatternSource, context: PatternContext): PatternCache {
    const isAsset = 'data' in source && typeof source.data === 'object' && source.data !== null && 'pixels' in source.data;
    const pixels = isAsset ? (source as AssetResource).data.pixels : (source as any).pixels;
    const name = source.name || (source as any).id || 'unnamed';
    const width = source.width;
    const height = source.height;

    const signature = AssetPatternService.getContextSignature(context, name, width, height);
    let cached = this.cacheMap.get(signature);

    if (!cached) {
      cached = AssetPatternService.createCache(pixels, width, height, context, name);
      this.cacheMap.set(signature, cached);
    }

    return cached;
  }

  /**
   * Public facade method: gets the pixel color at coordinates (x, y) with absolute or local alignment.
   * 
   * @param x Canvas coordinate X
   * @param y Canvas coordinate Y
   * @param context Pattern configuration context
   * @param source Target asset or pixel source to use as pattern tile
   * @param anchorX Anchor X for local coordinate alignment (default 0)
   * @param anchorY Anchor Y for local coordinate alignment (default 0)
   * @returns Color string, or null if transparent / out-of-bounds
   */
  public static getPixel(
    x: number,
    y: number,
    context: PatternContext,
    source: PatternSource,
    anchorX: number = 0,
    anchorY: number = 0
  ): string | null {
    if (!context.enabled || !source) return null;

    // 1. Unify and retrieve from the private cache
    const cache = this.getOrCreateCache(source, context);
    if (cache.width <= 0 || cache.height <= 0 || cache.pixels.length === 0) return null;

    // 2. Resolve relative coordinates
    let rx = context.alignment === 'local' ? x - anchorX : x;
    let ry = context.alignment === 'local' ? y - anchorY : y;

    // Apply offset offsets
    rx -= context.offsetX;
    ry -= context.offsetY;

    // 3. Select repeating strategy
    const strategyName = context.repeatMode || 'repeat';
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      // Fallback to absolute bounds check if strategy unknown
      if (rx < 0 || rx >= cache.width || ry < 0 || ry >= cache.height) return null;
      return cache.pixels[ry * cache.width + rx];
    }

    // 4. Resolve tiled coordinate from strategy
    const coords = strategy.getTileCoordinate(rx, ry, cache.width, cache.height);
    if (!coords) return null;

    return cache.pixels[coords.ty * cache.width + coords.tx];
  }
}
