import { describe, it, expect } from 'vitest';
import { PatternRenderer, PatternStrategy } from '../resources/PatternRenderer';
import { AssetPatternService, PatternContext } from '../resources/AssetPatternService';
import { AssetResource } from '../../types';

describe('PatternRenderer & PatternStrategy', () => {
  const asset: AssetResource = {
    id: 'test-pattern-id',
    version: 1,
    type: 'stamp',
    name: 'Stripes',
    description: 'Striped pattern',
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    width: 2,
    height: 2,
    pivot: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    data: {
      pixels: [
        '#ff0000', '#00ff00',
        '#0000ff', '#ffffff'
      ]
    }
  };

  const defaultContext: PatternContext = {
    enabled: true,
    repeatMode: 'repeat',
    alignment: 'absolute',
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    scale: 1
  };

  it('should render standard tiled repeat modes correctly via PatternRenderer', () => {
    // Top-left
    expect(PatternRenderer.getPixel(0, 0, defaultContext, asset)).toBe('#ff0000');
    // Top-right
    expect(PatternRenderer.getPixel(1, 0, defaultContext, asset)).toBe('#00ff00');
    // Tiled repeats
    expect(PatternRenderer.getPixel(2, 0, defaultContext, asset)).toBe('#ff0000');
    expect(PatternRenderer.getPixel(3, 3, defaultContext, asset)).toBe('#ffffff');
    expect(PatternRenderer.getPixel(-1, -1, defaultContext, asset)).toBe('#ffffff');
  });

  it('should respect absolute offsets', () => {
    const contextWithOffset = { ...defaultContext, offsetX: 1, offsetY: 1 };
    // Absolute position (1,1) minus offset (1,1) maps to (0,0) -> red
    expect(PatternRenderer.getPixel(1, 1, contextWithOffset, asset)).toBe('#ff0000');
  });

  it('should support repeat-x mode bounds and repeats', () => {
    const contextRX = { ...defaultContext, repeatMode: 'repeat-x' as const };
    // Inside horizontal row bounds (Y=0)
    expect(PatternRenderer.getPixel(0, 0, contextRX, asset)).toBe('#ff0000');
    expect(PatternRenderer.getPixel(5, 0, contextRX, asset)).toBe('#00ff00'); // x=5 % 2 = 1
    // Outside vertical row bounds (Y=2)
    expect(PatternRenderer.getPixel(0, 2, contextRX, asset)).toBeNull();
  });

  it('should support repeat-y mode bounds and repeats', () => {
    const contextRY = { ...defaultContext, repeatMode: 'repeat-y' as const };
    // Inside vertical column bounds (X=0)
    expect(PatternRenderer.getPixel(0, 0, contextRY, asset)).toBe('#ff0000');
    expect(PatternRenderer.getPixel(0, 3, contextRY, asset)).toBe('#0000ff'); // y=3 % 2 = 1
    // Outside horizontal column bounds (X=2)
    expect(PatternRenderer.getPixel(2, 0, contextRY, asset)).toBeNull();
  });

  it('should support mirror repeat mode', () => {
    const contextMirror = { ...defaultContext, repeatMode: 'mirror' as const };
    // (0,0) -> red, (1,0) -> green, (2,0) mirrored back to (1,0) -> green, (3,0) mirrored back to (0,0) -> red
    expect(PatternRenderer.getPixel(0, 0, contextMirror, asset)).toBe('#ff0000');
    expect(PatternRenderer.getPixel(1, 0, contextMirror, asset)).toBe('#00ff00');
    expect(PatternRenderer.getPixel(2, 0, contextMirror, asset)).toBe('#00ff00');
    expect(PatternRenderer.getPixel(3, 0, contextMirror, asset)).toBe('#ff0000');
  });

  it('should support local alignment using anchor coordinates', () => {
    const contextLocal = { ...defaultContext, alignment: 'local' as const };
    // Stroke starts at (5, 5). Point (5, 5) relative to anchor (5, 5) is (0, 0) -> red
    expect(PatternRenderer.getPixel(5, 5, contextLocal, asset, 5, 5)).toBe('#ff0000');
    // Point (6, 5) relative to anchor (5, 5) is (1, 0) -> green
    expect(PatternRenderer.getPixel(6, 5, contextLocal, asset, 5, 5)).toBe('#00ff00');
  });

  it('should support custom registered strategies at runtime (Open/Closed Principle)', () => {
    // Define a strategy that only draws color on even coordinate sums
    class ChessStrategy implements PatternStrategy {
      getTileCoordinate(rx: number, ry: number, tileW: number, tileH: number): { tx: number; ty: number } | null {
        if ((rx + ry) % 2 !== 0) return null;
        return { tx: 0, ty: 0 }; // always top-left pixel
      }
    }

    PatternRenderer.registerStrategy('chess', new ChessStrategy());

    const contextChess = { ...defaultContext, repeatMode: 'chess' as any };
    expect(PatternRenderer.getPixel(0, 0, contextChess, asset)).toBe('#ff0000'); // sum 0 is even -> red
    expect(PatternRenderer.getPixel(1, 0, contextChess, asset)).toBeNull();      // sum 1 is odd -> null
    expect(PatternRenderer.getPixel(1, 1, contextChess, asset)).toBe('#ff0000'); // sum 2 is even -> red
  });

  it('should automatically cache and return identical colors without reconstruct overhead', () => {
    PatternRenderer.clearCache();
    // Cache miss and creation
    const color1 = PatternRenderer.getPixel(0, 0, defaultContext, asset);
    expect(color1).toBe('#ff0000');

    // Cache hit should be fast
    const color2 = PatternRenderer.getPixel(0, 0, defaultContext, asset);
    expect(color2).toBe('#ff0000');
  });
});
