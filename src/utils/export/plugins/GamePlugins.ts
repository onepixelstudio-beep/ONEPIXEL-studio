import { 
  ExportPlugin, 
  ExportOptionSchema, 
  EncodedFile, 
  EncoderContext 
} from '../ExportTypes';
import { 
  buildSpriteSheetFromRenderResult, 
  serializeAtlasToJson, 
  serializeAtlasToXml 
} from './SpriteSheetUtils';
import { zipSync, strToU8 } from 'fflate';
import { 
  createExportCanvas, 
  populateCanvasWithPixels, 
  resolveFilename, 
  canvasToUint8Array 
} from './ExportEncoderUtils';
import { CancelError } from '../ExportErrors';

export const SpriteSheetJsonPlugin: ExportPlugin = {
  id: 'spritesheet_json',
  name: 'Sprite Sheet + JSON Atlas',
  desc: 'Hoja de sprites optimizada con un archivo descriptivo compatible con Phaser/PixiJS.',
  category: 'game',
  icon: 'FileJson',
  extension: 'zip',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: true,
    supportsMetadata: true,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre base para la imagen y el archivo JSON.'
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
        defaultValue: 'grid',
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
        desc: 'Número de columnas para el modo Cuadrícula.',
        visible: (opts) => opts.layout === 'grid'
      },
      {
        id: 'spacing',
        label: 'Espaciado (Padding)',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Distancia entre fotogramas en píxeles.'
      },
      {
        id: 'margin',
        label: 'Margen Exterior',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Margen alrededor de toda la hoja.'
      },
      {
        id: 'transparent',
        label: 'Fondo Transparente',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva la transparencia alfa.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si no es transparente.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Diseñando hoja de sprites...', percentage: 15 });
    if (signal?.aborted) throw new CancelError();

    const layout = options.layout === 'horizontal' || options.layout === 'vertical' ? options.layout : 'grid';
    const columns = Math.max(1, Math.min(32, parseInt(options.columns, 10) || 4));
    const spacing = Math.max(0, parseInt(options.spacing, 10) || 0);
    const margin = Math.max(0, parseInt(options.margin, 10) || 0);
    const transparent = options.transparent !== false;
    const bgColor = options.bgColor || '#ffffff';

    const atlas = buildSpriteSheetFromRenderResult(renderResult, {
      layout,
      columns,
      spacing,
      margin,
      transparent,
      bgColor
    });

    const baseName = resolveFilename(renderResult, options, 'atlas');
    const imageFileName = `${baseName}.png`;
    const jsonFileName = `${baseName}.json`;

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Renderizando imagen atlas...', percentage: 40 });

    const imageBytes = await canvasToUint8Array(atlas.canvas);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Serializando JSON de metadatos...', percentage: 70 });

    const jsonStr = serializeAtlasToJson(atlas, imageFileName);
    const jsonBytes = strToU8(jsonStr);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'compressing', message: 'Empaquetando en ZIP...', percentage: 85 });

    const zipFiles: Record<string, Uint8Array> = {
      [imageFileName]: imageBytes,
      [jsonFileName]: jsonBytes
    };

    const zipBuffer = zipSync(zipFiles);
    onProgress?.({ stage: 'completed', message: 'JSON Atlas completado', percentage: 100 });

    return {
      filename: baseName,
      extension: 'zip',
      data: zipBuffer,
      mimeType: 'application/zip'
    };
  }
};

export const SpriteSheetXmlPlugin: ExportPlugin = {
  id: 'spritesheet_xml',
  name: 'Sprite Sheet + XML Atlas',
  desc: 'Hoja de sprites optimizada con descripción XML compatible con Starling y Cocos2D.',
  category: 'game',
  icon: 'FileCode',
  extension: 'zip',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: true,
    supportsMetadata: true,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre base para la imagen y el archivo XML.'
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
        defaultValue: 'grid',
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
        desc: 'Número de columnas para el modo Cuadrícula.',
        visible: (opts) => opts.layout === 'grid'
      },
      {
        id: 'spacing',
        label: 'Espaciado (Padding)',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Distancia entre fotogramas en píxeles.'
      },
      {
        id: 'margin',
        label: 'Margen Exterior',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        desc: 'Margen alrededor de toda la hoja.'
      },
      {
        id: 'transparent',
        label: 'Fondo Transparente',
        type: 'boolean',
        defaultValue: true,
        desc: 'Conserva la transparencia alfa.'
      },
      {
        id: 'bgColor',
        label: 'Color de Fondo',
        type: 'text',
        defaultValue: '#ffffff',
        desc: 'Color de fondo para rellenar si no es transparente.',
        visible: (opts) => opts.transparent === false
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Diseñando hoja de sprites...', percentage: 15 });
    if (signal?.aborted) throw new CancelError();

    const layout = options.layout === 'horizontal' || options.layout === 'vertical' ? options.layout : 'grid';
    const columns = Math.max(1, Math.min(32, parseInt(options.columns, 10) || 4));
    const spacing = Math.max(0, parseInt(options.spacing, 10) || 0);
    const margin = Math.max(0, parseInt(options.margin, 10) || 0);
    const transparent = options.transparent !== false;
    const bgColor = options.bgColor || '#ffffff';

    const atlas = buildSpriteSheetFromRenderResult(renderResult, {
      layout,
      columns,
      spacing,
      margin,
      transparent,
      bgColor
    });

    const baseName = resolveFilename(renderResult, options, 'atlas');
    const imageFileName = `${baseName}.png`;
    const xmlFileName = `${baseName}.xml`;

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Renderizando imagen atlas...', percentage: 40 });

    const imageBytes = await canvasToUint8Array(atlas.canvas);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'encoding_format', message: 'Serializando XML de metadatos...', percentage: 70 });

    const xmlStr = serializeAtlasToXml(atlas, imageFileName);
    const xmlBytes = strToU8(xmlStr);

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'compressing', message: 'Empaquetando en ZIP...', percentage: 85 });

    const zipFiles: Record<string, Uint8Array> = {
      [imageFileName]: imageBytes,
      [xmlFileName]: xmlBytes
    };

    const zipBuffer = zipSync(zipFiles);
    onProgress?.({ stage: 'completed', message: 'XML Atlas completado', percentage: 100 });

    return {
      filename: baseName,
      extension: 'zip',
      data: zipBuffer,
      mimeType: 'application/zip'
    };
  }
};

