import { Frame, ProjectPixels, FrameLayerPixels } from '../../types';

export interface ClipboardData {
  frames: Frame[];
  pixels: Record<string, FrameLayerPixels>; // index-based or custom temporary ID based
}

export class ClipboardService {
  private static clipboard: ClipboardData | null = null;

  /**
   * Copies frame metadata and pixel data for the specified visible indices.
   */
  public static copy(
    frames: Frame[],
    pixels: ProjectPixels,
    indices: number[]
  ): void {
    if (indices.length === 0) return;

    const copiedFrames: Frame[] = [];
    const copiedPixels: Record<string, FrameLayerPixels> = {};

    indices.forEach(idx => {
      const frame = frames[idx];
      if (frame) {
        copiedFrames.push({ ...frame });
        
        const framePixels = pixels[frame.id] || {};
        const framePixelsCopy: FrameLayerPixels = {};
        
        Object.keys(framePixels).forEach(layerId => {
          framePixelsCopy[layerId] = [...framePixels[layerId]];
        });

        copiedPixels[frame.id] = framePixelsCopy;
      }
    });

    this.clipboard = {
      frames: copiedFrames,
      pixels: copiedPixels
    };
  }

  /**
   * Pastes the copied frames into the project at the target index.
   * Generates new unique IDs for the pasted frames and duplicates the pixels.
   */
  public static paste(
    frames: Frame[],
    pixels: ProjectPixels,
    targetIndex: number,
    generateId: () => string
  ): { frames: Frame[]; pixels: ProjectPixels } | null {
    if (!this.clipboard || this.clipboard.frames.length === 0) {
      return null;
    }

    const nextFrames = [...frames];
    const nextPixels = { ...pixels };

    const pastedFrames: Frame[] = [];

    this.clipboard.frames.forEach((copiedFrame, idx) => {
      const newId = generateId();
      const newFrame: Frame = {
        ...copiedFrame,
        id: newId,
        name: `${copiedFrame.name}_Paste`
      };

      pastedFrames.push(newFrame);

      // Deep copy the pixels under the new frame ID
      const originalPixels = this.clipboard!.pixels[copiedFrame.id] || {};
      const newFramePixels: FrameLayerPixels = {};

      Object.keys(originalPixels).forEach(layerId => {
        newFramePixels[layerId] = [...originalPixels[layerId]];
      });

      nextPixels[newId] = newFramePixels;
    });

    // Insert pasted frames at targetIndex
    nextFrames.splice(targetIndex, 0, ...pastedFrames);

    return {
      frames: nextFrames,
      pixels: nextPixels
    };
  }

  /**
   * Checks if there are any frames in the clipboard.
   */
  public static hasContent(): boolean {
    return this.clipboard !== null && this.clipboard.frames.length > 0;
  }

  /**
   * Clears the clipboard.
   */
  public static clear(): void {
    this.clipboard = null;
  }
}
