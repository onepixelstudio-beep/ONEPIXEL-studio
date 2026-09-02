/**
 * Utility to parse various color palette formats (GPL, PAL, ACT, ACO, ASE, etc.).
 * Guarantees zero unhandled exceptions, strict memory management, and normalizes
 * outputs to a CanonicalPalette format.
 */

import { rgbToHex } from './colorUtils';
import { CanonicalPalette } from '../types';

export interface ParsedPalette {
  name: string;
  colors: string[];
}

/**
 * Normalizes a ParsedPalette into a CanonicalPalette object.
 * Applies color cleaning, standards enforcement, and schema versioning.
 */
export function convertToCanonical(parsed: ParsedPalette, isCustom = true): CanonicalPalette {
  const id = 'cp-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
  const rawColors = parsed.colors || [];
  
  const normalizedColors = rawColors
    .map(c => {
      let cleaned = c.trim().toLowerCase();
      if (!cleaned.startsWith('#')) {
        cleaned = '#' + cleaned;
      }
      // Expand 3-character hex shorthand (#f00 -> #ff0000)
      if (/^#[0-9a-f]{3}$/.test(cleaned)) {
        const r = cleaned[1];
        const g = cleaned[2];
        const b = cleaned[3];
        cleaned = `#${r}${r}${g}${g}${b}${b}`;
      }
      // Validate correct 7-character hex string
      if (/^#[0-9a-f]{6}$/.test(cleaned)) {
        return cleaned;
      }
      return null;
    })
    .filter((c): c is string => c !== null);

  return {
    id,
    name: parsed.name ? parsed.name.trim() : 'Paleta sin nombre',
    colors: normalizedColors.length > 0 ? normalizedColors : ['#000000', '#ffffff'],
    version: 1,
    isCustom,
    description: `Paleta importada con ${normalizedColors.length} colores válidos.`
  };
}

/**
 * Parses GPL format color palette text.
 */
export function parseGpl(text: string): string[] {
  const colors: string[] = [];
  try {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        !trimmed ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('GIMP') ||
        trimmed.toLowerCase().startsWith('name:') ||
        trimmed.toLowerCase().startsWith('columns:')
      ) {
        continue;
      }
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length >= 3) {
        const r = parseInt(parts[0], 10);
        const g = parseInt(parts[1], 10);
        const b = parseInt(parts[2], 10);
        if (
          !isNaN(r) &&
          !isNaN(g) &&
          !isNaN(b) &&
          r >= 0 &&
          r <= 255 &&
          g >= 0 &&
          g <= 255 &&
          b >= 0 &&
          b <= 255
        ) {
          colors.push(rgbToHex(r, g, b));
        }
      }
    }
  } catch (e) {
    console.error("GPL parse error caught", e);
  }
  return colors;
}

/**
 * Parses JASC PAL format color palette text.
 */
export function parseJascPal(text: string): string[] {
  const colors: string[] = [];
  try {
    const lines = text.split(/\r?\n/);
    let headerFound = false;
    let colorCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === 'JASC-PAL') {
        headerFound = true;
        continue;
      }
      if (headerFound && trimmed === '0100') continue;
      if (headerFound && colorCount === 0) {
        colorCount = parseInt(trimmed, 10) || 0;
        continue;
      }
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const r = parseInt(parts[0], 10);
        const g = parseInt(parts[1], 10);
        const b = parseInt(parts[2], 10);
        if (
          !isNaN(r) &&
          !isNaN(g) &&
          !isNaN(b) &&
          r >= 0 &&
          r <= 255 &&
          g >= 0 &&
          g <= 255 &&
          b >= 0 &&
          b <= 255
        ) {
          colors.push(rgbToHex(r, g, b));
        }
      }
    }
  } catch (e) {
    console.error("JASC PAL parse error caught", e);
  }
  return colors;
}

/**
 * Parses RIFF PAL format color palette buffer.
 */
