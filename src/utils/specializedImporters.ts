import { unzipSync } from 'fflate';
import { readPsd } from 'ag-psd';
import { parseAseprite, ParsedAseprite } from './aseReader';
import { PixelProject, Frame, Layer, ProjectPixels } from '../types';
import { telemetry } from './telemetry';


/**
 * Loads an image (PNG, JPG, GIF, BMP, WEBP) from a File and returns its natural width, height, and HTMLImageElement.
 */
export function loadImageFromFile(file: File): Promise<{ width: number; height: number; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 32,
          height: img.naturalHeight || img.height || 32,
          img
        });
      };
      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to convert a canvas to flat pixel hex string array
 */
export function getPixelsFromCanvas(
  layerCanvas: HTMLCanvasElement | HTMLImageElement,
  width: number,
  height: number,
  left: number = 0,
  top: number = 0
): string[] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const pixels = new Array(width * height).fill('');

  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(layerCanvas, left, top);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const index = i / 4;
      if (a >= 12) {
        const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        pixels[index] = hex;
      }
    }
  }
  return pixels;
}

/**
 * Helper to load a PNG/JPG/etc bytes into an HTMLImageElement
 */
function decodeImageBytes(bytes: Uint8Array): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Parses ORA (OpenRaster) file and returns layers & dimensions
 */
async function parseOraFile(file: File): Promise<{
  width: number;
  height: number;
  layers: { name: string; opacity: number; visible: boolean; pixels: string[] }[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(arrayBuffer));

  const stackXmlBytes = unzipped['stack.xml'];
  if (!stackXmlBytes) {
    throw new Error('Archivo stack.xml no encontrado en el archivo .ora');
  }

  const xmlText = new TextDecoder().decode(stackXmlBytes);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const imageEl = xmlDoc.getElementsByTagName('image')[0];
  if (!imageEl) {
    throw new Error('Elemento <image> no encontrado en stack.xml');
  }

  const width = parseInt(imageEl.getAttribute('width') || '32', 10);
  const height = parseInt(imageEl.getAttribute('height') || '32', 10);

  const layerEls = Array.from(xmlDoc.getElementsByTagName('layer'));
  const parsedLayers: { name: string; opacity: number; visible: boolean; pixels: string[] }[] = [];

  for (let i = 0; i < layerEls.length; i++) {
    const el = layerEls[i];
    const src = el.getAttribute('src');
    if (!src) continue;

    // Remove leading slash if any
    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
    const pngBytes = unzipped[cleanSrc];
    if (!pngBytes) continue;

    const name = el.getAttribute('name') || `Capa ${i + 1}`;
    const opacityAttr = el.getAttribute('opacity') || '1.0';
    const opacity = Math.round(parseFloat(opacityAttr) * 100);
    const visible = el.getAttribute('visibility') !== 'hidden';

    const xOffset = parseInt(el.getAttribute('x') || '0', 10);
    const yOffset = parseInt(el.getAttribute('y') || '0', 10);

    const img = await decodeImageBytes(pngBytes);
    const pixels = getPixelsFromCanvas(img, width, height, xOffset, yOffset);

    parsedLayers.push({ name, opacity, visible, pixels });
  }

  if (parsedLayers.length === 0) {
    throw new Error('No se encontraron capas en el archivo .ora');
  }

  return { width, height, layers: parsedLayers };
}

/**
 * Parses PSD file and returns layers & dimensions
 */
