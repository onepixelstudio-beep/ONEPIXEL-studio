/**
 * AssetTransformationService.ts
 *
 * Dedicated service for executing lossless pixel-perfect geometric transformations on stamp resources,
 * brush assets, selection buffers, and textures.
 *
 * All operations are delegated to the low-level generic MatrixTransform library to ensure mathematical isolation.
 * Implements the TransformationPipeline pattern for unlimited extensibility.
 *
 * Architectural Rule:
 * All pixel matrix transformations in OnePixel Studio MUST delegate to this service or the
 * underlying MatrixTransform module. Custom inline rotation, flipping, or scaling logic is forbidden.
 */

import { MatrixTransform } from '../MatrixTransform';

/**
 * Interface defining a single step in the transformation pipeline.
 * New image operations (e.g., Outline, Shadow, ColorSwap, Crop) can be introduced
 * simply by implementing this interface without altering the core pipeline runner.
 */
export interface PipelineOperation {
  readonly type: string;
  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number };
}

/**
 * Concrete operation for pixel-perfect rotation (90, 180, 270 degrees).
 */
export class RotateOperation implements PipelineOperation {
  readonly type = 'rotate';
  constructor(public readonly angle: 90 | 180 | 270) {}

  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const res = this.angle === 90
      ? MatrixTransform.rotate90(pixels, width, height)
      : this.angle === 180
      ? MatrixTransform.rotate180(pixels, width, height)
      : MatrixTransform.rotate270(pixels, width, height);

    return { pixels: res.data, width: res.width, height: res.height };
  }
}

/**
 * Concrete operation for horizontal flipping.
 */
export class FlipHorizontalOperation implements PipelineOperation {
  readonly type = 'flipH';

  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const res = MatrixTransform.flipHorizontal(pixels, width, height);
    return { pixels: res.data, width: res.width, height: res.height };
  }
}

/**
 * Concrete operation for vertical flipping.
 */
export class FlipVerticalOperation implements PipelineOperation {
  readonly type = 'flipV';

  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const res = MatrixTransform.flipVertical(pixels, width, height);
    return { pixels: res.data, width: res.width, height: res.height };
  }
}

/**
 * Concrete operation for nearest-neighbor scaling.
 */
export class ScaleOperation implements PipelineOperation {
  readonly type = 'scale';
  constructor(public readonly scaleX: number, public readonly scaleY: number) {}

  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const res = MatrixTransform.scaleNearestNeighbor(pixels, width, height, this.scaleX, this.scaleY);
    return { pixels: res.data, width: res.width, height: res.height };
  }
}

/**
 * Sequentially chains and runs multiple geometric or visual transformations.
 */
export class TransformationPipeline {
  private readonly operations: PipelineOperation[] = [];

  /**
   * Adds an operation to the pipeline sequence.
   */
  add(operation: PipelineOperation): this {
    this.operations.push(operation);
    return this;
  }

  /**
   * Returns the count of registered operations.
   */
  get length(): number {
    return this.operations.length;
  }

  /**
   * Executes all pipeline operations in the order they were added.
   */
  execute(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    let current = { pixels, width, height };
    for (const op of this.operations) {
      current = op.execute(current.pixels, current.width, current.height);
    }
    return current;
  }
}

export class AssetTransformationService {
  /**
   * Rotates an asset 90 degrees clockwise.
   */
  static rotate90(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const op = new RotateOperation(90);
    return op.execute(pixels, width, height);
  }

  /**
   * Rotates an asset 180 degrees.
   */
  static rotate180(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const op = new RotateOperation(180);
    return op.execute(pixels, width, height);
  }

  /**
   * Rotates an asset 270 degrees clockwise.
   */
  static rotate270(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const op = new RotateOperation(270);
    return op.execute(pixels, width, height);
  }

  /**
   * Flips an asset horizontally.
   */
  static flipHorizontal(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const op = new FlipHorizontalOperation();
    return op.execute(pixels, width, height);
  }

  /**
   * Flips an asset vertically.
   */
  static flipVertical(pixels: string[], width: number, height: number): { pixels: string[]; width: number; height: number } {
    const op = new FlipVerticalOperation();
    return op.execute(pixels, width, height);
  }

  /**
   * Performs Nearest-Neighbor scaling using ScaleOperation.
   */
  static scale(
    pixels: string[],
    width: number,
    height: number,
    scaleX: number,
    scaleY: number
  ): { pixels: string[]; width: number; height: number } {
    if (scaleX <= 0 || scaleY <= 0) return { pixels, width, height };
    const op = new ScaleOperation(scaleX, scaleY);
    return op.execute(pixels, width, height);
  }

  /**
   * High-level orchestrator that utilizes the TransformationPipeline to chain operations sequentially.
   */
  static transform(
    pixels: string[],
    width: number,
    height: number,
    rotation: 0 | 90 | 180 | 270,
    flipH: boolean,
    flipV: boolean,
    scaleX: number = 1,
    scaleY: number = 1
  ): { pixels: string[]; width: number; height: number } {
    const pipeline = new TransformationPipeline();

    if (rotation === 90 || rotation === 180 || rotation === 270) {
      pipeline.add(new RotateOperation(rotation));
    }

    if (flipH) {
      pipeline.add(new FlipHorizontalOperation());
    }

    if (flipV) {
      pipeline.add(new FlipVerticalOperation());
    }

    if (scaleX !== 1 || scaleY !== 1) {
      pipeline.add(new ScaleOperation(scaleX, scaleY));
    }

    return pipeline.execute(pixels, width, height);
  }
}