export function parseRiffPal(buffer: ArrayBuffer): string[] {
  const colors: string[] = [];
  try {
    const view = new DataView(buffer);
    if (buffer.byteLength < 16) return [];
    if (view.getUint32(0, false) !== 0x52494646) return []; // "RIFF"
    if (view.getUint32(8, false) !== 0x50414C20) return []; // "PAL "
    let offset = 12;
    while (offset < buffer.byteLength - 8) {
      const chunkId = view.getUint32(offset, false);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 0x64617461) { // "data"
        const count = view.getUint16(offset + 10, true);
        let entryOffset = offset + 12;
        for (let i = 0; i < count; i++) {
          if (entryOffset + 3 < buffer.byteLength) {
            const r = view.getUint8(entryOffset);
            const g = view.getUint8(entryOffset + 1);
            const b = view.getUint8(entryOffset + 2);
            colors.push(rgbToHex(r, g, b));
            entryOffset += 4;
          }
        }
        break;
      }
      offset += 8 + chunkSize;
      if (chunkSize % 2 !== 0) offset++;
    }
  } catch (e) {
    console.error("RIFF PAL parse error", e);
  }
  return colors;
}

/**
 * Parses Adobe Color Table (ACT) binary buffer.
 */
export function parseAct(buffer: ArrayBuffer): string[] {
  const colors: string[] = [];
  try {
    const bytes = new Uint8Array(buffer);
    if (bytes.length === 0) return [];
    const numColors = bytes.length >= 772 ? (bytes[768] << 8) | bytes[769] : Math.floor(bytes.length / 3);
    const maxColors = Math.min(256, numColors);
    for (let i = 0; i < maxColors; i++) {
      const offset = i * 3;
      if (offset + 2 < bytes.length) {
        const r = bytes[offset];
        const g = bytes[offset + 1];
        const b = bytes[offset + 2];
        colors.push(rgbToHex(r, g, b));
      }
    }
  } catch (e) {
    console.error("ACT parse error caught", e);
  }
  return colors;
}

/**
 * Parses Adobe Color Swatch (ACO) binary buffer.
 */
export function parseAco(buffer: ArrayBuffer): string[] {
  const colors: string[] = [];
  try {
    if (buffer.byteLength < 4) return [];
    const view = new DataView(buffer);
    let version = view.getUint16(0, false);
    let count = view.getUint16(2, false);
    let offset = 4;
    
    const parseBlock = (v: number, cnt: number) => {
      for (let i = 0; i < cnt; i++) {
        if (offset + 10 > buffer.byteLength) break;
        const colorSpace = view.getUint16(offset, false);
        const w = view.getUint16(offset + 2, false);
        const x = view.getUint16(offset + 4, false);
        const y = view.getUint16(offset + 6, false);
        offset += 10;
        
        let r = w >> 8;
        let g = x >> 8;
        let b = y >> 8;
        if (colorSpace !== 0) { // Non-RGB
          r = w >> 8; g = x >> 8; b = y >> 8;
        }
        colors.push(rgbToHex(r, g, b));
        
        if (v === 2) {
          if (offset + 4 <= buffer.byteLength) {
            const nameLen = view.getUint32(offset, false);
            offset += 4 + nameLen * 2;
          }
        }
      }
    };

    parseBlock(version, count);
    if (version === 1 && offset + 4 <= buffer.byteLength) {
      const version2 = view.getUint16(offset, false);
      const count2 = view.getUint16(offset + 2, false);
      if (version2 === 2) {
        offset += 4;
        colors.length = 0;
        parseBlock(version2, count2);
      }
    }
  } catch (e) {
    console.error("ACO parse error", e);
  }
  return colors;
}

/**
 * Parses Adobe Swatch Exchange (ASE) binary buffer.
 */
