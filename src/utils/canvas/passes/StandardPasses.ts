import { RenderPass } from '../RenderPass';
import { FrameBuffer } from '../FrameBuffer';
import { RenderContext } from '../RenderContext';
import { ColorBlendUtils, RGBA } from '../ColorBlendUtils';
import { LayerResolutionService } from '../../animation/LayerResolutionService';

/**
 * Combines visible layers bottom-to-top with correct alpha-blending math.
 */
export class LayerMergePass implements RenderPass {
  public readonly id = 'layer-merge';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const { project, frameId, settings } = context;
    const totalPixels = project.width * project.height;
    const canvasBuffer: RGBA[] = Array.from({ length: totalPixels }, () => ({ r: 0, g: 0, b: 0, a: 0 }));

    let layersMerged = 0;

    // Render backwards: Bottom layer to Top layer (layers array is sorted top-to-bottom)
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;

      // Filter layer if specified in settings
      if (settings.selectedLayersOnly && !settings.selectedLayersOnly.includes(layer.id)) {
        continue;
      }

      const effective = LayerResolutionService.getEffectiveLayerPixels(project, frameId, layer.id);
      const layerPix = effective?.pixels;
      if (!layerPix || layerPix.length === 0 || LayerResolutionService.isPixelArrayEmpty(layerPix)) continue;

      layersMerged++;
      const opacityCoeff = (layer.opacity ?? 100) / 100;

      for (let p = 0; p < totalPixels; p++) {
        const rawColor = layerPix[p];
        if (!rawColor || rawColor === 'transparent') continue;

        const srcRgba = ColorBlendUtils.parseColor(rawColor);
        // Factor layer-specific opacity slider
        srcRgba.a *= opacityCoeff;

        if (srcRgba.a === 0) continue;

        const dstRgba = canvasBuffer[p];
        canvasBuffer[p] = ColorBlendUtils.blendColors(srcRgba, dstRgba);
      }
    }

    // Convert RGBA buffer back to flat hex strings
    let emptyFrame = true;
    const finalPixels = canvasBuffer.map((rgba) => {
      if (rgba.a > 0) emptyFrame = false;
      return ColorBlendUtils.stringifyColor(rgba);
    });

    // Track cumulative statistics in the context
    context.statistics.layersMerged += layersMerged;

    if (emptyFrame) {
      const frameObj = project.frames.find((f) => f.id === frameId);
      context.warnings.push({
        code: 'EMPTY_FRAME',
        message: `El fotograma "${frameObj?.name || frameId}" está completamente vacío (transparente).`,
        severity: 'info',
      });
    }

    return new FrameBuffer(project.width, project.height, finalPixels, 0, 0, {
      ...fb.metadata,
      emptyFrame,
    });
  }
}

/**
 * Cuts the composited pixel matrix into a smaller, designated area.
 */
export class CropPass implements RenderPass {
  public readonly id = 'crop';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const { settings } = context;
    if (!settings.crop) return fb;

    const { x, y, width, height } = settings.crop;
    const croppedPixels: string[] = [];

    for (let cy = 0; cy < height; cy++) {
      const targetY = y + cy;
      for (let cx = 0; cx < width; cx++) {
        const targetX = x + cx;

        if (targetX >= 0 && targetX < fb.width && targetY >= 0 && targetY < fb.height) {
          const index = targetY * fb.width + targetX;
          croppedPixels.push(fb.pixels[index] || 'transparent');
        } else {
          // Pad transparent if crop box falls outside original dimensions
          croppedPixels.push('transparent');
        }
      }
    }

    return new FrameBuffer(width, height, croppedPixels, x, y, fb.metadata);
  }
}

/**
 * Overwrites transparent pixels with a fallback solid background color.
 */
export class BgColorPass implements RenderPass {
  public readonly id = 'bgcolor';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const { settings } = context;
    if (!settings.bgColor || settings.bgColor === 'transparent') return fb;

    const bgRgba = ColorBlendUtils.parseColor(settings.bgColor);
    if (bgRgba.a === 0) return fb;

    const updatedPixels = fb.pixels.map((pix) => {
      if (pix === 'transparent' || !pix) {
        return settings.bgColor!;
      }
      const pixelRgba = ColorBlendUtils.parseColor(pix);
      if (pixelRgba.a === 1) return pix;

      // Blend pixel over background color
      const blended = ColorBlendUtils.blendColors(pixelRgba, bgRgba);
      return ColorBlendUtils.stringifyColor(blended);
    });

    return fb.clone({ pixels: updatedPixels });
  }
}

/**
 * Inserts blank padding boundaries around the composited pixels.
 */
export class PaddingPass implements RenderPass {
  public readonly id = 'padding';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const { settings } = context;
    if (!settings.padding) return fb;

    const { top, right, bottom, left } = settings.padding;
    const newWidth = fb.width + left + right;
    const newHeight = fb.height + top + bottom;
    const paddedPixels: string[] = Array.from({ length: newWidth * newHeight }, () => 'transparent');

    for (let y = 0; y < fb.height; y++) {
      const destY = y + top;
      const srcRowOffset = y * fb.width;
      const destRowOffset = destY * newWidth;

      for (let x = 0; x < fb.width; x++) {
        const destX = x + left;
        paddedPixels[destRowOffset + destX] = fb.pixels[srcRowOffset + x];
      }
    }

    return new FrameBuffer(newWidth, newHeight, paddedPixels, fb.originX - left, fb.originY - top, fb.metadata);
  }
}

/**
 * Extends pixel matrix dimensions outward representing outer margin margins.
 */
export class MarginPass implements RenderPass {
  public readonly id = 'margin';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const { settings } = context;
    if (!settings.margin) return fb;

    const { top, right, bottom, left } = settings.margin;
    const newWidth = fb.width + left + right;
    const newHeight = fb.height + top + bottom;
    const marginPixels: string[] = Array.from({ length: newWidth * newHeight }, () => 'transparent');

    for (let y = 0; y < fb.height; y++) {
      const destY = y + top;
      const srcRowOffset = y * fb.width;
      const destRowOffset = destY * newWidth;

      for (let x = 0; x < fb.width; x++) {
        const destX = x + left;
        marginPixels[destRowOffset + destX] = fb.pixels[srcRowOffset + x];
      }
    }

    return new FrameBuffer(newWidth, newHeight, marginPixels, fb.originX - left, fb.originY - top, fb.metadata);
  }
}

/**
 * Performs crystal-clear Nearest-Neighbor scale multiplication.
 */
export class ScalingPass implements RenderPass {
  public readonly id = 'scaling';

  public execute(fb: FrameBuffer, context: RenderContext): FrameBuffer {
    const scale = context.settings.scale || 1;
    if (scale <= 1) return fb;

    const newWidth = fb.width * scale;
    const newHeight = fb.height * scale;
    const scaledPixels: string[] = Array.from({ length: newWidth * newHeight }, () => 'transparent');

    for (let y = 0; y < fb.height; y++) {
      const srcRowOffset = y * fb.width;
      for (let x = 0; x < fb.width; x++) {
        const color = fb.pixels[srcRowOffset + x];
        if (color === 'transparent') continue;

        const startDestY = y * scale;
        const startDestX = x * scale;

        for (let dy = 0; dy < scale; dy++) {
          const destRowOffset = (startDestY + dy) * newWidth;
          for (let dx = 0; dx < scale; dx++) {
            scaledPixels[destRowOffset + (startDestX + dx)] = color;
          }
        }
      }
    }

    return new FrameBuffer(newWidth, newHeight, scaledPixels, fb.originX, fb.originY, fb.metadata);
  }
}
