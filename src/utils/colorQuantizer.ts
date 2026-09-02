import { quantize as gifencQuantize } from 'gifenc';

export interface ColorQuantizer {
  quantize(rgba: Uint8Array, maxColors: number, format?: 'rgba4444' | 'rgb565'): number[][];
}

/**
 * High-quality Pairwise Nearest Neighbor (PNN) Quantizer.
 * Decoupled from the GIF exporter code so we can swap it with Wu, NeuQuant, etc. in the future.
 */
export class PnnQuantizer implements ColorQuantizer {
  quantize(rgba: Uint8Array, maxColors: number, format: 'rgba4444' | 'rgb565' = 'rgba4444'): number[][] {
    return gifencQuantize(rgba, maxColors, { format });
  }
}
