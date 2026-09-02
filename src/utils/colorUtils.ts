interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class ColorCacheManager {
  private cache = new Map<string, ColorRGBA>();
  private maxCapacity: number;
  private hits = 0;
  private misses = 0;

  constructor(maxCapacity = 1000) {
    this.maxCapacity = maxCapacity;
  }

  public get(key: string): ColorRGBA | undefined {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.hits++;
      // Move to end to mark as most recently used (LRU)
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    this.misses++;
    return undefined;
  }

  public set(key: string, value: ColorRGBA): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      // O(1) Evict the oldest/least-recently-used item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getMetrics() {
    return {
      size: this.cache.size,
      maxCapacity: this.maxCapacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0
    };
  }
}

export const colorCache = new ColorCacheManager(1000);

const NAMED_COLORS: Record<string, ColorRGBA> = {
  white: { r: 255, g: 255, b: 255, a: 255 },
  black: { r: 0, g: 0, b: 0, a: 255 },
  red: { r: 255, g: 0, b: 0, a: 255 },
  green: { r: 0, g: 128, b: 0, a: 255 },
  blue: { r: 0, g: 0, b: 255, a: 255 },
  yellow: { r: 255, g: 255, b: 0, a: 255 },
  cyan: { r: 0, g: 255, b: 255, a: 255 },
  magenta: { r: 255, g: 0, b: 255, a: 255 },
  gray: { r: 128, g: 128, b: 128, a: 255 },
  grey: { r: 128, g: 128, b: 128, a: 255 },
  orange: { r: 255, g: 165, b: 0, a: 255 },
  purple: { r: 128, g: 0, b: 128, a: 255 },
};

export function parseHexColor(hex: string): ColorRGBA | null {
  if (!hex || hex === 'transparent') return null;
  
  // Normalize color key to lowercase for maximum cache-hit consistency
  const normalizedHex = hex.trim().toLowerCase();
  const cached = colorCache.get(normalizedHex);
  if (cached) return cached;

  if (NAMED_COLORS[normalizedHex]) {
    const res = NAMED_COLORS[normalizedHex];
    colorCache.set(normalizedHex, res);
    return res;
  }

  let r = 0, g = 0, b = 0, a = 255;
  if (normalizedHex.startsWith('#')) {
    const clean = normalizedHex.slice(1);
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16) || 0;
      g = parseInt(clean[1] + clean[1], 16) || 0;
      b = parseInt(clean[2] + clean[2], 16) || 0;
    } else if (clean.length === 4) {
      r = parseInt(clean[0] + clean[0], 16) || 0;
      g = parseInt(clean[1] + clean[1], 16) || 0;
      b = parseInt(clean[2] + clean[2], 16) || 0;
      a = parseInt(clean[3] + clean[3], 16) || 0;
    } else if (clean.length === 6) {
      r = parseInt(clean.slice(0, 2), 16) || 0;
      g = parseInt(clean.slice(2, 4), 16) || 0;
      b = parseInt(clean.slice(4, 6), 16) || 0;
    } else if (clean.length === 8) {
      r = parseInt(clean.slice(0, 2), 16) || 0;
      g = parseInt(clean.slice(2, 4), 16) || 0;
      b = parseInt(clean.slice(4, 6), 16) || 0;
      a = parseInt(clean.slice(6, 8), 16) || 0;
    }
  } else if (normalizedHex.startsWith('rgb')) {
    const match = normalizedHex.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      r = Math.min(255, Math.max(0, Math.round(parseFloat(match[1])) || 0));
      g = Math.min(255, Math.max(0, Math.round(parseFloat(match[2])) || 0));
      b = Math.min(255, Math.max(0, Math.round(parseFloat(match[3])) || 0));
      if (match[4] !== undefined) {
        const parsedA = parseFloat(match[4]);
        a = Math.min(255, Math.max(0, Math.round(parsedA <= 1 ? parsedA * 255 : parsedA) || 0));
      }
    }
  }
  const result = { r, g, b, a };
  colorCache.set(normalizedHex, result);
  return result;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  const toHexVal = (val: number) => {
    const hex = clamp(val).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const parsed = parseHexColor(hex);
  if (parsed) {
    return { r: parsed.r, g: parsed.g, b: parsed.b };
  }
  return { r: 0, g: 0, b: 0 };
}

export function matchColorsWithTolerance(hexA: string, hexB: string, tolerance: number): boolean {
  if (hexA === hexB) return true;
  if (!hexA || !hexB) return false;
  
  // Fall back to simple string equality for non-hex values (e.g. string tokens 'R', 'G', 'B' used in unit tests)
  if (!hexA.startsWith('#') || !hexB.startsWith('#')) {
    return hexA === hexB;
  }
  
  const cA = parseHexColor(hexA);
  const cB = parseHexColor(hexB);
  if (!cA || !cB) {
    return hexA === hexB;
  }
  
  if (tolerance === 0) {
    return cA.r === cB.r && cA.g === cB.g && cA.b === cB.b && cA.a === cB.a;
  }
  
  const dr = cA.r - cB.r;
  const dg = cA.g - cB.g;
  const db = cA.b - cB.b;
  const da = cA.a - cB.a;
  
  const diffSquare = dr * dr + dg * dg + db * db + da * da;
  const maxDistance = 255 * 255 * 4;
  const thresholdSquare = (tolerance / 255) * (tolerance / 255) * maxDistance;
  return diffSquare <= thresholdSquare;
}

