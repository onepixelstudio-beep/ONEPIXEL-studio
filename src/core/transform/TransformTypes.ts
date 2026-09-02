/**
 * ADR-TRANSFORM-001: Public Interface Contracts for Transformation System
 */

export function createImageData(
  width: number,
  height: number,
  data?: Uint8ClampedArray
): ImageData {
  if (typeof globalThis.ImageData !== 'undefined') {
    if (data) {
      return new globalThis.ImageData(data, width, height);
    }
    return new globalThis.ImageData(width, height);
  }

  // Environment fallback for headless Node.js unit tests
  const buffer = data ?? new Uint8ClampedArray(width * height * 4);
  return {
    width,
    height,
    data: buffer,
  } as ImageData;
}

export type InterpolationMode = 'nearest' | 'bilinear' | 'bicubic';

export type TransformTargetType = 'selection' | 'layer' | 'frame' | 'multi_frame' | 'object';

export interface Point2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 2D Affine Transformation Matrix 3x3 representation [a, c, tx; b, d, ty; 0, 0, 1]
 * Represented as flat tuple [a, b, c, d, tx, ty]
 */
export type Matrix2DTuple = [a: number, b: number, c: number, d: number, tx: number, ty: number];

export interface TransformMatrix2D {
  a: number;  // scale X
  b: number;  // shear Y
  c: number;  // shear X
  d: number;  // scale Y
  tx: number; // translate X
  ty: number; // translate Y
}

export interface TransformTarget {
  type: TransformTargetType;
  id: string;
  bounds: Rect2D;
  imageData?: ImageData;
}

export interface TransformSessionOptions {
  interpolation?: InterpolationMode;
  preserveAspectRatio?: boolean;
  gridSnapPx?: number;
}

export interface TransformSessionState {
  sessionId: string;
  target: TransformTarget;
  matrix: TransformMatrix2D;
  pivot: Point2D;
  originalBounds: Rect2D;
  currentBounds: Rect2D;
  isDirty: boolean;
  interpolation: InterpolationMode;
}

export interface TransformResult {
  sessionId: string;
  targetId: string;
  transformedImageData: ImageData;
  bounds: Rect2D;
  matrix: TransformMatrix2D;
}
