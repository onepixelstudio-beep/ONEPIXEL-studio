import { PixelProject, SpriteAtlas, SpriteAtlasFrame } from '../types';
import { drawFrameOnCanvas } from './frameRenderer';

export interface SpriteSheetBuildOptions {
  project: PixelProject;
  frameIds: string[];
  scale: number;
  layout: 'horizontal' | 'vertical' | 'grid';
  columns: number;
  spacing: number;
  margin: number;
  transparent: boolean;
  bgColor?: string;
  signal?: AbortSignal;
}

export function buildSpriteSheet(options: SpriteSheetBuildOptions): SpriteAtlas {
  const { project, frameIds, scale, layout, columns, spacing, margin, transparent, bgColor, signal } = options;
  const canvas = document.createElement('canvas');
  const N = frameIds.length;

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (N === 0) {
    canvas.width = 1;
    canvas.height = 1;
    return {
      canvas,
      frames: [],
      meta: {
        projectName: project.name,
        width: 1,
        height: 1,
        scale,
        layout,
        columns: 1,
        spacing,
        margin,
        transparent,
        bgColor,
        schema: 'OnePixel_SpriteAtlas',
        schemaVersion: '1.0.0',
        app: 'OnePixel Studio',
        generator: 'OnePixel SpriteSheetBuilder v1.0.0'
      }
    };
  }

  const singleW = project.width * scale;
  const singleH = project.height * scale;

  let cols = 1;
  let rows = 1;

  if (layout === 'horizontal') {
    cols = N;
    rows = 1;
  } else if (layout === 'vertical') {
    cols = 1;
    rows = N;
  } else {
    // grid
    cols = Math.max(1, Math.min(columns || 4, N));
    rows = Math.ceil(N / cols);
  }

  const totalWidth = 2 * margin + cols * singleW + Math.max(0, cols - 1) * spacing;
  const totalHeight = 2 * margin + rows * singleH + Math.max(0, rows - 1) * spacing;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // Handle transparency/background color
  ctx.clearRect(0, 0, totalWidth, totalHeight);
  if (!transparent) {
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
  }

  const frames: SpriteAtlasFrame[] = [];

  frameIds.forEach((frameId, idx) => {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    let col = 0;
    let row = 0;

    if (layout === 'horizontal') {
      col = idx;
      row = 0;
    } else if (layout === 'vertical') {
      col = 0;
      row = idx;
    } else {
      col = idx % cols;
      row = Math.floor(idx / cols);
    }

    const x = margin + col * (singleW + spacing);
    const y = margin + row * (singleH + spacing);

    // Find frame metadata name
    const frameObj = project.frames.find(f => f.id === frameId);
    const frameName = frameObj?.name || `frame_${idx + 1}`;

    // Render this frame using the Unified Frame Renderer
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y);

    drawFrameOnCanvas(
      ctx,
      frameId,
      project.width,
      project.height,
      scale,
      project.layers,
      project.pixels,
      undefined // transparency matches original background flow
    );

    ctx.restore();

    frames.push({
      name: frameName,
      frameIndex: idx,
      frameId,
      x,
      y,
      w: singleW,
      h: singleH,
      pivotX: 0.5,
      pivotY: 0.5
    });
  });

  return {
    canvas,
    frames,
    meta: {
      projectName: project.name,
      width: totalWidth,
      height: totalHeight,
      scale,
      layout,
      columns: cols,
      spacing,
      margin,
      transparent,
      bgColor,
      schema: 'OnePixel_SpriteAtlas',
      schemaVersion: '1.0.0',
      app: 'OnePixel Studio',
      generator: 'OnePixel SpriteSheetBuilder v1.0.0'
    }
  };
}
