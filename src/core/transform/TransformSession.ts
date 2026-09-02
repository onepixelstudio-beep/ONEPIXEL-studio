import {
  TransformSessionState,
  TransformTarget,
  TransformSessionOptions,
  TransformResult,
  TransformMatrix2D,
  Point2D,
  InterpolationMode,
  createImageData,
} from './TransformTypes';
import { TransformMatrix } from './TransformMatrix';
import { PivotManager } from './PivotManager';
import { TransformPreviewRenderer } from './TransformPreviewRenderer';
import { SamplingEngine } from './SamplingEngine';

/**
 * Non-destructive transformation session lifecycle manager.
 * Preserves original source pixels until commit and manages zero-allocation live preview.
 */
export class TransformSession {
  private state: TransformSessionState;
  private originalImageData: ImageData;
  private pivotManager: PivotManager;
  private previewRenderer: TransformPreviewRenderer;
  private samplingEngine: SamplingEngine;

  constructor(
    target: TransformTarget,
    options?: TransformSessionOptions,
    samplingEngine?: SamplingEngine
  ) {
    if (!target.imageData) {
      throw new Error('TransformTarget must include source ImageData.');
    }

    // Clone original ImageData to guarantee non-destructive session safety
    const copyData = new Uint8ClampedArray(target.imageData.data);
    this.originalImageData = createImageData(target.imageData.width, target.imageData.height, copyData);

    const initialMatrix = TransformMatrix.identity();
    const bounds = { ...target.bounds };

    this.pivotManager = new PivotManager(bounds);
    this.previewRenderer = new TransformPreviewRenderer();
    this.previewRenderer.initSourceBuffer(this.originalImageData);

    this.samplingEngine = samplingEngine ?? new SamplingEngine();

    this.state = {
      sessionId: `transform-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      target: { ...target },
      matrix: initialMatrix,
      pivot: this.pivotManager.getPivot(),
      originalBounds: { ...bounds },
      currentBounds: { ...bounds },
      isDirty: false,
      interpolation: options?.interpolation ?? 'nearest',
    };
  }

  public getState(): TransformSessionState {
    return {
      ...this.state,
      matrix: { ...this.state.matrix },
      pivot: { ...this.state.pivot },
      currentBounds: { ...this.state.currentBounds },
    };
  }

  public getMatrix(): TransformMatrix2D {
    return { ...this.state.matrix };
  }

  public getPivot(): Point2D {
    return this.pivotManager.getPivot();
  }

  public setPivot(pivot: Point2D): void {
    this.pivotManager.setPivot(pivot.x, pivot.y);
    this.state.pivot = this.pivotManager.getPivot();
  }

  public setInterpolation(mode: InterpolationMode): void {
    this.state.interpolation = mode;
  }

  public updateMatrix(matrix: TransformMatrix2D): void {
    TransformMatrix.copy(matrix, this.state.matrix);
    TransformMatrix.transformBounds(
      this.state.matrix,
      this.state.originalBounds,
      this.state.currentBounds
    );
    this.state.isDirty = !TransformMatrix.isIdentity(this.state.matrix);
  }

  public translate(dx: number, dy: number): void {
    const t = TransformMatrix.createTranslate(dx, dy);
    const newMatrix = TransformMatrix.multiply(t, this.state.matrix);
    this.updateMatrix(newMatrix);
  }

  public scale(sx: number, sy: number, customPivot?: Point2D): void {
    const p = customPivot ?? this.pivotManager.getPivot();
    const s = TransformMatrix.createScale(sx, sy, p);
    const newMatrix = TransformMatrix.multiply(s, this.state.matrix);
    this.updateMatrix(newMatrix);
  }

  public rotate(radians: number, customPivot?: Point2D): void {
    const p = customPivot ?? this.pivotManager.getPivot();
    const r = TransformMatrix.createRotate(radians, p);
    const newMatrix = TransformMatrix.multiply(r, this.state.matrix);
    this.updateMatrix(newMatrix);
  }

  public flip(horizontal: boolean, vertical: boolean): void {
    const p = this.pivotManager.getPivot();
    const f = TransformMatrix.createFlip(horizontal, vertical, p);
    const newMatrix = TransformMatrix.multiply(f, this.state.matrix);
    this.updateMatrix(newMatrix);
  }

  public renderPreview(ctx: CanvasRenderingContext2D): void {
    this.previewRenderer.renderPreview(
      ctx,
      this.state.originalBounds,
      this.state.matrix,
      { interpolation: this.state.interpolation }
    );
  }

  public commit(): TransformResult | null {
    if (!this.state.isDirty) {
      return null;
    }

    const targetW = Math.max(1, Math.round(this.state.currentBounds.width));
    const targetH = Math.max(1, Math.round(this.state.currentBounds.height));

    const resultBuffer = createImageData(targetW, targetH);

    // Perform raster pixel resampling
    this.samplingEngine.transformPixels(
      this.originalImageData,
      this.state.originalBounds,
      this.state.matrix,
      resultBuffer,
      this.state.interpolation
    );

    const result: TransformResult = {
      sessionId: this.state.sessionId,
      targetId: this.state.target.id,
      transformedImageData: resultBuffer,
      bounds: { ...this.state.currentBounds },
      matrix: { ...this.state.matrix },
    };

    this.cancel();
    return result;
  }

  public cancel(): void {
    this.previewRenderer.dispose();
    this.state.isDirty = false;
  }
}
