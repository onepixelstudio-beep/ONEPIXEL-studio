import { describe, it, expect, vi } from 'vitest';
import { 
  parseGpl, 
  parseJascPal, 
  parseRiffPal, 
  parseAct, 
  parseAco, 
  parseAse, 
  parseColorsFromText,
  parsePaletteFile,
  convertToCanonical
} from '../paletteParser';

describe('paletteParser', () => {
  describe('convertToCanonical', () => {
    it('should normalize a standard ParsedPalette', () => {
      const parsed = {
        name: 'My Cool Palette',
        colors: ['#FF0000', '00FF00', '#abc', 'invalid-color']
      };
      const canonical = convertToCanonical(parsed, true);
      
      expect(canonical.name).toBe('My Cool Palette');
      expect(canonical.version).toBe(1);
      expect(canonical.isCustom).toBe(true);
      // It should clean, lowercase and expand 3-character hex correctly
      // and filter out invalid colors
      expect(canonical.colors).toEqual(['#ff0000', '#00ff00', '#aabbcc']);
      expect(canonical.id).toMatch(/^cp-/);
    });

    it('should fall back to default colors if colors array is empty or all elements are invalid', () => {
      const parsed = {
        name: 'Empty Palette',
        colors: ['not-a-color', 'another-fake']
      };
      const canonical = convertToCanonical(parsed, false);
      expect(canonical.colors).toEqual(['#000000', '#ffffff']);
      expect(canonical.name).toBe('Empty Palette');
      expect(canonical.isCustom).toBe(false);
    });
  });

  describe('parseGpl', () => {
    it('should parse valid GIMP GPL palette text', () => {
      const gplText = `
GIMP Palette
Name: Test Palette
Columns: 4
# Comment
  0   0   0	Black
255 255 255	White
255   0   0	Red
      `;
      const colors = parseGpl(gplText);
      expect(colors).toEqual(['#000000', '#ffffff', '#ff0000']);
    });

    it('should ignore corrupt or out-of-bounds rows in GPL files', () => {
      const corruptGpl = `
GIMP Palette
Name: Corrupt
256 0 0 Red (Out of bounds)
-1 50 100 Negatives
100 200 120 Valid row
abc def ghi Non-numeric
      `;
      const colors = parseGpl(corruptGpl);
      expect(colors).toEqual(['#64c878']); // rgb(100, 200, 120) -> #64c878
    });
  });

  describe('parseJascPal', () => {
    it('should parse valid JASC-PAL text', () => {
      const jascText = `
JASC-PAL
0100
3
0 0 0
255 255 255
0 0 255
      `;
      const colors = parseJascPal(jascText);
      expect(colors).toEqual(['#000000', '#ffffff', '#0000ff']);
    });

    it('should handle JASC-PAL files with corrupt lines gracefully', () => {
      const corruptJasc = `
JASC-PAL
0100
2
0 0 0
300 12 12
abc 50 50
100 100 100
      `;
      const colors = parseJascPal(corruptJasc);
      expect(colors).toEqual(['#000000', '#646464']);
    });
  });

  describe('parseRiffPal', () => {
    it('should return empty list on invalid signature', () => {
      const buffer = new ArrayBuffer(16);
      const colors = parseRiffPal(buffer);
      expect(colors).toEqual([]);
    });

    it('should parse valid RIFF PAL binary structure', () => {
      const buffer = new ArrayBuffer(40);
      const view = new DataView(buffer);
      
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 32, true);          // Size
      view.setUint32(8, 0x50414C20, false); // "PAL "
      
      view.setUint32(12, 0x64617461, false); // "data"
      view.setUint32(16, 16, true);          // chunk size
      view.setUint16(20, 0x0300, true);      // Version (3.0)
      view.setUint16(22, 2, true);           // Color count (2)
      
      view.setUint8(24, 255);
      view.setUint8(25, 0);
      view.setUint8(26, 0);
      view.setUint8(27, 0);
      
      view.setUint8(28, 0);
      view.setUint8(29, 255);
      view.setUint8(30, 0);
      view.setUint8(31, 0);
      
      const colors = parseRiffPal(buffer);
      expect(colors).toEqual(['#ff0000', '#00ff00']);
    });
  });

  describe('parseAct', () => {
    it('should parse Adobe ACT palette files correctly', () => {
      const buffer = new ArrayBuffer(768);
      const bytes = new Uint8Array(buffer);
      bytes[0] = 255; bytes[1] = 0; bytes[2] = 0;
      bytes[3] = 0; bytes[4] = 255; bytes[5] = 0;
      
      const colors = parseAct(buffer);
      expect(colors.slice(0, 2)).toEqual(['#ff0000', '#00ff00']);
    });
  });

  describe('parseAco', () => {
    it('should return empty list on invalid/empty ACO buffer', () => {
      const buffer = new ArrayBuffer(2);
      const colors = parseAco(buffer);
      expect(colors).toEqual([]);
    });

    it('should parse ACO v1 RGB correctly', () => {
      const buffer = new ArrayBuffer(24);
      const view = new DataView(buffer);
      view.setUint16(0, 1, false); // version 1
      view.setUint16(2, 2, false); // count 2
      
      view.setUint16(4, 0, false);      // RGB space
      view.setUint16(6, 255 << 8, false); // Red
      view.setUint16(8, 0, false);       // Green
      view.setUint16(10, 0, false);      // Blue
      view.setUint16(12, 0, false);      // Padding
      
      view.setUint16(14, 0, false);      // RGB space
      view.setUint16(16, 0, false);      // Red
      view.setUint16(18, 255 << 8, false); // Green
      view.setUint16(20, 0, false);      // Blue
      view.setUint16(22, 0, false);      // Padding
      
      const colors = parseAco(buffer);
      expect(colors).toEqual(['#ff0000', '#00ff00']);
    });
  });

  describe('parseAse', () => {
    it('should return empty list on invalid ASE buffer', () => {
      const buffer = new ArrayBuffer(8);
      const colors = parseAse(buffer);
      expect(colors).toEqual([]);
    });
  });

  describe('parseColorsFromText', () => {
    it('should parse standard JSON array of hex values', () => {
      const json = JSON.stringify(['#FF0000', '#00FF00', '0000FF']);
      const colors = parseColorsFromText(json);
      expect(colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('should extract hex colors from any random text block', () => {
      const randomText = 'Some notes, here is Red: #FF0000, and Green: #00FF00.';
      const colors = parseColorsFromText(randomText);
      expect(colors).toEqual(['#ff0000', '#00ff00']);
    });

    it('should parse partially compatible XML/HTML rgb values', () => {
      const text = '<color r="255" g="10" b="20"/> <color red="0" green="255" blue="0"/>';
      const colors = parseColorsFromText(text);
      expect(colors).toEqual(['#ff0a14', '#00ff00']);
    });
  });

  describe('parsePaletteFile - Guardrails & Validation', () => {
    it('should reject with a clear error for files larger than 5MB', async () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'giant.gpl', { type: 'text/plain' });
      await expect(parsePaletteFile(largeFile)).rejects.toThrow('El archivo supera el límite máximo de tamaño de 5MB.');
    });

    it('should reject with a clear error for empty files', async () => {
      const emptyFile = new File([], 'empty.gpl', { type: 'text/plain' });
      await expect(parsePaletteFile(emptyFile)).rejects.toThrow('El archivo de paleta seleccionado está vacío.');
    });
  });
});
