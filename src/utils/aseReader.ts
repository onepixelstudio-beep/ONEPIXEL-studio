import { inflateSync } from 'fflate';

export interface AsepriteLayer {
  name: string;
  visible: boolean;
  opacity: number;
}

export interface AsepriteFrame {
  duration: number;
  // Map of layerIndex -> pixel hex array of size (width * height)
  celPixels: { [layerIndex: number]: string[] };
}

export interface ParsedAseprite {
  width: number;
  height: number;
  layers: AsepriteLayer[];
  frames: AsepriteFrame[];
  palette: string[]; // hex array
}

export function parseAseprite(arrayBuffer: ArrayBuffer): ParsedAseprite {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  // 1. File Header
  if (arrayBuffer.byteLength < 124) {
    throw new Error('Archivo Aseprite demasiado corto');
  }

  const fileSize = view.getUint32(0, true);
  const magic = view.getUint16(4, true);
  if (magic !== 0xA5E0) {
    throw new Error('Firma de archivo Aseprite inválida (no es 0xA5E0)');
  }

  const numFrames = view.getUint16(6, true);
  const width = view.getUint16(8, true);
  const height = view.getUint16(10, true);
  const colorDepth = view.getUint16(12, true); // 32, 16, or 8 bpp
  const paletteIndex = view.getUint8(28);

  let offset = 124;

  const layers: AsepriteLayer[] = [];
  const frames: AsepriteFrame[] = [];
  const palette: string[] = new Array(256).fill('#00000000');

  // Helper to read string
  function readString(off: number): { str: string, bytesRead: number } {
    const len = view.getUint16(off, true);
    let str = '';
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[off + 2 + i]);
    }
    return { str, bytesRead: 2 + len };
  }

  // Parse frames
  for (let f = 0; f < numFrames; f++) {
    if (offset >= bytes.length) break;

    const frameStart = offset;
    const frameSize = view.getUint32(offset, true);
    const frameMagic = view.getUint16(offset + 4, true);

    if (frameMagic !== 0xF1FA) {
      // Skip or error
      offset += frameSize;
      continue;
    }

    const oldChunks = view.getUint16(offset + 6, true);
    const duration = view.getUint16(offset + 8, true);
    const newChunks = view.getUint32(offset + 12, true);
    const numChunks = newChunks === 0 ? oldChunks : newChunks;

    const celPixels: { [layerIndex: number]: string[] } = {};

    let chunkOffset = frameStart + 16;
    for (let c = 0; c < numChunks; c++) {
      if (chunkOffset >= frameStart + frameSize) break;

      const chunkSize = view.getUint32(chunkOffset, true);
      const chunkType = view.getUint16(chunkOffset + 4, true);

      const chunkDataStart = chunkOffset + 6;

      if (chunkType === 0x2004) {
        // Layer Chunk
        const flags = view.getUint16(chunkDataStart, true);
        const visible = (flags & 1) !== 0;
        const layerType = view.getUint16(chunkDataStart + 2, true);
        const childLevel = view.getUint16(chunkDataStart + 4, true);
        const blendMode = view.getUint16(chunkDataStart + 8, true);
        const opacity = view.getUint8(chunkDataStart + 10);
        
        const { str: name } = readString(chunkDataStart + 12);
        
        // We only append to layers in the first frame
        if (f === 0) {
          layers.push({ name, visible, opacity });
        }
      } 
      else if (chunkType === 0x2005) {
        // Cel Chunk
        const layerIndex = view.getUint16(chunkDataStart, true);
        const x = view.getInt16(chunkDataStart + 2, true);
        const y = view.getInt16(chunkDataStart + 4, true);
        const opacity = view.getUint8(chunkDataStart + 6);
        const celType = view.getUint16(chunkDataStart + 7, true);
        const zIndex = view.getInt16(chunkDataStart + 9, true);

        // Pixel arrays
        let celW = 0;
        let celH = 0;
        let pixelBytes: Uint8Array | null = null;

        if (celType === 0) {
          // Raw Cel
          celW = view.getUint16(chunkDataStart + 16, true);
          celH = view.getUint16(chunkDataStart + 18, true);
          const rawSize = chunkSize - 6 - 20;
          pixelBytes = bytes.subarray(chunkDataStart + 20, chunkDataStart + 20 + rawSize);
        } 
        else if (celType === 2) {
          // Compressed Cel
          celW = view.getUint16(chunkDataStart + 16, true);
          celH = view.getUint16(chunkDataStart + 18, true);
          const compressedSize = chunkSize - 6 - 20;
          const compressed = bytes.subarray(chunkDataStart + 20, chunkDataStart + 20 + compressedSize);
          try {
            pixelBytes = inflateSync(compressed);
          } catch (err) {
            console.error('Error inflating compressed cel chunk:', err);
          }
        }
        else if (celType === 1) {
          // Linked Cel (copies pixel data from another frame)
          const linkFrame = view.getUint16(chunkDataStart + 16, true);
          if (frames[linkFrame] && frames[linkFrame].celPixels[layerIndex]) {
            celPixels[layerIndex] = [...frames[linkFrame].celPixels[layerIndex]];
          }
        }

        if (pixelBytes) {
          const pixels: string[] = new Array(width * height).fill('');
          
          let byteIdx = 0;
          for (let cy = 0; cy < celH; cy++) {
            for (let cx = 0; cx < celW; cx++) {
              const targetX = x + cx;
              const targetY = y + cy;

              let color = '';
              if (colorDepth === 32) {
                // RGBA
                if (byteIdx + 3 < pixelBytes.length) {
                  const r = pixelBytes[byteIdx];
                  const g = pixelBytes[byteIdx + 1];
                  const b = pixelBytes[byteIdx + 2];
                  const a = pixelBytes[byteIdx + 3];
                  if (a > 0) {
                    color = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    // Add alpha if not fully opaque
                    if (a < 255) {
                      color += a.toString(16).padStart(2, '0');
                    }
                  }
                }
                byteIdx += 4;
              } 
              else if (colorDepth === 8) {
                // Indexed
                if (byteIdx < pixelBytes.length) {
                  const index = pixelBytes[byteIdx];
                  if (index !== paletteIndex) {
                    color = palette[index] || '';
                  }
                }
                byteIdx += 1;
              } 
              else if (colorDepth === 16) {
                // Grayscale
                if (byteIdx + 1 < pixelBytes.length) {
                  const gray = pixelBytes[byteIdx];
                  const a = pixelBytes[byteIdx + 1];
                  if (a > 0) {
                    color = '#' + ((1 << 24) + (gray << 16) + (gray << 8) + gray).toString(16).slice(1);
                    if (a < 255) {
                      color += a.toString(16).padStart(2, '0');
                    }
                  }
                }
                byteIdx += 2;
              }

              if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
                pixels[targetY * width + targetX] = color;
              }
            }
          }
          celPixels[layerIndex] = pixels;
        }
      }
      else if (chunkType === 0x2019) {
        // Palette Chunk
        const paletteSize = view.getUint32(chunkDataStart, true);
        const firstIdx = view.getUint32(chunkDataStart + 4, true);
        const lastIdx = view.getUint32(chunkDataStart + 8, true);
        
        let palOffset = chunkDataStart + 20;
        for (let idx = firstIdx; idx <= lastIdx; idx++) {
          if (idx >= 256 || palOffset >= chunkOffset + chunkSize) break;
          const flags = view.getUint16(palOffset, true);
          const r = view.getUint8(palOffset + 2);
          const g = view.getUint8(palOffset + 3);
          const b = view.getUint8(palOffset + 4);
          const a = view.getUint8(palOffset + 5);
          
          let color = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          if (a < 255) {
            color += a.toString(16).padStart(2, '0');
          }
          palette[idx] = color;

          palOffset += 6;
          if (flags & 1) {
            const { bytesRead } = readString(palOffset);
            palOffset += bytesRead;
          }
        }
      }

      chunkOffset += chunkSize;
    }

    frames.push({ duration, celPixels });
    offset += frameSize;
  }

  // Ensure layers are filled in case first frame didn't have Layer Chunks (rare)
  if (layers.length === 0) {
    layers.push({ name: 'Capa 1', visible: true, opacity: 100 });
  }

  return {
    width,
    height,
    layers,
    frames,
    palette: palette.filter(c => c !== '#00000000')
  };
}
