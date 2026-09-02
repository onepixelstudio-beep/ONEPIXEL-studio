import { describe, it, expect, beforeEach } from 'vitest';
import { ExportPipeline } from '../ExportPipeline';
import { buildSpriteSheetFromRenderResult } from '../plugins/SpriteSheetUtils';
import { RenderResult, RenderedFrame } from '../ExportTypes';
import { PixelProject } from '../../../types';
import { unzipSync } from 'fflate';

// Real memory-backed canvas mock for node environment
class MockCanvas {
  private _width: number = 1;
  private _height: number = 1;
  public buffer: Uint8ClampedArray = new Uint8ClampedArray(4);

  constructor(w: number, h: number) {
    this._width = Math.max(1, Math.floor(w || 1));
    this._height = Math.max(1, Math.floor(h || 1));
    this.buffer = new Uint8ClampedArray(this._width * this._height * 4);
  }

  get width(): number {
    return this._width;
  }

  set width(val: number) {
    this._width = Math.max(1, Math.floor(val));
    this.buffer = new Uint8ClampedArray(this._width * this._height * 4);
  }

  get height(): number {
    return this._height;
  }

  set height(val: number) {
    this._height = Math.max(1, Math.floor(val));
    this.buffer = new Uint8ClampedArray(this._width * this._height * 4);
  }

  getContext(type: string) {
    if (type !== '2d') return null;
    const self = this;
    return {
      imageSmoothingEnabled: false,
      clearRect(x: number, y: number, w: number, h: number) {
        for (let row = y; row < y + h; row++) {
          if (row < 0 || row >= self.height) continue;
          for (let col = x; col < x + w; col++) {
            if (col < 0 || col >= self.width) continue;
            const idx = (row * self.width + col) * 4;
            self.buffer[idx] = 0;
            self.buffer[idx + 1] = 0;
            self.buffer[idx + 2] = 0;
            self.buffer[idx + 3] = 0;
          }
        }
      },
      fillRect(x: number, y: number, w: number, h: number) {
        for (let row = y; row < y + h; row++) {
          if (row < 0 || row >= self.height) continue;
          for (let col = x; col < x + w; col++) {
            if (col < 0 || col >= self.width) continue;
            const idx = (row * self.width + col) * 4;
            self.buffer[idx] = 255;
            self.buffer[idx + 1] = 255;
            self.buffer[idx + 2] = 255;
            self.buffer[idx + 3] = 255;
          }
        }
      },
      createImageData(w: number, h: number) {
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
      },
      putImageData(imgData: { width: number; height: number; data: Uint8ClampedArray }, dx: number, dy: number) {
        for (let row = 0; row < imgData.height; row++) {
          const destY = dy + row;
          if (destY < 0 || destY >= self.height) continue;
          for (let col = 0; col < imgData.width; col++) {
            const destX = dx + col;
            if (destX < 0 || destX >= self.width) continue;
            const srcIdx = (row * imgData.width + col) * 4;
            const destIdx = (destY * self.width + destX) * 4;
            self.buffer[destIdx] = imgData.data[srcIdx];
            self.buffer[destIdx + 1] = imgData.data[srcIdx + 1];
            self.buffer[destIdx + 2] = imgData.data[srcIdx + 2];
            self.buffer[destIdx + 3] = imgData.data[srcIdx + 3];
          }
        }
      },
      getImageData(sx: number, sy: number, sw: number, sh: number) {
        const out = new Uint8ClampedArray(sw * sh * 4);
        for (let row = 0; row < sh; row++) {
          const srcY = sy + row;
          for (let col = 0; col < sw; col++) {
            const srcX = sx + col;
            const destIdx = (row * sw + col) * 4;
            if (srcX >= 0 && srcX < self.width && srcY >= 0 && srcY < self.height) {
              const srcIdx = (srcY * self.width + srcX) * 4;
              out[destIdx] = self.buffer[srcIdx];
              out[destIdx + 1] = self.buffer[srcIdx + 1];
              out[destIdx + 2] = self.buffer[srcIdx + 2];
              out[destIdx + 3] = self.buffer[srcIdx + 3];
            }
          }
        }
        return { width: sw, height: sh, data: out };
      },
      drawImage(source: any, dx: number, dy: number) {
        if (!source || !source.getContext) return;
        const srcCtx = source.getContext('2d');
        const srcData = srcCtx.getImageData(0, 0, source.width, source.height);
        this.putImageData(srcData, dx, dy);
      }
    };
  }

  toBlob(callback: (blob: Blob) => void) {
    const fakePng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...this.buffer.slice(0, 64)]);
    callback(new Blob([fakePng], { type: 'image/png' }));
  }

  convertToBlob() {
    const fakePng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...this.buffer.slice(0, 64)]);
    return Promise.resolve(new Blob([fakePng], { type: 'image/png' }));
  }
}

