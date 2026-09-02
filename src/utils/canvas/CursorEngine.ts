// CursorEngine.ts - Modular cursor styling logic for OnePixel Studio

export type TransformHandleType = 'pivot' | 'rot' | 'tl' | 'br' | 'tr' | 'bl' | 'tc' | 'bc' | 'lc' | 'rc' | 'bounds' | null;

/**
 * Calculates the appropriate cursor CSS class based on active tool / transform handles
 */
export function getCursorClass(
  transformActive: boolean,
  activeHandle: TransformHandleType,
  hoveredHandle: TransformHandleType
): string {
  if (transformActive) {
    const h = activeHandle || hoveredHandle;
    if (h) {
      if (h === 'pivot') return 'cursor-move';
      if (h === 'rot') return 'cursor-crosshair';
      if (h === 'tl' || h === 'br') return 'cursor-nwse-resize';
      if (h === 'tr' || h === 'bl') return 'cursor-nesw-resize';
      if (h === 'tc' || h === 'bc') return 'cursor-ns-resize';
      if (h === 'lc' || h === 'rc') return 'cursor-ew-resize';
      if (h === 'bounds') return 'cursor-move';
    }
    return 'cursor-default';
  }
  return 'cursor-crosshair';
}
