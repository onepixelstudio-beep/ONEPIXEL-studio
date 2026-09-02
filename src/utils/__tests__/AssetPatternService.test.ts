import { describe, it, expect } from 'vitest';
import { AssetPatternService, PatternConfig } from '../resources/AssetPatternService';

describe('AssetPatternService', () => {
  const tile = [
    'A', 'B',
    'C', 'D'
  ];
  const w = 2;
  const h = 2;

  const baseConfig: PatternConfig = {
    repeatMode: 'repeat',
    alignment: 'absolute',
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    scaleX: 1,
    scaleY: 1
  };

  it('should repeat normally with default settings', () => {
    // Coordinate (0, 0)
    expect(AssetPatternService.getPixelAt(0, 0, tile, w, h, baseConfig)).toBe('A');
    // Coordinate (1, 0)
    expect(AssetPatternService.getPixelAt(1, 0, tile, w, h, baseConfig)).toBe('B');
    // Coordinate (2, 0) -> repeats to (0,0)
    expect(AssetPatternService.getPixelAt(2, 0, tile, w, h, baseConfig)).toBe('A');
    // Coordinate (3, 3) -> repeats to (1,1)
    expect(AssetPatternService.getPixelAt(3, 3, tile, w, h, baseConfig)).toBe('D');
    // Negative coordinates
    expect(AssetPatternService.getPixelAt(-1, -1, tile, w, h, baseConfig)).toBe('D');
  });

  it('should handle offset coordinates correctly', () => {
    const configWithOffset: PatternConfig = { ...baseConfig, offsetX: 1, offsetY: 1 };
    // Canvas (1, 1) with offset (1, 1) maps to tile (0, 0) -> 'A'
    expect(AssetPatternService.getPixelAt(1, 1, tile, w, h, configWithOffset)).toBe('A');
  });

  it('should handle local alignment anchoring', () => {
    const localConfig: PatternConfig = { ...baseConfig, alignment: 'local' };
    // Anchor is at (10, 10). Canvas (10, 10) maps to local (0, 0) -> 'A'
    expect(AssetPatternService.getPixelAt(10, 10, tile, w, h, localConfig, 10, 10)).toBe('A');
    // Canvas (11, 10) maps to local (1, 0) -> 'B'
    expect(AssetPatternService.getPixelAt(11, 10, tile, w, h, localConfig, 10, 10)).toBe('B');
  });

  it('should support repeat-x only mode', () => {
    const repeatXConfig: PatternConfig = { ...baseConfig, repeatMode: 'repeat-x' };
    // repeats horizontally, but out of bounds vertically
    expect(AssetPatternService.getPixelAt(5, 0, tile, w, h, repeatXConfig)).toBe('B'); // 5 % 2 = 1, y=0 -> B
    expect(AssetPatternService.getPixelAt(0, 3, tile, w, h, repeatXConfig)).toBeNull(); // Y out of bounds
  });

  it('should support repeat-y only mode', () => {
    const repeatYConfig: PatternConfig = { ...baseConfig, repeatMode: 'repeat-y' };
    // repeats vertically, but out of bounds horizontally
    expect(AssetPatternService.getPixelAt(0, 5, tile, w, h, repeatYConfig)).toBe('C'); // x=0, 5 % 2 = 1 -> C
    expect(AssetPatternService.getPixelAt(3, 0, tile, w, h, repeatYConfig)).toBeNull(); // X out of bounds
  });

  it('should support mirror repeat mode', () => {
    const mirrorConfig: PatternConfig = { ...baseConfig, repeatMode: 'mirror' };
    // mirror-repeat size 2: 0->0, 1->1, 2->1, 3->0, 4->0, 5->1
    expect(AssetPatternService.getPixelAt(0, 0, tile, w, h, mirrorConfig)).toBe('A'); // (0,0) -> A
    expect(AssetPatternService.getPixelAt(1, 0, tile, w, h, mirrorConfig)).toBe('B'); // (1,0) -> B
    expect(AssetPatternService.getPixelAt(2, 0, tile, w, h, mirrorConfig)).toBe('B'); // (2,0) -> maps to 1 -> B
    expect(AssetPatternService.getPixelAt(3, 0, tile, w, h, mirrorConfig)).toBe('A'); // (3,0) -> maps to 0 -> A
  });

  it('should prepare tile with transformation correctly', () => {
    const transformConfig: PatternConfig = {
      ...baseConfig,
      rotation: 180,
      flipH: true
    };
    const res = AssetPatternService.prepareTile(tile, w, h, transformConfig);
    // tile:
    // A B
    // C D
    // rotate 180:
    // D C
    // B A
    // flipH:
    // C D
    // A B
    expect(res.pixels).toEqual(['C', 'D', 'A', 'B']);
  });

  it('should support 1x1 patterns', () => {
    const tile1x1 = ['X'];
    expect(AssetPatternService.getPixelAt(0, 0, tile1x1, 1, 1, baseConfig)).toBe('X');
    expect(AssetPatternService.getPixelAt(542, 921, tile1x1, 1, 1, baseConfig)).toBe('X');
  });

  it('should support 256x256 large patterns efficiently', () => {
    const size = 256;
    const tileLarge = new Array(size * size).fill('P');
    tileLarge[0] = 'START';
    tileLarge[size * size - 1] = 'END';

    expect(AssetPatternService.getPixelAt(0, 0, tileLarge, size, size, baseConfig)).toBe('START');
    expect(AssetPatternService.getPixelAt(size - 1, size - 1, tileLarge, size, size, baseConfig)).toBe('END');
    expect(AssetPatternService.getPixelAt(size * 2, size * 2, tileLarge, size, size, baseConfig)).toBe('START');
  });

  it('should handle fully transparent and partially transparent colors gracefully preserving alpha', () => {
    const semiTransparentTile = [
      'transparent', 'rgba(255, 0, 0, 0.5)',
      '#00ff00', ''
    ];
    // Coordinate (0,0) is 'transparent'
    expect(AssetPatternService.getPixelAt(0, 0, semiTransparentTile, 2, 2, baseConfig)).toBe('transparent');
    // Coordinate (1,0) has half alpha
    expect(AssetPatternService.getPixelAt(1, 0, semiTransparentTile, 2, 2, baseConfig)).toBe('rgba(255, 0, 0, 0.5)');
    // Coordinate (1,1) is empty/transparent
    expect(AssetPatternService.getPixelAt(1, 1, semiTransparentTile, 2, 2, baseConfig)).toBe('');
  });

  it('should correctly support PatternContext signature and createCache/getPixelFromCache flow', () => {
    const context = AssetPatternService.getDefaultContext();
    const signature = AssetPatternService.getContextSignature(context, 'Brick', 2, 2);
    expect(signature).toContain('Brick_2x2_false_repeat_absolute_0_0_0_false_false_1');

    const cache = AssetPatternService.createCache(tile, w, h, context, 'Brick');
    expect(cache.width).toBe(2);
    expect(cache.height).toBe(2);
    expect(cache.contextSignature).toBe(signature);

    const pixel = AssetPatternService.getPixelFromCache(0, 0, cache, context);
    expect(pixel).toBe('A');
  });
});
