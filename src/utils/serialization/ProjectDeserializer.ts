import { PixelProject } from '../../types';
import { SerializedProjectData } from './ProjectSerializer';

/**
 * ProjectDeserializer
 * Consolidated service responsible for reconstructing a PixelProject object 
 * from its serialized form (JSON string or object structure).
 */
export class ProjectDeserializer {
  /**
   * Reconstructs and sanitizes a project object from a serialized string or object.
   * Guarantees that volatile/transient properties are discarded or reinitialized safely.
   */
  public static deserialize(data: string | object): {
    project: PixelProject;
    symmetry: any;
    tiling: any;
    referenceImage: string | null;
    referenceOpacity: number;
    referenceScale: number;
    referenceX: number;
    referenceY: number;
    referenceAngle: number;
    referenceVisible: boolean;
    referenceLocked: boolean;
    customPalette: any;
    selectedFrameId?: string;
    selectedLayerId?: string;
    activeSelection?: any;
  } {
    let parsed: any;

    if (typeof data === 'string') {
      // Security guard: protect against giant memory payloads
      if (data.length > 50 * 1024 * 1024) {
        throw new Error(`[ProjectDeserializer] El tamaño del archivo (${Math.round(data.length / (1024 * 1024))} MB) supera el límite máximo seguro de 50 MB.`);
      }
      try {
        parsed = JSON.parse(data);
      } catch (err: any) {
        throw new Error(`[ProjectDeserializer] Failed to parse JSON: ${err.message}`);
      }
    } else if (typeof data === 'object' && data !== null) {
      parsed = Array.isArray(data) ? data : { ...data };
    } else {
      throw new Error('[ProjectDeserializer] Invalid input data type. Must be string or object.');
    }

    // Ensure we have a valid object structure (and not an array)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('[ProjectDeserializer] Decoded data is not a valid object.');
    }

    // Defensive dimension validation (Must be integer, finite, >= 1, <= 600)
    let width = 32;
    if ('width' in parsed && parsed.width !== undefined) {
      if (
        typeof parsed.width !== 'number' ||
        !Number.isFinite(parsed.width) ||
        !Number.isInteger(parsed.width) ||
        parsed.width < 1 ||
        parsed.width > 600
      ) {
        throw new Error(`[ProjectDeserializer] Ancho de lienzo inválido: ${parsed.width}. Debe ser un número entero entre 1 y 600 px.`);
      }
      width = parsed.width;
    }

    let height = 32;
    if ('height' in parsed && parsed.height !== undefined) {
      if (
        typeof parsed.height !== 'number' ||
        !Number.isFinite(parsed.height) ||
        !Number.isInteger(parsed.height) ||
        parsed.height < 1 ||
        parsed.height > 600
      ) {
        throw new Error(`[ProjectDeserializer] Alto de lienzo inválido: ${parsed.height}. Debe ser un número entero entre 1 y 600 px.`);
      }
      height = parsed.height;
    }

    // Frames validation (defense against OOM with frame limits)
    let rawFrames: any[] = [];
    if (parsed.frames !== undefined && parsed.frames !== null) {
      if (!Array.isArray(parsed.frames)) {
        rawFrames = [];
      } else {
        if (parsed.frames.length > 500) {
          throw new Error(`[ProjectDeserializer] El proyecto supera el límite máximo permitido de 500 fotogramas (${parsed.frames.length}).`);
        }
        rawFrames = parsed.frames;
      }
    }

    // Layers validation (defense against OOM with layer limits)
    let rawLayers: any[] = [];
    if (parsed.layers !== undefined && parsed.layers !== null) {
      if (!Array.isArray(parsed.layers)) {
        rawLayers = [];
      } else {
        if (parsed.layers.length > 100) {
          throw new Error(`[ProjectDeserializer] El proyecto supera el límite máximo permitido de 100 capas (${parsed.layers.length}).`);
        }
        rawLayers = parsed.layers;
      }
    }

    // Ensure at least 1 layer and 1 frame if empty
    if (rawLayers.length === 0) {
      rawLayers = [{ id: 'layer-1', name: 'Capa 1', visible: true, opacity: 1, locked: false, blendMode: 'normal' }];
    }
    if (rawFrames.length === 0) {
      rawFrames = [{ id: 'frame-1', name: 'Fotograma 1', durationMs: 100 }];
    }

    // Defensive check: Total pixel volume quota (width * height * frames * layers)
    const totalPixelVolume = width * height * rawFrames.length * rawLayers.length;
    if (totalPixelVolume > 50_000_000) {
      throw new Error(`[ProjectDeserializer] El volumen total de píxeles (${width}×${height} × ${rawFrames.length} frames × ${rawLayers.length} capas = ${totalPixelVolume.toLocaleString()}) supera la cuota de seguridad de 50,000,000 celdas.`);
    }

    // Pixels structure validation and sanitization
    const rawPixels = parsed.pixels && typeof parsed.pixels === 'object' && !Array.isArray(parsed.pixels) ? parsed.pixels : {};
    const sanitizedPixels: Record<string, Record<string, string[]>> = {};
    const maxPixelsPerCel = width * height;

