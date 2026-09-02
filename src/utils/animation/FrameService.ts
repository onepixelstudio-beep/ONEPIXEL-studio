import { Frame, Layer, ProjectPixels, FrameLayerPixels } from '../../types';

export interface FrameMutationResult {
  frames: Frame[];
  pixels: ProjectPixels;
}

export class FrameService {
  /**
   * Generates a blank pixels array for a given layer.
   */
  public static createBlankLayerPixels(width: number, height: number): string[] {
    return Array(width * height).fill('');
  }

  /**
   * Inserts a brand new blank frame at the specified index.
   */
  public static insertAt(
    frames: Frame[],
    pixels: ProjectPixels,
    layers: Layer[],
    index: number,
    newFrameId: string,
    name: string,
    width: number,
    height: number,
    durationMs: number = 100
  ): FrameMutationResult {
    const newFrame: Frame = {
      id: newFrameId,
      name,
      durationMs
    };

    // Clone frames array and insert
    const nextFrames = [...frames];
    nextFrames.splice(index, 0, newFrame);

    // Create blank pixels for each layer
    const framePixels: FrameLayerPixels = {};
    layers.forEach(layer => {
      framePixels[layer.id] = this.createBlankLayerPixels(width, height);
    });

    const nextPixels = {
      ...pixels,
      [newFrameId]: framePixels
    };

    return {
      frames: nextFrames,
      pixels: nextPixels
    };
  }

  /**
   * Deletes a frame at the specified index.
   */
  public static deleteAt(
    frames: Frame[],
    pixels: ProjectPixels,
    index: number
  ): FrameMutationResult {
    if (frames.length <= 1) {
      // Cannot delete the only frame
      return { frames, pixels };
    }

    const targetFrame = frames[index];
    const nextFrames = frames.filter((_, idx) => idx !== index);

    // Clean up pixels for deleted frame ID
    const nextPixels = { ...pixels };
    delete nextPixels[targetFrame.id];

    return {
      frames: nextFrames,
      pixels: nextPixels
    };
  }

  /**
   * Duplicates a frame at the specified index, creating a deep copy of its pixels.
   */
  public static duplicateAt(
    frames: Frame[],
    pixels: ProjectPixels,
    index: number,
    newFrameId: string,
    newName: string
  ): FrameMutationResult {
    const sourceFrame = frames[index];
    if (!sourceFrame) return { frames, pixels };

    const newFrame: Frame = {
      id: newFrameId,
      name: newName,
      durationMs: sourceFrame.durationMs
    };

    const nextFrames = [...frames];
    nextFrames.splice(index + 1, 0, newFrame);

    // Deep copy pixels
    const sourceFramePixels = pixels[sourceFrame.id] || {};
    const duplicatedFramePixels: FrameLayerPixels = {};

    Object.keys(sourceFramePixels).forEach(layerId => {
      duplicatedFramePixels[layerId] = [...sourceFramePixels[layerId]];
    });

    const nextPixels = {
      ...pixels,
      [newFrameId]: duplicatedFramePixels
    };

    return {
      frames: nextFrames,
      pixels: nextPixels
    };
  }

  /**
   * Reorders a frame from sourceIndex to targetIndex.
   * Frame IDs do not change, so pixels object is unchanged (just referenced in a different order of frames).
   */
  public static move(
    frames: Frame[],
    sourceIndex: number,
    targetIndex: number
  ): Frame[] {
    if (sourceIndex === targetIndex) return frames;
    if (sourceIndex < 0 || sourceIndex >= frames.length) return frames;
    if (targetIndex < 0 || targetIndex >= frames.length) return frames;

    const nextFrames = [...frames];
    const [movedFrame] = nextFrames.splice(sourceIndex, 1);
    nextFrames.splice(targetIndex, 0, movedFrame);

    return nextFrames;
  }
}
