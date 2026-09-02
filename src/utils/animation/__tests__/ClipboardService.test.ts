import { describe, it, expect } from 'vitest';
import { ClipboardService } from '../ClipboardService';
import { Frame, ProjectPixels } from '../../../types';

describe('ClipboardService', () => {
  const createMockFrames = (): Frame[] => [
    { id: 'f1', name: 'Frame 1', durationMs: 100 },
    { id: 'f2', name: 'Frame 2', durationMs: 150 },
    { id: 'f3', name: 'Frame 3', durationMs: 200 }
  ];

  const createMockPixels = (): ProjectPixels => ({
    'f1': { 'l1': ['#ff0000', '#00ff00'] },
    'f2': { 'l1': ['#0000ff', '#ffffff'] },
    'f3': { 'l1': ['#000000', '#aaaaaa'] }
  });

  it('should initially have no content and can be cleared', () => {
    ClipboardService.clear();
    expect(ClipboardService.hasContent()).toBe(false);
  });

  it('should copy frame metadata and pixel data and report content', () => {
    const frames = createMockFrames();
    const pixels = createMockPixels();

    // Copy frames at index 0 and 2
    ClipboardService.copy(frames, pixels, [0, 2]);

    expect(ClipboardService.hasContent()).toBe(true);

    // Let's paste them
    let idCounter = 0;
    const generateId = () => `pasted-${++idCounter}`;

    const pasteResult = ClipboardService.paste(frames, pixels, 1, generateId);
    expect(pasteResult).not.toBeNull();
    if (pasteResult) {
      expect(pasteResult.frames).toHaveLength(5);
      // index 1 and 2 should be the pasted ones
      expect(pasteResult.frames[1].id).toBe('pasted-1');
      expect(pasteResult.frames[1].name).toBe('Frame 1_Paste');
      expect(pasteResult.frames[1].durationMs).toBe(100);

      expect(pasteResult.frames[2].id).toBe('pasted-2');
      expect(pasteResult.frames[2].name).toBe('Frame 3_Paste');
      expect(pasteResult.frames[2].durationMs).toBe(200);

      // Verify pixel data deep copies
      expect(pasteResult.pixels['pasted-1']?.['l1']).toEqual(['#ff0000', '#00ff00']);
      expect(pasteResult.pixels['pasted-2']?.['l1']).toEqual(['#000000', '#aaaaaa']);

      // Original frames are at correct locations
      expect(pasteResult.frames[0].id).toBe('f1');
      expect(pasteResult.frames[3].id).toBe('f2');
      expect(pasteResult.frames[4].id).toBe('f3');
    }
  });

  it('should clear clipboard content successfully', () => {
    const frames = createMockFrames();
    const pixels = createMockPixels();

    ClipboardService.copy(frames, pixels, [0]);
    expect(ClipboardService.hasContent()).toBe(true);

    ClipboardService.clear();
    expect(ClipboardService.hasContent()).toBe(false);

    const pasteResult = ClipboardService.paste(frames, pixels, 0, () => 'new');
    expect(pasteResult).toBeNull();
  });
});