// Setup global canvas mock
(globalThis as any).OffscreenCanvas = class extends MockCanvas {};
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return new MockCanvas(1, 1);
      return {};
    }
  };
}

if (typeof (globalThis as any).FileReader === 'undefined') {
  (globalThis as any).FileReader = class {
    onloadend: (() => void) | null = null;
    result: any = null;
    async readAsArrayBuffer(blob: Blob) {
      this.result = await blob.arrayBuffer();
      this.onloadend?.();
    }
  };
}

function createMockProject(width: number, height: number, frameCount: number): PixelProject {
  const frames = [];
  const pixels: Record<string, Record<string, string[]>> = {};

  for (let f = 0; f < frameCount; f++) {
    const frameId = `frame_${f + 1}`;
    frames.push({ id: frameId, name: `Hero_Run_${f + 1}`, durationMs: 100 });
    pixels[frameId] = {
      'layer_1': new Array(width * height).fill('')
    };

    // Fill distinctive color per frame for pixel-perfect verification
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = (f * 40 + x * 5) % 255;
        const g = (y * 10) % 255;
        const b = (f * 20 + 50) % 255;
        pixels[frameId]['layer_1'][y * width + x] = `rgba(${r},${g},${b},1)`;
      }
    }
  }

  return {
    id: 'game-export-test-proj',
    name: 'Hero Animation',
    width,
    height,
    layers: [{ id: 'layer_1', name: 'Base Layer', visible: true, locked: false, opacity: 100 }],
    frames,
    pixels,
    fps: 10,
    tags: [],
    lastSaved: Date.now()
  };
}

