import { describe, it, expect } from 'vitest';
import { FrameService } from '../FrameService';
import { Frame, Layer, ProjectPixels } from '../../../types';

describe('FrameService', () => {
  const mockLayers: Layer[] = [
    { id: 'layer-1', name: 'Capa 1', opacity: 100, visible: true, locked: false },
    { id: 'layer-2', name: 'Capa 2', opacity: 100, visible: true, locked: false }
  ];

  it('should generate a blank pixel array of specified size', () => {
    const pixels = FrameService.createBlankLayerPixels(4, 4);
    expect(pixels).toHaveLength(16);
    expect(pixels.every(p => p === '')).toBe(true);
  });

  it('should insert a blank frame at a specific index', () => {
    const frames: Frame[] = [{ id: 'frame-1', name: 'Frame 1', durationMs: 120 }];
    const pixels: ProjectPixels = {
      'frame-1': {
        'layer-1': ['#ff0000'],
        'layer-2': ['#00ff00']
      }
    };

    const result = FrameService.insertAt(
      frames,
      pixels,
      mockLayers,
      1,
      'frame-2',
      'Frame 2',
      1,
      1,
      100
    );

    expect(result.frames).toHaveLength(2);
    expect(result.frames[0]).toEqual({ id: 'frame-1', name: 'Frame 1', durationMs: 120 });
    expect(result.frames[1]).toEqual({ id: 'frame-2', name: 'Frame 2', durationMs: 100 });

    // Verify new frame's pixels are initialized with empty strings
    expect(result.pixels['frame-2']['layer-1']).toEqual(['']);
    expect(result.pixels['frame-2']['layer-2']).toEqual(['']);
    // Verify existing frame's pixels are preserved
    expect(result.pixels['frame-1']['layer-1']).toEqual(['#ff0000']);
  });

  it('should delete a frame and its pixels', () => {
    const frames: Frame[] = [
      { id: 'frame-1', name: 'Frame 1' },
      { id: 'frame-2', name: 'Frame 2' }
    ];
    const pixels: ProjectPixels = {
      'frame-1': { 'layer-1': ['#ff0000'] },
      'frame-2': { 'layer-1': ['#0000ff'] }
    };

    const result = FrameService.deleteAt(frames, pixels, 0);

    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].id).toBe('frame-2');
    expect(result.pixels['frame-1']).toBeUndefined();
    expect(result.pixels['frame-2']).toBeDefined();
  });

  it('should not delete the only remaining frame', () => {
    const frames: Frame[] = [{ id: 'frame-1', name: 'Frame 1' }];
    const pixels: ProjectPixels = { 'frame-1': { 'layer-1': ['#ff0000'] } };

    const result = FrameService.deleteAt(frames, pixels, 0);
    expect(result.frames).toHaveLength(1);
    expect(result.pixels['frame-1']).toBeDefined();
  });

  it('should duplicate a frame making a deep copy of its pixels', () => {
    const frames: Frame[] = [
      { id: 'frame-1', name: 'Frame 1', durationMs: 150 }
    ];
    const pixels: ProjectPixels = {
      'frame-1': {
        'layer-1': ['#ff0000']
      }
    };

    const result = FrameService.duplicateAt(
      frames,
      pixels,
      0,
      'frame-1-dup',
      'Copia de Frame 1'
    );

    expect(result.frames).toHaveLength(2);
    expect(result.frames[0].id).toBe('frame-1');
    expect(result.frames[1].id).toBe('frame-1-dup');
    expect(result.frames[1].durationMs).toBe(150);

    // Deep copy checks
    expect(result.pixels['frame-1-dup']['layer-1']).toEqual(['#ff0000']);
    expect(result.pixels['frame-1-dup']['layer-1']).not.toBe(pixels['frame-1']['layer-1']); // reference check
  });

  it('should reorder a frame inside the frames list', () => {
    const frames: Frame[] = [
      { id: 'frame-1', name: 'Frame 1' },
      { id: 'frame-2', name: 'Frame 2' },
      { id: 'frame-3', name: 'Frame 3' }
    ];

    const reordered = FrameService.move(frames, 0, 2);

    expect(reordered).toHaveLength(3);
    expect(reordered[0].id).toBe('frame-2');
    expect(reordered[1].id).toBe('frame-3');
    expect(reordered[2].id).toBe('frame-1');
  });
});
