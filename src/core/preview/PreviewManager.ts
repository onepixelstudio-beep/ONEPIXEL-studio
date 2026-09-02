import { PixelProject } from '../../types';
import { LayerCacheManager } from '../../utils/animation/LayerCacheManager';

export interface PreviewRenderOptions {
  backgroundStyle?: 'checkered' | 'dark' | 'light' | 'transparent';
  showPixelGrid?: boolean;
  scale?: number;
}

export class PreviewManager {
  private static instance: PreviewManager | null = null;
  private animationTimer: number | null = null;
  private currentPreviewFrameIndex: number = 0;
  private isPlaying: boolean = false;
  private pingPongDirection: 1 | -1 = 1;

  private constructor() {}

  public static getInstance(): PreviewManager {
    if (!PreviewManager.instance) {
      PreviewManager.instance = new PreviewManager();
    }
    return PreviewManager.instance;
  }

  /**
   * Renders a specific frame of a project onto a target HTMLCanvasElement.
   * Uses ImageData for high performance pixel-level composite rendering.
   */
  public renderFrameToCanvas(
    canvas: HTMLCanvasElement,
    project: PixelProject,
    frameId: string,
    options: PreviewRenderOptions = {}
  ): void {
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgStyle = options.backgroundStyle || 'checkered';

    // Sync dimensions
    if (canvas.width !== project.width) canvas.width = project.width;
    if (canvas.height !== project.height) canvas.height = project.height;

    ctx.clearRect(0, 0, project.width, project.height);

    // 1. Render background
    if (bgStyle === 'checkered') {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 4;
      patternCanvas.height = 4;
      const pctx = patternCanvas.getContext('2d');
      if (pctx) {
        pctx.fillStyle = '#1e293b';
        pctx.fillRect(0, 0, 4, 4);
        pctx.fillStyle = '#334155';
        pctx.fillRect(0, 0, 2, 2);
        pctx.fillRect(2, 2, 2, 2);
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, project.width, project.height);
        }
      }
    } else if (bgStyle === 'dark') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, project.width, project.height);
    } else if (bgStyle === 'light') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, project.width, project.height);
    }

    // 2. Render layer stack composite
    const layerCache = LayerCacheManager.getInstance();
    const compositeCanvas = layerCache.getFrameCompositeCanvas(
      frameId,
      project.layers,
      project.pixels,
      project.width,
      project.height,
      project.frames
    );

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(compositeCanvas, 0, 0);
    ctx.restore();

    // Optional pixel grid overlay
    if (options.showPixelGrid && project.width <= 64 && project.height <= 64) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= project.width; x++) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, project.height);
      }
      for (let y = 0; y <= project.height; y++) {
        ctx.moveTo(0, y);
        ctx.lineTo(project.width, y);
      }
      ctx.stroke();
    }
  }

  /**
   * Helper to calculate next frame index given current index, total frames, and playback mode.
   */
  public getNextFrameIndex(
    currentIndex: number,
    totalFrames: number,
    mode: 'forward' | 'reverse' | 'pingpong' = 'forward'
  ): number {
    if (totalFrames <= 1) return 0;

    if (mode === 'forward') {
      return (currentIndex + 1) % totalFrames;
    } else if (mode === 'reverse') {
      return (currentIndex - 1 + totalFrames) % totalFrames;
    } else if (mode === 'pingpong') {
      let nextIdx = currentIndex + this.pingPongDirection;
      if (nextIdx >= totalFrames) {
        this.pingPongDirection = -1;
        nextIdx = totalFrames - 2;
      } else if (nextIdx < 0) {
        this.pingPongDirection = 1;
        nextIdx = 1;
      }
      return Math.max(0, Math.min(totalFrames - 1, nextIdx));
    }

    return 0;
  }
}

export const previewManager = PreviewManager.getInstance();