export const PngSequenceZipPlugin: ExportPlugin = {
  id: 'png_sequence',
  name: 'PNG Sequence (.zip)',
  desc: 'Genera un archivo ZIP con todos los cuadros como PNGs individuales numerados.',
  category: 'game',
  icon: 'Layers',
  extension: 'zip',
  capabilities: {
    supportsAnimation: true,
    supportsLayers: true,
    supportsPalette: true,
    supportsTransparency: true,
    supportsQuality: false,
    supportsPivot: false,
    supportsMetadata: true,
  },
  getOptionsSchema(): ExportOptionSchema {
    return [
      {
        id: 'filename',
        label: 'Nombre de Archivo',
        type: 'text',
        defaultValue: '',
        desc: 'Nombre base para cada imagen de la secuencia.'
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
        id: 'padding',
        label: 'Dígitos en Numeración (Padding)',
        type: 'select',
        defaultValue: '3',
        options: [
          { value: '2', label: '01, 02...' },
          { value: '3', label: '001, 002...' },
          { value: '4', label: '0001, 0002...' }
        ],
        desc: 'Número de dígitos para rellenar con ceros en el nombre de archivo.'
      },
      {
        id: 'folderName',
        label: 'Carpeta Interna',
        type: 'text',
        defaultValue: 'sprites',
        desc: 'Nombre de la subcarpeta dentro del archivo ZIP (vacío para raíz).'
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
      },
      {
        id: 'includeMetadata',
        label: 'Incluir Manifiesto',
        type: 'boolean',
        defaultValue: true,
        desc: 'Incluye un archivo manifest.json con metadatos estructurados en la raíz del ZIP.'
      }
    ];
  },
  async encode(context: EncoderContext): Promise<EncodedFile> {
    const { renderResult, options, signal, onProgress } = context;
    onProgress?.({ stage: 'encoding_format', message: 'Iniciando empaquetado secuencial...', percentage: 5 });
    if (signal?.aborted) throw new CancelError();

    const files: Record<string, Uint8Array> = {};
    const baseName = resolveFilename(renderResult, options, 'sequence');
    const paddingVal = Math.max(1, Math.min(6, parseInt(options.padding || '3', 10) || 3));
    const folderName = (options.folderName || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    const folderPrefix = folderName ? `${folderName}/` : '';

    const N = renderResult.frames.length;

    for (let idx = 0; idx < N; idx++) {
      if (signal?.aborted) {
        throw new CancelError();
      }

      const frame = renderResult.frames[idx];
      const progressPercent = 5 + Math.round((idx / N) * 75);
      onProgress?.({
        stage: 'encoding_format',
        message: `Codificando cuadro ${idx + 1} de ${N}...`,
        percentage: progressPercent
      });

      const { canvas, ctx } = createExportCanvas(frame.width, frame.height);
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
      populateCanvasWithPixels(canvas, ctx, frame.pixels, frame.width, frame.height);

      const bytes = await canvasToUint8Array(canvas);
      const frameNumStr = String(idx + 1).padStart(paddingVal, '0');
      const filename = `${folderPrefix}${baseName}_${frameNumStr}.png`;
      files[filename] = bytes;
    }

    if (options.includeMetadata !== false) {
      if (signal?.aborted) throw new CancelError();
      onProgress?.({ stage: 'encoding_format', message: 'Generando manifiesto...', percentage: 85 });

      const manifest = {
        name: renderResult.projectName,
        width: renderResult.width,
        height: renderResult.height,
        framesCount: N,
        scale: renderResult.scale,
        schema: 'OnePixel_SpriteAtlas',
        schemaVersion: '1.0.0',
        app: 'OnePixel Studio',
        generator: 'OnePixel PngSequenceZipPlugin v2.0.0',
        frames: renderResult.frames.map((f, idx) => ({
          name: (f as any).name || `frame_${idx + 1}`,
          id: f.frameId,
          index: idx,
          file: `${baseName}_${String(idx + 1).padStart(paddingVal, '0')}.png`
        }))
      };

      files[`${folderPrefix}manifest.json`] = strToU8(JSON.stringify(manifest, null, 2));
    }

    if (signal?.aborted) throw new CancelError();
    onProgress?.({ stage: 'compressing', message: 'Comprimiendo archivo ZIP...', percentage: 92 });

    const zipBuffer = zipSync(files);
    onProgress?.({ stage: 'completed', message: 'Secuencia PNG completada', percentage: 100 });

    return {
      filename: baseName,
      extension: 'zip',
      data: zipBuffer,
      mimeType: 'application/zip'
    };
  }
};
