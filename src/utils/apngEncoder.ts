import { AnimationSequence } from './animationSequenceBuilder';

export interface ApngEncoderOptions {
  loop?: boolean; // true = repeat forever (0), false = once (1)
  onProgress?: (stepName: string, progressPercentage: number) => void;
  signal?: AbortSignal;
}

interface PngChunk {
  type: string;
  data: Uint8Array;
}

// CRC-32 table initialization
const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

/**
 * Computes standard CRC-32 checksum.
 */
function crc32(bytes: Uint8Array, start = 0, end = bytes.length): number {
  let crc = -1;
  for (let i = start; i < end; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Helper to wrap type and data into a standard PNG chunk byte array.
 */
function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunkBytes = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunkBytes.buffer);
  
  // 1. Length (4 bytes)
  view.setUint32(0, len, false);
  
  // 2. Type (4 bytes)
  for (let i = 0; i < 4; i++) {
    chunkBytes[4 + i] = type.charCodeAt(i);
  }
  
  // 3. Data (len bytes)
  chunkBytes.set(data, 8);
  
  // 4. CRC (4 bytes) - Computed over Type + Data
  const crcVal = crc32(chunkBytes, 4, 8 + len);
  view.setUint32(8 + len, crcVal, false);
  
  return chunkBytes;
}

/**
 * Parses PNG bytes into individual chunks.
 */
function parsePngChunks(pngBytes: Uint8Array): PngChunk[] {
  const chunks: PngChunk[] = [];
  let offset = 8; // Skip PNG signature
  
  while (offset < pngBytes.length) {
    if (offset + 8 > pngBytes.length) break;
    
    const dataView = new DataView(pngBytes.buffer, pngBytes.byteOffset + offset, 8);
    const length = dataView.getUint32(0, false);
    const typeBytes = pngBytes.slice(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);
    
    offset += 8;
    
    if (offset + length + 4 > pngBytes.length) {
      break; // Malformed/truncated chunk
    }
    
    const data = pngBytes.slice(offset, offset + length);
    offset += length;
    
    // Skip original CRC
    offset += 4;
    
    chunks.push({ type, data });
    
    if (type === 'IEND') {
      break;
    }
  }
  return chunks;
}

/**
 * Converts a Canvas (HTMLCanvasElement or OffscreenCanvas) into a standard PNG Uint8Array.
 */
async function canvasToPngBytes(canvas: any): Promise<Uint8Array> {
  if (!canvas) {
    throw new Error('Canvas element is null or undefined');
  }

  if (typeof canvas.convertToBlob === 'function') {
    // OffscreenCanvas support
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } else if (typeof canvas.toBlob === 'function') {
    // HTMLCanvasElement support
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Failed to get blob from canvas'));
          return;
        }
        try {
          const arrayBuffer = await blob.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        } catch (err) {
          reject(err);
        }
      }, 'image/png');
    });
  } else {
    throw new Error('Unsupported canvas implementation (neither convertToBlob nor toBlob found)');
  }
}

/**
 * Constructs an fcTL (Frame Control) chunk.
 */
function createFcTlChunk(
  seq: number,
  width: number,
  height: number,
  durationMs: number,
  disposeOp = 1, // APNG_DISPOSE_OP_BACKGROUND (safer for alpha overlays)
  blendOp = 0    // APNG_BLEND_OP_SOURCE (overwrite pixels fully)
): Uint8Array {
  const data = new Uint8Array(26);
  const view = new DataView(data.buffer);
  
  view.setUint32(0, seq, false);
  view.setUint32(4, width, false);
  view.setUint32(8, height, false);
  view.setUint32(12, 0, false); // x_offset = 0
  view.setUint32(16, 0, false); // y_offset = 0
  
  // Set delay in ms
  view.setUint16(20, durationMs, false);
  view.setUint16(22, 1000, false); // delay_den = 1000 (ms denominator)
  
  view.setUint8(24, disposeOp);
  view.setUint8(25, blendOp);
  
  return createPngChunk('fcTL', data);
}

/**
 * Constructs an fdAT (Frame Data) chunk.
 */
function createFdAtChunk(seq: number, idatData: Uint8Array): Uint8Array {
  const data = new Uint8Array(4 + idatData.length);
  const view = new DataView(data.buffer);
  
  view.setUint32(0, seq, false);
  data.set(idatData, 4);
  
  return createPngChunk('fdAT', data);
}

/**
 * Yields execution to the main thread to allow browser painting,
 * progress updates, and event loop handling.
 */
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Low-level APNG Encoder.
 * Reassembles standard PNG chunks from canvas frames into a high-quality Animated PNG (APNG) file.
 * Completely decoupled from React and specific Project states.
 */
