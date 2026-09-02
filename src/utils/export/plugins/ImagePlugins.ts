import { 
  ExportPlugin, 
  ExportOptionSchema, 
  EncodedFile, 
  EncoderContext 
} from '../ExportTypes';
import { encodeBMP, encodeTGA, encodeTIFF, encodeICO } from '../../binaryEncoders';
import { 
  createExportCanvas, 
  populateCanvasWithPixels, 
  getFrameToExport, 
  resolveFilename 
} from './ExportEncoderUtils';
import { CancelError } from '../ExportErrors';

export const PngPlugin: ExportPlugin = {
  id: 'png',
  name: 'PNG Image',
  desc: 'Formato estándar sin pérdida con transparencias. El más recomendado.',
  category: 'image',
  icon: 'FileImage',
  extension: 'png',
  capabilities: {
    supportsAnimation: false,
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
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: true,
        desc: 'Mantiene el canal alfa (transparente).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando PNG...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando Blob...', percentage: 60 });

    if (canvas.convertToBlob) {
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      onProgress?.({ stage: 'completed', message: 'PNG completado', percentage: 100 });
      return {
        filename: resolveFilename(renderResult, options),
        extension: 'png',
        data: blob,
        mimeType: 'image/png'
      };
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      canvas.toBlob((blob: any) => {
        if (!blob) {
          reject(new Error('Failed to encode canvas to PNG'));
          return;
        }
        onProgress?.({ stage: 'completed', message: 'PNG completado', percentage: 100 });
        resolve({
          filename: resolveFilename(renderResult, options),
          extension: 'png',
          data: blob,
          mimeType: 'image/png'
        });
      }, 'image/png');
    });
  }
};

export const JpegPlugin: ExportPlugin = {
  id: 'jpg',
  name: 'JPEG Image',
  desc: 'Formato comprimido con pérdida, ideal para compartir bocetos rápidos sin transparencias.',
  category: 'image',
  icon: 'FileImage',
  extension: 'jpg',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: false,
    supportsQuality: true,
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
        id: 'quality',
        label: 'Calidad de Compresión',
        type: 'number',
        defaultValue: 90,
        min: 1,
        max: 100,
        step: 1,
        desc: 'Nivel de calidad para la compresión JPEG.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo obligatorio, ya que JPEG no admite transparencia.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando JPEG...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando Blob...', percentage: 60 });

    const qualityPercent = typeof options.quality === 'number' ? options.quality : 90;
    const qualityValue = Math.max(0.01, Math.min(1.0, qualityPercent / 100));

    if (canvas.convertToBlob) {
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: qualityValue });
      onProgress?.({ stage: 'completed', message: 'JPEG completado', percentage: 100 });
      return {
        filename: resolveFilename(renderResult, options),
        extension: 'jpg',
        data: blob,
        mimeType: 'image/jpeg'
      };
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      canvas.toBlob((blob: any) => {
        if (!blob) {
          reject(new Error('Failed to encode canvas to JPEG'));
          return;
        }
        onProgress?.({ stage: 'completed', message: 'JPEG completado', percentage: 100 });
        resolve({
          filename: resolveFilename(renderResult, options),
          extension: 'jpg',
          data: blob,
          mimeType: 'image/jpeg'
        });
      }, 'image/jpeg', qualityValue);
    });
  }
};

export const WebpPlugin: ExportPlugin = {
  id: 'webp',
  name: 'WebP Image',
  desc: 'Formato moderno para web con compresión avanzada y transparencia opcional.',
  category: 'image',
  icon: 'Sparkles',
  extension: 'webp',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: true,
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
        id: 'webpMode',
        label: 'Modo WebP',
        type: 'select',
        defaultValue: 'lossless',
        options: [
          { value: 'lossless', label: 'Sin Pérdida (Lossless)' },
          { value: 'lossy', label: 'Con Pérdida (Lossy)' }
        ],
        desc: 'Selecciona entre compresión con pérdida o sin pérdida.'
      },
      {
        id: 'quality',
        label: 'Calidad de Compresión',
        type: 'number',
        defaultValue: 90,
        min: 1,
        max: 100,
        step: 1,
        desc: 'Nivel de calidad para la compresión WebP en modo Lossy.',
        visible: (opts) => opts.webpMode === 'lossy'
      },
      {
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el canal alfa (transparente).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando WebP...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando Blob...', percentage: 60 });

    const isLossless = options.webpMode === 'lossless';
    const qualityPercent = typeof options.quality === 'number' ? options.quality : 90;
    const qualityValue = isLossless ? 1.0 : Math.max(0.01, Math.min(1.0, qualityPercent / 100));

    if (canvas.convertToBlob) {
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: qualityValue });
      onProgress?.({ stage: 'completed', message: 'WebP completado', percentage: 100 });
      return {
        filename: resolveFilename(renderResult, options),
        extension: 'webp',
        data: blob,
        mimeType: 'image/webp'
      };
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      canvas.toBlob((blob: any) => {
        if (!blob) {
          reject(new Error('Failed to encode canvas to WebP'));
          return;
        }
        onProgress?.({ stage: 'completed', message: 'WebP completado', percentage: 100 });
        resolve({
          filename: resolveFilename(renderResult, options),
          extension: 'webp',
          data: blob,
          mimeType: 'image/webp'
        });
      }, 'image/webp', qualityValue);
    });
  }
};

