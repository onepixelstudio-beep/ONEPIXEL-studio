import { PixelProject } from '../types';
import { drawFrameOnCanvas } from './frameRenderer';

export interface AnimationSequenceFrame {
  canvas: HTMLCanvasElement;
  durationMs: number;
  pixels?: Uint8Array;
}

export interface AnimationSequence {
  frames: AnimationSequenceFrame[];
}

export interface SequenceBuilderOptions {
  fps?: number;
  bgColor?: string;
  useTransparent?: boolean;
  signal?: AbortSignal;
}

/**
 * Layer 1: AnimationSequence Builder.
 * Converts the project layers/frames into a clean, ordered sequence of canvases
 * with specific durations, completely independent of the Timeline.
 */
export function buildAnimationSequence(
  project: PixelProject,
  frameIds: string[],
  scale: number,
  options: SequenceBuilderOptions = {}
): AnimationSequence {
  const { signal } = options;
  const frames: AnimationSequenceFrame[] = [];
  
  // Resolve FPS or fallback to project default
  const fps = options.fps ?? project.fps ?? 12;
  const defaultDurationMs = Math.round(1000 / fps);

  for (const frameId of frameIds) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const canvas = document.createElement('canvas');
    canvas.width = project.width * scale;
    canvas.height = project.height * scale;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw frame pixels using the Unified Frame Renderer
      drawFrameOnCanvas(
        ctx,
        frameId,
        project.width,
        project.height,
        scale,
        project.layers,
        project.pixels,
        options.useTransparent ? undefined : options.bgColor
      );
    }

    frames.push({
      canvas,
      durationMs: defaultDurationMs, // Readily structured for individual frame duration overrides in the future
    });
  }

  return { frames };
}
export type { AnimationSequence as TypeAnimationSequence };
