import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreRenderProcessor } from '../../canvas/CoreRenderProcessor';
import { RenderCache } from '../RenderCache';
import { PixelProject } from '../../../types';
import { FrameBuffer } from '../../canvas/FrameBuffer';
import { RenderContext } from '../../canvas/RenderContext';
import { RenderPassRegistry } from '../../canvas/RenderPassRegistry';

describe('Phase 9.2: CoreRenderProcessor (Mathematical Engine)', () => {
  beforeEach(() => {
    RenderCache.invalidate();
  });

  const testProject: PixelProject = {
    id: 'render-test-project',
    name: 'Cosmic Star',
    width: 2,
    height: 2,
    fps: 10,
    tags: [],
    frames: [
      { id: 'f1', name: 'Frame 1', durationMs: 120 },
      { id: 'f2', name: 'Frame 2', durationMs: 150 },
    ],
    layers: [
      { id: 'l_top', name: 'Foreground', visible: true, opacity: 50, locked: false },
      { id: 'l_bot', name: 'Background', visible: true, opacity: 100, locked: false },
    ],
    pixels: {
      f1: {
        l_top: ['#ff0000', 'transparent', 'transparent', '#00ff00'],
        l_bot: ['#0000ff', '#0000ff', '#0000ff', '#0000ff'],
      },
      f2: {
        l_top: ['transparent', 'transparent', 'transparent', 'transparent'],
        l_bot: ['transparent', 'transparent', 'transparent', 'transparent'],
      },
    },
    lastSaved: 12345,
  };

  it('should successfully merge visible layers with correct opacity alpha blending', async () => {
    const result = await CoreRenderProcessor.render(testProject, { scale: 1 });

    expect(result.projectId).toBe('render-test-project');
    expect(result.projectName).toBe('Cosmic Star');
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.frames).toHaveLength(2);

    // Frame 1 check
    const frame1 = result.frames[0];
    expect(frame1.frameId).toBe('f1');
    expect(frame1.durationMs).toBe(120);

    // Pixel 0 is l_top (#ff0000, alpha 0.5) over l_bot (#0000ff, alpha 1.0)
    // Red channel: src.r * src.a + dst.r * dst.a * (1 - src.a) = 255 * 0.5 + 0 * 1 * 0.5 = 127.5 -> 128
    // Blue channel: src.b * src.a + dst.b * dst.a * (1 - src.a) = 0 * 0.5 + 255 * 1 * 0.5 = 127.5 -> 128
    // Blended hex should be close to #800080 (which is purple)
    expect(frame1.pixels[0]).toBe('#800080');

    // Pixel 1 is transparent l_top over #0000ff l_bot -> should be #0000ff
    expect(frame1.pixels[1]).toBe('#0000ff');

    // Pixel 3 is l_top (#00ff00, alpha 0.5) over l_bot (#0000ff, alpha 1.0)
    // Green: 255 * 0.5 = 128, Blue: 255 * 0.5 = 128 -> #008080 (teal)
    expect(frame1.pixels[3]).toBe('#008080');
  });

  it('should skip hidden layers in composition', async () => {
    const hiddenLayerProj: PixelProject = {
      ...testProject,
      layers: [
        { id: 'l_top', name: 'Foreground', visible: false, opacity: 100, locked: false },
        { id: 'l_bot', name: 'Background', visible: true, opacity: 100, locked: false },
      ],
    };

    const result = await CoreRenderProcessor.render(hiddenLayerProj, { scale: 1 });
    // Top layer is hidden, so only bottom layer is rendered (#0000ff)
    expect(result.frames[0].pixels[0]).toBe('#0000ff');
  });

  it('should support solid background color fill pass', async () => {
    const result = await CoreRenderProcessor.render(testProject, {
      scale: 1,
      bgColor: '#ffffff',
    });

    // Frame 2 has only transparent pixels. With bgColor = '#ffffff', it should be filled with '#ffffff'
    const frame2 = result.frames[1];
    expect(frame2.pixels[0]).toBe('#ffffff');
    expect(frame2.pixels[1]).toBe('#ffffff');
  });

  it('should compile an info warning for empty frames', async () => {
    const result = await CoreRenderProcessor.render(testProject, { scale: 1 });
    const emptyWarning = result.warnings.find((w) => w.code === 'EMPTY_FRAME');
    expect(emptyWarning).toBeDefined();
    expect(emptyWarning?.severity).toBe('info');
  });

  it('should support cropping bounding box pass', async () => {
    const result = await CoreRenderProcessor.render(testProject, {
      scale: 1,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    });

    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(result.frames[0].pixels).toHaveLength(1);
    expect(result.frames[0].pixels[0]).toBe('#800080');
  });

  it('should support padding pass', async () => {
    const result = await CoreRenderProcessor.render(testProject, {
      scale: 1,
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    // Original is 2x2. Padded with 1 on all sides -> new width/height = 2 + 1 + 1 = 4
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expect(result.frames[0].pixels).toHaveLength(16);

    // Pixel at (1, 1) inside new frame represents the original (0,0) pixel -> #800080
    // destIndex = destY * newWidth + destX = 1 * 4 + 1 = 5
    expect(result.frames[0].pixels[5]).toBe('#800080');
    // Boundary pixel should be transparent
    expect(result.frames[0].pixels[0]).toBe('transparent');
  });

  it('should support Nearest-Neighbor scaling pass', async () => {
    const result = await CoreRenderProcessor.render(testProject, {
      scale: 3,
    });

    // Original is 2x2. Scaled by 3 -> new width/height = 6x6
    expect(result.width).toBe(6);
    expect(result.height).toBe(6);
    expect(result.frames[0].pixels).toHaveLength(36);

    // The pixel at (0,0) was #800080. In 6x6, the top-left 3x3 block should all be #800080
    expect(result.frames[0].pixels[0]).toBe('#800080');
    expect(result.frames[0].pixels[1]).toBe('#800080');
    expect(result.frames[0].pixels[2]).toBe('#800080');
    expect(result.frames[0].pixels[6]).toBe('#800080'); // row 1, col 0
  });

  it('should cache and reuse pre-render composition results', async () => {
    const renderSpy = vi.spyOn(RenderCache, 'get');

    const result1 = await CoreRenderProcessor.render(testProject, { scale: 2 });
    expect(result1.statistics.cacheHit).toBe(false);
    expect(result1.statistics.cacheMiss).toBe(true);

    const result2 = await CoreRenderProcessor.render(testProject, { scale: 2 });
    expect(result2.statistics.cacheHit).toBe(true);
    expect(result2.statistics.cacheMiss).toBe(false);
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should execute lifecycle mathematical hooks correctly during render passes', async () => {
    const beforeRenderHook = vi.fn();
    const beforeFrameHook = vi.fn();
    const afterFrameHook = vi.fn();
    const afterRenderHook = vi.fn();

    await CoreRenderProcessor.render(testProject, {
      scale: 1,
      hooks: {
        beforeRender: beforeRenderHook,
        beforeFrame: beforeFrameHook,
        afterFrame: afterFrameHook,
        afterRender: afterRenderHook,
      },
    });

    expect(beforeRenderHook).toHaveBeenCalled();
    expect(beforeFrameHook).toHaveBeenCalledTimes(2);
    expect(afterFrameHook).toHaveBeenCalledTimes(2);
    expect(afterRenderHook).toHaveBeenCalled();
  });

  it('should throw Error if validation fails on negative settings', async () => {
    await expect(
      CoreRenderProcessor.render(testProject, {
        padding: { top: -1, right: 0, bottom: 0, left: 0 },
      })
    ).rejects.toThrow();
  });

  it('should allow custom pass registration in RenderPassRegistry and execute it in pipeline', async () => {
    const registry = RenderPassRegistry.getInstance();
    
    // Create a custom mock pass that shifts all pixel values to red '#ff0000'
    const customPass = {
      id: 'custom-red-shift',
      execute: (fb: FrameBuffer, context: RenderContext) => {
        const shifted = fb.pixels.map(() => '#ff0000');
        return fb.clone({ pixels: shifted });
      },
    };

    // Register our custom pass at the very end
    registry.register(customPass);

    try {
      const result = await CoreRenderProcessor.render(testProject, { scale: 1 });
      // Because our custom pass shifts all pixels to #ff0000, all output pixels must be #ff0000
      expect(result.frames[0].pixels[0]).toBe('#ff0000');
      expect(result.frames[0].pixels[1]).toBe('#ff0000');
    } finally {
      // Always reset back to default standard passes after test to avoid side effects
      registry.reset();
    }
  });

  it('should verify FrameBuffer clone functionality and metadata propagation', () => {
    const fb = new FrameBuffer(2, 2, ['#ffffff', '#000000'], 0, 0, { key: 'val' });
    const cloned = fb.clone({ originX: 5 });
    
    expect(cloned.width).toBe(2);
    expect(cloned.originX).toBe(5);
    expect(cloned.metadata.key).toBe('val');
  });
});