export function parseAse(buffer: ArrayBuffer): string[] {
  const colors: string[] = [];
  try {
    if (buffer.byteLength < 12) return [];
    const view = new DataView(buffer);
    if (view.getUint32(0, false) !== 0x41534546) return []; // "ASEF" signature
    const blockCount = view.getUint32(8, false);
    let offset = 12;
    
    for (let b = 0; b < blockCount; b++) {
      if (offset + 6 > buffer.byteLength) break;
      const blockType = view.getUint16(offset, false);
      const blockLength = view.getUint32(offset + 2, false);
      offset += 6;
      
      const nextBlockOffset = offset + blockLength;
      if (blockType === 0x0001) {
        if (offset + 2 > buffer.byteLength) break;
        const nameLen = view.getUint16(offset, false);
        offset += 2 + nameLen * 2;
        
        if (offset + 4 > buffer.byteLength) break;
        let model = '';
        for (let i = 0; i < 4; i++) {
          model += String.fromCharCode(view.getUint8(offset + i));
        }
        offset += 4;
        
        if (model === 'RGB ') {
          if (offset + 12 <= buffer.byteLength) {
            const rVal = view.getFloat32(offset, false);
            const gVal = view.getFloat32(offset + 4, false);
            const bVal = view.getFloat32(offset + 8, false);
            const r = Math.round(rVal * 255);
            const g = Math.round(gVal * 255);
            const b = Math.round(bVal * 255);
            colors.push(rgbToHex(r, g, b));
          }
        } else if (model === 'Gray') {
          if (offset + 4 <= buffer.byteLength) {
            const gVal = view.getFloat32(offset, false);
            const val = Math.round(gVal * 255);
            colors.push(rgbToHex(val, val, val));
          }
        } else if (model === 'CMYK') {
          if (offset + 16 <= buffer.byteLength) {
            const c = view.getFloat32(offset, false);
            const m = view.getFloat32(offset + 4, false);
            const y = view.getFloat32(offset + 8, false);
            const k = view.getFloat32(offset + 12, false);
            const r = Math.round(255 * (1 - c) * (1 - k));
            const g = Math.round(255 * (1 - m) * (1 - k));
            const b = Math.round(255 * (1 - y) * (1 - k));
            colors.push(rgbToHex(r, g, b));
          }
        }
      }
      offset = nextBlockOffset;
    }
  } catch (e) {
    console.error("ASE parse error", e);
  }
  return colors;
}

/**
 * Parses generic text format (such as JSON, CSV, XML, raw hex lists, etc.)
 * Safely extracts color matches even from partially compatible or corrupted files.
 */
export function parseColorsFromText(text: string): string[] {
  const colors: string[] = [];
  
  // Try JSON first
  try {
    const parsed = JSON.parse(text);
    let extracted: string[] = [];
    if (Array.isArray(parsed)) {
      extracted = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.colors)) {
        extracted = parsed.colors;
      } else if (Array.isArray(parsed.palette)) {
        extracted = parsed.palette;
      } else {
        const findStrings = (obj: any) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(obj[key])) {
              extracted.push(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              findStrings(obj[key]);
            }
          }
        };
        findStrings(parsed);
      }
    }
    if (extracted.length > 0) {
      return extracted.map(c => c.startsWith('#') ? c.toLowerCase() : `#${c.toLowerCase()}`);
    }
  } catch (e) {
    // If not valid JSON, proceed to line-by-line regex parsing
  }

  try {
    const hashHexRegex = /#[0-9a-fA-F]{6}\b/g;
    const hashHex3Regex = /#[0-9a-fA-F]{3}\b/g;
    const hashMatches = text.match(hashHexRegex) || [];
    const hash3Matches = text.match(hashHex3Regex) || [];
    const allHashMatches = [...hashMatches, ...hash3Matches];
    if (allHashMatches.length > 0) {
      return Array.from(new Set(allHashMatches.map(c => c.toLowerCase())));
    }

    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//') || trimmed.toLowerCase().startsWith('gimp')) continue;

      const tagRegex = /<(?:color|palette-color)[^>]*>/gi;
      const tags = trimmed.match(tagRegex);
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          const rMatch = tag.match(/(?:r|red)\s*=\s*["']?(\d+)["']?/i);
          const gMatch = tag.match(/(?:g|green)\s*=\s*["']?(\d+)["']?/i);
          const bMatch = tag.match(/(?:b|blue)\s*=\s*["']?(\d+)["']?/i);
          if (rMatch && gMatch && bMatch) {
            const r = parseInt(rMatch[1], 10);
            const g = parseInt(gMatch[1], 10);
            const b = parseInt(bMatch[1], 10);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
              colors.push(rgbToHex(r, g, b));
            }
          }
        }
        continue;
      }

      const parts = trimmed.split(/[\s,;\t=]+/).filter(Boolean);
      if (parts.length >= 3) {
        const r = parseInt(parts[parts.length - 3], 10);
        const g = parseInt(parts[parts.length - 2], 10);
        const b = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
          colors.push(rgbToHex(r, g, b));
          continue;
        }
      }

      if (parts.length === 1 || (parts.length === 2 && /^\d+$/.test(parts[0]))) {
        const potentialHex = parts.length === 1 ? parts[0] : parts[1];
        if (/^[0-9a-fA-F]{6}$/.test(potentialHex) || /^[0-9a-fA-F]{3}$/.test(potentialHex)) {
          colors.push(`#${potentialHex.toLowerCase()}`);
        }
      }
    }
  } catch (e) {
    console.error("Text regex parse error caught", e);
  }

  return Array.from(new Set(colors));
}