    for (const frameKey of Object.keys(rawPixels)) {
      if (frameKey === '__proto__' || frameKey === 'constructor' || frameKey === 'prototype') continue;
      const frameObj = rawPixels[frameKey];
      if (frameObj && typeof frameObj === 'object' && !Array.isArray(frameObj)) {
        sanitizedPixels[frameKey] = {};
        for (const layerKey of Object.keys(frameObj)) {
          if (layerKey === '__proto__' || layerKey === 'constructor' || layerKey === 'prototype') continue;
          const pixelData = frameObj[layerKey];
          if (Array.isArray(pixelData)) {
            if (pixelData.length > maxPixelsPerCel) {
              throw new Error(`[ProjectDeserializer] Estructura de píxeles anómala: la capa '${layerKey}' contiene ${pixelData.length} celdas, superando el tamaño del lienzo de ${maxPixelsPerCel}.`);
            }
            sanitizedPixels[frameKey][layerKey] = pixelData;
          }
        }
      }
    }

    // FPS validation
    let fps = 12;
    if (typeof parsed.fps === 'number' && Number.isFinite(parsed.fps)) {
      fps = Math.max(1, Math.min(60, Math.round(parsed.fps)));
    }

    // Tags & guides limits validation
    if (Array.isArray(parsed.tags) && parsed.tags.length > 200) {
      throw new Error(`[ProjectDeserializer] El proyecto supera el límite de 200 etiquetas (${parsed.tags.length}).`);
    }
    if (Array.isArray(parsed.guides) && parsed.guides.length > 200) {
      throw new Error(`[ProjectDeserializer] El proyecto supera el límite de 200 guías (${parsed.guides.length}).`);
    }

    const cleanName = typeof parsed.name === 'string' ? parsed.name.slice(0, 256) : 'Sin Título';
    const cleanId = typeof parsed.id === 'string' ? parsed.id.slice(0, 128) : `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 1. Reconstruct the clean, core PixelProject object
    const project: PixelProject = {
      id: cleanId,
      name: cleanName || 'Sin Título',
      width,
      height,
      layers: rawLayers,
      frames: rawFrames,
      pixels: sanitizedPixels,
      fps,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 200) : [],
      animationClips: Array.isArray(parsed.animationClips) ? parsed.animationClips.slice(0, 100) : undefined,
      animationTags: Array.isArray(parsed.animationTags) ? parsed.animationTags.slice(0, 100) : undefined,
      guides: Array.isArray(parsed.guides) ? parsed.guides.slice(0, 200) : undefined,
      folderId: typeof parsed.folderId === 'string' ? parsed.folderId.slice(0, 128) : undefined,
      lastSaved: typeof parsed.lastSaved === 'number' && Number.isFinite(parsed.lastSaved) ? parsed.lastSaved : Date.now(),
      isCloud: !!parsed.isCloud,
      hasBeenSavedLocally: !!parsed.hasBeenSavedLocally,
      hasBeenSavedCloud: !!parsed.hasBeenSavedCloud,
      hasDownloadedInitialFile: !!parsed.hasDownloadedInitialFile,
      fileFormat: parsed.fileFormat || 'onepixel',
      fileHandle: (typeof data === 'object' && data !== null) ? (data as any).fileHandle : undefined,
      nativeFileUri: typeof parsed.nativeFileUri === 'string' ? parsed.nativeFileUri : undefined,
      isModified: false // Resets on load
    };

    // 2. Extracts workspace/session settings with safe fallbacks
    const symmetry = parsed.symmetry || {
      x: false,
      y: false,
      radial: false,
      radialCount: 4,
      centerX: project.width / 2,
      centerY: project.height / 2
    };

    const tiling = parsed.tiling || {
      active: false,
      repeatX: true,
      repeatY: true
    };

    const referenceImage = parsed.referenceImage || null;
    let referenceOpacity = typeof parsed.referenceOpacity === 'number' ? parsed.referenceOpacity : 0.5;
    if (referenceOpacity > 1) {
      referenceOpacity = referenceOpacity / 100;
    }
    const referenceScale = typeof parsed.referenceScale === 'number' ? parsed.referenceScale : 1.0;
    const referenceX = typeof parsed.referenceX === 'number' ? parsed.referenceX : 0;
    const referenceY = typeof parsed.referenceY === 'number' ? parsed.referenceY : 0;
    const referenceAngle = typeof parsed.referenceAngle === 'number' ? parsed.referenceAngle : 0;
    const referenceVisible = typeof parsed.referenceVisible === 'boolean' ? parsed.referenceVisible : true;
    const referenceLocked = typeof parsed.referenceLocked === 'boolean' ? parsed.referenceLocked : true;
    const customPalette = parsed.customPalette || null;

    return {
      project,
      symmetry,
      tiling,
      referenceImage,
      referenceOpacity,
      referenceScale,
      referenceX,
      referenceY,
      referenceAngle,
      referenceVisible,
      referenceLocked,
      customPalette,
      selectedFrameId: typeof (parsed as any).selectedFrameId === 'string' ? (parsed as any).selectedFrameId : undefined,
      selectedLayerId: typeof (parsed as any).selectedLayerId === 'string' ? (parsed as any).selectedLayerId : undefined,
      activeSelection: (parsed as any).activeSelection || undefined
    };
  }
}