describe('Auditoría Integral del Exportador para Videojuegos', () => {
  it('1. Genera Sprite Sheet + JSON Atlas con correspondencia exacta de coordenadas (Phaser / PixiJS)', async () => {
    const W = 16;
    const H = 24;
    const numFrames = 6;
    const project = createMockProject(W, H, numFrames);
    let capturedFile: any = null;

    const result = await ExportPipeline.execute({
      project,
      pluginId: 'spritesheet_json',
      scale: 1,
      options: {
        filename: 'hero_spritesheet.png', // Debe sanitizar la doble extensión
        layout: 'grid',
        columns: 3,
        spacing: 2,
        margin: 4,
        scale: 1,
        transparent: true
      },
      hooks: {
        beforeSave: (file) => {
          capturedFile = file;
        }
      }
    });

    expect(result).toBeDefined();
    expect(result.filename).toBe('hero_spritesheet');
    expect(result.extension).toBe('zip');
    expect(capturedFile).toBeDefined();

    // Descomprimir el ZIP
    const unzipped = unzipSync(new Uint8Array(capturedFile.data as ArrayBuffer));
    expect(unzipped['hero_spritesheet.png']).toBeDefined();
    expect(unzipped['hero_spritesheet.json']).toBeDefined();

    const jsonStr = new TextDecoder().decode(unzipped['hero_spritesheet.json']);
    const atlas = JSON.parse(jsonStr);

    expect(atlas.meta).toBeDefined();
    expect(atlas.meta.image).toBe('hero_spritesheet.png');
    expect(atlas.meta.app).toBe('OnePixel Studio');
    expect(atlas.meta.format).toBe('RGBA8888');
    expect(atlas.meta.scale).toBe('1');
    expect(atlas.frames).toBeDefined();

    // 3 columnas x 2 filas
    // Ancho total esperado: 2*margin + 3*W + 2*spacing = 8 + 48 + 4 = 60
    // Alto total esperado: 2*margin + 2*H + 1*spacing = 8 + 48 + 2 = 58
    expect(atlas.meta.size.w).toBe(60);
    expect(atlas.meta.size.h).toBe(58);

    // Verificar cada frame individualmente en el atlas
    for (let idx = 0; idx < numFrames; idx++) {
      const frameKey = `Hero_Run_${idx + 1}`;
      const frameData = atlas.frames[frameKey];
      expect(frameData).toBeDefined();

      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const expectedX = 4 + col * (W + 2);
      const expectedY = 4 + row * (H + 2);

      expect(frameData.frame.x).toBe(expectedX);
      expect(frameData.frame.y).toBe(expectedY);
      expect(frameData.frame.w).toBe(W);
      expect(frameData.frame.h).toBe(H);
      expect(frameData.sourceSize.w).toBe(W);
      expect(frameData.sourceSize.h).toBe(H);
      expect(frameData.trimmed).toBe(false);
    }
  });

  it('2. Genera Sprite Sheet + XML Atlas válido y compatible con Starling / Sparrow / Cocos2D', async () => {
    const W = 32;
    const H = 32;
    const numFrames = 4;
    const project = createMockProject(W, H, numFrames);
    let capturedFile: any = null;

    const result = await ExportPipeline.execute({
      project,
      pluginId: 'spritesheet_xml',
      scale: 1,
      options: {
        filename: 'enemy_spritesheet',
        layout: 'horizontal',
        spacing: 1,
        margin: 0,
        scale: 1,
        transparent: true
      },
      hooks: {
        beforeSave: (file) => {
          capturedFile = file;
        }
      }
    });

    expect(result).toBeDefined();
    expect(capturedFile).toBeDefined();
    expect(capturedFile.extension).toBe('zip');
    const unzipped = unzipSync(new Uint8Array(capturedFile.data as ArrayBuffer));
    expect(unzipped['enemy_spritesheet.png']).toBeDefined();
    expect(unzipped['enemy_spritesheet.xml']).toBeDefined();

    const xmlStr = new TextDecoder().decode(unzipped['enemy_spritesheet.xml']);
    expect(xmlStr).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xmlStr).toContain('<TextureAtlas imagePath="enemy_spritesheet.png"');
    expect(xmlStr).toContain('width="131" height="32"');

    // Horizontal: 4 frames -> ancho = 4*32 + 3*1 = 131
    for (let idx = 0; idx < numFrames; idx++) {
      const expectedX = idx * (32 + 1);
      const expectedName = `Hero_Run_${idx + 1}`;
      expect(xmlStr).toContain(`name="${expectedName}" x="${expectedX}" y="0" width="32" height="32"`);
    }
  });

  it('3. Genera Secuencia PNG en ZIP con orden y numeración estricta', async () => {
    const W = 16;
    const H = 16;
    const numFrames = 5;
    const project = createMockProject(W, H, numFrames);
    let capturedFile: any = null;

    const result = await ExportPipeline.execute({
      project,
      pluginId: 'png_sequence',
      scale: 1,
      options: {
        filename: 'coin_anim',
        padding: '3',
        folderName: 'sprites',
        includeMetadata: true
      },
      hooks: {
        beforeSave: (file) => {
          capturedFile = file;
        }
      }
    });

    expect(result).toBeDefined();
    expect(capturedFile).toBeDefined();
    expect(capturedFile.extension).toBe('zip');
    const unzipped = unzipSync(new Uint8Array(capturedFile.data as ArrayBuffer));
    
    // Validar que contiene cada frame con el padding solicitado
    expect(unzipped['sprites/coin_anim_001.png']).toBeDefined();
    expect(unzipped['sprites/coin_anim_002.png']).toBeDefined();
    expect(unzipped['sprites/coin_anim_003.png']).toBeDefined();
    expect(unzipped['sprites/coin_anim_004.png']).toBeDefined();
    expect(unzipped['sprites/coin_anim_005.png']).toBeDefined();
    expect(unzipped['sprites/manifest.json']).toBeDefined();

    const manifestStr = new TextDecoder().decode(unzipped['sprites/manifest.json']);
    const manifest = JSON.parse(manifestStr);
    expect(manifest.framesCount).toBe(5);
    expect(manifest.frames.length).toBe(5);
    expect(manifest.frames[0].file).toBe('coin_anim_001.png');
    expect(manifest.frames[4].file).toBe('coin_anim_005.png');
  });

  it('4. Prueba Matemática de Integridad Píxel por Píxel (Crop vs Original)', () => {
    const W = 8;
    const H = 8;
    const numFrames = 4;
    const renderedFrames = [];

    for (let f = 0; f < numFrames; f++) {
      const pixels: string[] = [];
      for (let i = 0; i < W * H; i++) {
        const r = (f * 50 + i * 2) % 256;
        const g = (f * 30 + 70) % 256;
        const b = (f * 20 + 120) % 256;
        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');
        pixels.push(`#${rHex}${gHex}${bHex}`);
      }
      renderedFrames.push({
        frameId: `f_${f}`,
        name: `Frame_${f + 1}`,
        durationMs: 100,
        pixels,
        width: W,
        height: H
      });
    }

    const mockRenderResult: RenderResult = {
      projectId: 'proj_test',
      projectName: 'Test Project',
      width: W,
      height: H,
      scale: 1,
      frames: renderedFrames,
      palette: [],
      statistics: {
        renderTimeMs: 10,
        framesRendered: numFrames,
        layersMerged: 1,
        pixelsProcessed: W * H * numFrames,
        pixelsWritten: W * H * numFrames,
        pixelsDiscarded: 0,
        scaleApplied: 1,
        cacheHit: false,
        cacheMiss: true
      },
      warnings: []
    };

    const atlas = buildSpriteSheetFromRenderResult(mockRenderResult, {
      layout: 'grid',
      columns: 2,
      spacing: 3,
      margin: 2,
      transparent: true
    });

    expect(atlas.meta.width).toBe(2 * 2 + 2 * 8 + 3); // 4 + 16 + 3 = 23
    expect(atlas.meta.height).toBe(2 * 2 + 2 * 8 + 3); // 23
    expect(atlas.frames.length).toBe(4);

    // Reconstruir y comparar frame por frame
    const ctx = atlas.canvas.getContext('2d');
    expect(ctx).toBeDefined();

    for (let f = 0; f < numFrames; f++) {
      const frameMeta = atlas.frames[f];
      const origPixels = renderedFrames[f].pixels;
      const extractedImageData = ctx!.getImageData(frameMeta.x, frameMeta.y, frameMeta.w, frameMeta.h);
      const extractedPixels = extractedImageData.data;

      expect(extractedPixels.length).toBe(origPixels.length * 4);
      for (let p = 0; p < origPixels.length; p++) {
        const expectedR = (f * 50 + p * 2) % 256;
        const expectedG = (f * 30 + 70) % 256;
        const expectedB = (f * 20 + 120) % 256;
        const expectedA = 255;

        const actualR = extractedPixels[p * 4];
        const actualG = extractedPixels[p * 4 + 1];
        const actualB = extractedPixels[p * 4 + 2];
        const actualA = extractedPixels[p * 4 + 3];

        if (actualR !== expectedR || actualG !== expectedG || actualB !== expectedB || actualA !== expectedA) {
          throw new Error(`Pixel mismatch in frame ${f} at pixel ${p}: expected rgba(${expectedR},${expectedG},${expectedB},${expectedA}) but received rgba(${actualR},${actualG},${actualB},${actualA})`);
        }
      }
    }
  });

  it('5. Distribuciones Vertical, Horizontal y Grid con Columnas Variadas (1, 2, 5, 10)', () => {
    const W = 10;
    const H = 10;
    const framesCount = 10;
    const renderedFrames: RenderedFrame[] = Array.from({ length: framesCount }, (_, i) => ({
      frameId: `frame_${i}`,
      name: `Frame_${i + 1}`,
      durationMs: 100,
      pixels: new Array(W * H).fill('#ffffff'),
      width: W,
      height: H
    }));

    const mockRenderResult: RenderResult = {
      projectId: 'proj_test',
      projectName: 'Test Project',
      width: W,
      height: H,
      scale: 1,
      frames: renderedFrames,
      palette: [],
      statistics: {
        renderTimeMs: 10,
        framesRendered: framesCount,
        layersMerged: 1,
        pixelsProcessed: W * H * framesCount,
        pixelsWritten: W * H * framesCount,
        pixelsDiscarded: 0,
        scaleApplied: 1,
        cacheHit: false,
        cacheMiss: true
      },
      warnings: []
    };

    // 1 columna -> 10 filas
    const res1Col = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'grid', columns: 1, spacing: 0, margin: 0, transparent: true });
    expect(res1Col.meta.width).toBe(10);
    expect(res1Col.meta.height).toBe(100);

    // 2 columnas -> 5 filas
    const res2Col = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'grid', columns: 2, spacing: 0, margin: 0, transparent: true });
    expect(res2Col.meta.width).toBe(20);
    expect(res2Col.meta.height).toBe(50);

    // 5 columnas -> 2 filas
    const res5Col = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'grid', columns: 5, spacing: 0, margin: 0, transparent: true });
    expect(res5Col.meta.width).toBe(50);
    expect(res5Col.meta.height).toBe(20);

    // 10 columnas -> 1 fila
    const res10Col = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'grid', columns: 10, spacing: 0, margin: 0, transparent: true });
    expect(res10Col.meta.width).toBe(100);
    expect(res10Col.meta.height).toBe(10);

    // Tira horizontal explícita
    const resHoriz = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'horizontal', columns: 1, spacing: 2, margin: 1, transparent: true });
    expect(resHoriz.meta.width).toBe(2 * 1 + 10 * 10 + 9 * 2); // 2 + 100 + 18 = 120
    expect(resHoriz.meta.height).toBe(12);

    // Tira vertical explícita
    const resVert = buildSpriteSheetFromRenderResult(mockRenderResult, { layout: 'vertical', columns: 1, spacing: 2, margin: 1, transparent: true });
    expect(resVert.meta.width).toBe(12);
    expect(resVert.meta.height).toBe(120);
  });
});


