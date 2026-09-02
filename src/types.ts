export interface Layer {
  id: string;
  name: string;
  opacity: number; // 0 to 100
  visible: boolean;
  locked: boolean;
  blendMode?: string; // normal, multiply, screen, overlay, darken, lighten
  isStatic?: boolean; // When true, layer remains static across all animation frames without duplicating data
}

export interface Frame {
  id: string;
  name: string;
  durationMs?: number; // Duration of the frame in milliseconds
}

export interface AnimationClip {
  id: string;
  name: string;
  startFrameIndex: number; // index of starting frame (base 0)
  endFrameIndex: number;   // index of ending frame (base 0)
  repeatMode: 'loop' | 'once' | 'pingpong';
}

export interface AnimationTag {
  id: string;
  name: string;
  color: string;           // Hex color for UI representation
  startFrameIndex: number; // index of starting frame (base 0, inclusive)
  endFrameIndex: number;   // index of ending frame (base 0, inclusive)
}

export interface OnionSkinSettings {
  enabled: boolean;
  framesBefore: number;    // e.g., 2
  framesAfter: number;     // e.g., 1
  opacityBefore: number;   // 0.0 to 1.0
  opacityAfter: number;    // 0.0 to 1.0
  colorBefore: string;     // Hex color (e.g. Red tint)
  colorAfter: string;      // Hex color (e.g. Green tint)
  tintMode: boolean;       // Apply solid tint or just opacity
}

export interface AnimationDocument {
  id: string;
  projectName: string;
  frames: Frame[];
  clips: AnimationClip[];
  tags: AnimationTag[];
  schemaVersion: '1.0.0';
}

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface PlaybackSnapshot {
  state: PlaybackState;
  activeFrameIndex: number;
  playbackMode: 'forward' | 'reverse' | 'pingpong';
  pingPongDirection: 'forward' | 'reverse';
  speedMultiplier: number;
  loop: boolean;
  activeTag: AnimationTag | null;
  customRange: { start: number; end: number } | null;
}

export interface AnimationSession {
  activeFrameIndex: number;
  selectedFrameIndices: number[];
  isPlaying: boolean;
  activeClipId: string | null;
  playbackSpeedMultiplier: number; // e.g., 0.5, 1.0, 2.0
  timelineScrollX: number;
  timelineZoom: number;
  clipboard: {
    frames: Frame[];
    pixels: Record<string, Record<string, string[]>>; // frameId -> layerId -> 1D pixels array
  } | null;
}

export interface EditorSettings {
  onionSkin: OnionSkinSettings;
  showGrid: boolean;
  theme: 'dark' | 'light' | 'cosmic';
  snappingEnabled: boolean;
  timelineCompactMode: boolean;
}

// Pixel representation for a layer inside a frame
// 1D array of hex strings of length width * height (e.g., "#ffffff" or "" for transparent)
export interface FrameLayerPixels {
  [layerId: string]: string[];
}

export interface ProjectPixels {
  [frameId: string]: FrameLayerPixels;
}

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // in canvas coordinate space
  isProjectLevel: boolean;
  locked: boolean;
  color?: string;
}

export interface PixelProject {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
  frames: Frame[];
  pixels: ProjectPixels; // pixels[frameId][layerId] = string[]
  fps: number;
  tags: string[];
  animationClips?: AnimationClip[];
  animationTags?: AnimationTag[];
  guides?: Guide[];
  folderId?: string;
  lastSaved: number;
  isCloud?: boolean;
  hasBeenSavedLocally?: boolean;
  hasBeenSavedCloud?: boolean;
  hasDownloadedInitialFile?: boolean;
  fileHandle?: any;
  fileFormat?: string;
  isModified?: boolean;
  schemaVersion?: string;
  createdWith?: string;
  lastSavedWith?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // array of hex strings
  tags: string[];
  folderId?: string;
  userId?: string;
  lastSaved: number;
  isCloud?: boolean;
}

export interface CanonicalPalette {
  id: string;             // Identificador único de la paleta
  name: string;           // Nombre asignado de la paleta
  colors: string[];       // Array de colores en formato HEX de 7 caracteres en minúsculas (ej: "#000000")
  version: number;        // Versión del esquema del modelo de datos para control de migración
  isCustom: boolean;      // Indica si es una paleta creada/modificada por el usuario
  description?: string;   // Metadatos descriptivos de la paleta
}

