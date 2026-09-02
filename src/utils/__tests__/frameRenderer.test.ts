import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Layer, ProjectPixels } from '../../types';

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

import { drawFrameOnCanvas, getTintedFrameCanvas } from '../frameRenderer';

describe('frameRenderer tests', () => {
  let mockCtx: any;

  beforeEach(() => {
    createdCanvases.length = 0; // reset tracked creations

    mockCtx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8Array(16) })),
      putImageData: vi.fn(),
      imageSmoothingEnabled: false,
    };
  });

  it('should successfully call drawing operations and utilize cached offscreen canvases', () => {
    const layers: Layer[] = [
      { id: 'l1', name: 'Capa 1', opacity: 100, visible: true, locked: false }
    ];

    const pixels: ProjectPixels = {
      'f1': {
        'l1': ['#ffffff', '#000000', '', '']
      }
    };

    // 1. First render: this should populate the cached offscreen canvases
    drawFrameOnCanvas(
      mockCtx,
      'f1',
      2,
      2,
      10, // scale
      layers,
      pixels
    );

    // Canvases must be created during the initial setup
    const initialCreationsCount = createdCanvases.length;
    expect(initialCreationsCount).toBeGreaterThan(0);

    // Reset tracked creations to monitor second render
    createdCanvases.length = 0;

    // 2. Second render: this should reuse the cached offscreen canvases completely
    drawFrameOnCanvas(
      mockCtx,
      'f1',
      2,
      2,
      10, // scale
      layers,
      pixels
    );

    // Verified that ZERO new canvases were created (they were perfectly reused!)
    expect(createdCanvases.length).toBe(0);
  });

  it('should generate a tinted canvas for onion skin rendering and support both tintMode configurations', () => {
    const layers: Layer[] = [
      { id: 'l1', name: 'Capa 1', opacity: 100, visible: true, locked: false }
    ];

    const pixels: ProjectPixels = {
      'f1': {
        'l1': ['#ffffff', '#000000', '', '']
      }
    };

    // Test with tintMode = true
    const tintedCanvasTrue = getTintedFrameCanvas(
      2,
      2,
      'f1',
      layers,
      pixels,
      '#ff0000',
      true
    );
    expect(tintedCanvasTrue).toBeDefined();

    // Test with tintMode = false
    const tintedCanvasFalse = getTintedFrameCanvas(
      2,
      2,
      'f1',
      layers,
      pixels,
      '#00ff00',
      false
    );
    expect(tintedCanvasFalse).toBeDefined();
  });
});