/**
 * Parses any supported palette file, returning its name and list of extracted color hex strings.
 * Includes size restrictions, empty file protection, and explicit FileReader cleanup.
 */
export function parsePaletteFile(file: File): Promise<ParsedPalette> {
  return new Promise((resolve, reject) => {
    // 1. Guardrails for Size limits and Empty Files
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('El archivo supera el límite máximo de tamaño de 5MB.'));
      return;
    }
    if (file.size === 0) {
      reject(new Error('El archivo de paleta seleccionado está vacío.'));
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const name = file.name.replace(/\.[^/.]+$/, "");
    
    const isBinary = ['act', 'aco', 'ase'].includes(extension);
    const reader = new FileReader();

    // Explicit listener cleanup function to avoid closures retaining references in memory
    const cleanup = () => {
      reader.onload = null;
      reader.onerror = null;
    };

    if (isBinary || extension === 'pal') {
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          let colors: string[] = [];
          
          if (extension === 'act') {
            colors = parseAct(buffer);
          } else if (extension === 'aco') {
            colors = parseAco(buffer);
          } else if (extension === 'ase') {
            colors = parseAse(buffer);
          } else if (extension === 'pal') {
            const view = new DataView(buffer);
            if (buffer.byteLength >= 4 && view.getUint32(0, false) === 0x52494646) {
              colors = parseRiffPal(buffer);
            } else {
              const decoder = new TextDecoder('utf-8');
              const text = decoder.decode(buffer);
              colors = parseJascPal(text);
            }
          }
          
          cleanup();
          resolve({ name, colors });
        } catch (err) {
          cleanup();
          reject(new Error(`Fallo al parsear archivo binario ${extension.toUpperCase()}`));
        }
      };
      
      reader.onerror = () => {
        cleanup();
        reject(new Error('Error de lectura del archivo binario'));
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let colors: string[] = [];
          let finalName = name;
          
          if (extension === 'gpl') {
            const lines = text.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.toLowerCase().startsWith('name:')) {
                finalName = trimmed.substring(5).trim();
                break;
              }
            }
            colors = parseGpl(text);
          } else {
            colors = parseColorsFromText(text);
          }
          
          cleanup();
          resolve({ name: finalName, colors });
        } catch (err) {
          cleanup();
          reject(new Error(`Fallo al parsear archivo de texto ${extension.toUpperCase()}`));
        }
      };
      
      reader.onerror = () => {
        cleanup();
        reject(new Error('Error de lectura del archivo de texto'));
      };
      
      reader.readAsText(file);
    }
  });
}
