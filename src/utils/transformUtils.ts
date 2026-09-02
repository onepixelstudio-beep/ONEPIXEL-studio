import { TransformState } from '../types';
import { TransformMatrix } from '../core/transform/TransformMatrix';

/**
 * Calculates the bounding box of a selection mask.
 */
export function getSelectionBounds(pixels: boolean[], width: number, height: number) {
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let hasSelection = false;

  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i]) {
      const x = i % width;
      const y = Math.floor(i / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      hasSelection = true;
    }
  }

  if (!hasSelection) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Extracts selection pixels and masks into flat 1D buffer grids of the selection bounding box's size.
 */
export function extractSelectionBuffers(
  layerPixels: string[],
  selectionPixels: boolean[],
  bounds: { x: number; y: number; width: number; height: number },
  projectWidth: number
) {
  const pixelBuffer: (string | null)[] = new Array(bounds.width * bounds.height).fill(null);
  const maskBuffer: boolean[] = new Array(bounds.width * bounds.height).fill(false);

  for (let dy = 0; dy < bounds.height; dy++) {
    for (let dx = 0; dx < bounds.width; dx++) {
      const x = bounds.x + dx;
      const y = bounds.y + dy;
      const targetIdx = y * projectWidth + x;
      const bufferIdx = dy * bounds.width + dx;

      if (selectionPixels[targetIdx]) {
        pixelBuffer[bufferIdx] = layerPixels[targetIdx] || '';
        maskBuffer[bufferIdx] = true;
      }
    }
  }

  return { pixelBuffer, maskBuffer };
}

/**
 * Helper to construct affine matrix from pivot, scale, translation, rotation using TransformMatrix.
 */
function buildAffineMatrix(
  pivot: { x: number; y: number },
  scale: { x: number; y: number },
  translation: { x: number; y: number },
  rotation: number
) {
  const sMat = TransformMatrix.createScale(scale.x, scale.y, pivot);
  const rMat = TransformMatrix.createRotate(rotation, pivot);
  const tMat = TransformMatrix.createTranslate(translation.x, translation.y);
  const rs = TransformMatrix.multiply(rMat, sMat);
  return TransformMatrix.multiply(tMat, rs);
}

/**
 * Translates and rotates coordinates forward using TransformMatrix.
 */
export function forwardTransform(
  x: number,
  y: number,
  pivot: { x: number; y: number },
  scale: { x: number; y: number },
  translation: { x: number; y: number },
  rotation: number
) {
  const matrix = buildAffineMatrix(pivot, scale, translation, rotation);
  return TransformMatrix.transformPoint(matrix, { x, y });
}

/**
 * Translates and rotates coordinates backward using TransformMatrix.invert.
 */
export function backwardTransform(
  tx: number,
  ty: number,
  pivot: { x: number; y: number },
  scale: { x: number; y: number },
  translation: { x: number; y: number },
  rotation: number
) {
  const matrix = buildAffineMatrix(pivot, scale, translation, rotation);
  const invMatrix = TransformMatrix.invert(matrix);
  return TransformMatrix.transformPoint(invMatrix, { x: tx, y: ty });
}

/**
 * Core nearest-neighbor transformation implementation that executes pixel-perfect scaling and rotation.
 */
export function transformPixels(
  bounds: { x: number; y: number; width: number; height: number },
  pivot: { x: number; y: number },
  translation: { x: number; y: number },
  scale: { x: number; y: number },
  rotation: number,
  pixelBuffer: (string | null)[],
  maskBuffer: boolean[],
  projectWidth: number,
  projectHeight: number
): { pixels: string[]; mask: boolean[] } {
  const nextPixels = new Array(projectWidth * projectHeight).fill('');
  const nextMask = new Array(projectWidth * projectHeight).fill(false);

  const matrix = buildAffineMatrix(pivot, scale, translation, rotation);
  const invMatrix = TransformMatrix.invert(matrix);

  // Calculate transformed bounds accurately using TransformMatrix.transformBounds
  const transformedBounds = TransformMatrix.transformBounds(matrix, bounds);

  // Extend sampling box slightly to ensure no edge pixels or rotated corners are clipped
  const tx_min = Math.floor(transformedBounds.x - 1);
  const ty_min = Math.floor(transformedBounds.y - 1);
  const tx_max = Math.ceil(transformedBounds.x + transformedBounds.width + 1);
  const ty_max = Math.ceil(transformedBounds.y + transformedBounds.height + 1);

  const loop_y_start = Math.max(0, ty_min);
  const loop_y_end = Math.min(projectHeight - 1, ty_max);
  const loop_x_start = Math.max(0, tx_min);
  const loop_x_end = Math.min(projectWidth - 1, tx_max);

  for (let ty = loop_y_start; ty <= loop_y_end; ty++) {
    for (let tx = loop_x_start; tx <= loop_x_end; tx++) {
      // Sample precisely from the center of each destination pixel
      const srcPt = TransformMatrix.transformPoint(invMatrix, { x: tx + 0.5, y: ty + 0.5 });
      const sx = Math.floor(srcPt.x);
      const sy = Math.floor(srcPt.y);

      if (
        sx >= bounds.x &&
        sx < bounds.x + bounds.width &&
        sy >= bounds.y &&
        sy < bounds.y + bounds.height
      ) {
        const srcLocalX = sx - bounds.x;
        const srcLocalY = sy - bounds.y;
        const srcIdx = srcLocalY * bounds.width + srcLocalX;

        if (maskBuffer[srcIdx]) {
          const targetIdx = ty * projectWidth + tx;
          nextPixels[targetIdx] = pixelBuffer[srcIdx] || '';
          nextMask[targetIdx] = true;
        }
      }
    }
  }

  return { pixels: nextPixels, mask: nextMask };
}