export async function encodeApng(
  sequence: AnimationSequence,
  width: number,
  height: number,
  options: ApngEncoderOptions = {}
): Promise<Uint8Array> {
  const {
    loop = true,
    onProgress,
    signal
  } = options;

  const totalFrames = sequence.frames.length;
  if (totalFrames === 0) {
    throw new Error('No frames to encode');
  }

  const numPlays = loop ? 0 : 1;
  const chunksToJoin: Uint8Array[] = [];
  
  // APNG sequence number tracker
  let sequenceNumber = 0;

  // Step 1: Render and parse Frame 0
  onProgress?.('Preparing Frame 1...', 5);
  await yieldToMainThread();
  
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const frame0 = sequence.frames[0];
  const png0Bytes = await canvasToPngBytes(frame0.canvas);
  const chunks0 = parsePngChunks(png0Bytes);

  let ihdrChunk = chunks0.find(c => c.type === 'IHDR');
  if (!ihdrChunk) {
    // Synthesize standard 13-byte IHDR chunk for (width, height, 8 bit depth, RGBA color type 6)
    const ihdrData = new Uint8Array(13);
    const view = new DataView(ihdrData.buffer);
    view.setUint32(0, width || 1, false);
    view.setUint32(4, height || 1, false);
    view.setUint8(8, 8); // bit depth
    view.setUint8(9, 6); // color type: 6 = RGBA
    view.setUint8(10, 0); // compression method
    view.setUint8(11, 0); // filter method
    view.setUint8(12, 0); // interlace method
    ihdrChunk = { type: 'IHDR', data: ihdrData };
  }

  // PNG Signature (8 bytes)
  chunksToJoin.push(new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  
  // 1. IHDR Chunk
  chunksToJoin.push(createPngChunk('IHDR', ihdrChunk.data));

  // 2. acTL Chunk (Animation Control)
  onProgress?.('Preparing animation layout...', 15);
  await yieldToMainThread();
  
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  
  const acTlData = new Uint8Array(8);
  const acTlView = new DataView(acTlData.buffer);
  acTlView.setUint32(0, totalFrames, false);
  acTlView.setUint32(4, numPlays, false);
  chunksToJoin.push(createPngChunk('acTL', acTlData));

  // 3. Write auxiliary chunks from Frame 0 that are BEFORE IDAT
  for (const chunk of chunks0) {
    if (chunk.type !== 'IHDR' && chunk.type !== 'IDAT' && chunk.type !== 'IEND' && chunk.type !== 'acTL' && chunk.type !== 'fcTL') {
      chunksToJoin.push(createPngChunk(chunk.type, chunk.data));
    }
  }

  // 4. fcTL Chunk for Frame 0 (seq = 0)
  const fcTl0 = createFcTlChunk(sequenceNumber++, width, height, frame0.durationMs);
  chunksToJoin.push(fcTl0);

  // 5. IDAT Chunks for Frame 0
  let idatChunks0 = chunks0.filter(c => c.type === 'IDAT');
  if (idatChunks0.length === 0) {
    idatChunks0 = [{ type: 'IDAT', data: new Uint8Array([0x78, 0x9c, 0x62, 0x60, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01]) }];
  }
  for (const idat of idatChunks0) {
    chunksToJoin.push(createPngChunk('IDAT', idat.data));
  }

  // Step 2: Render, parse and convert subsequent frames (1 to N-1)
  for (let f = 1; f < totalFrames; f++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const currentProgress = 20 + Math.floor((f / totalFrames) * 75);
    onProgress?.(`Encoding Frame ${f + 1}/${totalFrames}...`, currentProgress);
    await yieldToMainThread();

    const frame = sequence.frames[f];
    const pngBytes = await canvasToPngBytes(frame.canvas);
    const chunks = parsePngChunks(pngBytes);

    // fcTL for Frame f
    const fcTl = createFcTlChunk(sequenceNumber++, width, height, frame.durationMs);
    chunksToJoin.push(fcTl);

    // Convert Frame f's IDAT chunks to fdAT chunks
    let idatChunks = chunks.filter(c => c.type === 'IDAT');
    if (idatChunks.length === 0) {
      idatChunks = [{ type: 'IDAT', data: new Uint8Array([0x78, 0x9c, 0x62, 0x60, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01]) }];
    }
    
    for (const idat of idatChunks) {
      const fdAt = createFdAtChunk(sequenceNumber++, idat.data);
      chunksToJoin.push(fdAt);
    }
  }

  onProgress?.('Saving animation...', 98);
  await yieldToMainThread();
  
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 6. IEND Chunk
  chunksToJoin.push(createPngChunk('IEND', new Uint8Array(0)));

  // Step 3: Concatenate all chunk segments into a single cohesive Uint8Array buffer
  onProgress?.('Assembling files...', 99);
  await yieldToMainThread();

  let totalSize = 0;
  for (const chunk of chunksToJoin) {
    totalSize += chunk.length;
  }

  const resultBytes = new Uint8Array(totalSize);
  let writeOffset = 0;
  for (const chunk of chunksToJoin) {
    resultBytes.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  onProgress?.('Complete', 100);
  return resultBytes;
}
