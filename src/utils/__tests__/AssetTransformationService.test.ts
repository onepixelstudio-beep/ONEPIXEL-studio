import { describe, it, expect } from 'vitest';
import {
  AssetTransformationService,
  TransformationPipeline,
  RotateOperation,
  FlipHorizontalOperation,
  FlipVerticalOperation,
  ScaleOperation
} from '../resources/AssetTransformationService';

describe('AssetTransformationService', () => {
  // Simple 2x3 test grid:
  // r g b
  // y m c
  const testPixels = [
    'red', 'green', 'blue',
    'yellow', 'magenta', 'cyan'
  ];
  const width = 3;
  const height = 2;

  describe('rotate90', () => {
    it('should rotate 90 degrees clockwise correctly', () => {
      // Expected 3x2 rotated result (height becomes new width, width becomes new height):
      // row 0: y r
      // row 1: m g
      // row 2: c b
      const res = AssetTransformationService.rotate90(testPixels, width, height);
      expect(res.width).toBe(2);
      expect(res.height).toBe(3);
      expect(res.pixels).toEqual([
        'yellow', 'red',
        'magenta', 'green',
        'cyan', 'blue'
      ]);
    });
  });

  describe('rotate180', () => {
    it('should rotate 180 degrees correctly', () => {
      // Expected inverted result:
      // c m y
      // b g r
      const res = AssetTransformationService.rotate180(testPixels, width, height);
      expect(res.width).toBe(3);
      expect(res.height).toBe(2);
      expect(res.pixels).toEqual([
        'cyan', 'magenta', 'yellow',
        'blue', 'green', 'red'
      ]);
    });
  });

  describe('rotate270', () => {
    it('should rotate 270 degrees clockwise correctly', () => {
      // Expected result:
      // row 0: b c
      // row 1: g m
      // row 2: r y
      const res = AssetTransformationService.rotate270(testPixels, width, height);
      expect(res.width).toBe(2);
      expect(res.height).toBe(3);
      expect(res.pixels).toEqual([
        'blue', 'cyan',
        'green', 'magenta',
        'red', 'yellow'
      ]);
    });
  });

  describe('flipHorizontal', () => {
    it('should flip pixels horizontally', () => {
      const res = AssetTransformationService.flipHorizontal(testPixels, width, height);
      expect(res.pixels).toEqual([
        'blue', 'green', 'red',
        'cyan', 'magenta', 'yellow'
      ]);
    });
  });

  describe('flipVertical', () => {
    it('should flip pixels vertically', () => {
      const res = AssetTransformationService.flipVertical(testPixels, width, height);
      expect(res.pixels).toEqual([
        'yellow', 'magenta', 'cyan',
        'red', 'green', 'blue'
      ]);
    });
  });

  describe('scale', () => {
    it('should double the size using nearest-neighbor scaling', () => {
      const res = AssetTransformationService.scale(testPixels, width, height, 2, 2);
      expect(res.width).toBe(6);
      expect(res.height).toBe(4);
      // Row 0/1 should have duplicated r, g, b
      expect(res.pixels.slice(0, 6)).toEqual(['red', 'red', 'green', 'green', 'blue', 'blue']);
      expect(res.pixels.slice(6, 12)).toEqual(['red', 'red', 'green', 'green', 'blue', 'blue']);
      // Row 2/3 should have duplicated y, m, c
      expect(res.pixels.slice(12, 18)).toEqual(['yellow', 'yellow', 'magenta', 'magenta', 'cyan', 'cyan']);
      expect(res.pixels.slice(18, 24)).toEqual(['yellow', 'yellow', 'magenta', 'magenta', 'cyan', 'cyan']);
    });

    it('should scale down using nearest-neighbor', () => {
      const res = AssetTransformationService.scale(testPixels, width, height, 0.5, 0.5);
      expect(res.width).toBe(1);
      expect(res.height).toBe(1);
      expect(res.pixels).toEqual(['magenta']);
    });
  });

  describe('transform combination', () => {
    it('should perform sequence of transformations cleanly', () => {
      const res = AssetTransformationService.transform(testPixels, width, height, 90, true, false, 2, 1);
      // Step 1: Rotate 90:
      // y r
      // m g
      // c b
      // Step 2: Flip Horizontal:
      // r y
      // g m
      // b c
      // Step 3: Flip Vertical: false -> unchanged
      // Step 4: Scale: X by 2, Y by 1 (target width = 2 * 2 = 4, target height = 3 * 1 = 3)
      // row 0: r r y y
      // row 1: g g m m
      // row 2: b b c c
      expect(res.width).toBe(4);
      expect(res.height).toBe(3);
      expect(res.pixels).toEqual([
        'red', 'red', 'yellow', 'yellow',
        'green', 'green', 'magenta', 'magenta',
        'blue', 'blue', 'cyan', 'cyan'
      ]);
    });
  });

  describe('TransformationPipeline', () => {
    it('should correctly support pipeline execution of chained operations', () => {
      const pipeline = new TransformationPipeline();
      pipeline.add(new RotateOperation(180));
      pipeline.add(new FlipHorizontalOperation());
      pipeline.add(new ScaleOperation(1, 2));

      expect(pipeline.length).toBe(3);

      const res = pipeline.execute(testPixels, width, height);
      // Step 1: Rotate 180:
      // c m y
      // b g r
      // Step 2: Flip Horizontal:
      // y m c
      // r g b
      // Step 3: Scale (1, 2) (Y doubled):
      // y m c
      // y m c
      // r g b
      // r g b
      expect(res.width).toBe(3);
      expect(res.height).toBe(4);
      expect(res.pixels).toEqual([
        'yellow', 'magenta', 'cyan',
        'yellow', 'magenta', 'cyan',
        'red', 'green', 'blue',
        'red', 'green', 'blue'
      ]);
    });
  });
});
