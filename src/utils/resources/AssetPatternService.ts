/**
 * AssetPatternService.ts
 *
 * Domain service for managing, repeating, and aligning patterns, tiles, and textures on the canvas.
 * Integrates directly with AssetTransformationService to support dynamic transformed patterns.
 */

import { AssetTransformationService } from './AssetTransformationService';

export type PatternRepeatMode = 'repeat' | 'repeat-x' | 'repeat-y' | 'mirror' | 'none';
export type PatternAlignmentMode = 'absolute' | 'local';

export interface PatternConfig {
  repeatMode: PatternRepeatMode;
  alignment: PatternAlignmentMode;
  offsetX: number;
  offsetY: number;
  // Transformation options applied to the pattern tile before tiling
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  scaleX: number;
  scaleY: number;
}

export interface PatternContext {
  enabled: boolean;
  repeatMode: PatternRepeatMode;
  alignment: PatternAlignmentMode;
  offsetX: number;
  offsetY: number;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  scale: number;
}

export interface PatternCache {
  width: number;
  height: number;
  pixels: string[];
  contextSignature: string;
}

export class AssetPatternService {
  /**
   * Default pattern configuration
   */
  static getDefaultConfig(): PatternConfig {
    return {
      repeatMode: 'repeat',
      alignment: 'absolute',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      scaleX: 1,
      scaleY: 1
    };
  }

  /**
   * Default pattern context
   */
  static getDefaultContext(): PatternContext {
    return {
      enabled: false,
      repeatMode: 'repeat',
      alignment: 'absolute',
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      scale: 1
    };
  }

  /**
   * Generates a unique context signature string to identify if cache is still valid
   */
  static getContextSignature(
    context: PatternContext,
    assetName: string,
    assetWidth: number,
    assetHeight: number
  ): string {
    return `${assetName}_${assetWidth}x${assetHeight}_${context.enabled}_${context.repeatMode}_${context.alignment}_${context.offsetX}_${context.offsetY}_${context.rotation}_${context.flipH}_${context.flipV}_${context.scale}`;
  }

  /**
   * Creates a pre-rendered PatternCache object from raw asset pixels and a PatternContext
   */
  static createCache(
    pixels: string[],
    width: number,
    height: number,
    context: PatternContext,
    assetName: string
  ): PatternCache {
    const config: PatternConfig = {
      repeatMode: context.repeatMode,
      alignment: context.alignment,
      offsetX: context.offsetX,
      offsetY: context.offsetY,
      rotation: context.rotation,
      flipH: context.flipH,
      flipV: context.flipV,
      scaleX: context.scale,
      scaleY: context.scale
    };

    const prepared = this.prepareTile(pixels, width, height, config);

    return {
      width: prepared.width,
      height: prepared.height,
      pixels: prepared.pixels,
      contextSignature: this.getContextSignature(context, assetName, width, height)
    };
  }

  /**
   * Resolves the pixel color using a pre-calculated PatternCache
   */
  static getPixelFromCache(
    x: number,
    y: number,
    cache: PatternCache,
    context: PatternContext,
    anchorX: number = 0,
    anchorY: number = 0
  ): string | null {
    const config: PatternConfig = {
      repeatMode: context.repeatMode,
      alignment: context.alignment,
      offsetX: context.offsetX,
      offsetY: context.offsetY,
      rotation: context.rotation,
      flipH: context.flipH,
      flipV: context.flipV,
      scaleX: context.scale,
      scaleY: context.scale
    };

    return this.getPixelAt(x, y, cache.pixels, cache.width, cache.height, config, anchorX, anchorY);
  }

  /**
   * Pre-transforms a pattern's base tile pixels using the AssetTransformationService.
   */
  static prepareTile(
    pixels: string[],
    width: number,
    height: number,
    config: PatternConfig
  ): { pixels: string[]; width: number; height: number } {
    return AssetTransformationService.transform(
      pixels,
      width,
      height,
      config.rotation,
      config.flipH,
      config.flipV,
      config.scaleX,
      config.scaleY
    );
  }

  /**
   * Resolves the pixel color for a given canvas coordinate under a repeating pattern configuration.
   *
   * @param x Target canvas X coordinate
   * @param y Target canvas Y coordinate
   * @param tilePixels Flat array of color strings for the pre-transformed pattern tile
   * @param tileW Width of the tile
   * @param tileH Height of the tile
   * @param config The pattern tiling configuration
   * @param anchorX Start/anchor X coordinate for 'local' alignment mode (defaults to 0)
   * @param anchorY Start/anchor Y coordinate for 'local' alignment mode (defaults to 0)
   * @returns Color string or 'transparent'/'', or null if out of pattern bounds (e.g., repeatMode 'none')
   */
  static getPixelAt(
    x: number,
    y: number,
    tilePixels: string[],
    tileW: number,
    tileH: number,
    config: PatternConfig,
    anchorX: number = 0,
    anchorY: number = 0
  ): string | null {
    if (tileW <= 0 || tileH <= 0 || tilePixels.length === 0) return null;

    // 1. Calculate relative coordinates based on alignment
    let rx = config.alignment === 'local' ? x - anchorX : x;
    let ry = config.alignment === 'local' ? y - anchorY : y;

    // 2. Apply user-defined custom offsets
    rx -= config.offsetX;
    ry -= config.offsetY;

    // 3. Resolve repeating / tiling logic
    const mode = config.repeatMode;

    if (mode === 'none') {
      if (rx < 0 || rx >= tileW || ry < 0 || ry >= tileH) {
        return null; // Out of bounds for non-repeating
      }
      return tilePixels[ry * tileW + rx];
    }

    let tx = 0;
    let ty = 0;

    // Resolve X repeating
    if (mode === 'repeat' || mode === 'repeat-x') {
      tx = ((rx % tileW) + tileW) % tileW;
    } else if (mode === 'mirror') {
      tx = this.getMirrorCoord(rx, tileW);
    } else {
      // 'repeat-y' has no repeat on X
      if (rx < 0 || rx >= tileW) return null;
      tx = rx;
    }

    // Resolve Y repeating
    if (mode === 'repeat' || mode === 'repeat-y') {
      ty = ((ry % tileH) + tileH) % tileH;
    } else if (mode === 'mirror') {
      ty = this.getMirrorCoord(ry, tileH);
    } else {
      // 'repeat-x' has no repeat on Y
      if (ry < 0 || ry >= tileH) return null;
      ty = ry;
    }

    return tilePixels[ty * tileW + tx];
  }

  /**
   * Implements mirror-tiling coord helper.
   * Maps an infinite coordinate to [0, size - 1] in a mirroring fashion:
   * e.g., for size 4: 0,1,2,3, 3,2,1,0, 0,1,2,3...
   */
  private static getMirrorCoord(coord: number, size: number): number {
    const doubleSize = size * 2;
    const norm = ((coord % doubleSize) + doubleSize) % doubleSize;
    return norm < size ? norm : doubleSize - 1 - norm;
  }
}
