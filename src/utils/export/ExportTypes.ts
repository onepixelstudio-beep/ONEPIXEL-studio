import { PixelProject } from '../../types';

/**
 * Represents a single pre-rendered frame of the project at a specific scale,
 * ready to be consumed by any export encoder plugin.
 */
export interface RenderedFrame {
  frameId: string;
  name?: string;
  width: number;
  height: number;
  durationMs: number;
  /**
   * Pure flat array of pixel colors representing the final merged frame.
   * Modifiers (opacity, visibility, margins) are already blended here.
   * Format: Hex strings (e.g. '#ff0000', '#ffffffaa') or 'transparent'.
   */
  pixels: string[];
}

/**
 * Standard, format-agnostic render result produced by the CoreRenderProcessor.
 */
export interface RenderResult {
  projectId: string;
  projectName: string;
  width: number;
  height: number;
  scale: number;
  frames: RenderedFrame[];
  palette: string[];
  statistics: RenderStatistics;
  warnings: RenderWarning[];
  metadata?: Record<string, any>;
}

/**
 * Internal mathematical hooks for rendering passes.
 */
export interface RenderHooks {
  beforeRender?: (project: PixelProject, settings: RenderSettings) => void;
  beforeFrame?: (frameId: string, index: number) => void;
  afterFrame?: (frameId: string, index: number, framePixels: string[]) => void;
  afterRender?: (project: PixelProject, settings: RenderSettings, result: RenderResult) => void;
}

/**
 * Parameterization settings for the CoreRenderProcessor.
 * Consolidates all composition, geometry, margins, and rendering hooks.
 */
export interface RenderSettings {
  scale?: number;             // Nearest-neighbor scaling factor (defaults to 1)
  crop?: {                    // Cropping boundaries
    x: number;
    y: number;
    width: number;
    height: number;
  };
  padding?: {                 // Internal spacing inside margins
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin?: {                  // External boundary border spacing
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  bgColor?: string;           // Optional fallback solid background color
  selectedLayersOnly?: string[]; // IDs of layers to blend (defaults to all visible)
  selectedFramesOnly?: string[]; // IDs of frames to include (defaults to all)
  hooks?: RenderHooks;        // Mathematical hooks for lifecycle extensions
}

/**
 * Diagnosis metrics for performance tracking.
 */
export interface RenderStatistics {
  renderTimeMs: number;
  framesRendered: number;
  layersMerged: number;
  pixelsProcessed: number;
  pixelsWritten: number;
  pixelsDiscarded: number;
  scaleApplied: number;
  cacheHit: boolean;
  cacheMiss: boolean;
}

/**
 * Representation of rendering anomalies.
 */
export interface RenderWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning';
}

/**
 * Declarative description of what capabilities a specific plugin supports.
 * Helps the UI render options dynamically and adjust context rules automatically.
 */
export interface ExportCapabilities {
  supportsAnimation: boolean;
  supportsLayers: boolean;
  supportsPalette: boolean;
  supportsTransparency: boolean;
  supportsQuality: boolean;
  supportsPivot: boolean;
  supportsMetadata: boolean;
}

/**
 * Available UI control types for plugin custom parameters.
 */
export type ExportOptionType = 'text' | 'number' | 'boolean' | 'select';

/**
 * Field schema defining an individual configuration option for a plugin.
 */
export interface ExportOptionField {
  id: string;
  label: string;
  type: ExportOptionType;
  defaultValue: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  desc?: string;
  visible?: (options: Record<string, any>) => boolean;
}

/**
 * Collection of option fields representing a full schema.
 */
export type ExportOptionSchema = ExportOptionField[];

/**
 * Rich progress representation to feed detailed visual bars.
 */
export type ExportStage =
  | 'idle'
  | 'reading_project'
  | 'rendering_frames'
  | 'encoding_format'
  | 'compressing'
  | 'saving_file'
  | 'completed'
  | 'error';

export interface ExportProgress {
  stage: ExportStage;
  message: string;
  percentage: number;
}

/**
 * Unified context supplied to format-specific encoders.
 * Encapsulates the complete rendered state, options, control signals,
 * and diagnostics to secure future-proof development.
 */
export interface EncoderContext {
  renderResult: RenderResult;
  options: Record<string, any>;
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
  metadata?: Record<string, any>;
  statistics: {
    startTime: number;
    encodingTimeMs?: number;
    fileSize?: number;
  };
  logger?: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string, err?: any) => void;
  };
}

/**
 * Event-driven export pipeline hooks for telemetry, external plugins, 
 * performance measurement, or cloud synchronization.
 */
export interface ExportHooks {
  beforeRender?: (project: PixelProject, settings: any) => void | Promise<void>;
  afterRender?: (project: PixelProject, settings: any, result: RenderResult) => void | Promise<void>;
  beforeEncode?: (context: EncoderContext) => void | Promise<void>;
  afterEncode?: (context: EncoderContext, file: EncodedFile) => void | Promise<void>;
  beforeSave?: (file: EncodedFile) => void | Promise<void>;
  afterSave?: (file: EncodedFile) => void | Promise<void>;
  onError?: (error: Error, context?: EncoderContext) => void | Promise<void>;
  onCancel?: (context?: EncoderContext) => void | Promise<void>;
}

/**
 * Orchestrator context containing state necessary to carry out an export run.
 */
export interface ExportContext {
  project: PixelProject;
  scale: number;
  options: Record<string, any>;
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

/**
 * Result of the encoding phase, completely decoupled from any saving logic.
 */
export interface EncodedFile {
  filename: string;
  extension: string;
  data: Uint8Array | Blob | string;
  mimeType: string;
}

/**
 * Contract that all modular export format plugins must implement.
 * Ensures the Open/Closed Principle (OCP) is strictly respected.
 */
export interface ExportPlugin {
  id: string;
  name: string;
  desc: string;
  category: 'image' | 'animation' | 'game' | 'palette';
  icon: string; // Name of Lucide icon
  extension: string;
  capabilities: ExportCapabilities;

  /**
   * Returns the options schema so the UI can construct inputs dynamically.
   */
  getOptionsSchema(): ExportOptionSchema;

  /**
   * Decoupled encoding method.
   * Consumes the standard EncoderContext and produces the EncodedFile.
   * Respects AbortSignal inside the context for cooperative cancellation.
   */
  encode(context: EncoderContext): Promise<EncodedFile>;
}
