import { describe, it, expect } from 'vitest';
import { 
  getSelectionBounds, 
  extractSelectionBuffers, 
  forwardTransform, 
  backwardTransform, 
  transformPixels 
} from '../transformUtils';

describe('Transform Utilities', () => {
  describe('getSelectionBounds', () => {
    it('should correctly calculate bounds of a selected region', () => {
      // 4x4 canvas: width=4, height=4
      // Select pixels at index 5 (1,1) and 10 (2,2)
      const pixels = new Array(16).fill(false);
      pixels[5] = true;
      pixels[10] = true;

      const bounds = getSelectionBounds(pixels, 4, 4);
      expect(bounds).not.toBeNull();
      expect(bounds).toEqual({
        x: 1,
        y: 1,
        width: 2,
        height: 2
      });
    });

    it('should return null when there are no selected pixels', () => {
      const pixels = new Array(16).fill(false);
      const bounds = getSelectionBounds(pixels, 4, 4);
      expect(bounds).toBeNull();
    });
  });

  describe('extractSelectionBuffers', () => {
    it('should extract correct local pixel and mask buffers', () => {
      // 4x4 canvas
      const layerPixels = [
        '', '', '', '',
        '', 'red', 'green', '',
        '', 'blue', 'yellow', '',
        '', '', '', ''
      ];
      const selectionPixels = [
        false, false, false, false,
        false, true, true, false,
        false, true, true, false,
        false, false, false, false
      ];
      const bounds = { x: 1, y: 1, width: 2, height: 2 };

      const { pixelBuffer, maskBuffer } = extractSelectionBuffers(
        layerPixels,
        selectionPixels,
        bounds,
        4
      );

      expect(pixelBuffer).toEqual(['red', 'green', 'blue', 'yellow']);
      expect(maskBuffer).toEqual([true, true, true, true]);
    });
  });

  describe('Coordinate Transforms (forward & backward)', () => {
    it('should be mathematical inverses for scaling and translation', () => {
      const pivot = { x: 2, y: 2 };
      const scale = { x: 2.0, y: 1.5 };
      const translation = { x: 3, y: -1 };
      const rotation = 0; // No rotation for simple scale inverse test

      const testPt = { x: 1, y: 3 };

      const forward = forwardTransform(testPt.x, testPt.y, pivot, scale, translation, rotation);
      const backward = backwardTransform(forward.x, forward.y, pivot, scale, translation, rotation);

      expect(backward.x).toBeCloseTo(testPt.x, 5);
      expect(backward.y).toBeCloseTo(testPt.y, 5);
    });

    it('should be mathematical inverses with rotation, scale, and translation', () => {
      const pivot = { x: 10, y: 12 };
      const scale = { x: 1.8, y: 0.5 };
      const translation = { x: -4, y: 8 };
      const rotation = Math.PI / 6; // 30 degrees

      const testPt = { x: 8, y: 15 };

      const forward = forwardTransform(testPt.x, testPt.y, pivot, scale, translation, rotation);
      const backward = backwardTransform(forward.x, forward.y, pivot, scale, translation, rotation);

      expect(backward.x).toBeCloseTo(testPt.x, 5);
      expect(backward.y).toBeCloseTo(testPt.y, 5);
    });
  });

  describe('transformPixels', () => {
    it('should perform translation without gaps or interpolation', () => {
      const bounds = { x: 1, y: 1, width: 2, height: 2 };
      const pivot = { x: 2, y: 2 };
      const translation = { x: 1, y: 1 }; // Shift 1 right, 1 down
      const scale = { x: 1, y: 1 };
      const rotation = 0;
      const pixelBuffer = ['red', 'green', 'blue', 'yellow'];
      const maskBuffer = [true, true, true, true];

      const { pixels, mask } = transformPixels(
        bounds,
        pivot,
        translation,
        scale,
        rotation,
        pixelBuffer,
        maskBuffer,
        4,
        4
      );

      // Original bounds at (1,1)-(2,2) translated by (1,1) -> (2,2)-(3,3)
      // Indexes of 4x4:
      // (2,2) -> index 10 => 'red'
      // (3,2) -> index 11 => 'green'
      // (2,3) -> index 14 => 'blue'
      // (3,3) -> index 15 => 'yellow'

      expect(pixels[10]).toBe('red');
      expect(pixels[11]).toBe('green');
      expect(pixels[14]).toBe('blue');
      expect(pixels[15]).toBe('yellow');

      expect(mask[10]).toBe(true);
      expect(mask[11]).toBe(true);
      expect(mask[14]).toBe(true);
      expect(mask[15]).toBe(true);

      // Verify no other pixels are set
      const activePixelsCount = pixels.filter(p => p !== '').length;
      expect(activePixelsCount).toBe(4);
    });

    it('should scale up correctly using nearest neighbor logic (no interpolation)', () => {
      const bounds = { x: 0, y: 0, width: 1, height: 1 };
      const pivot = { x: 0, y: 0 };
      const translation = { x: 0, y: 0 };
      const scale = { x: 2, y: 2 }; // Scale 1x1 to 2x2
      const rotation = 0;
      const pixelBuffer = ['purple'];
      const maskBuffer = [true];

      const { pixels, mask } = transformPixels(
        bounds,
        pivot,
        translation,
        scale,
        rotation,
        pixelBuffer,
        maskBuffer,
        4,
        4
      );

      // 1x1 at 0,0 scaled 2x from pivot 0,0 -> occupies tx=0,1 and ty=0,1
      // 4x4 canvas indices: 0 (0,0), 1 (1,0), 4 (0,1), 5 (1,1)
      expect(pixels[0]).toBe('purple');
      expect(pixels[1]).toBe('purple');
      expect(pixels[4]).toBe('purple');
      expect(pixels[5]).toBe('purple');

      const count = pixels.filter(p => p === 'purple').length;
      expect(count).toBe(4);
    });
  });
});
