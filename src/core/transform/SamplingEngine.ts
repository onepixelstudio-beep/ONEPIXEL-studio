import { InterpolationMode, TransformMatrix2D, Rect2D } from './TransformTypes';
import { TransformMatrix } from './TransformMatrix';

export interface PixelSampler {
  sample(
    srcPixels: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    u: number,
    v: number,
    outRGBA: Uint8ClampedArray
  ): void;
}

export class NearestNeighborSampler implements PixelSampler {
  public sample(
    srcPixels: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    u: number,
    v: number,
    outRGBA: Uint8ClampedArray
  ): void {
    const x = Math.floor(u);
    const y = Math.floor(v);

    if (x < 0 || x >= srcWidth || y < 0 || y >= srcHeight) {
      outRGBA[0] = 0;
      outRGBA[1] = 0;
      outRGBA[2] = 0;
      outRGBA[3] = 0;
      return;
    }

    const idx = (y * srcWidth + x) * 4;
    outRGBA[0] = srcPixels[idx];
    outRGBA[1] = srcPixels[idx + 1];
    outRGBA[2] = srcPixels[idx + 2];
    outRGBA[3] = srcPixels[idx + 3];
  }
}

export class BilinearSampler implements PixelSampler {
  public sample(
    srcPixels: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    u: number,
    v: number,
    outRGBA: Uint8ClampedArray
  ): void {
    const x1 = Math.floor(u);
    const y1 = Math.floor(v);
    const x2 = x1 + 1;
    const y2 = y1 + 1;

    if (x2 <= 0 || x1 >= srcWidth || y2 <= 0 || y1 >= srcHeight) {
      outRGBA[0] = 0;
      outRGBA[1] = 0;
      outRGBA[2] = 0;
      outRGBA[3] = 0;
      return;
    }

    const fx = u - x1;
    const fy = v - y1;
    const w11 = (1 - fx) * (1 - fy);
    const w21 = fx * (1 - fy);
    const w12 = (1 - fx) * fy;
    const w22 = fx * fy;

    const clampX = (x: number) => Math.max(0, Math.min(srcWidth - 1, x));
    const clampY = (y: number) => Math.max(0, Math.min(srcHeight - 1, y));

    const idx11 = (clampY(y1) * srcWidth + clampX(x1)) * 4;
    const idx21 = (clampY(y1) * srcWidth + clampX(x2)) * 4;
    const idx12 = (clampY(y2) * srcWidth + clampX(x1)) * 4;
    const idx22 = (clampY(y2) * srcWidth + clampX(x2)) * 4;

    for (let c = 0; c < 4; c++) {
      const val =
        srcPixels[idx11 + c] * w11 +
        srcPixels[idx21 + c] * w21 +
        srcPixels[idx12 + c] * w12 +
        srcPixels[idx22 + c] * w22;
      outRGBA[c] = Math.round(val);
    }
  }
}

export class BicubicSampler implements PixelSampler {
  private cubicWeight(x: number): number {
    const a = -0.5;
    const absX = Math.abs(x);
    if (absX <= 1) {
      return (a + 2) * Math.pow(absX, 3) - (a + 3) * Math.pow(absX, 2) + 1;
    } else if (absX < 2) {
      return a * Math.pow(absX, 3) - 5 * a * Math.pow(absX, 2) + 8 * a * absX - 4 * a;
    }
    return 0;
  }

