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
    throw new Error('Archivo Aseprite demasiado corto (longitud inferior a 124 bytes)');
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

  // Security bounds on dimensions
  if (width < 1 || height < 1 || width > 600 || height > 600) {
    throw new Error(`Dimensiones Aseprite inválidas o fuera del límite permitido de 600×600 px (${width}×${height} px)`);
  }

  if (numFrames < 1 || numFrames > 500) {
    throw new Error(`Cantidad de fotogramas inválida o excesiva en archivo Aseprite (${numFrames})`);
  }

  let offset = 124;

  const layers: AsepriteLayer[] = [];
  const frames: AsepriteFrame[] = [];
  const palette: string[] = new Array(256).fill('#00000000');

  // Helper to read string safely with bounds check
  function readString(off: number): { str: string, bytesRead: number } {
    if (off + 2 > bytes.length) {
      throw new Error('Offset fuera de rango al leer longitud de cadena en Aseprite');
    }
    const len = view.getUint16(off, true);
    if (off + 2 + len > bytes.length || len > 1024) {
      throw new Error('Longitud de cadena corrupta o excesiva en archivo Aseprite');
    }
    let str = '';
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[off + 2 + i]);
    }
    return { str, bytesRead: 2 + len };
  }

  // Parse frames
  for (let f = 0; f < numFrames; f++) {
    if (offset + 16 > bytes.length) break;

    const frameStart = offset;
    const frameSize = view.getUint32(offset, true);
    const frameMagic = view.getUint16(offset + 4, true);

    if (frameSize < 16 || frameStart + frameSize > bytes.length) {
      throw new Error(`Tamaño de fotograma corrupto o fuera de límites en frame ${f}`);
    }

    if (frameMagic !== 0xF1FA) {
      throw new Error(`Firma de fotograma inválida en frame ${f} (no es 0xF1FA)`);
    }

    const oldChunks = view.getUint16(offset + 6, true);
    const duration = view.getUint16(offset + 8, true);
    const newChunks = view.getUint32(offset + 12, true);
    const numChunks = newChunks === 0 ? oldChunks : newChunks;

    const celPixels: { [layerIndex: number]: string[] } = {};

    let chunkOffset = frameStart + 16;
    for (let c = 0; c < numChunks; c++) {
      if (chunkOffset >= frameStart + frameSize) break;
      if (chunkOffset + 6 > frameStart + frameSize || chunkOffset + 6 > bytes.length) {
        throw new Error(`Encabezado de chunk truncado en frame ${f}, chunk ${c}`);
      }

      const chunkSize = view.getUint32(chunkOffset, true);
      const chunkType = view.getUint16(chunkOffset + 4, true);

      // DEFENSIVE SECURITY VALIDATION: Prevent zero-size chunks and out-of-boundary chunks
      if (chunkSize < 6 || chunkOffset + chunkSize > frameStart + frameSize || chunkOffset + chunkSize > bytes.length) {
        throw new Error(`Tamaño de chunk inválido (${chunkSize}) en frame ${f}, chunk ${c}`);
      }

      const chunkDataStart = chunkOffset + 6;

      if (chunkType === 0x2004) {
        // Layer Chunk
        if (chunkDataStart + 14 > chunkOffset + chunkSize) {
          throw new Error(`Chunk de capa truncado en frame ${f}`);
        }
        const flags = view.getUint16(chunkDataStart, true);
        const visible = (flags & 1) !== 0;
        const layerType = view.getUint16(chunkDataStart + 2, true);
        const childLevel = view.getUint16(chunkDataStart + 4, true);
        const blendMode = view.getUint16(chunkDataStart + 8, true);
        const opacity = view.getUint8(chunkDataStart + 10);
        
        const { str: name } = readString(chunkDataStart + 12);
        
        // We only append to layers in the first frame
        if (f === 0) {
          if (layers.length >= 100) {
            throw new Error('El archivo Aseprite supera el límite de seguridad de 100 capas');
          }
          layers.push({ name, visible, opacity });
        }
      } 
      else if (chunkType === 0x2005) {
        // Cel Chunk
        if (chunkDataStart + 16 > chunkOffset + chunkSize) {
          throw new Error(`Chunk Cel truncado en frame ${f}`);
        }
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
          if (chunkDataStart + 20 > chunkOffset + chunkSize) {
            throw new Error(`Chunk Cel raw con tamaño insuficiente en frame ${f}`);
          }
          celW = view.getUint16(chunkDataStart + 16, true);
          celH = view.getUint16(chunkDataStart + 18, true);
          if (celW > 600 || celH > 600) {
            throw new Error(`Dimensiones de Cel excesivas (${celW}×${celH}) en frame ${f}`);
          }
          const rawSize = chunkSize - 6 - 20;
          if (chunkDataStart + 20 + rawSize > bytes.length) {
            throw new Error(`Datos raw de cel truncados en frame ${f}`);
          }
          pixelBytes = bytes.subarray(chunkDataStart + 20, chunkDataStart + 20 + rawSize);
        } 
        else if (celType === 2) {
          // Compressed Cel
          if (chunkDataStart + 20 > chunkOffset + chunkSize) {
            throw new Error(`Chunk Cel comprimido con tamaño insuficiente en frame ${f}`);
          }
          celW = view.getUint16(chunkDataStart + 16, true);
          celH = view.getUint16(chunkDataStart + 18, true);
          if (celW > 600 || celH > 600) {
            throw new Error(`Dimensiones de Cel comprimido excesivas (${celW}×${celH}) en frame ${f}`);
          }
          const compressedSize = chunkSize - 6 - 20;
          if (chunkDataStart + 20 + compressedSize > bytes.length) {
            throw new Error(`Datos de Cel comprimido truncados en frame ${f}`);
          }
          const compressed = bytes.subarray(chunkDataStart + 20, chunkDataStart + 20 + compressedSize);
          try {
            pixelBytes = inflateSync(compressed);
          } catch (err: any) {
            throw new Error(`Error al descomprimir cel en frame ${f}: ${err?.message || err}`);
          }
        }
        else if (celType === 1) {
          // Linked Cel (copies pixel data from another frame)
          if (chunkDataStart + 18 > chunkOffset + chunkSize) {
            throw new Error(`Chunk Cel vinculado truncado en frame ${f}`);
          }
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
          if (idx >= 256 || palOffset + 6 > chunkOffset + chunkSize || palOffset + 6 > bytes.length) break;
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
