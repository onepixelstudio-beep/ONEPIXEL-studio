import { GIFEncoder, applyPalette } from 'gifenc';
import { AnimationSequence } from './animationSequenceBuilder';
import { ColorQuantizer, PnnQuantizer } from './colorQuantizer';

export interface GifEncoderOptions {
  loop?: boolean; // true = repeat forever (0), false = once (-1)
  maxColors?: number; // 1 to 256
  useTransparent?: boolean;
  quantizer?: ColorQuantizer;
  onProgress?: (stepName: string, progressPercentage: number) => void;
  signal?: AbortSignal;
}

/**
 * Layer 4: GIF Encoder.
 * Quantizes and encodes an AnimationSequence into a compiled GIF Uint8Array.
 * Uses asynchronous chunking to keep the UI completely responsive.
 */
export async function encodeGif(
  sequence: AnimationSequence,
  width: number,
  height: number,
  options: GifEncoderOptions = {}
): Promise<Uint8Array> {
  const {
    loop = true,
    maxColors = 256,
    useTransparent = true,
    quantizer = new PnnQuantizer(),
    onProgress,
    signal
  } = options;

  const totalFrames = sequence.frames.length;
  if (totalFrames === 0) {
    throw new Error('No frames to encode');
  }

  // Step 1: Accumulate and concatenate pixels from all frames to build a single optimal global palette
  onProgress?.('Preparing...', 0);
  await yieldToMainThread();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Concatenate pixel bytes from all frames
  const totalPixelsLength = width * height * 4 * totalFrames;
  const combinedPixels = new Uint8Array(totalPixelsLength);

  let offset = 0;
  let hasAnyTransparentPixel = false;

  for (let f = 0; f < totalFrames; f++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const frame = sequence.frames[f];
    const ctx = frame.canvas.getContext('2d');
    if (!ctx) continue;

    const imgData = ctx.getImageData(0, 0, width, height);
    const framePixels = new Uint8Array(imgData.data.buffer);
    frame.pixels = framePixels; // Cache pixel data to eliminate redundant getImageData calls
    
    combinedPixels.set(framePixels, offset);
    offset += framePixels.length;

    // Fast transparency scan
    if (useTransparent && !hasAnyTransparentPixel) {
      for (let i = 3; i < framePixels.length; i += 4) {
        if (framePixels[i] < 128) {
          hasAnyTransparentPixel = true;
          break;
        }
      }
    }
  }

  // Step 2: Run Color Quantizer on the combined pixel data
  onProgress?.('Quantizing...', 15);
  await yieldToMainThread();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const format = useTransparent ? 'rgba4444' : 'rgb565';
  const palette = quantizer.quantize(combinedPixels, maxColors, format);

  // Step 3: Handle Transparency Index in Palette
  let transparentIndex = -1;
  let hasTransparent = false;

  if (useTransparent && hasAnyTransparentPixel) {
    let transIdx = palette.findIndex(c => c[3] === 0 || c[3] < 128);
    if (transIdx === -1) {
      // Ensure there is a transparent slot
      if (palette.length < 256) {
        palette.push([0, 0, 0, 0]);
        transIdx = palette.length - 1;
      } else {
        palette[palette.length - 1] = [0, 0, 0, 0];
        transIdx = palette.length - 1;
      }
    } else {
      palette[transIdx][3] = 0; // Force exact 0 alpha
    }
    transparentIndex = transIdx;
    hasTransparent = true;
  }

  // Step 4: Write frames using gifenc
  const gif = GIFEncoder();
  const repeat = loop ? 0 : -1;

  for (let f = 0; f < totalFrames; f++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Update progress between frames
    const currentProgress = 20 + Math.floor((f / totalFrames) * 75);
    onProgress?.(`Encoding Frame ${f + 1}/${totalFrames}...`, currentProgress);
    await yieldToMainThread();

    const frame = sequence.frames[f];
    let framePixels = frame.pixels;
    if (!framePixels) {
      const ctx = frame.canvas.getContext('2d');
      if (!ctx) continue;
      const imgData = ctx.getImageData(0, 0, width, height);
      framePixels = new Uint8Array(imgData.data.buffer);
    }

    // Apply global palette to map this frame's pixels
    const index = applyPalette(framePixels, palette, format);

    // Write frame into the stream
    gif.writeFrame(index, width, height, {
      palette,
      delay: frame.durationMs,
      transparent: hasTransparent,
      transparentIndex: hasTransparent ? transparentIndex : 0,
      repeat,
      first: f === 0
    });
  }

  onProgress?.('Saving...', 98);
  await yieldToMainThread();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  gif.finish();
  const resultBytes = gif.bytes();

  onProgress?.('Complete', 100);
  return resultBytes;
}

/**
 * Yields execution to the main thread to allow browser painting,
 * progress rendering, and processing cancellation events.
 */
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
