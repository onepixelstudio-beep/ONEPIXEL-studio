import { RenderResult, RenderedFrame } from '../ExportTypes';
import { ColorBlendUtils } from '../../canvas/ColorBlendUtils';
import { createExportCanvas, populateCanvasWithPixels } from './ExportEncoderUtils';

export interface SpriteAtlasFrame {
  name: string;
  frameIndex: number;
  frameId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pivotX: number;
  pivotY: number;
}

export interface SpriteAtlas {
  canvas: any; // HTMLCanvasElement or OffscreenCanvas
  frames: SpriteAtlasFrame[];
  meta: {
    projectName: string;
    width: number;
    height: number;
    scale: number;
    layout: string;
    columns: number;
    spacing: number;
    margin: number;
    transparent: boolean;
    bgColor?: string;
    schema: string;
    schemaVersion: string;
    app: string;
    generator: string;
  };
}

export function buildSpriteSheetFromRenderResult(
  renderResult: RenderResult,
  options: {
    layout: 'horizontal' | 'vertical' | 'grid';
    columns: number;
    spacing: number;
    margin: number;
    transparent: boolean;
    bgColor?: string;
  }
): SpriteAtlas {
  const { layout, columns, spacing, margin, transparent, bgColor } = options;
  const N = renderResult.frames.length;

  if (N === 0) {
    const { canvas } = createExportCanvas(1, 1);
    return {
      canvas,
      frames: [],
      meta: {
        projectName: renderResult.projectName,
        width: 1,
        height: 1,
        scale: renderResult.scale,
        layout,
        columns: 1,
        spacing,
        margin,
        transparent,
        bgColor,
        schema: 'OnePixel_SpriteAtlas',
        schemaVersion: '1.0.0',
        app: 'OnePixel Studio',
        generator: 'OnePixel SpriteSheetBuilder v2.0.0'
      }
    };
  }

  const singleW = renderResult.width;
  const singleH = renderResult.height;

  let cols = 1;
  let rows = 1;

  if (layout === 'horizontal') {
    cols = N;
    rows = 1;
  } else if (layout === 'vertical') {
    cols = 1;
    rows = N;
  } else {
    cols = Math.max(1, Math.min(columns || 4, N));
    rows = Math.ceil(N / cols);
  }

  const totalWidth = 2 * margin + cols * singleW + Math.max(0, cols - 1) * spacing;
  const totalHeight = 2 * margin + rows * singleH + Math.max(0, rows - 1) * spacing;

  const { canvas, ctx } = createExportCanvas(totalWidth, totalHeight);
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
  }

  if (ctx.clearRect) {
    ctx.clearRect(0, 0, totalWidth, totalHeight);
  }
  if (!transparent && ctx.fillRect) {
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
  }

  const frames: SpriteAtlasFrame[] = [];

  renderResult.frames.forEach((frame, idx) => {
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

    // Write pixels of this frame to the canvas
    const { canvas: offscreen, ctx: offCtx } = createExportCanvas(frame.width, frame.height);
    if (offCtx) {
      offCtx.imageSmoothingEnabled = false;
    }
    populateCanvasWithPixels(offscreen, offCtx, frame.pixels, frame.width, frame.height);

    if (ctx.drawImage) {
      ctx.drawImage(offscreen, x, y);
    }

    const frameName = (frame as any).name || `frame_${idx + 1}`;

    frames.push({
      name: frameName,
      frameIndex: idx,
      frameId: frame.frameId,
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
      projectName: renderResult.projectName,
      width: totalWidth,
      height: totalHeight,
      scale: renderResult.scale,
      layout,
      columns: cols,
      spacing,
      margin,
      transparent,
      bgColor,
      schema: 'OnePixel_SpriteAtlas',
      schemaVersion: '1.0.0',
      app: 'OnePixel Studio',
      generator: 'OnePixel SpriteSheetBuilder v2.0.0'
    }
  };
}

export function serializeAtlasToJson(atlas: SpriteAtlas, imageFileName: string): string {
  const framesRecord: Record<string, any> = {};

  atlas.frames.forEach((f) => {
    framesRecord[f.name] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      pivot: { x: f.pivotX ?? 0.5, y: f.pivotY ?? 0.5 }
    };
  });

  const output = {
    frames: framesRecord,
    meta: {
      app: atlas.meta.app,
      version: '1.0.0',
      image: imageFileName,
      format: 'RGBA8888',
      size: { w: atlas.meta.width, h: atlas.meta.height },
      scale: atlas.meta.scale.toString(),
      schema: atlas.meta.schema,
      schemaVersion: atlas.meta.schemaVersion,
      generator: atlas.meta.generator
    }
  };

  return JSON.stringify(output, null, 2);
}

export function serializeAtlasToXml(atlas: SpriteAtlas, imageFileName: string): string {
  const escapeXml = (str: string) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<TextureAtlas imagePath="${escapeXml(imageFileName)}" width="${atlas.meta.width}" height="${atlas.meta.height}" app="${escapeXml(atlas.meta.app)}" version="1.0.0" schema="${escapeXml(atlas.meta.schema)}" schemaVersion="${escapeXml(atlas.meta.schemaVersion)}">\n`;

  atlas.frames.forEach((f) => {
    const pivotAttr = f.pivotX !== undefined ? ` pivotX="${f.pivotX}" pivotY="${f.pivotY ?? 0.5}"` : '';
    xml += `  <SubTexture name="${escapeXml(f.name)}" x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"${pivotAttr} />\n`;
  });

  xml += `</TextureAtlas>\n`;
  return xml;
}
