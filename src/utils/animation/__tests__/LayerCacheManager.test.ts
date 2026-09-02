import { describe, it, expect, beforeEach, vi } from 'vitest';

// Establish a robust globalThis.document mock for the Node testing environment
const createdCanvases: any[] = [];

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: (tagName: string) => {
      if (tagName === 'canvas') {
        const customCanvas = {
          getContext: vi.fn(() => ({
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            drawImage: vi.fn(),
            createImageData: vi.fn(() => ({ data: new Uint8Array(16) })),
            putImageData: vi.fn(),
          })),
          width: 0,
          height: 0,
        };
        createdCanvases.push(customCanvas);
        return customCanvas;
      }
      return {};
    }
  } as any;
}

import { layerCacheManager } from '../LayerCacheManager';
import { PixelProject } from '../../../types';

describe('LayerCacheManager tests', () => {
  beforeEach(() => {
    layerCacheManager.clear();
  });

  it('should successfully cache and retrieve layer canvases', () => {
    const pixels = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'];
    const canvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, 2, 2);

    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);

    const metrics1 = layerCacheManager.getMetrics();
    expect(metrics1.activeCanvasesCount).toBe(1);
    expect(metrics1.hits).toBe(0);
    expect(metrics1.misses).toBe(1);

    // Retrieve again with same reference
    const canvas2 = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, 2, 2);
    expect(canvas2).toBe(canvas);

    const metrics2 = layerCacheManager.getMetrics();
    expect(metrics2.hits).toBe(1);
    expect(metrics2.misses).toBe(1);
  });

  it('should reconstruct stale cache if pixel array reference changes', () => {
    const pixels1 = ['#ff0000', '#00ff00'];
    const pixels2 = ['#ff0000', '#ffffff']; // different content, new reference

    const canvas1 = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels1, 2, 1);
    const canvas2 = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels2, 2, 1);

    expect(canvas2).toBe(canvas1); // canvas is reused but reconstructed

    const metrics = layerCacheManager.getMetrics();
    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(2);
    expect(metrics.reconstructedCount).toBe(1);
  });

  it('should render to temp override canvas when overridePixels is provided', () => {
    const pixels = ['#ff0000', '#00ff00'];
    const overridePixels = ['#ffffff', '#000000'];

    const canvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, 2, 1);
    const overrideCanvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, 2, 1, overridePixels);

    expect(overrideCanvas).toBeDefined();
    expect(overrideCanvas).not.toBe(canvas);

    const metrics = layerCacheManager.getMetrics();
    // Cache stats for persistent entries should not be affected by overrides
    expect(metrics.activeCanvasesCount).toBe(1);
  });

  it('should prune cached entries of layers/frames that no longer exist', () => {
    const pixels = ['#ff0000', '#00ff00'];
    layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, 2, 1);
    layerCacheManager.getLayerCanvas('frame-2', 'layer-1', pixels, 2, 1);

    expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(2);

    // Create a mock PixelProject containing only frame-1 and layer-1
    const mockProject = {
      frames: [{ id: 'frame-1', name: 'Frame 1' }],
      layers: [{ id: 'layer-1', name: 'Layer 1', opacity: 100, visible: true, locked: false }],
    } as unknown as PixelProject;

    layerCacheManager.prune(mockProject);

    expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(1);
  });

  describe('Subfase C3.2 Stress Audit Suite', () => {
    it('Escenario 1: Large project simulation with loop playback', () => {
      const numFrames = 200;
      const numLayers = 4;
      const width = 16;
      const height = 16;
      const pixels = new Array(width * height).fill('#ffffff');

      // 1. Initial render of all frames & layers (warm up)
      for (let f = 0; f < numFrames; f++) {
        for (let l = 0; l < numLayers; l++) {
          layerCacheManager.getLayerCanvas(`frame-${f}`, `layer-${l}`, pixels, width, height);
        }
      }

      const metricsAfterWarmup = layerCacheManager.getMetrics();
      expect(metricsAfterWarmup.activeCanvasesCount).toBe(numFrames * numLayers); // 800 canvases
      const expectedMemory = numFrames * numLayers * width * height * 4;
      expect(metricsAfterWarmup.estimatedMemoryBytes).toBe(expectedMemory);

      // 2. Playback loop - play 10 times (2000 frame-ticks total)
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let f = 0; f < numFrames; f++) {
          for (let l = 0; l < numLayers; l++) {
            const canvas = layerCacheManager.getLayerCanvas(`frame-${f}`, `layer-${l}`, pixels, width, height);
            expect(canvas).toBeDefined();
          }
        }
      }

      const metricsAfterPlayback = layerCacheManager.getMetrics();
      // Verifies active canvases didn't grow, memory is perfectly stable, and hits increased enormously
      expect(metricsAfterPlayback.activeCanvasesCount).toBe(800);
      expect(metricsAfterPlayback.estimatedMemoryBytes).toBe(expectedMemory);
      expect(metricsAfterPlayback.hits).toBeGreaterThanOrEqual(8000);
    });

    it('Escenario 2: Continuous drawing simulation (thousands of modifications)', () => {
      const width = 16;
      const height = 16;
      let currentPixels = new Array(width * height).fill('#000000');

      // Simulate 500 consecutive paint/spray/stroke changes on the same layer
      for (let stroke = 0; stroke < 500; stroke++) {
        // Create a new array reference with modified pixel values (simulating standard immutability)
        const nextPixels = [...currentPixels];
        nextPixels[stroke % (width * height)] = '#ff0000';
        currentPixels = nextPixels;

        // Fetch layer canvas
        const canvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', currentPixels, width, height);
        expect(canvas).toBeDefined();
      }

      const metrics = layerCacheManager.getMetrics();
      // Since it's the exact same key, the number of cached canvases MUST be exactly 1!
      expect(metrics.activeCanvasesCount).toBe(1);
      expect(metrics.reconstructedCount).toBe(499); // 1 initial miss, 499 reconstructions
      expect(metrics.estimatedMemoryBytes).toBe(width * height * 4); // memory remains perfectly bounded!
    });

    it('Escenario 3: Multi-project switching, opening, and closing simulation', () => {
      const width = 8;
      const height = 8;
      const pixels = new Array(width * height).fill('');

      // 1. Load Project A: 50 frames, 2 layers
      for (let f = 0; f < 50; f++) {
        for (let l = 0; l < 2; l++) {
          layerCacheManager.getLayerCanvas(`projA-frame-${f}`, `projA-layer-${l}`, pixels, width, height);
        }
      }
      expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(100);

      // 2. Load Project B (user switches project): 30 frames, 3 layers
      for (let f = 0; f < 30; f++) {
        for (let l = 0; l < 3; l++) {
          layerCacheManager.getLayerCanvas(`projB-frame-${f}`, `projB-layer-${l}`, pixels, width, height);
        }
      }
      // Both projects are partially in cache
      expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(190);

      // 3. User closes Project A or switches completely to Project B. Pruning Project B keeps only active keys.
      const mockProjectB = {
        frames: Array.from({ length: 30 }, (_, idx) => ({ id: `projB-frame-${idx}`, name: `Frame ${idx}` })),
        layers: Array.from({ length: 3 }, (_, idx) => ({ id: `projB-layer-${idx}`, name: `Layer ${idx}`, opacity: 100, visible: true, locked: false })),
      } as unknown as PixelProject;

      layerCacheManager.prune(mockProjectB);

      // Project A canvases should be cleanly evicted, leaving only Project B (90 canvases)
      expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(90);

      // 4. Closing the remaining project and cleaning up
      layerCacheManager.clear();
      expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(0);
      expect(layerCacheManager.getMetrics().estimatedMemoryBytes).toBe(0);
    });

    it('Escenario 4: Interaction with high-frequency tools, transforms, and undo/redo', () => {
      const width = 16;
      const height = 16;
      const pixels = new Array(width * height).fill('#000000');
      const tempTransformPixels = new Array(width * height).fill('#ff00aa');

      // 1. Initial render
      const originalCanvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', pixels, width, height);

      // 2. Active selection/transform dragging generates continuous previews
      for (let dragStep = 0; dragStep < 100; dragStep++) {
        const previewCanvas = layerCacheManager.getLayerCanvas(
          'frame-1',
          'layer-1',
          pixels,
          width,
          height,
          tempTransformPixels
        );
        expect(previewCanvas).not.toBe(originalCanvas);
      }

      // Stored canvases count must still be exactly 1
      expect(layerCacheManager.getMetrics().activeCanvasesCount).toBe(1);

      // 3. Undo/Redo trigger
      // On Undo/Redo, the underlying pixel array changes. We get the canvas with the old array reference.
      const revertedPixels = [...pixels];
      const revertedCanvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', revertedPixels, width, height);
      expect(revertedCanvas).toBe(originalCanvas); // Canvas instance is reused
      expect(layerCacheManager.getMetrics().reconstructedCount).toBe(1);
    });

    it('Escenario 5: Cohesive cache sharing across Onion Skin, Playback, and Exporters', () => {
      const width = 16;
      const height = 16;
      const frame1Pixels = new Array(width * height).fill('#ffffff');
      const frame2Pixels = new Array(width * height).fill('#000000');

      // 1. Render Frame 2 (main edit frame)
      const mainCanvas = layerCacheManager.getLayerCanvas('frame-2', 'layer-1', frame2Pixels, width, height);

      // 2. Onion Skin requests Frame 1 (previous frame) and Frame 2 (main)
      const onionPrevCanvas = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', frame1Pixels, width, height);
      const onionCurrentCanvas = layerCacheManager.getLayerCanvas('frame-2', 'layer-1', frame2Pixels, width, height);

      expect(onionCurrentCanvas).toBe(mainCanvas); // Onion skin correctly reuses current frame canvas

      // 3. Exporter requests Frame 1 and Frame 2
      const exportCanvas1 = layerCacheManager.getLayerCanvas('frame-1', 'layer-1', frame1Pixels, width, height);
      const exportCanvas2 = layerCacheManager.getLayerCanvas('frame-2', 'layer-1', frame2Pixels, width, height);

      expect(exportCanvas1).toBe(onionPrevCanvas);
      expect(exportCanvas2).toBe(mainCanvas);

      // Check hits
      const metrics = layerCacheManager.getMetrics();
      expect(metrics.activeCanvasesCount).toBe(2);
      expect(metrics.hits).toBe(3); // onionCurrentCanvas, exportCanvas1, exportCanvas2
    });
  });

  describe('Frame Composite Cache', () => {
    it('should successfully build and retrieve composited frame canvases', () => {
      const layers = [
        { id: 'layer-1', name: 'Layer 1', opacity: 100, visible: true, locked: false },
        { id: 'layer-2', name: 'Layer 2', opacity: 50, visible: true, locked: false },
      ];
      const pixels = {
        'frame-1': {
          'layer-1': ['#ff0000', '#000000'],
          'layer-2': ['#000000', '#0000ff'],
        }
      };

      const canvas = layerCacheManager.getFrameCompositeCanvas('frame-1', layers, pixels, 2, 2);
      expect(canvas).toBeDefined();

      const metrics = layerCacheManager.getMetrics();
      expect(metrics.activeFrameCompositesCount).toBe(1);

      // Re-retrieval without changes should result in a cache hit
      const canvas2 = layerCacheManager.getFrameCompositeCanvas('frame-1', layers, pixels, 2, 2);
      expect(canvas2).toBe(canvas);
      expect(layerCacheManager.getMetrics().hits).toBe(1);
    });

    it('should invalidate and rebuild when a layer pixel array reference changes', () => {
      const layers = [
        { id: 'layer-1', name: 'Layer 1', opacity: 100, visible: true, locked: false },
      ];
      let layer1Pixels = ['#ff0000'];
      const pixels = {
        'frame-1': {
          'layer-1': layer1Pixels,
        }
      };

      const canvas1 = layerCacheManager.getFrameCompositeCanvas('frame-1', layers, pixels, 1, 1);
      
      // Mutate pixels (recreate array to simulate standard immutable state updates)
      const nextPixels = ['#00ff00'];
      pixels['frame-1']['layer-1'] = nextPixels;

      const canvas2 = layerCacheManager.getFrameCompositeCanvas('frame-1', layers, pixels, 1, 1);
      expect(canvas2).toBe(canvas1); // Keeps the same canvas element instance, but rebuilt!
    });
  });
});

