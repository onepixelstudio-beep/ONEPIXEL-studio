import { 
  ExportPlugin, 
  ExportOptionSchema, 
  EncodedFile, 
  RenderResult, 
  EncoderContext 
} from '../ExportTypes';
import { encodeGPL, encodePAL, encodeACT, encodeACO } from '../../binaryEncoders';
import { resolveFilename } from './ExportEncoderUtils';
import { CancelError } from '../ExportErrors';

function getProjectUniqueColors(renderResult: RenderResult): string[] {
  const colors = new Set<string>();
  
  if (renderResult.palette && renderResult.palette.length > 0) {
    renderResult.palette.forEach(c => {
      if (c && c.startsWith('#')) {
        colors.add(c.toLowerCase());
      }
    });
  }

  if (colors.size === 0) {
    renderResult.frames.forEach((frame) => {
      frame.pixels.forEach((col) => {
        if (col && col.startsWith('#')) {
          colors.add(col.toLowerCase());
        }
      });
    });
  }

  if (colors.size === 0) {
    ['#000000', '#ffffff', '#ff0055', '#00ffcc', '#ffcc00'].forEach(c => colors.add(c));
  }

  return Array.from(colors).slice(0, 256);
}

export const GplPlugin: ExportPlugin = {
  id: 'gpl',
  name: 'GIMP Palette (GPL)',
  desc: 'Formato estándar usado por GIMP, Inkscape, Aseprite y Krita.',
  category: 'palette',
  icon: 'Palette',
  extension: 'gpl',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: false,
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
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo .gpl final.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Extrayendo colores...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const colors = getProjectUniqueColors(renderResult);
    if (signal?.aborted) throw new CancelError();

    onProgress?.({ stage: 'encoding_format', message: 'Codificando GPL...', percentage: 60 });
    const text = encodeGPL(renderResult.projectName, colors);

    onProgress?.({ stage: 'completed', message: 'GPL completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'palette'),
      extension: 'gpl',
      data: text,
      mimeType: 'text/plain'
    };
  }
};

export const PalPlugin: ExportPlugin = {
  id: 'pal',
  name: 'JASC PAL',
  desc: 'Formato clásico de Paint Shop Pro compatible con muchas herramientas retro.',
  category: 'palette',
  icon: 'Palette',
  extension: 'pal',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: false,
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
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo .pal final.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Extrayendo colores...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const colors = getProjectUniqueColors(renderResult);
    if (signal?.aborted) throw new CancelError();

    onProgress?.({ stage: 'encoding_format', message: 'Codificando JASC PAL...', percentage: 60 });
    const text = encodePAL(colors);

    onProgress?.({ stage: 'completed', message: 'PAL completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'palette'),
      extension: 'pal',
      data: text,
      mimeType: 'text/plain'
    };
  }
};

export const ActPlugin: ExportPlugin = {
  id: 'act',
  name: 'Adobe Color Table (ACT)',
  desc: 'Formato oficial de Adobe Photoshop para tablas indexadas de 256 colores.',
  category: 'palette',
  icon: 'Palette',
  extension: 'act',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: false,
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
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo .act final.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Extrayendo colores...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const colors = getProjectUniqueColors(renderResult);
    if (signal?.aborted) throw new CancelError();

    onProgress?.({ stage: 'encoding_format', message: 'Codificando ACT binario...', percentage: 60 });
    const blob = encodeACT(colors);

    onProgress?.({ stage: 'completed', message: 'ACT completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'palette'),
      extension: 'act',
      data: blob,
      mimeType: 'application/octet-stream'
    };
  }
};

export const AcoPlugin: ExportPlugin = {
  id: 'aco',
  name: 'Adobe Swatch Exchange (ACO)',
  desc: 'Formato moderno de Photoshop para guardar y compartir muestras.',
  category: 'palette',
  icon: 'Palette',
  extension: 'aco',
  capabilities: {
    supportsAnimation: false,
    supportsLayers: false,
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
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre del archivo .aco final.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Extrayendo colores...', percentage: 20 });
    if (signal?.aborted) throw new CancelError();

    const colors = getProjectUniqueColors(renderResult);
    if (signal?.aborted) throw new CancelError();

    onProgress?.({ stage: 'encoding_format', message: 'Codificando ACO binario...', percentage: 60 });
    const blob = encodeACO(colors);

    onProgress?.({ stage: 'completed', message: 'ACO completado', percentage: 100 });
    return {
      filename: resolveFilename(renderResult, options, 'palette'),
      extension: 'aco',
      data: blob,
      mimeType: 'application/octet-stream'
    };
  }
};
