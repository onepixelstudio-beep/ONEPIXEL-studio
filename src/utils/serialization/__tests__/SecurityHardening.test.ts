import { describe, it, expect } from 'vitest';
import { ProjectDeserializer } from '../ProjectDeserializer';
import { parseAseprite } from '../../aseReader';

describe('Security Hardening Pre-Release Audit & Protection Suite', () => {
  describe('ProjectDeserializer Security Boundary', () => {
    it('rejects invalid width values (negative, zero, decimal, NaN, Infinity, > 600)', () => {
      const invalidWidths = [-1, 0, 32.5, NaN, Infinity, -Infinity, 601, 1000];

      for (const w of invalidWidths) {
        expect(() => {
          ProjectDeserializer.deserialize({
            id: 'test',
            width: w,
            height: 32,
            layers: [{ id: 'l1', name: 'Layer 1' }],
            frames: [{ id: 'f1', name: 'Frame 1' }]
          });
        }).toThrow(/Ancho de lienzo inválido/);
      }
    });

    it('rejects invalid height values (negative, zero, decimal, NaN, Infinity, > 600)', () => {
      const invalidHeights = [-5, 0, 16.2, NaN, Infinity, -Infinity, 601, 2000];

      for (const h of invalidHeights) {
        expect(() => {
          ProjectDeserializer.deserialize({
            id: 'test',
            width: 32,
            height: h,
            layers: [{ id: 'l1', name: 'Layer 1' }],
            frames: [{ id: 'f1', name: 'Frame 1' }]
          });
        }).toThrow(/Alto de lienzo inválido/);
      }
    });

    it('rejects project exceeding 500 frames', () => {
      const frames = new Array(501).fill(null).map((_, i) => ({ id: `f-${i}`, name: `Frame ${i}` }));
      expect(() => {
        ProjectDeserializer.deserialize({
          id: 'test-frames-overflow',
          width: 32,
          height: 32,
          frames,
          layers: [{ id: 'l1', name: 'Capa 1' }]
        });
      }).toThrow(/supera el límite máximo permitido de 500 fotogramas/);
    });

    it('rejects project exceeding 100 layers', () => {
      const layers = new Array(101).fill(null).map((_, i) => ({ id: `l-${i}`, name: `Capa ${i}` }));
      expect(() => {
        ProjectDeserializer.deserialize({
          id: 'test-layers-overflow',
          width: 32,
          height: 32,
          frames: [{ id: 'f1', name: 'Frame 1' }],
          layers
        });
      }).toThrow(/supera el límite máximo permitido de 100 capas/);
    });

    it('rejects project exceeding total pixel quota (width * height * frames * layers > 50,000,000)', () => {
      // 600 * 600 = 360,000 per cel. 100 frames * 100 layers = 10,000 cels -> 3,600,000,000 total pixels
      const frames = new Array(200).fill(null).map((_, i) => ({ id: `f-${i}`, name: `Frame ${i}` }));
      const layers = new Array(100).fill(null).map((_, i) => ({ id: `l-${i}`, name: `Capa ${i}` }));

      expect(() => {
        ProjectDeserializer.deserialize({
          id: 'test-volume-overflow',
          width: 600,
          height: 600,
          frames,
          layers
        });
      }).toThrow(/supera la cuota de seguridad de 50,000,000 celdas/);
    });

    it('rejects cel pixel array exceeding width * height', () => {
      expect(() => {
        ProjectDeserializer.deserialize({
          id: 'test-cel-overflow',
          width: 2,
          height: 2, // max 4 pixels
          layers: [{ id: 'l1', name: 'Capa 1' }],
          frames: [{ id: 'f1', name: 'Frame 1' }],
          pixels: {
            'f1': {
              'l1': ['#fff', '#fff', '#fff', '#fff', '#fff'] // 5 pixels > 4
            }
          }
        });
      }).toThrow(/superando el tamaño del lienzo/);
    });

    it('rejects non-object or array root data', () => {
      expect(() => ProjectDeserializer.deserialize('invalid json')).toThrow(/Failed to parse JSON/);
      expect(() => ProjectDeserializer.deserialize(12345 as any)).toThrow(/Invalid input data type/);
      expect(() => ProjectDeserializer.deserialize(null as any)).toThrow(/Invalid input data type/);
      expect(() => ProjectDeserializer.deserialize([] as any)).toThrow(/Decoded data is not a valid object/);
    });

    it('sanitizes strings and limits lengths safely', () => {
      const longName = 'A'.repeat(500);
      const res = ProjectDeserializer.deserialize({
        id: 'test-sanitization',
        name: longName,
        width: 32,
        height: 32,
        layers: [{ id: 'l1', name: 'Capa 1' }],
        frames: [{ id: 'f1', name: 'Frame 1' }]
      });

      expect(res.project.name.length).toBe(256);
    });
  });

  describe('AseReader Security Boundary', () => {
    it('rejects buffer shorter than 124 bytes', () => {
      const buffer = new ArrayBuffer(50);
      expect(() => parseAseprite(buffer)).toThrow(/Archivo Aseprite demasiado corto/);
    });

    it('rejects buffer with invalid magic byte', () => {
      const buffer = new ArrayBuffer(128);
      const view = new DataView(buffer);
      view.setUint16(4, 0x1234, true); // Wrong magic
      expect(() => parseAseprite(buffer)).toThrow(/Firma de archivo Aseprite inválida/);
    });

    it('rejects Aseprite file with dimensions exceeding 600x600', () => {
      const buffer = new ArrayBuffer(128);
      const view = new DataView(buffer);
      view.setUint16(4, 0xA5E0, true); // Valid magic
      view.setUint16(6, 1, true); // 1 frame
      view.setUint16(8, 800, true); // Width 800 > 600
      view.setUint16(10, 32, true);
      expect(() => parseAseprite(buffer)).toThrow(/fuera del límite permitido de 600×600 px/);
    });

    it('rejects Aseprite chunk with chunkSize < 6 to prevent zero-chunk infinite loop', () => {
      // 124 header + 32 frame = 156 bytes
      const buffer = new ArrayBuffer(160);
      const view = new DataView(buffer);
      view.setUint16(4, 0xA5E0, true); // Valid magic
      view.setUint16(6, 1, true); // 1 frame
      view.setUint16(8, 32, true); // 32x32
      view.setUint16(10, 32, true);

      // Frame 0 at offset 124
      const frameOffset = 124;
      view.setUint32(frameOffset, 32, true); // frameSize 32
      view.setUint16(frameOffset + 4, 0xF1FA, true); // Frame magic
      view.setUint16(frameOffset + 6, 1, true); // 1 chunk

      // Chunk at offset 124 + 16 = 140
      const chunkOffset = frameOffset + 16;
      view.setUint32(chunkOffset, 0, true); // chunkSize = 0! (Malicious zero chunk)
      view.setUint16(chunkOffset + 4, 0x2004, true);

      expect(() => parseAseprite(buffer)).toThrow(/Tamaño de chunk inválido \(0\)/);
    });

    it('rejects chunk whose size exceeds frame boundaries', () => {
      const buffer = new ArrayBuffer(160);
      const view = new DataView(buffer);
      view.setUint16(4, 0xA5E0, true);
      view.setUint16(6, 1, true);
      view.setUint16(8, 32, true);
      view.setUint16(10, 32, true);

      const frameOffset = 124;
      view.setUint32(frameOffset, 32, true); // frameSize 32
      view.setUint16(frameOffset + 4, 0xF1FA, true);
      view.setUint16(frameOffset + 6, 1, true);

      const chunkOffset = frameOffset + 16;
      view.setUint32(chunkOffset, 50, true); // chunkSize 50 > remaining frame bytes!
      view.setUint16(chunkOffset + 4, 0x2004, true);

      expect(() => parseAseprite(buffer)).toThrow(/Tamaño de chunk inválido/);
    });
  });

  describe('HTML Entity Escaping in Support Submissions', () => {
    function escapeHtml(str: any): string {
      if (typeof str !== 'string') {
        if (str === null || str === undefined) return '';
        return String(str);
      }
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    it('escapes script tags and attributes in user input', () => {
      const maliciousSubject = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(maliciousSubject);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('escapes img onerror payloads and single quotes', () => {
      const maliciousPayload = "<img src=x onerror='alert(document.cookie)'>";
      const escaped = escapeHtml(maliciousPayload);
      expect(escaped).toBe('&lt;img src=x onerror=&#39;alert(document.cookie)&#39;&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain("'");
    });

    it('escapes ampersands safely', () => {
      const text = 'Rock & Roll & <Fun>';
      expect(escapeHtml(text)).toBe('Rock &amp; Roll &amp; &lt;Fun&gt;');
    });
  });
});
