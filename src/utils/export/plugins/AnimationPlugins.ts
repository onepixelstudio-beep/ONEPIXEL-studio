import { 
  ExportPlugin, 
  ExportOptionSchema, 
  EncodedFile, 
  RenderResult, 
  EncoderContext 
} from '../ExportTypes';
import { encodeGif } from '../../gifEncoder';
import { encodeApng } from '../../apngEncoder';
import { buildSpriteSheetFromRenderResult } from './SpriteSheetUtils';
import { AnimationSequence } from '../../animationSequenceBuilder';
import { 
  createExportCanvas, 
  populateCanvasWithPixels, 
  resolveFilename 
} from './ExportEncoderUtils';
import { CancelError } from '../ExportErrors';

function renderResultToAnimationSequence(renderResult: RenderResult, options: Record<string, any>): AnimationSequence {
  const isFirstOnly = options.range === 'first';
  const framesToUse = isFirstOnly && renderResult.frames.length > 0
    ? [renderResult.frames[0]]
    : renderResult.frames;

  const frames = framesToUse.map((frame) => {
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);
    return {
      canvas,
      durationMs: frame.durationMs,
    };
  });

  return { frames };
}

export const GifPlugin: ExportPlugin = {
  id: 'gif',
  name: 'Animated GIF',
  desc: 'Formato clásico y compatible para loops y redes sociales.',
  category: 'animation',
  icon: 'Video',
  extension: 'gif',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: false,
    supportsMetadata: false,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre del Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo final sin extensión.'
      },
      {
        id: 'fps',
        label: 'Velocidad (FPS)',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 60,
        step: 1,
        desc: 'Fotogramas por segundo del GIF animado.'
      },
      {
        id: 'loop',
        label: 'Bucle Infinito',
        type: 'boolean',
        defaultValue: true,
        desc: 'El GIF se repetirá infinitamente.'
      },
      {
        id: 'range',
        label: 'Rango de Cuadros',
        type: 'select',
        defaultValue: 'all',
        options: [
          { value: 'all', label: 'Todos los cuadros' },
          { value: 'first', label: 'Solo primer cuadro' }
        ],
        desc: 'Cuadros a incluir en la animación.'
      },
      {
        id: 'transparent',
        label: 'Fondo Transparente',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el fondo transparente en lugar de un color sólido.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo si no se usa fondo transparente.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Preparando cuadros para GIF...', percentage: 10 });
    if (signal?.aborted) throw new CancelError();

    const sequence = renderResultToAnimationSequence(renderResult, options);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Codificando cuadros GIF...', percentage: 30 });

    const useTransparent = options.transparent !== false;
    const loop = options.loop !== false;

    const gifBytes = await encodeGif(sequence, renderResult.width, renderResult.height, {
      loop,
      useTransparent,
      onProgress: (stepName, progressPercentage) => {
        onProgress?.({
          stage: 'encoding_format',
          message: `GIF: ${stepName}`,
          percentage: 30 + Math.floor(progressPercentage * 0.65)
        });
      },
      signal
    });

    onProgress?.({ stage: 'completed', message: 'GIF completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'animation'),
      extension: 'gif',
      data: gifBytes,
      mimeType: 'image/gif'
    };
  }
};

export const ApngPlugin: ExportPlugin = {
  id: 'apng',
  name: 'Animated PNG (APNG)',
  desc: 'Animación de alta calidad sin pérdida y transparencias fluidas de 24 bits.',
  category: 'animation',
  icon: 'Sparkles',
  extension: 'png',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: false,
    supportsMetadata: false,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre del Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo final sin extensión.'
      },
      {
        id: 'fps',
        label: 'Velocidad (FPS)',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 60,
        step: 1,
        desc: 'Fotogramas por segundo del APNG animado.'
      },
      {
        id: 'loop',
        label: 'Bucle Infinito',
        type: 'boolean',
        defaultValue: true,
        desc: 'La animación se repetirá infinitamente.'
      },
      {
        id: 'range',
        label: 'Rango de Cuadros',
        type: 'select',
        defaultValue: 'all',
        options: [
          { value: 'all', label: 'Todos los cuadros' },
          { value: 'first', label: 'Solo primer cuadro' }
        ],
        desc: 'Cuadros a incluir en la animación.'
      },
      {
        id: 'transparent',
        label: 'Fondo Transparente',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el fondo transparente en lugar de un color sólido.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo si no se usa fondo transparente.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Preparando cuadros para APNG...', percentage: 10 });
    if (signal?.aborted) throw new CancelError();

    const sequence = renderResultToAnimationSequence(renderResult, options);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Codificando cuadros APNG...', percentage: 30 });

    const loop = options.loop !== false;

    const apngBytes = await encodeApng(sequence, renderResult.width, renderResult.height, {
      loop,
      onProgress: (stepName, progressPercentage) => {
        onProgress?.({
          stage: 'encoding_format',
          message: `APNG: ${stepName}`,
          percentage: 30 + Math.floor(progressPercentage * 0.65)
        });
      },
      signal
    });

    onProgress?.({ stage: 'completed', message: 'APNG completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'animation'),
      extension: 'png',
      data: apngBytes,
      mimeType: 'image/png'
    };
  }
};

