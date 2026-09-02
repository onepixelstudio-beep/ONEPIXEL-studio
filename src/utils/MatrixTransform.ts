import { TransformMatrix } from '../core/transform/TransformMatrix';

/**
 * MatrixTransform.ts
 *
 * Dedicated low-level mathematical engine for performing lossless, pixel-perfect
 * geometric transformations on flat 1D representation of 2D matrices.
 *
 * Generic typed (T) to allow transforming color arrays, transparency masks,
 * selection buffers, boolean maps, or any pixel-aligned grid data.
 */

export class MatrixTransform {
  /**
   * Rotates a 2D matrix (represented as a 1D flat array) 90 degrees clockwise.
   */
  static rotate90<T>(matrix: T[], width: number, height: number): { data: T[]; width: number; height: number } {
    const rotated: T[] = new Array(width * height);
    for (let dy = 0; dy < width; dy++) {
      for (let dx = 0; dx < height; dx++) {
        const sx = dy;
        const sy = height - 1 - dx;
        rotated[dy * height + dx] = matrix[sy * width + sx];
      }
    }
    return { data: rotated, width: height, height: width };
  }

  /**
   * Rotates a 2D matrix 180 degrees.
   */
  static rotate180<T>(matrix: T[], width: number, height: number): { data: T[]; width: number; height: number } {
    const rotated: T[] = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sx = width - 1 - x;
        const sy = height - 1 - y;
        rotated[y * width + x] = matrix[sy * width + sx];
      }
    }
    return { data: rotated, width, height };
  }

  /**
   * Rotates a 2D matrix 270 degrees clockwise (90 degrees counter-clockwise).
   */
  static rotate270<T>(matrix: T[], width: number, height: number): { data: T[]; width: number; height: number } {
    const rotated: T[] = new Array(width * height);
    for (let dy = 0; dy < width; dy++) {
      for (let dx = 0; dx < height; dx++) {
        const sx = width - 1 - dy;
        const sy = dx;
        rotated[dy * height + dx] = matrix[sy * width + sx];
      }
    }
    return { data: rotated, width: height, height: width };
  }

  /**
   * Flips a 2D matrix horizontally.
   */
  static flipHorizontal<T>(matrix: T[], width: number, height: number): { data: T[]; width: number; height: number } {
    const flipped: T[] = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        flipped[y * width + x] = matrix[y * width + (width - 1 - x)];
      }
    }
    return { data: flipped, width, height };
  }

  /**
   * Flips a 2D matrix vertically.
   */
  static flipVertical<T>(matrix: T[], width: number, height: number): { data: T[]; width: number; height: number } {
    const flipped: T[] = new Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        flipped[y * width + x] = matrix[(height - 1 - y) * width + x];
      }
    }
    return { data: flipped, width, height };
  }

  /**
   * Scales a 2D matrix using Nearest-Neighbor interpolation via TransformMatrix.
   * If scaleX and scaleY are integers, exact integer mapping is applied.
   * Supports fractional scale factors while preserving crisp pixel/grid boundaries.
   */
  static scaleNearestNeighbor<T>(
    matrix: T[],
    width: number,
    height: number,
    scaleX: number,
    scaleY: number
  ): { data: T[]; width: number; height: number } {
    if (scaleX <= 0 || scaleY <= 0) return { data: matrix, width, height };

    const newWidth = Math.max(1, Math.floor(width * scaleX));
    const newHeight = Math.max(1, Math.floor(height * scaleY));
    const scaled: T[] = new Array(newWidth * newHeight);

    const scaleMat = TransformMatrix.createScale(scaleX, scaleY);
    const invMat = TransformMatrix.invert(scaleMat);

    // Precise Nearest-Neighbor interpolation mapping target center back to source using TransformMatrix
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcPt = TransformMatrix.transformPoint(invMat, { x: x + 0.5, y: y + 0.5 });
        const srcX = Math.min(width - 1, Math.max(0, Math.floor(srcPt.x)));
        const srcY = Math.min(height - 1, Math.max(0, Math.floor(srcPt.y)));
        scaled[y * newWidth + x] = matrix[srcY * width + srcX];
      }
    }

    return { data: scaled, width: newWidth, height: newHeight };
  }
}