export interface CustomBrush {
  id: string;
  name: string;
  size: number;
  pixels: boolean[][]; // shape map
  tags: string[];
  folderId?: string;
  userId?: string;
  lastSaved: number;
  isCloud?: boolean;
}

export type ResourceType = 'project' | 'palette' | 'brush' | 'texture';

export interface LibraryResource {
  id: string;
  name: string;
  type: ResourceType;
  data: any; // Serialized JSON representation
  tags: string[];
  folderId?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  userEmail?: string;
  isShared?: boolean;
}

export interface LibraryFolder {
  id: string;
  name: string;
  type: ResourceType | 'all';
  createdAt: number;
}

export type ToolType = 'pen' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'curve' | 'spray' | 'dithering' | 'clone_stamp' | 'bucket' | 'picker' | 'wand' | 'pan' | 'rect_select' | 'ellipse_select' | 'lasso_select';

export interface SymmetrySettings {
  x: boolean; // vertical mirror
  y: boolean; // horizontal mirror
  radial: boolean; // 4-way radial symmetry
  radialCount: number; // e.g., 4 or 8
  centerX: number; // coordinate of symmetry center
  centerY: number;
}

export interface TilingSettings {
  active: boolean;
  repeatX: boolean;
  repeatY: boolean;
}

export interface SelectionState {
  active: boolean;
  pixels: boolean[]; // 1D array of length width * height indicating selected coordinates
}

export interface UserPreferences {
  digitalPenEnabled: boolean;
  interfaceSize: 'sm' | 'md' | 'lg' | 'xl';
  largeButtons: boolean;
  gesturesEnabled: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  interfaceColor: 'slate' | 'gold' | 'rose' | 'charcoal';
  leftHandedMode: boolean;
  autoSaveEnabled?: boolean;
  language?: 'es' | 'en' | 'pt' | 'zh-CN' | 'ru' | 'ja';
  diagnosticsModeEnabled?: boolean;
  theme?: 'standard' | 'dark' | 'light';
}

export interface FrameSelectionState {
  activeFrameId: string;
  focusedFrameId: string;
  anchorFrameId: string;
  selectedFrameIds: readonly string[]; // Conceptually a Set without duplicates, represented as an array
}

export interface OpenProjectTab {
  id: string;
  project: PixelProject;
  selectedFrameId: string;
  selectedLayerId: string;
  focusedFrameId?: string;
  anchorFrameId?: string;
  selectedFrameIds?: readonly string[];
  undoStack: any[];
  redoStack: any[];
  symmetry: SymmetrySettings;
  tiling: TilingSettings;
  fileHandle?: any;
  fileFormat?: string;
  hasDownloadedInitialFile?: boolean;
}

export interface SpriteAtlasFrame {
  name: string;
  frameIndex: number;
  frameId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pivotX?: number;
  pivotY?: number;
  borderLeft?: number;
  borderRight?: number;
  borderTop?: number;
  borderBottom?: number;
}

export interface SpriteAtlasMetadata {
  projectName: string;
  width: number;
  height: number;
  scale: number;
  layout: 'horizontal' | 'vertical' | 'grid';
  columns: number;
  spacing: number;
  margin: number;
  transparent: boolean;
  bgColor?: string;
  schema: 'OnePixel_SpriteAtlas';
  schemaVersion: '1.0.0';
  app: string;
  generator: string;
}

export interface SpriteAtlas {
  canvas: HTMLCanvasElement;
  frames: SpriteAtlasFrame[];
  meta: SpriteAtlasMetadata;
}

export interface TransformState {
  isActive: boolean;
  originalBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pivot: {
    x: number;
    y: number;
  };
  translation: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
  };
  rotation: number; // in radians
  skew: {
    x: number;
    y: number;
  };
  pixelBuffer: (string | null)[];
  maskBuffer: boolean[];
}

export type AssetType = 'stamp' | 'pattern' | 'brush' | 'tile' | 'template' | 'selection' | string;

export interface StampData {
  pixels: string[];
}

export type AssetData = StampData;

export interface AssetResource {
  id: string;
  version: number;
  type: AssetType;

  name: string;
  description: string;
  tags: string[];

  createdAt: number;
  updatedAt: number;

  width: number;
  height: number;

  pivot: {
    x: number;
    y: number;
  };

  preview?: string;
  author?: string;

  origin: {
    x: number;
    y: number;
  };

  metadata?: Record<string, unknown>;
  data: AssetData;
}

export type StampResource = AssetResource;

export type { LanguageCode } from './i18n/types';






