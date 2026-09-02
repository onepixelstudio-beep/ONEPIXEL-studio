import { describe, it, expect } from 'vitest';
import { parseHexColor, rgbToHex, hexToRgb, ColorCacheManager } from '../colorUtils';

describe('colorUtils tests', () => {
  it('should successfully parse valid 3-digit, 6-digit, and 8-digit hex colors', () => {
    // 3-digit
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    expect(parseHexColor('#0af')).toEqual({ r: 0, g: 170, b: 255, a: 255 });

    // 6-digit
    expect(parseHexColor('#ff00aa')).toEqual({ r: 255, g: 0, b: 170, a: 255 });
    
    // 8-digit
    expect(parseHexColor('#ff00aa80')).toEqual({ r: 255, g: 0, b: 170, a: 128 });
  });

  it('should return null or default values for invalid hex input', () => {
    expect(parseHexColor('')).toBeNull();
    expect(parseHexColor('invalid')).toEqual({ r: 0, g: 0, b: 0, a: 255 });
  });

  it('should correctly convert RGB parameters back into Hex strings', () => {
    expect(rgbToHex(255, 0, 170)).toBe('#ff00aa');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(300, -10, 150)).toBe('#ff0096'); // clamp check
  });

  it('should convert Hex string to RGB structure', () => {
    expect(hexToRgb('#ff00aa')).toEqual({ r: 255, g: 0, b: 170 });
    expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
  });

  describe('ColorCacheManager', () => {
    it('should stay bounded to maxCapacity and evict LRU items', () => {
      const cache = new ColorCacheManager(3);
      cache.set('color1', { r: 1, g: 1, b: 1, a: 255 });
      cache.set('color2', { r: 2, g: 2, b: 2, a: 255 });
      cache.set('color3', { r: 3, g: 3, b: 3, a: 255 });

      // Access color1, making color2 the least recently used
      expect(cache.get('color1')).toBeDefined();

      // Add a 4th color, which should evict color2
      cache.set('color4', { r: 4, g: 4, b: 4, a: 255 });

      expect(cache.get('color2')).toBeUndefined();
      expect(cache.get('color1')).toBeDefined();
      expect(cache.get('color3')).toBeDefined();
      expect(cache.get('color4')).toBeDefined();
      expect(cache.getMetrics().size).toBe(3);
    });

    it('should handle clear and hit/miss metrics correctly', () => {
      const cache = new ColorCacheManager(2);
      expect(cache.getMetrics().hits).toBe(0);
      expect(cache.getMetrics().misses).toBe(0);

      cache.get('nonexistent');
      expect(cache.getMetrics().misses).toBe(1);

      cache.set('color1', { r: 1, g: 1, b: 1, a: 255 });
      cache.get('color1');
      expect(cache.getMetrics().hits).toBe(1);

      cache.clear();
      expect(cache.getMetrics().size).toBe(0);
      expect(cache.getMetrics().hits).toBe(0);
    });
  });
});

