/**
 * Pure mathematical representation of a color with RGBA channels.
 */
export interface RGBA {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0.0-1.0
}

/**
 * Platform-agnostic utilities for hexadecimal color parsing, alpha blending, and serialization.
 */
export class ColorBlendUtils {
  /**
   * Performs standard alpha compositing to blend src color over dst color.
   */
  public static blendColors(src: RGBA, dst: RGBA): RGBA {
    if (src.a === 1) return src;
    if (src.a === 0) return dst;
    if (dst.a === 0) return src;

    const outA = src.a + dst.a * (1 - src.a);
    const outR = (src.r * src.a + dst.r * dst.a * (1 - src.a)) / outA;
    const outG = (src.g * src.a + dst.g * dst.a * (1 - src.a)) / outA;
    const outB = (src.b * src.a + dst.b * dst.a * (1 - src.a)) / outA;

    return {
      r: Math.round(outR),
      g: Math.round(outG),
      b: Math.round(outB),
      a: parseFloat(outA.toFixed(4)),
    };
  }

  /**
   * Decodes hex color strings (#rgb, #rgba, #rrggbb, #rrggbbaa) or 'transparent' to an RGBA object.
   */
  public static parseColor(colorStr: string | undefined | null): RGBA {
    if (!colorStr) return { r: 0, g: 0, b: 0, a: 0 };
    const trimmed = colorStr.trim().toLowerCase();
    if (trimmed === 'transparent' || trimmed === '') {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    if (trimmed.startsWith('#')) {
      const hex = trimmed.substring(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b, a: 1 };
      }
      if (hex.length === 4) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        const a = parseInt(hex[3] + hex[3], 16) / 255;
        return { r, g, b, a };
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b, a: 1 };
      }
      if (hex.length === 8) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = parseInt(hex.substring(6, 8), 16) / 255;
        return { r, g, b, a };
      }
    }

    return { r: 0, g: 0, b: 0, a: 0 };
  }

  /**
   * Encodes an RGBA object into a hexadecimal string or 'transparent' representation.
   */
  public static stringifyColor(rgba: RGBA): string {
    if (rgba.a === 0) return 'transparent';

    const rHex = Math.round(rgba.r).toString(16).padStart(2, '0');
    const gHex = Math.round(rgba.g).toString(16).padStart(2, '0');
    const bHex = Math.round(rgba.b).toString(16).padStart(2, '0');

    if (rgba.a === 1) {
      return `#${rHex}${gHex}${bHex}`;
    }

    const aHex = Math.round(rgba.a * 255).toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }
}