export const BmpPlugin: ExportPlugin = {
  id: 'bmp',
  name: 'Windows BMP',
  desc: 'Formato clásico de mapas de bits sin compresión con fondo blanco o de color.',
  category: 'image',
  icon: 'FileImage',
  extension: 'bmp',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: false,
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
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: false,
        desc: 'Conserva el canal alfa (BMP estándar no lo soporta, se recomienda usar fondo sólido).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando BMP...', percentage: 30 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    // Even for binary BMP we need standard context image data
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    let imgData: ImageData;
    if (ctx.getImageData) {
      imgData = ctx.getImageData(0, 0, frame.width, frame.height);
    } else {
      throw new Error('Canvas rendering context does not support getImageData');
    }

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando archivo binario BMP...', percentage: 70 });

    const blob = encodeBMP(frame.width, frame.height, imgData.data);
    onProgress?.({ stage: 'completed', message: 'BMP completado', percentage: 100 });

    return {
      filename: resolveFilename(renderResult, options),
      extension: 'bmp',
      data: blob,
      mimeType: 'image/bmp'
    };
  }
};

export const TiffPlugin: ExportPlugin = {
  id: 'tiff',
  name: 'TIFF Format',
  desc: 'Formato profesional de alta precisión para impresión y archivo.',
  category: 'image',
  icon: 'Layers',
  extension: 'tiff',
  capabilities: {
    supportsAnimation: false,
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
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: true,
        desc: 'Mantiene el canal alfa (transparente).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando TIFF...', percentage: 30 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    let imgData: ImageData;
    if (ctx.getImageData) {
      imgData = ctx.getImageData(0, 0, frame.width, frame.height);
    } else {
      throw new Error('Canvas rendering context does not support getImageData');
    }

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando archivo binario TIFF...', percentage: 70 });

    const blob = encodeTIFF(frame.width, frame.height, imgData.data);
    onProgress?.({ stage: 'completed', message: 'TIFF completado', percentage: 100 });

    return {
      filename: resolveFilename(renderResult, options),
      extension: 'tiff',
      data: blob,
      mimeType: 'image/tiff'
    };
  }
};

export const TgaPlugin: ExportPlugin = {
  id: 'tga',
  name: 'TARGA TGA',
  desc: 'Formato histórico Truevision ampliamente utilizado en desarrollo retro.',
  category: 'image',
  icon: 'FileImage',
  extension: 'tga',
  capabilities: {
    supportsAnimation: false,
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
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el canal alfa (transparente).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando TGA...', percentage: 30 });
    if (signal?.aborted) throw new CancelError();

    const frame = getFrameToExport(renderResult, options);
    const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

    let imgData: ImageData;
    if (ctx.getImageData) {
      imgData = ctx.getImageData(0, 0, frame.width, frame.height);
    } else {
      throw new Error('Canvas rendering context does not support getImageData');
    }

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando archivo binario TARGA...', percentage: 70 });

    const blob = encodeTGA(frame.width, frame.height, imgData.data);
    onProgress?.({ stage: 'completed', message: 'TGA completado', percentage: 100 });

    return {
      filename: resolveFilename(renderResult, options),
      extension: 'tga',
      data: blob,
      mimeType: 'image/x-tga'
    };
  }
};

export const IcoPlugin: ExportPlugin = {
  id: 'ico',
  name: 'Windows ICO Icon',
  desc: 'Genera un archivo .ico de tamaño favicon perfecto para el navegador o escritorio.',
  category: 'image',
  icon: 'Sparkles',
  extension: 'ico',
  capabilities: {
    supportsAnimation: false,
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
        id: 'icoSize',
        label: 'Resolución del Icono',
        type: 'select',
        defaultValue: '32',
        options: [
          { value: '16', label: '16 × 16 px (Favicon pequeño)' },
          { value: '32', label: '32 × 32 px (Estándar de Favicon)' },
          { value: '48', label: '48 × 48 px (Icono de Escritorio)' },
          { value: '64', label: '64 × 64 px (Icono de alta densidad)' },
          { value: '128', label: '128 × 128 px (Icono grande)' },
          { value: '256', label: '256 × 256 px (Máxima resolución)' }
        ],
        desc: 'El tamaño de la imagen que se empaquetará dentro del contenedor .ico.'
      },
      {
        id: 'transparent',
        label: 'Transparencia de Fondo',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva el fondo transparente (canal alfa).'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si la transparencia está desactivada.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Codificando ICO...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const size = parseInt(options.icoSize || '32', 10);
    const frame = getFrameToExport(renderResult, options);
    // Draw directly onto scaled resolution ico canvas
    const { canvas, ctx } = createExportCanvas(size, size);

    // Scaling/interpolating nearest neighbor for ico resolution
    const tempCanvas = createExportCanvas(frame.width, frame.height);
    populateCanvasWithPixels(tempCanvas.canvas, tempCanvas.ctx, frame.pixels, frame.width, frame.height);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas.canvas, 0, 0, size, size);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Generando contenedor ICO...', percentage: 65 });

    if (canvas.convertToBlob) {
      const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
      const icoBlob = await encodeICO(pngBlob);
      onProgress?.({ stage: 'completed', message: 'ICO completado', percentage: 100 });
      return {
        filename: resolveFilename(renderResult, options, 'favicon'),
        extension: 'ico',
        data: icoBlob,
        mimeType: 'image/x-icon'
      };
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      canvas.toBlob((pngBlob: any) => {
        if (!pngBlob) {
          reject(new Error('Failed to encode intermediate PNG for ICO container'));
          return;
        }

        encodeICO(pngBlob).then((icoBlob) => {
          onProgress?.({ stage: 'completed', message: 'ICO completado', percentage: 100 });
          resolve({
            filename: resolveFilename(renderResult, options, 'favicon'),
            extension: 'ico',
            data: icoBlob,
            mimeType: 'image/x-icon'
          });
        }).catch(reject);
      }, 'image/png');
    });
  }
};
