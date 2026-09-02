// Custom Low-Level Binary Encoders for various export formats

export function encodeBMP(width: number, height: number, rgbaData: Uint8ClampedArray): Blob {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP Header
  view.setUint16(0, 0x4D42, true); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true); // Offset to pixel data

  // DIB Header
  view.setUint32(14, 40, true); // DIB header size
  view.setUint32(18, width, true);
  view.setInt32(22, -height, true); // top-down
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // 24-bit RGB
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const uint8View = new Uint8Array(buffer);
  let offset = 54;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    let colOffset = 0;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * 4;
      const r = rgbaData[idx];
      const g = rgbaData[idx + 1];
      const b = rgbaData[idx + 2];

      uint8View[offset + colOffset] = b;
      uint8View[offset + colOffset + 1] = g;
      uint8View[offset + colOffset + 2] = r;
      colOffset += 3;
    }
    for (let p = colOffset; p < rowSize; p++) {
      uint8View[offset + p] = 0;
    }
    offset += rowSize;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

export function encodeTGA(width: number, height: number, rgbaData: Uint8ClampedArray): Blob {
  const headerSize = 18;
  const pixelDataSize = width * height * 4;
  const fileSize = headerSize + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint8(2, 2); // Uncompressed true-color
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  view.setUint8(16, 32); // 32 bits per pixel (RGBA)
  view.setUint8(17, 40); // 0x28: top-left descriptor + 8 alpha bits

  const uint8View = new Uint8Array(buffer);
  let offset = 18;
  for (let i = 0; i < rgbaData.length; i += 4) {
    const r = rgbaData[i];
    const g = rgbaData[i + 1];
    const b = rgbaData[i + 2];
    const a = rgbaData[i + 3];

    uint8View[offset] = b;
    uint8View[offset + 1] = g;
    uint8View[offset + 2] = r;
    uint8View[offset + 3] = a;
    offset += 4;
  }

  return new Blob([buffer], { type: 'image/x-tga' });
}

export function encodeTIFF(width: number, height: number, rgbaData: Uint8ClampedArray): Blob {
  const headerSize = 8;
  const numEntries = 10;
  const ifdSize = 2 + numEntries * 12 + 4; // 134 bytes
  const bpOffset = headerSize + ifdSize; // 134
  const pixelDataOffset = 144; // aligned to 4-byte boundary
  const pixelDataSize = width * height * 4;
  const fileSize = pixelDataOffset + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // 1. TIFF Header
  view.setUint16(0, 0x4949, true); // "II" (Little Endian)
  view.setUint16(2, 42, true);     // TIFF magic number
  view.setUint32(4, 8, true);      // Offset of first IFD

  // 2. IFD entries
  view.setUint16(8, numEntries, true);

  let entryOffset = 10;

  const writeEntry = (tag: number, type: number, count: number, value: number) => {
    view.setUint16(entryOffset, tag, true);
    view.setUint16(entryOffset + 2, type, true);
    view.setUint32(entryOffset + 4, count, true);
    view.setUint32(entryOffset + 8, value, true);
    entryOffset += 12;
  };

  writeEntry(256, 4, 1, width);
  writeEntry(257, 4, 1, height);
  writeEntry(258, 3, 4, bpOffset);
  writeEntry(259, 3, 1, 1);
  writeEntry(262, 3, 1, 2);
  writeEntry(273, 4, 1, pixelDataOffset);
  writeEntry(277, 3, 1, 4);
  writeEntry(278, 4, 1, height);
  writeEntry(279, 4, 1, pixelDataSize);
  writeEntry(338, 3, 1, 2);

  view.setUint32(entryOffset, 0, true);

  view.setUint16(bpOffset, 8, true);
  view.setUint16(bpOffset + 2, 8, true);
  view.setUint16(bpOffset + 4, 8, true);
  view.setUint16(bpOffset + 6, 8, true);

  const uint8View = new Uint8Array(buffer);
  uint8View.set(rgbaData, pixelDataOffset);

  return new Blob([buffer], { type: 'image/tiff' });
}

export function encodeICO(pngBlob: Blob): Promise<Blob> {
  return pngBlob.arrayBuffer().then((pngBuffer) => {
    const headerSize = 6;
    const entrySize = 16;
    const fileSize = headerSize + entrySize + pngBuffer.byteLength;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    view.setUint16(2, 1, true); // .ico type
    view.setUint16(4, 1, true); // 1 image

    view.setUint8(6, 32); // width (32)
    view.setUint8(7, 32); // height (32)
    view.setUint8(8, 0);
    view.setUint8(9, 0);
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBuffer.byteLength, true);
    view.setUint32(18, headerSize + entrySize, true);

    const uint8View = new Uint8Array(buffer);
    uint8View.set(new Uint8Array(pngBuffer), headerSize + entrySize);

    return new Blob([buffer], { type: 'image/x-icon' });
  });
}

export function encodeACT(colors: string[]): Blob {
  const buffer = new ArrayBuffer(768);
  const view = new DataView(buffer);

  for (let i = 0; i < 256; i++) {
    const color = colors[i] || '#000000';
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;

    view.setUint8(i * 3, r);
    view.setUint8(i * 3 + 1, g);
    view.setUint8(i * 3 + 2, b);
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

export function encodeACO(colors: string[]): Blob {
  const entrySize = 10;
  const headerSize = 4;
  const fileSize = headerSize + colors.length * entrySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint16(0, 1); // ACO version 1
  view.setUint16(2, colors.length);

  let offset = 4;
  colors.forEach((color) => {
    const r = (parseInt(color.slice(1, 3), 16) || 0) * 257;
    const g = (parseInt(color.slice(3, 5), 16) || 0) * 257;
    const b = (parseInt(color.slice(5, 7), 16) || 0) * 257;

    view.setUint16(offset, 0); // RGB Color Space
    view.setUint16(offset + 2, r);
    view.setUint16(offset + 4, g);
    view.setUint16(offset + 6, b);
    view.setUint16(offset + 8, 0);
    offset += entrySize;
  });

  return new Blob([buffer], { type: 'application/octet-stream' });
}

export function encodeGPL(name: string, colors: string[]): string {
  let gpl = `GIMP Palette\nName: ${name}\nColumns: 16\n#\n`;
  colors.forEach((color, idx) => {
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;
    gpl += `${r.toString().padStart(3, ' ')} ${g.toString().padStart(3, ' ')} ${b.toString().padStart(3, ' ')} Color ${idx + 1}\n`;
  });
  return gpl;
}

export function encodePAL(colors: string[]): string {
  let pal = `JASC-PAL\n0100\n256\n`;
  for (let i = 0; i < 256; i++) {
    const color = colors[i] || '#000000';
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;
    pal += `${r} ${g} ${b}\n`;
  }
  return pal;
}
