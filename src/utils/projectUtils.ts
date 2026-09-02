import { PixelProject } from '../types';
import { createEmptyPixels } from './canvas';

export function getProjectContentString(p: PixelProject): string {
  if (!p) return '';
  return JSON.stringify({
    name: p.name,
    pixels: p.pixels,
    layers: p.layers,
    frames: p.frames,
    fps: p.fps,
    guides: p.guides || []
  });
}

export function createInitialProject(w: number, h: number, bgFillColor?: string): PixelProject {
  const defaultLayerId = `layer-${Date.now()}`;
  const defaultFrameId = `frame-${Date.now()}`;
  const emptyPix = bgFillColor ? Array(w * h).fill(bgFillColor) : createEmptyPixels(w, h);

  return {
    id: `proj-${Date.now()}`,
    name: 'Untitled Pixel Art',
    width: w,
    height: h,
    layers: [{ id: defaultLayerId, name: 'Capa Base', opacity: 100, visible: true, locked: false }],
    frames: [{ id: defaultFrameId, name: 'Cuadro 1' }],
    pixels: {
      [defaultFrameId]: {
        [defaultLayerId]: emptyPix
      }
    },
    fps: 8,
    tags: ['Boceto'],
    lastSaved: Date.now()
  };
}