  public sample(
    srcPixels: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    u: number,
    v: number,
    outRGBA: Uint8ClampedArray
  ): void {
    const x = Math.floor(u);
    const y = Math.floor(v);

    if (x < -1 || x >= srcWidth + 1 || y < -1 || y >= srcHeight + 1) {
      outRGBA[0] = 0;
      outRGBA[1] = 0;
      outRGBA[2] = 0;
      outRGBA[3] = 0;
      return;
    }

    const fx = u - x;
    const fy = v - y;

    const sums = [0, 0, 0, 0];
    let totalWeight = 0;

    const clampX = (px: number) => Math.max(0, Math.min(srcWidth - 1, px));
    const clampY = (py: number) => Math.max(0, Math.min(srcHeight - 1, py));

    for (let m = -1; m <= 2; m++) {
      const wy = this.cubicWeight(m - fy);
      const py = clampY(y + m);
      const rowIdx = py * srcWidth;

      for (let n = -1; n <= 2; n++) {
        const wx = this.cubicWeight(n - fx);
        const weight = wx * wy;
        const px = clampX(x + n);
        const idx = (rowIdx + px) * 4;

        sums[0] += srcPixels[idx] * weight;
        sums[1] += srcPixels[idx + 1] * weight;
        sums[2] += srcPixels[idx + 2] * weight;
        sums[3] += srcPixels[idx + 3] * weight;
        totalWeight += weight;
      }
    }

    const invW = totalWeight !== 0 ? 1 / totalWeight : 1;
    outRGBA[0] = Math.max(0, Math.min(255, Math.round(sums[0] * invW)));
    outRGBA[1] = Math.max(0, Math.min(255, Math.round(sums[1] * invW)));
    outRGBA[2] = Math.max(0, Math.min(255, Math.round(sums[2] * invW)));
    outRGBA[3] = Math.max(0, Math.min(255, Math.round(sums[3] * invW)));
  }
}

/**
 * Dedicated Sampling Engine for raster image pixel resampling.
 */
export class SamplingEngine {
  private samplers: Map<InterpolationMode, PixelSampler> = new Map();
  private static tempRGBA: Uint8ClampedArray = new Uint8ClampedArray(4);

  constructor() {
    this.samplers.set('nearest', new NearestNeighborSampler());
    this.samplers.set('bilinear', new BilinearSampler());
    this.samplers.set('bicubic', new BicubicSampler());
  }

  /** Registers a custom pixel sampler algorithm */
  public registerSampler(mode: InterpolationMode, sampler: PixelSampler): void {
    this.samplers.set(mode, sampler);
  }

  /** Gets sampler for given mode, defaults to Nearest for Pixel Art */
  public getSampler(mode: InterpolationMode = 'nearest'): PixelSampler {
    return this.samplers.get(mode) ?? this.samplers.get('nearest')!;
  }

  /**
   * Resamples pixel buffer using inverse matrix transformation.
   * Modifies targetImageData in-place without new memory allocations.
   */
  public transformPixels(
    srcImageData: ImageData,
    srcBounds: Rect2D,
    matrix: TransformMatrix2D,
    targetImageData: ImageData,
    mode: InterpolationMode = 'nearest'
  ): ImageData {
    const invMatrix = TransformMatrix.invert(matrix);

    const srcPixels = srcImageData.data;
    const srcW = srcImageData.width;
    const srcH = srcImageData.height;

    const dstPixels = targetImageData.data;
    const dstW = targetImageData.width;
    const dstH = targetImageData.height;

    const sampler = this.getSampler(mode);
    const rgba = SamplingEngine.tempRGBA;

    const invA = invMatrix.a;
    const invB = invMatrix.b;
    const invC = invMatrix.c;
    const invD = invMatrix.d;
    const invTx = invMatrix.tx;
    const invTy = invMatrix.ty;

    for (let dy = 0; dy < dstH; dy++) {
      const worldY = srcBounds.y + dy;
      const rowOffset = dy * dstW * 4;

      for (let dx = 0; dx < dstW; dx++) {
        const worldX = srcBounds.x + dx;

        // Map target pixel world coordinate back to source local space
        const srcX = invA * worldX + invC * worldY + invTx - srcBounds.x;
        const srcY = invB * worldX + invD * worldY + invTy - srcBounds.y;

        sampler.sample(srcPixels, srcW, srcH, srcX, srcY, rgba);

        const dstIdx = rowOffset + dx * 4;
        dstPixels[dstIdx] = rgba[0];
        dstPixels[dstIdx + 1] = rgba[1];
        dstPixels[dstIdx + 2] = rgba[2];
        dstPixels[dstIdx + 3] = rgba[3];
      }
    }

    return targetImageData;
  }
}
