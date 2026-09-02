import { LibraryResource, LibraryFolder, ResourceType, LanguageCode } from '../types';
import { LocalPersistence } from './persistence/LocalPersistence';
import { convertToCanonical } from './paletteParser';
import { ProjectSerializer } from './serialization/ProjectSerializer';

export const PRESET_RESOURCES: LibraryResource[] = [
  // Custom Brushes (8 pinceles pixel art de nivel profesional)
  {
    id: 'preset-brush-1',
    name: 'Lápiz Fino (1px)',
    type: 'brush',
    data: { id: 'brush-pixel', size: 1, pixels: [[true]] },
    tags: ['Fino', 'Pincel', 'Básico'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-2',
    name: 'Pincel Cuadrado Rígido (2x2)',
    type: 'brush',
    data: { id: 'brush-square-2x2', size: 2, pixels: [[true, true], [true, true]] },
    tags: ['Bloque', 'Pincel', 'Básico'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-3',
    name: 'Pincel Redondo Orgánico (3x3)',
    type: 'brush',
    data: { id: 'brush-circle-3x3', size: 3, pixels: [[false, true, false], [true, true, true], [false, true, false]] },
    tags: ['Suave', 'Pincel', 'Básico'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-4',
    name: 'Pincel Doble Diagonal',
    type: 'brush',
    data: { id: 'brush-diagonal-2px', size: 2, pixels: [[true, false], [false, true]] },
    tags: ['Diagonal', 'Pincel'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-5',
    name: 'Estrella de Cruz (5px)',
    type: 'brush',
    data: { id: 'brush-star-5px', size: 5, pixels: [
      [false, false, true, false, false],
      [false, false, true, false, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false]
    ]},
    tags: ['Especial', 'Pincel', 'Estrella'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-6',
    name: 'Sombreado Bayer Fino (4x4)',
    type: 'brush',
    data: { id: 'brush-bayer-4x4', size: 4, pixels: [
      [true, false, true, false],
      [false, true, false, true],
      [true, false, true, false],
      [false, true, false, true]
    ]},
    tags: ['Sombreado', 'Pincel', 'Dither'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-brush-7',
    name: 'Pincel Ruido Orgánico (3x3)',
    type: 'brush',
    data: { id: 'brush-noise-3x3', size: 3, pixels: [
      [true, false, true],
      [false, true, false],
      [true, false, false]
    ]},
    tags: ['Disperso', 'Pincel', 'Ruido'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },

  // Color Palettes (8 paletas cuidadosamente seleccionadas)
  {
    id: 'preset-palette-onepixel-classic',
    name: 'Paleta OnePixel Classic',
    type: 'palette',
    data: { colors: ['#1a1b2e', '#2a2b4d', '#3d3e75', '#5556a3', '#C8A96A', '#9596f2', '#bcbdff', '#e0e1ff', '#2d162c', '#4d2042', '#752d5b', '#a33c75', '#d65193', '#f272b1', '#ff9ecf', '#ffcce3'] },
    tags: ['Retro', 'OnePixel', 'Paleta', 'Classic'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-atardecer-magico',
    name: 'Paleta Atardecer Cósmico',
    type: 'palette',
    data: { colors: ['#0f051d', '#2c114d', '#551a8b', '#821a9c', '#b11d94', '#d92c7b', '#f54e52', '#ff7f32', '#ffa928', '#ffd13b'] },
    tags: ['Cosmic', 'Vibrante', 'Atardecer', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-bosque-esmeralda',
    name: 'Paleta Bosque Medieval',
    type: 'palette',
    data: { colors: ['#051c08', '#0b3010', '#144d1c', '#1f6e2b', '#308e40', '#4cb35e', '#75d988', '#a3f2b4', '#151b14', '#2a3528'] },
    tags: ['Bosque', 'Medieval', 'Naturaleza', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-cyberpunk',
    name: 'Paleta Cyberpunk 2077',
    type: 'palette',
    data: { colors: ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226'] },
    tags: ['Retro', 'Cyberpunk', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-nes',
    name: 'Paleta Retro NES',
    type: 'palette',
    data: { colors: ['#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000'] },
    tags: ['Retro', 'NES', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-pico8',
    name: 'Paleta Fantasía PICO-8',
    type: 'palette',
    data: { colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'] },
    tags: ['Retro', 'Pico8', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-palette-gameboy',
    name: 'Paleta Classic GameBoy DMG',
    type: 'palette',
    data: { colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    tags: ['Retro', 'GameBoy', 'Paleta'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },

  // Texture Patterns (10 texturas básicas de Pixel Art)
  {
    id: 'preset-texture-ladrillo',
    name: 'Ladrillo',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#d9534f', '#c0392b', '#962d22', '#4a4a4a', '#d9534f', '#c0392b', '#962d22', '#4a4a4a',
        '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a',
        '#962d22', '#4a4a4a', '#d9534f', '#c0392b', '#962d22', '#4a4a4a', '#d9534f', '#c0392b',
        '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a',
        '#d9534f', '#c0392b', '#962d22', '#4a4a4a', '#d9534f', '#c0392b', '#962d22', '#4a4a4a',
        '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a',
        '#962d22', '#4a4a4a', '#d9534f', '#c0392b', '#962d22', '#4a4a4a', '#d9534f', '#c0392b',
        '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a', '#4a4a4a'
      ]
    },
    tags: ['Construcción', 'Ladrillo', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-piedra',
    name: 'Piedra',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#9ca3af', '#6b7280', '#6b7280', '#4b5563', '#1f2937', '#9ca3af', '#6b7280', '#1f2937',
        '#6b7280', '#4b5563', '#4b5563', '#4b5563', '#1f2937', '#6b7280', '#4b5563', '#1f2937',
        '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937',
        '#1f2937', '#9ca3af', '#6b7280', '#1f2937', '#9ca3af', '#6b7280', '#6b7280', '#4b5563',
        '#1f2937', '#6b7280', '#4b5563', '#1f2937', '#6b7280', '#4b5563', '#4b5563', '#4b5563',
        '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937', '#1f2937',
        '#9ca3af', '#6b7280', '#1f2937', '#9ca3af', '#6b7280', '#6b7280', '#4b5563', '#1f2937',
        '#6b7280', '#4b5563', '#1f2937', '#6b7280', '#4b5563', '#4b5563', '#4b5563', '#1f2937'
      ]
    },
    tags: ['Construcción', 'Piedra', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-madera',
    name: 'Madera',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#b45309', '#92400e', '#92400e', '#78350f', '#92400e', '#b45309', '#92400e', '#78350f',
        '#92400e', '#78350f', '#92400e', '#92400e', '#78350f', '#92400e', '#78350f', '#92400e',
        '#78350f', '#92400e', '#78350f', '#b45309', '#92400e', '#78350f', '#92400e', '#78350f',
        '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03',
        '#b45309', '#92400e', '#78350f', '#92400e', '#b45309', '#92400e', '#92400e', '#78350f',
        '#92400e', '#78350f', '#92400e', '#78350f', '#92400e', '#78350f', '#92400e', '#92400e',
        '#78350f', '#92400e', '#b45309', '#92400e', '#78350f', '#92400e', '#78350f', '#78350f',
        '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03', '#451a03'
      ]
    },
    tags: ['Naturaleza', 'Madera', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-tierra',
    name: 'Tierra',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#713f12', '#713f12', '#854d0e', '#713f12', '#713f12', '#522b07', '#713f12', '#713f12',
        '#713f12', '#522b07', '#713f12', '#713f12', '#854d0e', '#713f12', '#713f12', '#522b07',
        '#522b07', '#3b1a03', '#522b07', '#713f12', '#713f12', '#713f12', '#854d0e', '#713f12',
        '#713f12', '#522b07', '#713f12', '#854d0e', '#713f12', '#522b07', '#713f12', '#713f12',
        '#713f12', '#713f12', '#713f12', '#713f12', '#522b07', '#3b1a03', '#522b07', '#713f12',
        '#854d0e', '#713f12', '#522b07', '#713f12', '#713f12', '#522b07', '#713f12', '#854d0e',
        '#713f12', '#713f12', '#713f12', '#854d0e', '#713f12', '#713f12', '#713f12', '#713f12',
        '#522b07', '#713f12', '#713f12', '#713f12', '#713f12', '#522b07', '#3b1a03', '#522b07'
      ]
    },
    tags: ['Naturaleza', 'Tierra', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-arena',
    name: 'Arena',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#fde047', '#fde047', '#fef08a', '#fde047', '#fde047', '#eab308', '#fde047', '#fde047',
        '#fde047', '#eab308', '#ca8a04', '#eab308', '#fde047', '#fde047', '#fef08a', '#fde047',
        '#eab308', '#ca8a04', '#eab308', '#fde047', '#fde047', '#eab308', '#ca8a04', '#eab308',
        '#fde047', '#fde047', '#fde047', '#fde047', '#eab308', '#ca8a04', '#eab308', '#fde047',
        '#fef08a', '#fde047', '#fde047', '#eab308', '#ca8a04', '#eab308', '#fde047', '#fde047',
        '#fde047', '#eab308', '#ca8a04', '#eab308', '#fde047', '#fde047', '#fde047', '#eab308',
        '#eab308', '#ca8a04', '#eab308', '#fde047', '#fde047', '#eab308', '#ca8a04', '#eab308',
        '#fde047', '#fde047', '#fde047', '#fef08a', '#fde047', '#fde047', '#eab308', '#ca8a04'
      ]
    },
    tags: ['Naturaleza', 'Arena', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-hierba',
    name: 'Hierba',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#22c55e', '#4ade80', '#22c55e', '#166534', '#22c55e', '#4ade80', '#22c55e', '#166534',
        '#166534', '#22c55e', '#166534', '#14532d', '#166534', '#22c55e', '#166534', '#14532d',
        '#22c55e', '#166534', '#22c55e', '#4ade80', '#22c55e', '#166534', '#22c55e', '#4ade80',
        '#166534', '#14532d', '#166534', '#22c55e', '#166534', '#14532d', '#166534', '#22c55e',
        '#22c55e', '#4ade80', '#22c55e', '#166534', '#22c55e', '#4ade80', '#22c55e', '#166534',
        '#166534', '#22c55e', '#166534', '#14532d', '#166534', '#22c55e', '#166534', '#14532d',
        '#22c55e', '#166534', '#22c55e', '#4ade80', '#22c55e', '#166534', '#22c55e', '#4ade80',
        '#166534', '#14532d', '#166534', '#22c55e', '#166534', '#14532d', '#166534', '#22c55e'
      ]
    },
    tags: ['Naturaleza', 'Hierba', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-metal',
    name: 'Metal',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#334155',
        '#e2e8f0', '#334155', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#334155', '#64748b',
        '#e2e8f0', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#64748b',
        '#e2e8f0', '#94a3b8', '#94a3b8', '#64748b', '#64748b', '#94a3b8', '#94a3b8', '#64748b',
        '#e2e8f0', '#94a3b8', '#94a3b8', '#64748b', '#64748b', '#94a3b8', '#94a3b8', '#64748b',
        '#e2e8f0', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#64748b',
        '#e2e8f0', '#334155', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#334155', '#64748b',
        '#334155', '#64748b', '#64748b', '#64748b', '#64748b', '#64748b', '#64748b', '#334155'
      ]
    },
    tags: ['Construcción', 'Metal', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-agua',
    name: 'Agua',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#1d4ed8', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8', '#1d4ed8', '#1d4ed8',
        '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8', '#1d4ed8', '#1e3a8a', '#1d4ed8',
        '#3b82f6', '#1d4ed8', '#1d4ed8', '#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6',
        '#1d4ed8', '#1e3a8a', '#1d4ed8', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8',
        '#1d4ed8', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a', '#1d4ed8',
        '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8', '#1d4ed8', '#1d4ed8', '#1e3a8a',
        '#3b82f6', '#1d4ed8', '#1d4ed8', '#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6',
        '#1d4ed8', '#1e3a8a', '#1d4ed8', '#1d4ed8', '#3b82f6', '#93c5fd', '#3b82f6', '#1d4ed8'
      ]
    },
    tags: ['Naturaleza', 'Agua', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-tela',
    name: 'Tela',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#f87171', '#ef4444', '#991b1b', '#ef4444', '#f87171', '#ef4444', '#991b1b', '#ef4444',
        '#ef4444', '#dc2626', '#ef4444', '#991b1b', '#ef4444', '#dc2626', '#ef4444', '#991b1b',
        '#991b1b', '#ef4444', '#f87171', '#ef4444', '#991b1b', '#ef4444', '#f87171', '#ef4444',
        '#ef4444', '#991b1b', '#ef4444', '#dc2626', '#ef4444', '#991b1b', '#ef4444', '#dc2626',
        '#f87171', '#ef4444', '#991b1b', '#ef4444', '#f87171', '#ef4444', '#991b1b', '#ef4444',
        '#ef4444', '#dc2626', '#ef4444', '#991b1b', '#ef4444', '#dc2626', '#ef4444', '#991b1b',
        '#991b1b', '#ef4444', '#f87171', '#ef4444', '#991b1b', '#ef4444', '#f87171', '#ef4444',
        '#ef4444', '#991b1b', '#ef4444', '#dc2626', '#ef4444', '#991b1b', '#ef4444', '#dc2626'
      ]
    },
    tags: ['Material', 'Tela', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  },
  {
    id: 'preset-texture-azulejo',
    name: 'Azulejo / Baldosa',
    type: 'texture',
    data: { 
      width: 8, 
      height: 8,
      pixels: [
        '#38bdf8', '#0284c7', '#0369a1', '#0f172a', '#38bdf8', '#0284c7', '#0369a1', '#0f172a',
        '#0284c7', '#0284c7', '#0369a1', '#0f172a', '#0284c7', '#0284c7', '#0369a1', '#0f172a',
        '#0369a1', '#0369a1', '#0369a1', '#0f172a', '#0369a1', '#0369a1', '#0369a1', '#0f172a',
        '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a',
        '#38bdf8', '#0284c7', '#0369a1', '#0f172a', '#38bdf8', '#0284c7', '#0369a1', '#0f172a',
        '#0284c7', '#0284c7', '#0369a1', '#0f172a', '#0284c7', '#0284c7', '#0369a1', '#0f172a',
        '#0369a1', '#0369a1', '#0369a1', '#0f172a', '#0369a1', '#0369a1', '#0369a1', '#0f172a',
        '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a', '#0f172a'
      ]
    },
    tags: ['Construcción', 'Azulejo', 'Baldosa', 'Textura'],
    createdAt: 1719859200000,
    updatedAt: 1719859200000
  }
];

/**
 * ProjectLibraryService
 * Business logic manager of resources, folders, and operations for the library,
 * completely decoupled from UI components.
 */
export class ProjectLibraryService {
  /**
   * Loads both preset and user resources, performs auto-migration and cleanup.
   */
  public static async loadResources(): Promise<LibraryResource[]> {
    // 1. Load resources from local storage
    let loadedResources = LocalPersistence.loadResources();
    const loadedFolders = LocalPersistence.loadFolders();

    // 2. Perform one-time cleanup of custom items if not done
    const cleanupDone = localStorage.getItem('pixel_cleanup_manual_v1');
    if (!cleanupDone) {
      for (const f of loadedFolders) {
        if (f.id !== 'fol-sprites' && f.id !== 'fol-palettes' && f.id !== 'fol-brushes') {
          try {
            LocalPersistence.deleteFolder(f.id);
          } catch (err) {
            console.warn("Cleanup folder delete error:", err);
          }
        }
      }
      for (const r of loadedResources) {
        if (r.type === 'palette' && !r.id.startsWith('preset-') && !r.id.startsWith('seed-')) {
          try {
            LocalPersistence.deleteResource(r.id);
          } catch (err) {
            console.warn("Cleanup resource delete error:", err);
          }
        }
      }
      localStorage.setItem('pixel_cleanup_manual_v1', 'true');
      loadedResources = LocalPersistence.loadResources();
    }

    // 3. Load lists of deleted resources
    const deletedPresetIds = this.getDeletedPresetIds();
    const deletedIds = this.getDeletedResourceIds();

    const validPresetIds = new Set(PRESET_RESOURCES.map(r => r.id));
    const filteredPresets = PRESET_RESOURCES.filter(r => !deletedPresetIds.includes(r.id) && !deletedIds.includes(r.id));
    const filteredLoaded = loadedResources.filter(r => {
      if (deletedPresetIds.includes(r.id) || deletedIds.includes(r.id)) return false;
      // Filter out old preset textures that are no longer in PRESET_RESOURCES
      if (r.id.startsWith('preset-texture-') && !validPresetIds.has(r.id)) return false;
      return true;
    });

    // 4. Run version migrations
    const migratedLoaded = await Promise.all(filteredLoaded.map(async (r) => {
      if (r.type === 'palette') {
        if (!r.data || r.data.version !== 1) {
          const rawColors = r.data?.colors || r.data || [];
          const canonical = convertToCanonical({ name: r.name, colors: rawColors }, true);
          const updatedResource = {
            ...r,
            data: canonical,
            updatedAt: Date.now()
          };
          try {
            LocalPersistence.saveResource(updatedResource);
          } catch (err) {
            console.warn("Auto-migration save failed:", err);
          }
          return updatedResource;
        }
      }
      return r;
    }));

    return [...filteredPresets, ...migratedLoaded];
  }

  /**
   * Loads custom folders.
   */
  public static async loadFolders(): Promise<LibraryFolder[]> {
    return LocalPersistence.loadFolders();
  }

  /**
   * Creates and saves a new folder.
   */
  public static async createFolder(name: string, activeTab: ResourceType): Promise<LibraryFolder> {
    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      type: activeTab,
      createdAt: Date.now()
    };
    LocalPersistence.saveFolder(newFolder);
    return newFolder;
  }

  /**
   * Deletes a folder and moves its contents to root.
   */
  public static async deleteFolder(id: string, allResources: LibraryResource[]): Promise<void> {
    const resourcesInFolder = allResources.filter(r => r.folderId === id);
    for (const res of resourcesInFolder) {
      const updated = { ...res, folderId: undefined };
      LocalPersistence.saveResource(updated);
    }
    LocalPersistence.deleteFolder(id);
  }

  /**
   * Renames a folder.
   */
  public static async renameFolder(id: string, newName: string): Promise<void> {
    const folders = LocalPersistence.loadFolders();
    const folder = folders.find(f => f.id === id);
    if (folder) {
      folder.name = newName.trim();
      LocalPersistence.saveFolder(folder);
    }
  }

  /**
   * Deletes a library resource.
   */
  public static async deleteResource(id: string): Promise<void> {
    const deletedIds = this.getDeletedResourceIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('pixel_deleted_resources', JSON.stringify(deletedIds));
    }

    if (id.startsWith('preset-') || id.startsWith('seed-')) {
      const deletedPresetIds = this.getDeletedPresetIds();
      if (!deletedPresetIds.includes(id)) {
        deletedPresetIds.push(id);
        localStorage.setItem('pixel_deleted_presets', JSON.stringify(deletedPresetIds));
      }
    } else {
      LocalPersistence.deleteResource(id);
    }
  }

  /**
   * Saves active content (Project or Palette) to the library.
   */
  public static async saveActiveToLibrary(
    name: string,
    type: ResourceType,
    currentProjectData: any,
    currentPaletteColors: string[] | undefined,
    folderId?: string,
    tags: string = ''
  ): Promise<LibraryResource> {
    let serializedData: any = null;
    let resourceId = `resource-${Date.now()}`;
    
    if (type === 'project' && currentProjectData) {
      serializedData = ProjectSerializer.serializeToObj(currentProjectData);
    } else if (type === 'palette' && currentPaletteColors) {
      const canonical = convertToCanonical({ name, colors: currentPaletteColors }, true);
      serializedData = canonical;
      resourceId = canonical.id;
    } else if (type === 'brush') {
      serializedData = { size: 3, pixels: [[true, true, true], [true, true, true], [true, true, true]] };
    } else {
      throw new Error('No active data to save');
    }

    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const newResource: LibraryResource = {
      id: resourceId,
      name: name.trim(),
      type,
      data: serializedData,
      tags: tagsArr,
      folderId: folderId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    LocalPersistence.saveResource(newResource);
    return newResource;
  }

  /**
   * Duplicates an existing resource.
   */
  public static async duplicateResource(res: LibraryResource, language: LanguageCode = 'es'): Promise<LibraryResource> {
    const copySuffixMap: Record<LanguageCode, string> = {
      es: ' (Copia)',
      pt: ' (Cópia)',
      'zh-CN': ' (副本)',
      ru: ' (Копия)',
      ja: ' (コピー)',
      en: ' (Copy)'
    };
    const copySuffix = copySuffixMap[language] || ' (Copy)';
    const duplicated: LibraryResource = {
      ...res,
      id: `resource-copy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${res.name}${copySuffix}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: JSON.parse(JSON.stringify(res.data))
    };
    
    LocalPersistence.saveResource(duplicated);
    return duplicated;
  }

  /**
   * Renames a resource.
   */
  public static async renameResource(res: LibraryResource, newName: string): Promise<LibraryResource> {
    const updated: LibraryResource = {
      ...res,
      name: newName.trim(),
      updatedAt: Date.now()
    };
    LocalPersistence.saveResource(updated);
    return updated;
  }

  /**
   * Saves or updates a resource.
   */
  public static async saveResource(res: LibraryResource): Promise<void> {
    LocalPersistence.saveResource(res);
  }

  /**
   * Shares a resource.
   */
  public static async shareResource(res: LibraryResource): Promise<LibraryResource> {
    const updated = { ...res, isShared: true };
    LocalPersistence.saveResource(updated);
    return updated;
  }

  /**
   * Fetches shared resources (local stub).
   */
  public static async fetchSharedResources(_activeTab: ResourceType): Promise<any[]> {
    return [];
  }

  // Session & Connection Info delegation
  public static getAuthUser() {
    return null;
  }

  public static async login() {
    return null;
  }

  public static async logout() {
    // no-op
  }

  public static isCloudAvailable() {
    return false;
  }

  // Helper getters
  private static getDeletedPresetIds(): string[] {
    const deletedPresetIdsStr = localStorage.getItem('pixel_deleted_presets') || '[]';
    try {
      return JSON.parse(deletedPresetIdsStr);
    } catch (e) {
      return [];
    }
  }

  private static getDeletedResourceIds(): string[] {
    const deletedIdsStr = localStorage.getItem('pixel_deleted_resources') || '[]';
    try {
      return JSON.parse(deletedIdsStr);
    } catch (e) {
      return [];
    }
  }
}
