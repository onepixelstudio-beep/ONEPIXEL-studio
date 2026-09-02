import { StampResource } from '../../types';

export interface CaptureOptions {
  name: string;
  tags?: string[];
  mode?: 'exact' | 'trimmed'; // 'exact' (Modo A: full selection box) or 'trimmed' (Modo B: trimmed bounding box of colored pixels)
}

export class CaptureService {
  /**
   * Captures the selected pixels from the given layer's pixel array as a StampResource.
   *
   * @param selectionPixels 1D boolean array indicating active selection (size width * height)
   * @param layerPixels 1D string array indicating colors of the active layer (size width * height)
   * @param canvasWidth width of the canvas
   * @param canvasHeight height of the canvas
   * @param options name, tags, and capture mode (exact or trimmed)
   */
  static captureSelection(
    selectionPixels: boolean[],
    layerPixels: string[],
    canvasWidth: number,
    canvasHeight: number,
    options: CaptureOptions
  ): StampResource {
    if (!selectionPixels || selectionPixels.length === 0) {
      throw new Error('No active selection to capture');
    }
    if (!layerPixels || layerPixels.length !== canvasWidth * canvasHeight) {
      throw new Error('Invalid layer pixels array length');
    }

    // 1. Find bounding box of the active selection
    let minX = canvasWidth;
    let maxX = -1;
    let minY = canvasHeight;
    let maxY = -1;

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const idx = y * canvasWidth + x;
        if (selectionPixels[idx]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      throw new Error('Active selection contains no pixels');
    }

    // Default option values
    const mode = options.mode || 'exact';
    const tags = options.tags || [];

    let captureMinX = minX;
    let captureMaxX = maxX;
    let captureMinY = minY;
    let captureMaxY = maxY;

    // If Mode B is chosen (trimmed), trim surrounding transparent/empty pixels inside the selection bounding box
    if (mode === 'trimmed') {
      let trimmedMinX = maxX;
      let trimmedMaxX = minX;
      let trimmedMinY = maxY;
      let trimmedMaxY = minY;
      let hasOpaque = false;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * canvasWidth + x;
          if (selectionPixels[idx]) {
            const pixelColor = layerPixels[idx];
            // An opaque/colored pixel is one that is not empty/transparent
            if (pixelColor && pixelColor !== '') {
              hasOpaque = true;
              if (x < trimmedMinX) trimmedMinX = x;
              if (x > trimmedMaxX) trimmedMaxX = x;
              if (y < trimmedMinY) trimmedMinY = y;
              if (y > trimmedMaxY) trimmedMaxY = y;
            }
          }
        }
      }

      // Only update bounding box if we found at least one non-transparent pixel
      if (hasOpaque) {
        captureMinX = trimmedMinX;
        captureMaxX = trimmedMaxX;
        captureMinY = trimmedMinY;
        captureMaxY = trimmedMaxY;
      }
    }

    const stampWidth = (captureMaxX - captureMinX) + 1;
    const stampHeight = (captureMaxY - captureMinY) + 1;

    // Generate pixels for the stamp
    const stampPixels: string[] = new Array(stampWidth * stampHeight).fill('');

    for (let sy = 0; sy < stampHeight; sy++) {
      const cy = captureMinY + sy;
      for (let sx = 0; sx < stampWidth; sx++) {
        const cx = captureMinX + sx;
        const canvasIdx = cy * canvasWidth + cx;
        const stampIdx = sy * stampWidth + sx;

        // If it is in the selection, copy the color; otherwise it's transparent ('')
        // (This preserves exactly the selected area's colors)
        if (selectionPixels[canvasIdx]) {
          stampPixels[stampIdx] = layerPixels[canvasIdx] || '';
        } else {
          stampPixels[stampIdx] = '';
        }
      }
    }

    const now = Date.now();

    return {
      id: `stamp_${now}_${Math.random().toString(36).substring(2, 11)}`,
      version: 1,
      type: 'stamp',
      name: options.name || 'Sello sin nombre',
      description: '',
      width: stampWidth,
      height: stampHeight,
      createdAt: now,
      updatedAt: now,
      tags: tags,
      pivot: {
        x: Math.floor(stampWidth / 2),
        y: Math.floor(stampHeight / 2),
      },
      preview: '',
      author: 'user',
      origin: {
        x: Math.floor(stampWidth / 2),
        y: Math.floor(stampHeight / 2),
      },
      metadata: {},
      data: {
        pixels: stampPixels
      }
    };
  }
}
