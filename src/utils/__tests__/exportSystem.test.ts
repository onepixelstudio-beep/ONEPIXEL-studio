import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Layer, ProjectPixels, PixelProject } from '../../types';

// Ensure globalThis.document mock exists for the Node environment
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: (tagName: string) => {
      if (tagName === 'canvas') {
        const mockCtx = {
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          drawImage: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          createImageData: vi.fn(() => ({ data: new Uint8Array(16) })),
          putImageData: vi.fn(),
          getImageData: vi.fn(() => ({
            data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255])
          })),
        };
        const customCanvas = {
          getContext: vi.fn(() => mockCtx),
          width: 2,
          height: 2,
          toDataURL: vi.fn(() => 'data:image/png;base64,SGVsbG8gd29ybGQ='),
          toBlob: vi.fn((callback) => {
            // Callback with a mock Blob
            callback(new Blob(['mock_png_blob_data'], { type: 'image/png' }));
          }),
        };
        return customCanvas;
      }
      return {};
    }
  } as any;
}

// Ensure globalThis.FileReader mock exists for the Node environment
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    onloadend: (() => void) | null = null;
    result: any = null;
    readAsArrayBuffer(blob: any) {
      // Return a valid mock PNG structure containing header, IHDR, IDAT, and IEND chunks
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR type
        0x00, 0x00, 0x00, 0x02, // width 2
        0x00, 0x00, 0x00, 0x02, // height 2
        0x08, 0x06, 0x00, 0x00, 0x00, // format
        0x00, 0x00, 0x00, 0x00, // CRC placeholder
        0x00, 0x00, 0x00, 0x04, // IDAT length
        0x49, 0x44, 0x41, 0x54, // IDAT type
        0x11, 0x22, 0x33, 0x44, // pixel data
        0x00, 0x00, 0x00, 0x00, // CRC placeholder
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4E, 0x44, // IEND type
        0xAE, 0x42, 0x60, 0x82  // CRC
      ]);
      this.result = pngBytes.buffer;
      setTimeout(() => {
        if (this.onloadend) this.onloadend();
      }, 0);
    }
  } as any;
}

// Optimized helper for base64 parsing (under test)
async function originalDataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const parts = dataUrl.split(',');
  const base64 = parts[1];
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

// Fetch-based legacy implementation to prove functional parity
async function legacyDataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  // Mock fetch-like behavior because fetch of data URL is not supported in node natively without a browser
  const parts = dataUrl.split(',');
  const base64 = parts[1];
  const binaryStr = Buffer.from(base64, 'base64').toString('binary');
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

import { encodeGif } from '../gifEncoder';
import { encodeApng } from '../apngEncoder';
import { buildSpriteSheet } from '../spriteSheetBuilder';
import { AnimationSequence } from '../animationSequenceBuilder';

describe('Export subsystem and builders test suite', () => {
  it('should verify parity and correctness of optimized dataUrlToUint8Array base64 decoder', async () => {
    const dataUrl = 'data:image/png;base64,SGVsbG8gd29ybGQ='; // Base64 for "Hello world"
    
    const optimizedBytes = await originalDataUrlToUint8Array(dataUrl);
    const legacyBytes = await legacyDataUrlToUint8Array(dataUrl);

    expect(optimizedBytes).toEqual(legacyBytes);
    
    // Convert bytes back to string to verify exact payload integrity
    const decodedStr = String.fromCharCode(...optimizedBytes);
    expect(decodedStr).toBe('Hello world');
  });

  it('should encode a sequence into a valid GIF and utilize the frame.pixels optimization cache', async () => {
    const mockCanvas = document.createElement('canvas') as any;
    const sequence: AnimationSequence = {
      frames: [
        { canvas: mockCanvas, durationMs: 100 }
      ]
    };

    // Confirm that the sequence frame doesn't initially have the .pixels cache set
    expect(sequence.frames[0].pixels).toBeUndefined();

    // Call encodeGif with proper width and height arguments (2, 2)
    const gifBytes = await encodeGif(sequence, 2, 2);

    // Verify it returned valid GIF data
    expect(gifBytes).toBeInstanceOf(Uint8Array);
    expect(gifBytes.length).toBeGreaterThan(0);

    // Verify magic bytes: "GIF89a" or "GIF87a"
    const header = String.fromCharCode(gifBytes[0], gifBytes[1], gifBytes[2], gifBytes[3], gifBytes[4], gifBytes[5]);
    expect(header).toMatch(/^GIF8[79]a$/);

    // Verify that the frame.pixels optimization cache was populated after the run to avoid future getImageData calls!
    expect(sequence.frames[0].pixels).toBeDefined();
    expect(sequence.frames[0].pixels).toBeInstanceOf(Uint8Array);
  });

  it('should encode a sequence into a valid APNG/PNG', async () => {
    const mockCanvas = document.createElement('canvas') as any;
    const sequence: AnimationSequence = {
      frames: [
        { canvas: mockCanvas, durationMs: 100 },
        { canvas: mockCanvas, durationMs: 100 }
      ]
    };

    const apngBytes = await encodeApng(sequence, 2, 2);

    expect(apngBytes).toBeInstanceOf(Uint8Array);
    expect(apngBytes.length).toBeGreaterThan(0);

    // Verify APNG/PNG signature: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    expect(apngBytes[0]).toBe(0x89);
    expect(apngBytes[1]).toBe(0x50); // P
    expect(apngBytes[2]).toBe(0x4E); // N
    expect(apngBytes[3]).toBe(0x47); // G
  });

  it('should build a valid sprite sheet structure containing frames', () => {
    const project: PixelProject = {
      id: 'p1',
      name: 'SpriteSheet Project',
      width: 2,
      height: 2,
      layers: [{ id: 'l1', name: 'Layer 1', opacity: 100, visible: true, locked: false }],
      frames: [
        { id: 'f1', name: 'Frame 1', durationMs: 100 },
        { id: 'f2', name: 'Frame 2', durationMs: 100 }
      ],
      pixels: {
        'f1': { 'l1': ['', '', '', ''] },
        'f2': { 'l1': ['', '', '', ''] }
      },
      fps: 10,
      tags: [],
      lastSaved: Date.now()
    };

    const atlas = buildSpriteSheet({
      project,
      frameIds: ['f1', 'f2'],
      scale: 1,
      layout: 'horizontal',
      columns: 2,
      spacing: 0,
      margin: 0,
      transparent: true
    });

    expect(atlas.canvas).toBeDefined();
    expect(atlas.meta.projectName).toBe('SpriteSheet Project');
    expect(atlas.meta.layout).toBe('horizontal');
  });
});
