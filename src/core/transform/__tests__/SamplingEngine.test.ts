import { describe, it, expect } from 'vitest';
import { SamplingEngine } from '../SamplingEngine';
import { TransformMatrix } from '../TransformMatrix';
import { createImageData } from '../TransformTypes';

describe('SamplingEngine Module (Sprint 1.6)', () => {
  it('resamples pixels accurately with Nearest Neighbor', () => {
    const engine = new SamplingEngine();

    // 2x2 source ImageData: Red, Green, Blue, White
    const srcData = createImageData(2, 2);
    // (0,0) Red
    srcData.data[0] = 255; srcData.data[3] = 255;
    // (1,0) Green
    srcData.data[5] = 255; srcData.data[7] = 255;
    // (0,1) Blue
    srcData.data[10] = 255; srcData.data[11] = 255;
    // (1,1) White
    srcData.data[12] = 255; srcData.data[13] = 255; srcData.data[14] = 255; srcData.data[15] = 255;

    const bounds = { x: 0, y: 0, width: 2, height: 2 };
    const matrix = TransformMatrix.createScale(2, 2); // Scale up to 4x4
    const dstData = createImageData(4, 4);

    engine.transformPixels(srcData, bounds, matrix, dstData, 'nearest');

    // Check scaled pixel (0,0) is Red
    expect(dstData.data[0]).toBe(255);
    expect(dstData.data[3]).toBe(255);

    // Check scaled pixel (2,0) is Green
    const idx20 = (0 * 4 + 2) * 4;
    expect(dstData.data[idx20 + 1]).toBe(255);
    expect(dstData.data[idx20 + 3]).toBe(255);
  });

  it('supports bilinear and bicubic sampling algorithms without error', () => {
    const engine = new SamplingEngine();
    const srcData = createImageData(4, 4);
    for (let i = 0; i < srcData.data.length; i += 4) {
      srcData.data[i] = 100;
      srcData.data[i + 3] = 255;
    }

    const bounds = { x: 0, y: 0, width: 4, height: 4 };
    const matrix = TransformMatrix.createRotate(Math.PI / 6);
    const dstData = createImageData(4, 4);

    expect(() => {
      engine.transformPixels(srcData, bounds, matrix, dstData, 'bilinear');
      engine.transformPixels(srcData, bounds, matrix, dstData, 'bicubic');
    }).not.toThrow();
  });
});
