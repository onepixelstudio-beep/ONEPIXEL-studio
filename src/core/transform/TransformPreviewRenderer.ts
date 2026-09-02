import { TransformMatrix2D, InterpolationMode, Rect2D } from './TransformTypes';

export interface PreviewRenderOptions {
  interpolation?: InterpolationMode;
  opacity?: number;
  drawBoundingBox?: boolean;
}

/**
 * Decoupled Preview Renderer for 60 FPS real-time transformation previews.
 * Uses OffscreenCanvas when available with Canvas2D fallback.
 * Reuses internal buffers with 0 memory allocation during drag interactions.
 */
export class TransformPreviewRenderer {
  private offscreenBuffer: OffscreenCanvas | HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private bufferWidth: number = 0;
  private bufferHeight: number = 0;

  /** Initializes the offscreen source image buffer */
  public initSourceBuffer(imageData: ImageData): void {
    const w = imageData.width;
    const h = imageData.height;

    if (w === 0 || h === 0) return;

    if (
      !this.offscreenBuffer ||
      this.bufferWidth !== w ||
      this.bufferHeight !== h
    ) {
      if (typeof OffscreenCanvas !== 'undefined') {
        this.offscreenBuffer = new OffscreenCanvas(w, h);
      } else if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        this.offscreenBuffer = canvas;
      }
      this.offscreenCtx = this.offscreenBuffer
        ? (this.offscreenBuffer.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D)
        : null;
      this.bufferWidth = w;
      this.bufferHeight = h;
    }

    if (this.offscreenCtx) {
      this.offscreenCtx.putImageData(imageData, 0, 0);
    }
  }

  /**
   * Renders real-time hardware-accelerated preview onto target canvas context.
   * Zero allocation on every drag frame.
   */
  public renderPreview(
    ctx: CanvasRenderingContext2D,
    sourceBounds: Rect2D,
    matrix: TransformMatrix2D,
    options?: PreviewRenderOptions
  ): void {
    if (!this.offscreenBuffer || this.bufferWidth === 0 || this.bufferHeight === 0) {
      return;
    }

    const interpolation = options?.interpolation ?? 'nearest';
    const opacity = options?.opacity ?? 1.0;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingEnabled = interpolation !== 'nearest';

    // Apply matrix transformation relative to origin
    ctx.transform(
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.tx,
      matrix.ty
    );

    // Draw cached source image onto transformed coordinate space
    ctx.drawImage(
      this.offscreenBuffer as CanvasImageSource,
      sourceBounds.x,
      sourceBounds.y,
      sourceBounds.width,
      sourceBounds.height
    );

    ctx.restore();
  }

  /** Clears cached buffers */
  public dispose(): void {
    this.offscreenBuffer = null;
    this.offscreenCtx = null;
    this.bufferWidth = 0;
    this.bufferHeight = 0;
  }
}