async function parsePsdFile(file: File): Promise<{
  width: number;
  height: number;
  layers: { name: string; opacity: number; visible: boolean; pixels: string[] }[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const psd = readPsd(arrayBuffer);

  const width = psd.width;
  const height = psd.height;
  const parsedLayers: { name: string; opacity: number; visible: boolean; pixels: string[] }[] = [];

  // Helper to recursively collect layers
  function collectLayers(children: any[]) {
    for (const child of children) {
      if (child.children) {
        // Recurse groups
        collectLayers(child.children);
      } else {
        const name = child.name || 'Capa';
        const opacity = Math.round((child.opacity ?? 1) * 100);
        const visible = child.visible !== false;
        
        let pixels: string[];
        if (child.canvas) {
          pixels = getPixelsFromCanvas(child.canvas, width, height, child.left ?? 0, child.top ?? 0);
        } else {
          pixels = new Array(width * height).fill('');
        }

        parsedLayers.push({ name, opacity, visible, pixels });
      }
    }
  }

  if (psd.children && psd.children.length > 0) {
    collectLayers(psd.children);
  } else if (psd.canvas) {
    // Fallback to composite canvas
    const pixels = getPixelsFromCanvas(psd.canvas, width, height);
    parsedLayers.push({ name: 'Fondo', opacity: 100, visible: true, pixels });
  } else {
    throw new Error('No se pudo extraer ninguna capa del archivo PSD');
  }

  return { width, height, layers: parsedLayers };
}

/**
 * Unified importer function.
 * Converts any compatible file format into a rich PixelProject structure.
 * Formats: PNG, JPEG, GIF, PSD, ORA, ASE/ASEPRITE, BMP, WEBP.
 */
export async function parseCompatibleFileToProject(file: File): Promise<PixelProject> {
  const start = performance.now();
  const project = await parseCompatibleFileToProjectInternal(file);
  const duration = performance.now() - start;
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let format = 'PNG';
  if (ext === 'psd') format = 'PSD';
  else if (ext === 'ora') format = 'ORA';
  else if (ext === 'ase' || ext === 'aseprite') format = 'ASEPRITE';
  
  telemetry.recordImport(format, duration);
  return project;
}

async function parseCompatibleFileToProjectInternal(file: File): Promise<PixelProject> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const projectId = `proj-${Date.now()}`;
  const projectName = file.name.split('.')[0] || 'Nuevo Proyecto';

  if (ext === 'ora') {
    const { width, height, layers } = await parseOraFile(file);
    if (width > 600 || height > 600) {
      throw new Error(`El documento excede el límite máximo permitido de 600×600 px (${width}×${height} px).`);
    }
    const frames: Frame[] = [{ id: `frame-${Date.now()}`, name: 'Fotograma 1' }];
    
    // In our app layers[0] is the top-most layer, and we draw bottom to top.
    // ORA stack.xml lists layers from bottom-to-top.
    // So we reverse the ORA layers array so the top layer is at index 0.
    const reversedLayers = [...layers].reverse();

    const finalLayers: Layer[] = reversedLayers.map((l, idx) => ({
      id: `layer-${Date.now()}-${idx}`,
      name: l.name,
      opacity: l.opacity,
      visible: l.visible,
      locked: false
    }));

    const pixels: ProjectPixels = {
      [frames[0].id]: {}
    };

    finalLayers.forEach((layer, idx) => {
      pixels[frames[0].id][layer.id] = reversedLayers[idx].pixels;
    });

    return {
      id: projectId,
      name: projectName,
      width,
      height,
      frames,
      layers: finalLayers,
      pixels,
      fps: 8,
      tags: [],
      lastSaved: Date.now()
    };
  }

  if (ext === 'psd') {
    const { width, height, layers } = await parsePsdFile(file);
    if (width > 600 || height > 600) {
      throw new Error(`El documento excede el límite máximo permitido de 600×600 px (${width}×${height} px).`);
    }
    const frames: Frame[] = [{ id: `frame-${Date.now()}`, name: 'Fotograma 1' }];

    // PSD stores layers top-to-bottom or bottom-to-top depending on order.
    // ag-psd returns children from top to bottom.
    // Our app has layers[0] as top-most, so keep index order!
    const finalLayers: Layer[] = layers.map((l, idx) => ({
      id: `layer-${Date.now()}-${idx}`,
      name: l.name,
      opacity: l.opacity,
      visible: l.visible,
      locked: false
    }));

    const pixels: ProjectPixels = {
      [frames[0].id]: {}
    };

    finalLayers.forEach((layer, idx) => {
      pixels[frames[0].id][layer.id] = layers[idx].pixels;
    });

    return {
      id: projectId,
      name: projectName,
      width,
      height,
      frames,
      layers: finalLayers,
      pixels,
      fps: 8,
      tags: [],
      lastSaved: Date.now()
    };
  }

  if (ext === 'ase' || ext === 'aseprite') {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = parseAseprite(arrayBuffer);
    if (parsed.width > 600 || parsed.height > 600) {
      throw new Error(`El documento excede el límite máximo permitido de 600×600 px (${parsed.width}×${parsed.height} px).`);
    }

    // Create Frames
    const frames: Frame[] = parsed.frames.map((f, idx) => ({
      id: `frame-${Date.now()}-${idx}`,
      name: `Fotograma ${idx + 1}`
    }));

    // Create Layers
    const finalLayers: Layer[] = parsed.layers.map((l, idx) => ({
      id: `layer-${Date.now()}-${idx}`,
      name: l.name,
      opacity: l.opacity,
      visible: l.visible,
      locked: false
    }));

    // Populate Pixels
    const pixels: ProjectPixels = {};
    frames.forEach((frame, fIdx) => {
      pixels[frame.id] = {};
      const aseFrame = parsed.frames[fIdx];
      
      finalLayers.forEach((layer, lIdx) => {
        // ase-parser indices match directly or from celPixels
        const framePixels = aseFrame.celPixels[lIdx] || new Array(parsed.width * parsed.height).fill('');
        pixels[frame.id][layer.id] = framePixels;
      });
    });

    return {
      id: projectId,
      name: projectName,
      width: parsed.width,
      height: parsed.height,
      frames,
      layers: finalLayers,
      pixels,
      fps: parsed.frames[0]?.duration ? Math.round(1000 / parsed.frames[0].duration) : 8,
      tags: [],
      lastSaved: Date.now()
    };
  }

  // Fallback to standard image decoding (PNG, JPEG, GIF, BMP, WEBP)
  const { width, height, img } = await loadImageFromFile(file);
  if (width > 600 || height > 600) {
    throw new Error(`El documento excede el límite máximo permitido de 600×600 px (${width}×${height} px).`);
  }
  const frameId = `frame-${Date.now()}`;
  const layerId = `layer-${Date.now()}`;
  const pixelsArray = getPixelsFromCanvas(img, width, height);

  return {
    id: projectId,
    name: projectName,
    width,
    height,
    frames: [{ id: frameId, name: 'Fotograma 1' }],
    layers: [{ id: layerId, name: 'Capa 1', opacity: 100, visible: true, locked: false }],
    pixels: {
      [frameId]: {
        [layerId]: pixelsArray
      }
    },
    fps: 8,
    tags: [],
    lastSaved: Date.now()
  };
}
