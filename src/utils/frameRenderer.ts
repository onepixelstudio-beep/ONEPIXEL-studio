import { Layer, ProjectPixels } from '../types';
import { parseHexColor } from './colorUtils';
import { layerCacheManager } from './animation/LayerCacheManager';
export { parseHexColor };


export interface OnionSkinRenderOptions {
  enabled: boolean;
  framesBefore: number;
  framesAfter: number;
  opacityBefore: number; // 0.0 to 1.0
  opacityAfter: number;  // 0.0 to 1.0
  colorBefore: string;   // hex color (e.g., "#ff0000")
  colorAfter: string;    // hex color (e.g., "#00ff00")
  tintMode: boolean;
  frames: { id: string }[];
  activeFrameIndex: number;
}

// Cached offscreen canvases to avoid heavy DOM element creation in hot execution loops
let cachedTempCanvas: HTMLCanvasElement | null = null;
let cachedTintedCanvas: HTMLCanvasElement | null = null;
let cachedLayerCanvas: HTMLCanvasElement | null = null;
let cachedTintCanvas: HTMLCanvasElement | null = null;

function getCachedTempCanvas(width: number, height: number): HTMLCanvasElement {
  if (!cachedTempCanvas) {
    cachedTempCanvas = document.createElement('canvas');
  }
  if (cachedTempCanvas.width !== width || cachedTempCanvas.height !== height) {
    cachedTempCanvas.width = width;
    cachedTempCanvas.height = height;
  }
  return cachedTempCanvas;
}

function getCachedTintedCanvas(width: number, height: number): HTMLCanvasElement {
  if (!cachedTintedCanvas) {
    cachedTintedCanvas = document.createElement('canvas');
  }
  if (cachedTintedCanvas.width !== width || cachedTintedCanvas.height !== height) {
    cachedTintedCanvas.width = width;
    cachedTintedCanvas.height = height;
  }
  return cachedTintedCanvas;
}

function getCachedLayerCanvas(width: number, height: number): HTMLCanvasElement {
  if (!cachedLayerCanvas) {
    cachedLayerCanvas = document.createElement('canvas');
  }
  if (cachedLayerCanvas.width !== width || cachedLayerCanvas.height !== height) {
    cachedLayerCanvas.width = width;
    cachedLayerCanvas.height = height;
  }
  return cachedLayerCanvas;
}

function getCachedTintCanvas(width: number, height: number): HTMLCanvasElement {
  if (!cachedTintCanvas) {
    cachedTintCanvas = document.createElement('canvas');
  }
  if (cachedTintCanvas.width !== width || cachedTintCanvas.height !== height) {
    cachedTintCanvas.width = width;
    cachedTintCanvas.height = height;
  }
  return cachedTintCanvas;
}

export function getTintedFrameCanvas(
  width: number,
  height: number,
  frameId: string,
  layers: Layer[],
  pixels: ProjectPixels,
  tintColor: string,
  tintMode: boolean,
  frames?: Array<{ id: string }>
): HTMLCanvasElement {
  return layerCacheManager.getTintedFrameCompositeCanvas(
    frameId,
    layers,
    pixels as any,
    width,
    height,
    tintColor,
    tintMode,
    frames
  );
}

export function drawFrameOnCanvas(
  ctx: CanvasRenderingContext2D,
  frameId: string,
  width: number,
  height: number,
  pxScale: number,
  layers: Layer[],
  pixels: ProjectPixels,
  bgColor?: string,
  onionSkin?: OnionSkinRenderOptions,
  frames?: Array<{ id: string }>
) {
  ctx.clearRect(0, 0, width * pxScale, height * pxScale);

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width * pxScale, height * pxScale);
  }

  // Draw on an unscaled canvas to preserve pixel perfection (reusing cached temp canvas)
  const tempCanvas = getCachedTempCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.clearRect(0, 0, width, height);

  const effectiveFrames = frames || onionSkin?.frames || Object.keys(pixels).map(id => ({ id }));

  // Onion skin render pass
  if (onionSkin && onionSkin.enabled && onionSkin.frames.length > 1) {
    const { frames: skinFrames, activeFrameIndex, framesBefore, framesAfter, opacityBefore, opacityAfter, colorBefore, colorAfter, tintMode } = onionSkin;

    // 1. Render previous frames (Pass 1)
    for (let step = framesBefore; step >= 1; step--) {
      const prevIdx = activeFrameIndex - step;
      if (prevIdx >= 0) {
        const prevFrame = skinFrames[prevIdx];
        if (prevFrame && prevFrame.id !== frameId) {
          // Calculate linear fade
          const stepRatio = (framesBefore - step + 1) / framesBefore;
          const targetOpacity = opacityBefore * stepRatio;

          const onionCanvas = getTintedFrameCanvas(width, height, prevFrame.id, layers, pixels, colorBefore, tintMode, effectiveFrames);
          tempCtx.save();
          tempCtx.globalAlpha = targetOpacity;
          tempCtx.drawImage(onionCanvas, 0, 0);
          tempCtx.restore();
        }
      }
    }

    // 2. Render future frames (Pass 2)
    for (let step = 1; step <= framesAfter; step++) {
      const nextIdx = activeFrameIndex + step;
      if (nextIdx < skinFrames.length) {
        const nextFrame = skinFrames[nextIdx];
        if (nextFrame && nextFrame.id !== frameId) {
          // Calculate linear fade
          const stepRatio = (framesAfter - step + 1) / framesAfter;
          const targetOpacity = opacityAfter * stepRatio;

          const onionCanvas = getTintedFrameCanvas(width, height, nextFrame.id, layers, pixels, colorAfter, tintMode, effectiveFrames);
          tempCtx.save();
          tempCtx.globalAlpha = targetOpacity;
          tempCtx.drawImage(onionCanvas, 0, 0);
          tempCtx.restore();
        }
      }
    }
  }

  // 3. Render active frame (Pass 3)
  const activeFrameCanvas = getTintedFrameCanvas(width, height, frameId, layers, pixels, '', false, effectiveFrames);
  tempCtx.drawImage(activeFrameCanvas, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, width * pxScale, height * pxScale);
  ctx.restore();
}
