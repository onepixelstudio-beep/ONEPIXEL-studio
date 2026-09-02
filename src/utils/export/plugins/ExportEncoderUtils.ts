import { RenderResult, RenderedFrame } from '../ExportTypes';
import { ColorBlendUtils } from '../../canvas/ColorBlendUtils';

/**
 * Creates a canvas instance dynamically.
 * Uses OffscreenCanvas if available (ideal for Web Workers),
 * otherwise falls back to standard HTMLCanvasElement in the DOM.
 */
export function createExportCanvas(width: number, height: number): { canvas: any; ctx: any } {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, ctx: canvas.getContext('2d') };
  } else if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d') };
  } else {
    throw new Error('No canvas implementation found (OffscreenCanvas and document are undefined).');
  }
}

/**
 * Common helper to populate canvas image data with standard pixel art colors.
 */
export function populateCanvasWithPixels(canvas: any, ctx: any, pixels: string[], width: number, height: number): void {
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < pixels.length; i++) {
    const rgba = ColorBlendUtils.parseColor(pixels[i]);
    const idx = i * 4;
    data[idx] = rgba.r;
    data[idx + 1] = rgba.g;
    data[idx + 2] = rgba.b;
    data[idx + 3] = Math.round(rgba.a * 255);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Extracts the single frame specified by the options (e.g. options.frameId) 
 * or defaults to the first frame.
 */
export function getFrameToExport(renderResult: RenderResult, options: Record<string, any>): RenderedFrame {
  const frameId = options.frameId;
  if (frameId) {
    const found = renderResult.frames.find((f) => f.frameId === frameId);
    if (found) return found;
  }
  return renderResult.frames[0] || {
    frameId: 'default',
    width: renderResult.width,
    height: renderResult.height,
    durationMs: 100,
    pixels: []
  };
}

/**
 * Resolves a final safe filename from user options or project configuration,
 * cleaning up spaces and using safe default suffixes if missing.
 */
export function resolveFilename(renderResult: RenderResult, options: Record<string, any>, suffix = 'frame_0001'): string {
  let baseName = options.filename ? String(options.filename).trim() : '';
  if (baseName) {
    // Strip common accidental file extensions to prevent double extensions (e.g. .png.png, .zip.zip)
    baseName = baseName.replace(/\.(png|zip|json|xml|gif|apng|webp|jpg|jpeg|bmp|tga|ico|tiff|tif)$/i, '');
    // Sanitize unsafe filesystem characters (\ / : * ? " < > |)
    baseName = baseName.replace(/[\\/:*?"<>|]/g, '_').trim();
  }
  const defaultBase = (renderResult.projectName || 'untitled').replace(/[\s\\/:*?"<>|]+/g, '_');
  return baseName || `${defaultBase}_${suffix}`;
}

/**
 * Converts a raw canvas/OffscreenCanvas into a raw Uint8Array containing PNG data.
 * Ideal for packing multiple sequential assets in zip files without polluting DOM APIs.
 */
export async function canvasToUint8Array(canvas: any): Promise<Uint8Array> {
  if (canvas.convertToBlob) {
    // OffscreenCanvas support
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buf = await blob.arrayBuffer();
    return new Uint8Array(buf);
  } else if (canvas.toBlob) {
    // HTMLCanvasElement support
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob: any) => {
        if (!blob) {
          reject(new Error('Canvas toBlob returned null'));
          return;
        }
        try {
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        } catch (err) {
          reject(err);
        }
      }, 'image/png');
    });
  } else {
    throw new Error('Unsupported canvas element for binary extraction');
  }
}