export const SpriteSheetSimplePlugin: ExportPlugin = {
  id: 'spritesheet_simple',
  name: 'Sprite Sheet',
  desc: 'Montaje secuencial de fotogramas orientado al artista. Soporta múltiples distribuciones, márgenes y espaciados.',
  category: 'animation',
  icon: 'Grid',
  extension: 'png',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: false,
    supportsMetadata: false,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre del Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo final sin extensión.'
      },
      {
        id: 'scale',
        label: 'Escala (Upscale)',
        type: 'number',
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        desc: 'Multiplicador entero de escala (1x = tamaño nativo sin interpolación).'
      },
      {
        id: 'layout',
        label: 'Distribución',
        type: 'select',
        defaultValue: 'horizontal',
        options: [
          { value: 'horizontal', label: 'Tira Horizontal' },
          { value: 'vertical', label: 'Tira Vertical' },
          { value: 'grid', label: 'Cuadrícula (Grid)' }
        ]
      },
      {
        id: 'columns',
        label: 'Columnas',
        type: 'number',
        defaultValue: 4,
        min: 1,
        max: 32,
        step: 1,
        desc: 'Número de columnas para la distribución en cuadrícula.',
        visible: (opts) => opts.layout === 'grid'
      },
      {
        id: 'spacing',
        label: 'Espaciado (Spacing)',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Espacio vacío entre fotogramas en píxeles.'
      },
      {
        id: 'margin',
        label: 'Margen Exterior',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Margen vacío alrededor de toda la hoja de sprites.'
      },
      {
        id: 'transparent',
        label: 'Fondo Transparente',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el fondo con canal alfa transparente.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo si no se usa fondo transparente.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Diseñando Sprite Sheet...', percentage: 15 });
    if (signal?.aborted) throw new CancelError();

    const layout = options.layout === 'vertical' || options.layout === 'grid' ? options.layout : 'horizontal';
    const columns = Math.max(1, Math.min(32, parseInt(options.columns, 10) || 4));
    const spacing = Math.max(0, parseInt(options.spacing, 10) || 0);
    const margin = Math.max(0, parseInt(options.margin, 10) || 0);
    const transparent = options.transparent !== false;
    const bgColor = options.bgColor || '#ffffff';

    const sheet = buildSpriteSheetFromRenderResult(renderResult, {
      layout,
      columns,
      spacing,
      margin,
      transparent,
      bgColor
    });

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Codificando PNG...', percentage: 60 });

    if (sheet.canvas.convertToBlob) {
      const blob = await sheet.canvas.convertToBlob({ type: 'image/png' });
      onProgress?.({ stage: 'completed', message: 'Sprite Sheet completado', percentage: 100 });
      return {
        filename: resolveFilename(renderResult, options, 'spritesheet'),
        extension: 'png',
        data: blob,
        mimeType: 'image/png'
      };
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      sheet.canvas.toBlob((blob: any) => {
        if (!blob) {
          reject(new Error('Failed to encode Sprite Sheet canvas to PNG'));
          return;
        }
        onProgress?.({ stage: 'completed', message: 'Sprite Sheet completado', percentage: 100 });
        resolve({
          filename: resolveFilename(renderResult, options, 'spritesheet'),
          extension: 'png',
          data: blob,
          mimeType: 'image/png'
        });
      }, 'image/png');
    });
  }
};
