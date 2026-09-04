import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, RefreshCw, Copy, Check, X, FlipHorizontal, FlipVertical, RotateCw, Grid, Sliders, Repeat, Settings2, Eye, EyeOff, Lock, Unlock, RotateCcw, Trash2, Image as ImageIcon } from 'lucide-react';
import { 
  PixelProject, ToolType, SymmetrySettings, 
  TilingSettings, SelectionState, TransformState, Guide, OnionSkinSettings
} from '../types';
import { MoveManager } from '../utils/MoveManager';
import { animationEventBus } from '../utils/animation/EventBus';
import { 
  getSymmetricPoints, getLinePoints, getRectanglePoints, 
  getEllipsePoints, getMagicWandSelection, floodFill,
  getBucketFillPoints,
  isPointInPolygon, transformStamp, filterPixelPerfect,
  calculateBrushOffsets
} from '../utils/canvas';
import { useCanvasZoomPan } from '../hooks/useCanvasZoomPan';
import { parseHexColor } from '../utils/colorUtils';
import { telemetry } from '../utils/telemetry';
import { getSelectionBounds, extractSelectionBuffers, transformPixels, backwardTransform } from '../utils/transformUtils';
import { drawTransformUI, getTransformHandles } from '../utils/transformRenderer';
import { RulerHorizontal } from './RulerHorizontal';
import { RulerVertical } from './RulerVertical';
import { GuideOverlay } from './GuideOverlay';
import { SnapEngine } from '../utils/guideUtils';
import { translate, LanguageCode } from '../i18n';
import { getCursorClass as getCursorClassFromEngine, TransformHandleType } from '../utils/canvas/CursorEngine';
import { getTintedFrameCanvas } from '../utils/frameRenderer';
import { LayerResolutionService } from '../utils/animation/LayerResolutionService';
import { AssetPatternService, PatternContext } from '../utils/resources/AssetPatternService';
import { PatternRenderer } from '../utils/resources/PatternRenderer';
import { SelectionEngine, ISelectionEngine, SelectionOverlayRenderer, ISelectionMask, SelectionMode } from '../core/selection';


interface CanvasAreaProps {
  project: PixelProject;
  currentFrameId: string;
  currentLayerId: string;
  currentTool: ToolType;
  currentColor: string;
  brushOpacity: number; // 0 to 100
  brushSize: number;
  symmetry: SymmetrySettings;
  tiling: TilingSettings;
  onionSkinEnabled: boolean;
  onionSkinOpacity?: number;
  onionSkinSettings?: OnionSkinSettings;
  onUpdatePixels: (pixels: any, saveSnapshot?: boolean) => void;
  onStartHistoryAction?: (customPixels?: any) => void;
  onPickColor: (color: string) => void;
  gridVisible: boolean;
  canvasCommand?: { action: 'zoom_in' | 'zoom_out' | 'center' | null; timestamp: number };
  selectionCommand?: { 
    action: 'select_all' | 'deselect' | 'invert' | 'cut' | 'copy' | 'paste' | 'fill' | 'select_by_color' | 'expand_selection' | 'contract_selection' | null; 
    timestamp: number 
  };
  
  // Custom tool configurations
  sprayDensity?: number;
  sprayRandomness?: number;
  sprayShape?: 'round' | 'square' | 'cross' | 'star';
  ditheringPattern?: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  cloneSource?: { x: number; y: number } | null;
  onChangeCloneSource?: (source: { x: number; y: number } | null) => void;
  onSelectionChange?: (selection: SelectionState) => void;
  activeStamp?: { pixels: string[]; width: number; height: number; name: string } | null;
  onClearActiveStamp?: () => void;
  stampScale?: number;
  stampRotation?: number;
  stampFlipH?: boolean;
  stampFlipV?: boolean;
  patternMode?: 'stamp' | 'pattern';
  activeBrush?: any;
  onRecordColorUsage?: (color: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  pixelPerfect?: boolean;
  bucketContiguous?: boolean;
  bucketRefer?: 'active' | 'all';
  tolerance?: number;
  fillShape?: boolean;

  // Grid & Snapping Configurations
  gridSize?: number;
  gridColor?: string;
  gridOpacity?: number;

  // Guides & Rulers
  guides?: Guide[];
  guidesVisible?: boolean;
  guidesLocked?: boolean;
  rulersVisible?: boolean;
  snappingEnabled?: boolean;
  onAddGuide?: (type: 'horizontal' | 'vertical', position: number, silent?: boolean, id?: string) => string | void;
  onMoveGuide?: (id: string, newPosition: number) => void;
  onRemoveGuide?: (id: string, silent?: boolean) => void;
  language?: LanguageCode;
  colorBlindness?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  symmetryAxisColor?: string;
  theme?: string;
  themeColor?: string;
}

const CanvasArea = React.memo(function CanvasArea({
  project,
  language = 'es',
  currentFrameId,
  currentLayerId,
  currentTool,
  currentColor,
  brushOpacity,
  brushSize,
  symmetry,
  symmetryAxisColor = '#C8A96A',
  tiling,
  onionSkinEnabled,
  onionSkinOpacity = 30,
  onionSkinSettings,
  onUpdatePixels,
  onStartHistoryAction,
  onPickColor,
  gridVisible,
  gridSize = 1,
  gridColor = '#ffffff',
  gridOpacity = 30,
  canvasCommand,
  selectionCommand,
  sprayDensity = 15,
  sprayRandomness = 4,
  sprayShape = 'round',
  ditheringPattern = 'checkerboard',
  cloneSource,
  onChangeCloneSource,
  onSelectionChange,
  activeStamp,
  onClearActiveStamp,
  stampScale: propStampScale,
  stampRotation: propStampRotation,
  stampFlipH: propStampFlipH,
  stampFlipV: propStampFlipV,
  patternMode: propPatternMode,
  activeBrush,
  onRecordColorUsage,
  showToast,
  pixelPerfect = false,
  bucketContiguous = true,
  bucketRefer = 'active',
  tolerance = 0,
  fillShape = false,
  guides = [],
  guidesVisible = true,
  guidesLocked = false,
  rulersVisible = true,
  snappingEnabled = true,
  onAddGuide,
  onMoveGuide,
  onRemoveGuide,
  colorBlindness = 'none',
  theme,
  themeColor
}: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clipboardRef = useRef<{ pixels: string[]; mask: boolean[] } | null>(null);
  const strokeStartTimeRef = useRef<number | null>(null);
  const strokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const initialLayerPixelsRef = useRef<string[] | null>(null);
  const activeStrokeLayerPixelsRef = useRef<string[] | null>(null);
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const activeModifiedIndicesRef = useRef<Set<number>>(new Set());
  const lastPixelPerfectPointsRef = useRef<{ x: number; y: number }[]>([]);
  const strokeColorToRecordRef = useRef<string | null>(null);

  // Selection System Core Engine Ref
  const selectionEngineRef = useRef<ISelectionEngine | null>(null);
  if (!selectionEngineRef.current || selectionEngineRef.current.width !== project.width || selectionEngineRef.current.height !== project.height) {
    selectionEngineRef.current = new SelectionEngine(project.width, project.height);
  }

  const currentFractionalCoordRef = useRef<{ x: number; y: number } | null>(null);
  const brushOffsetsCacheRef = useRef<{ dx: number; dy: number }[]>(calculateBrushOffsets(brushSize, activeBrush));

  useEffect(() => {
    brushOffsetsCacheRef.current = calculateBrushOffsets(brushSize, activeBrush);
  }, [brushSize, activeBrush]);

  const getFractionalCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panX) / zoom;
    const y = (clientY - rect.top - panY) / zoom;
    return { x, y };
  };

  // Record React render
  telemetry.incrementReactRender();

  // Reusable offscreen canvases to prevent Garbage Collection overhead and memory churn
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dupCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const moveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mobile multi-touch pinch-to-zoom & two-finger panning tracking ref
  const pinchRef = useRef<{
    active: boolean;
    initialDist: number;
    initialZoom: number;
    initialPanX: number;
    initialPanY: number;
    centerClientX: number;
    centerClientY: number;
  } | null>(null);

  // Helper utility to get or resize a cached offscreen canvas
  const getCachedCanvas = (
    ref: React.MutableRefObject<HTMLCanvasElement | null>,
    width: number,
    height: number,
    name = 'unnamed'
  ): HTMLCanvasElement => {
    if (!ref.current) {
      telemetry.logAction('CANVAS_BUFFER_CREATE', `Created offscreen buffer: ${name}`, { width, height });
      ref.current = document.createElement('canvas');
    }
    const canvas = ref.current;
    if (canvas.width !== width || canvas.height !== height) {
      telemetry.logAction('CANVAS_BUFFER_RESIZE', `Resized offscreen buffer: ${name}`, {
        from: `${canvas.width}x${canvas.height}`,
        to: `${width}x${height}`
      });
      canvas.width = width;
      canvas.height = height;
    }
    return canvas;
  };

  // Pan & Zoom hook
  const {
    zoom,
    setZoom,
    panX,
    setPanX,
    panY,
    setPanY,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    handleZoomIn,
    handleZoomOut,
    centerCanvas,
    resetZoomAndCenter
  } = useCanvasZoomPan({
    project,
    containerRef,
    canvasCommand,
    tiling
  });

  // Telemetry trackers for Canvas lifecycle & viewport states
  useEffect(() => {
    telemetry.logAction('CANVAS_MOUNT', 'CanvasArea component mounted', {
      projectId: project.id,
      dimensions: `${project.width}x${project.height}`
    });
    return () => {
      telemetry.logAction('CANVAS_UNMOUNT', 'CanvasArea component unmounted', {
        projectId: project.id
      });
    };
  }, []);

  useEffect(() => {
    telemetry.updateLastKnownState({
      zoomLevel: (zoom / 12) * 100,
      panX,
      panY
    });
    telemetry.logAction('VIEWPORT_CHANGE', 'Canvas zoom/pan adjusted', {
      zoomPercent: `${Math.round((zoom / 12) * 100)}%`,
      panX,
      panY
    });
  }, [zoom, panX, panY]);

  const [activeSnapLines, setActiveSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [activeDragGuideId, setActiveDragGuideId] = useState<string | null>(null);

  const getSnappedCoords = (
    rawCoord: { x: number; y: number } | null,
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
  ): { x: number; y: number } | null => {
    if (!rawCoord) {
      setActiveSnapLines({ x: null, y: null });
      return null;
    }
    if (!snappingEnabled) {
      setActiveSnapLines({ x: null, y: null });
      return rawCoord;
    }

    const altKey = e.altKey || false;
    if (altKey) {
      setActiveSnapLines({ x: null, y: null });
      return rawCoord;
    }

    const context = {
      zoom,
      gridSize: gridSize || 1,
      gridVisible,
      guides,
      guidesVisible,
      canvasWidth: project.width,
      canvasHeight: project.height,
      symmetry: {
        x: symmetry.x,
        y: symmetry.y,
        centerX: symmetry.centerX,
        centerY: symmetry.centerY
      },
      selectionBounds: selection.active ? getSelectionBounds(selection.pixels, project.width, project.height) : null,
      altKey
    };

    const snapEngine = new SnapEngine();
    const result = snapEngine.snap(rawCoord.x, rawCoord.y, context, 8);
    
    // Save snapped targets to state for rendering subtle feedback
    setActiveSnapLines({
      x: result.targets.x ? result.x : null,
      y: result.targets.y ? result.y : null
    });

    return { x: result.x, y: result.y };
  };

  const getSnappedPixelCoords = (
    clientX: number,
    clientY: number,
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
  ): { x: number; y: number } | null => {
    const fractional = getFractionalCanvasCoords(clientX, clientY);
    if (!fractional) return null;

    if (!snappingEnabled || e.altKey) {
      const x = Math.floor(fractional.x);
      const y = Math.floor(fractional.y);

      if (tiling.active) {
        return {
          x: ((x % project.width) + project.width) % project.width,
          y: ((y % project.height) + project.height) % project.height
        };
      }

      if (x >= 0 && x < project.width && y >= 0 && y < project.height) {
        return { x, y };
      }
      return null;
    }

    const snappedFractional = getSnappedCoords(fractional, e);
    if (!snappedFractional) return null;

    let x = Math.floor(snappedFractional.x);
    let y = Math.floor(snappedFractional.y);

    if (tiling.active) {
      return {
        x: ((x % project.width) + project.width) % project.width,
        y: ((y % project.height) + project.height) % project.height
      };
    }

    if (x >= 0 && x < project.width && y >= 0 && y < project.height) {
      return { x, y };
    }

    const origX = Math.floor(fractional.x);
    const origY = Math.floor(fractional.y);
    if (origX >= 0 && origX < project.width && origY >= 0 && origY < project.height) {
      return {
        x: Math.max(0, Math.min(project.width - 1, x)),
        y: Math.max(0, Math.min(project.height - 1, y))
      };
    }

    return null;
  };

  // Drawing States
  const [isDrawing, setIsDrawing] = useState(false);
  const [stampScaleState, setStampScale] = useState(1);
  const [stampRotationState, setStampRotation] = useState<number>(0); // 0, 90, 180, 270
  const [stampFlipHState, setStampFlipH] = useState<boolean>(false);
  const [stampFlipVState, setStampFlipV] = useState<boolean>(false);
  const [patternModeState, setPatternMode] = useState<'stamp' | 'pattern'>('stamp');

  const stampScale = propStampScale ?? stampScaleState;
  const stampRotation = propStampRotation ?? stampRotationState;
  const stampFlipH = propStampFlipH ?? stampFlipHState;
  const stampFlipV = propStampFlipV ?? stampFlipVState;
  const patternMode = propPatternMode ?? patternModeState;
  const [patternRepeatMode, setPatternRepeatMode] = useState<'repeat' | 'repeat-x' | 'repeat-y' | 'mirror' | 'none'>('repeat');
  const [patternAlignment, setPatternAlignment] = useState<'absolute' | 'local'>('absolute');
  const [patternOffsetX, setPatternOffsetX] = useState<number>(0);
  const [patternOffsetY, setPatternOffsetY] = useState<number>(0);

  const patternContext = useMemo<PatternContext>(() => ({
    enabled: patternMode === 'pattern',
    repeatMode: patternRepeatMode,
    alignment: patternAlignment,
    offsetX: patternOffsetX,
    offsetY: patternOffsetY,
    rotation: stampRotation as 0 | 90 | 180 | 270,
    flipH: stampFlipH,
    flipV: stampFlipV,
    scale: stampScale
  }), [patternMode, patternRepeatMode, patternAlignment, patternOffsetX, patternOffsetY, stampRotation, stampFlipH, stampFlipV, stampScale]);

  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const currentCoordRef = useRef<{ x: number; y: number } | null>(null);
  const cloneStartOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [coordDisplay, setCoordDisplay] = useState<{ x: number; y: number } | null>(null);
  const coordDisplayRafRef = useRef<number | null>(null);
  const pendingCoordDisplayRef = useRef<{ x: number; y: number } | null>(null);

  const scheduleCoordDisplayUpdate = (coord: { x: number; y: number } | null) => {
    pendingCoordDisplayRef.current = coord;
    // Decouple high-frequency React re-renders during active stroke drawing
    if (isTransactionActiveRef.current) {
      return;
    }
    if (coordDisplayRafRef.current === null) {
      coordDisplayRafRef.current = requestAnimationFrame(() => {
        coordDisplayRafRef.current = null;
        setCoordDisplay(pendingCoordDisplayRef.current);
      });
    }
  };
  const lastPaintCoord = useRef<{ x: number; y: number } | null>(null);

  // Transaction state & handlers to batch high-frequency updates
  const isTransactionActiveRef = useRef(false);

  const startTransaction = () => {
    if (!isTransactionActiveRef.current) {
      isTransactionActiveRef.current = true;
      animationEventBus.emit('TRANSACTION_START', null);
    }
  };

  const endTransaction = () => {
    if (isTransactionActiveRef.current) {
      isTransactionActiveRef.current = false;
      animationEventBus.emit('TRANSACTION_END', null);
    }
  };

  useEffect(() => {
    return () => {
      endTransaction();
    };
  }, []);

  // Smart selection state
  const [selection, setSelection] = useState<SelectionState>({ active: false, pixels: [] });

  const dragSelectionInitialMaskRef = useRef<ISelectionMask | null>(null);
  const dragSelectionModeRef = useRef<SelectionMode>('replace');

  const syncSelectionFromEngine = () => {
    const engine = selectionEngineRef.current;
    if (!engine || engine.mask.isEmpty()) {
      setSelection({ active: false, pixels: [] });
    } else {
      const pixels = new Array(project.width * project.height);
      for (let y = 0; y < project.height; y++) {
        for (let x = 0; x < project.width; x++) {
          pixels[y * project.width + x] = engine.mask.getValue(x, y) > 0;
        }
      }
      setSelection({ active: true, pixels });
    }
  };

  const getSelectionModeFromEvent = (e: React.MouseEvent | MouseEvent): SelectionMode => {
    if (e.shiftKey && e.altKey) return 'intersect';
    if (e.shiftKey) return 'add';
    if (e.altKey) return 'subtract';
    return 'replace';
  };

  const applyGeometricSelectionPreview = (
    start: { x: number; y: number },
    current: { x: number; y: number },
    tool: 'rect_select' | 'ellipse_select',
    mode: SelectionMode
  ) => {
    const engine = selectionEngineRef.current;
    if (!engine) return;
    const initialMask = dragSelectionInitialMaskRef.current;

    if (initialMask) {
      for (let y = 0; y < engine.height; y++) {
        for (let x = 0; x < engine.width; x++) {
          engine.mask.setValue(x, y, initialMask.getValue(x, y));
        }
      }
    } else {
      engine.clear();
    }

    const x1 = Math.min(start.x, current.x);
    const x2 = Math.max(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const y2 = Math.max(start.y, current.y);
    const w = x2 - x1 + 1;
    const h = y2 - y1 + 1;

    if (tool === 'rect_select') {
      engine.selectRect(x1, y1, w, h, mode);
    } else if (tool === 'ellipse_select') {
      const cx = x1 + w / 2;
      const cy = y1 + h / 2;
      const rx = w / 2;
      const ry = h / 2;
      engine.selectEllipse(cx, cy, rx, ry, mode);
    }

    syncSelectionFromEngine();
  };

  useEffect(() => {
    telemetry.logAction('SELECTION_MASK_STATE', selection.active ? 'Selection mask active/created' : 'Selection mask cleared/destroyed', {
      active: selection.active,
      pixelsCount: selection.pixels ? selection.pixels.filter(Boolean).length : 0
    });
  }, [selection.active, selection.pixels]);

  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);
  const lastSelectionTimestampRef = useRef<number>(0);

  const handleStartDragNewGuide = (type: 'horizontal' | 'vertical', e: React.MouseEvent) => {
    if (guidesLocked) return;
    const id = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get initial position corresponding to the click
    const rect = document.getElementById('canvas-draw-area')?.getBoundingClientRect();
    if (!rect) return;

    let initialPos = 0;
    if (type === 'vertical') {
      const clientX = e.clientX - rect.left;
      initialPos = Math.round((clientX - panX) / zoom);
    } else {
      const clientY = e.clientY - rect.top;
      initialPos = Math.round((clientY - panY) / zoom);
    }

    onAddGuide?.(type, initialPos, true, id);
    setActiveDragGuideId(id);
  };

  const handleStartDragGuide = (id: string, e: React.MouseEvent) => {
    if (guidesLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setActiveDragGuideId(id);
  };

  useEffect(() => {
    if (!activeDragGuideId) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('canvas-draw-area')?.getBoundingClientRect();
      if (!rect) return;

      const dragGuide = guides.find(g => g.id === activeDragGuideId);
      if (!dragGuide) return;

      const isSymmetryActive = symmetry && (symmetry.x || symmetry.y);

      if (dragGuide.type === 'vertical') {
        const clientX = e.clientX - rect.left;
        let newCanvasX = (clientX - panX) / zoom;
        
        // Snapping:
        if (snappingEnabled && !e.altKey) {
          const context = {
            zoom,
            gridSize: gridSize || 1,
            gridVisible,
            guides: guides.filter(g => g.id !== activeDragGuideId),
            guidesVisible,
            canvasWidth: project.width,
            canvasHeight: project.height,
            symmetry: isSymmetryActive ? {
              x: symmetry.x,
              y: symmetry.y,
              centerX: project.width / 2,
              centerY: project.height / 2
            } : undefined,
            selectionBounds: selection.active ? getSelectionBounds(selection.pixels, project.width, project.height) : null,
            altKey: false
          };
          const snapEngine = new SnapEngine();
          const result = snapEngine.snap(newCanvasX, 0, context, 8);
          newCanvasX = result.x;
          setActiveSnapLines({
            x: result.targets.x ? result.x : null,
            y: null
          });
        } else {
          setActiveSnapLines({ x: null, y: null });
        }

        onMoveGuide?.(activeDragGuideId, newCanvasX);
      } else {
        const clientY = e.clientY - rect.top;
        let newCanvasY = (clientY - panY) / zoom;

        // Snapping:
        if (snappingEnabled && !e.altKey) {
          const context = {
            zoom,
            gridSize: gridSize || 1,
            gridVisible,
            guides: guides.filter(g => g.id !== activeDragGuideId),
            guidesVisible,
            canvasWidth: project.width,
            canvasHeight: project.height,
            symmetry: isSymmetryActive ? {
              x: symmetry.x,
              y: symmetry.y,
              centerX: project.width / 2,
              centerY: project.height / 2
            } : undefined,
            selectionBounds: selection.active ? getSelectionBounds(selection.pixels, project.width, project.height) : null,
            altKey: false
          };
          const snapEngine = new SnapEngine();
          const result = snapEngine.snap(0, newCanvasY, context, 8);
          newCanvasY = result.y;
          setActiveSnapLines({
            x: null,
            y: result.targets.y ? result.y : null
          });
        } else {
          setActiveSnapLines({ x: null, y: null });
        }

        onMoveGuide?.(activeDragGuideId, newCanvasY);
      }
    };

    const handleGlobalMouseUp = () => {
      const dragGuide = guides.find(g => g.id === activeDragGuideId);
      if (dragGuide) {
        if (dragGuide.type === 'vertical') {
          // Deletion if dragged back to top-left ruler area or off-canvas boundaries
          if (dragGuide.position <= 0 || dragGuide.position >= project.width) {
            onRemoveGuide?.(activeDragGuideId, true);
          }
        } else {
          if (dragGuide.position <= 0 || dragGuide.position >= project.height) {
            onRemoveGuide?.(activeDragGuideId, true);
          }
        }
      }
      setActiveDragGuideId(null);
      setActiveSnapLines({ x: null, y: null });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activeDragGuideId, guides, panX, panY, zoom, snappingEnabled, gridVisible, guidesVisible, symmetry, project.width, project.height, selection, onMoveGuide, onRemoveGuide]);

  // Advanced tool states
  const [curveState, setCurveState] = useState<{ step: 'bend'; start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

  // Selection Duplication state (allows dragging the duplicated selection and clicking Accept)
  const [duplicateActive, setDuplicateActive] = useState<boolean>(false);
  const [duplicatePixels, setDuplicatePixels] = useState<string[]>([]);
  const [duplicateMask, setDuplicateMask] = useState<boolean[]>([]);
  const [duplicateOffsetX, setDuplicateOffsetX] = useState<number>(0);
  const [duplicateOffsetY, setDuplicateOffsetY] = useState<number>(0);
  const [isDraggingDuplicate, setIsDraggingDuplicate] = useState<boolean>(false);
  const [dragDuplicateStart, setDragDuplicateStart] = useState<{ x: number; y: number } | null>(null);

  // Selection Moving state (allows dragging/nudging the selection losslessly and clicking Accept)
  const [moveActive, setMoveActive] = useState<boolean>(false);
  const [movePixels, setMovePixels] = useState<string[]>([]);
  const [moveMask, setMoveMask] = useState<boolean[]>([]);
  const [moveOffsetX, setMoveOffsetX] = useState<number>(0);
  const [moveOffsetY, setMoveOffsetY] = useState<number>(0);
  const [isDraggingMove, setIsDraggingMove] = useState<boolean>(false);
  const [dragMoveStart, setDragMoveStart] = useState<{ x: number; y: number } | null>(null);
  const [dragMoveStartOffset, setDragMoveStartOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragDuplicateStartOffset, setDragDuplicateStartOffset] = useState<{ x: number; y: number } | null>(null);
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false);

  // --- Transform Libre State ---
  const [transformState, setTransformState] = useState<TransformState>({
    isActive: false,
    originalBounds: { x: 0, y: 0, width: 0, height: 0 },
    pivot: { x: 0, y: 0 },
    translation: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    skew: { x: 0, y: 0 },
    pixelBuffer: [],
    maskBuffer: [],
  });
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [originalLayerPixels, setOriginalLayerPixels] = useState<string[] | null>(null);

  const activeHandleRef = useRef<string | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartTransformRef = useRef<TransformState | null>(null);
  const dragStartAngleRef = useRef<number>(0);

  const startTransformSelection = () => {
    if (!selection.active) return;
    
    // If we have an active move/duplicate, bake it first!
    if (moveActive) {
      acceptMove();
    }
    if (duplicateActive) {
      acceptDuplication();
    }

    const bounds = getSelectionBounds(selection.pixels, project.width, project.height);
    if (!bounds) {
      showToast?.(translate('canvas.noValidSelectionToTransform', language), 'error');
      return;
    }

    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    // Save backup of original layer pixels
    setOriginalLayerPixels([...layerPixels]);

    const { pixelBuffer, maskBuffer } = extractSelectionBuffers(
      layerPixels,
      selection.pixels,
      bounds,
      project.width
    );

    // Clear selection pixels from current layer
    const nextLayerPixels = [...layerPixels];
    for (let i = 0; i < project.width * project.height; i++) {
      if (selection.pixels[i]) {
        nextLayerPixels[i] = '';
      }
    }

    // Update layer pixels in app state immediately (clearing selection area)
    const updated = { ...project.pixels };
    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextLayerPixels
    };
    onUpdatePixels(updated, false); // don't push to history yet, wait until accepted

    // Set transform state
    const pivotX = bounds.x + bounds.width / 2;
    const pivotY = bounds.y + bounds.height / 2;

    setTransformState({
      isActive: true,
      originalBounds: bounds,
      pivot: { x: pivotX, y: pivotY },
      translation: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      skew: { x: 0, y: 0 },
      pixelBuffer,
      maskBuffer,
    });

    showToast?.(translate('canvas.freeTransformModeActivated', language), 'success');
  };

  const acceptTransformSelection = () => {
    if (!transformState.isActive) return;

    // Construct original pixels before transform for history
    const originalPixels = { ...project.pixels };
    if (originalLayerPixels) {
      originalPixels[currentFrameId] = {
        ...originalPixels[currentFrameId],
        [currentLayerId]: originalLayerPixels
      };
    }
    onStartHistoryAction?.(originalPixels);

    // Get the final transformed pixels and mask
    const { pixels: transformedPixels, mask: transformedMask } = transformPixels(
      transformState.originalBounds,
      transformState.pivot,
      transformState.translation,
      transformState.scale,
      transformState.rotation,
      transformState.pixelBuffer,
      transformState.maskBuffer,
      project.width,
      project.height
    );

    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    // We write the final transformed pixels onto the cleared layer
    const nextLayerPixels = [...layerPixels];
    for (let i = 0; i < project.width * project.height; i++) {
      if (transformedPixels[i]) {
        nextLayerPixels[i] = transformedPixels[i];
      }
    }

    // Update pixels to the final transformed state
    const updated = { ...project.pixels };
    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextLayerPixels
    };
    onUpdatePixels(updated, false); // already saved original state above!

    // Update selection to the final transformed mask
    setSelection({
      active: true,
      pixels: transformedMask,
    });

    // Reset transform states
    setTransformState({
      isActive: false,
      originalBounds: { x: 0, y: 0, width: 0, height: 0 },
      pivot: { x: 0, y: 0 },
      translation: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      skew: { x: 0, y: 0 },
      pixelBuffer: [],
      maskBuffer: [],
    });
    setOriginalLayerPixels(null);
    setHoveredHandle(null);

    showToast?.(translate('canvas.transformAppliedSuccessfully', language), 'success');
  };

  const cancelTransformSelection = () => {
    if (!transformState.isActive) return;

    // Restore layer pixels from original backup
    if (originalLayerPixels) {
      const updated = { ...project.pixels };
      updated[currentFrameId] = {
        ...updated[currentFrameId],
        [currentLayerId]: originalLayerPixels
      };
      onUpdatePixels(updated, false);
    }

    // Reset transform states
    setTransformState({
      isActive: false,
      originalBounds: { x: 0, y: 0, width: 0, height: 0 },
      pivot: { x: 0, y: 0 },
      translation: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      skew: { x: 0, y: 0 },
      pixelBuffer: [],
      maskBuffer: [],
    });
    setOriginalLayerPixels(null);
    setHoveredHandle(null);

    showToast?.(translate('canvas.transformCancelled', language), 'info');
  };

  useEffect(() => {
    if (!transformState.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTransformSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        acceptTransformSelection();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;

        setTransformState(prev => ({
          ...prev,
          translation: {
            x: prev.translation.x + dx,
            y: prev.translation.y + dy
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [transformState.isActive, transformState, originalLayerPixels]);

  const getCursorClass = () => {
    return getCursorClassFromEngine(
      transformState.isActive,
      activeHandleRef.current as TransformHandleType,
      hoveredHandle as TransformHandleType
    );
  };

  // Synchronize selection state to parent
  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  // Track offscreen canvas buffers active in the system
  useEffect(() => {
    const buffersList: string[] = [];
    if (patternCanvasRef.current) buffersList.push(`pattern (${patternCanvasRef.current.width}x${patternCanvasRef.current.height})`);
    if (dupCanvasRef.current) buffersList.push(`duplicate (${dupCanvasRef.current.width}x${dupCanvasRef.current.height})`);
    if (moveCanvasRef.current) buffersList.push(`move (${moveCanvasRef.current.width}x${moveCanvasRef.current.height})`);
    if (selCanvasRef.current) buffersList.push(`selection (${selCanvasRef.current.width}x${selCanvasRef.current.height})`);
    if (tempCanvasRef.current) buffersList.push(`temp compose (${tempCanvasRef.current.width}x${tempCanvasRef.current.height})`);
    
    telemetry.updateLastKnownState({ activeBuffers: buffersList });
  }, [project.width, project.height]);

  // Reset all size-dependent selection, move, duplicate, and transform states when the project ID, width, or height changes.
  // This prevents runtime index out of bounds and memory mismatch crashes during canvas resizing, importing, opening, or tab-switching.
  useEffect(() => {
    setSelection({ active: false, pixels: [] });
    setLassoPath([]);
    setDuplicateActive(false);
    setDuplicatePixels([]);
    setDuplicateMask([]);
    setDuplicateOffsetX(0);
    setDuplicateOffsetY(0);
    setIsDraggingDuplicate(false);
    setDragDuplicateStart(null);
    setMoveActive(false);
    setMovePixels([]);
    setMoveMask([]);
    setMoveOffsetX(0);
    setMoveOffsetY(0);
    setIsDraggingMove(false);
    setDragMoveStart(null);
    setDragMoveStartOffset(null);
    setDragDuplicateStartOffset(null);
    setIsMoveMode(false);
    setTransformState({
      isActive: false,
      originalBounds: { x: 0, y: 0, width: 0, height: 0 },
      pivot: { x: 0, y: 0 },
      translation: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      skew: { x: 0, y: 0 },
      pixelBuffer: [],
      maskBuffer: [],
    });
    setHoveredHandle(null);
    setOriginalLayerPixels(null);
  }, [project.id, project.width, project.height]);

  // Reset temporary drawing and tool states when currentTool changes
  useEffect(() => {
    setCurveState(null);
    setIsDrawing(false);
    setDrawStart(null);
    currentCoordRef.current = null;
    scheduleCoordDisplayUpdate(null);
    endTransaction();
  }, [currentTool]);

  // Listen to Escape key to cancel curve bending mode
  useEffect(() => {
    if (!curveState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCurveState(null);
        setIsDrawing(false);
        setDrawStart(null);
        currentCoordRef.current = null;
        scheduleCoordDisplayUpdate(null);
        endTransaction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [curveState]);

  // Listen to selection commands from Header menu
  useEffect(() => {
    if (!selectionCommand) return;
    if (selectionCommand.timestamp === lastSelectionTimestampRef.current) return;
    lastSelectionTimestampRef.current = selectionCommand.timestamp;

    const framePixels = project.pixels[currentFrameId];
    let layerPixels = framePixels?.[currentLayerId];
    let activeSelection = selection;

    if (transformState.isActive && layerPixels) {
      const { pixels: transformedPixels, mask: transformedMask } = transformPixels(
        transformState.originalBounds,
        transformState.pivot,
        transformState.translation,
        transformState.scale,
        transformState.rotation,
        transformState.pixelBuffer,
        transformState.maskBuffer,
        project.width,
        project.height
      );

      const bakedPixels = [...layerPixels];
      for (let i = 0; i < project.width * project.height; i++) {
        if (transformedPixels[i]) {
          bakedPixels[i] = transformedPixels[i];
        }
      }
      layerPixels = bakedPixels;
      activeSelection = { active: true, pixels: transformedMask };

      const updated = { ...project.pixels };
      updated[currentFrameId] = {
        ...updated[currentFrameId],
        [currentLayerId]: bakedPixels
      };
      onUpdatePixels(updated, false);
      setSelection(activeSelection);

      setTransformState({
        isActive: false,
        originalBounds: { x: 0, y: 0, width: 0, height: 0 },
        pivot: { x: 0, y: 0 },
        translation: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        skew: { x: 0, y: 0 },
        pixelBuffer: [],
        maskBuffer: [],
      });
      setOriginalLayerPixels(null);
      setHoveredHandle(null);
    }

    if (moveActive && layerPixels) {
      // Bake moved pixels synchronously for this command!
      const bakedPixels = [...layerPixels]; // currently cleared in original places
      const bakedSelectionPixels = new Array(project.width * project.height).fill(false);
      for (let y = 0; y < project.height; y++) {
        for (let x = 0; x < project.width; x++) {
          const idx = y * project.width + x;
          if (moveMask[idx]) {
            const nx = x + moveOffsetX;
            const ny = y + moveOffsetY;
            if (nx >= 0 && nx < project.width && ny >= 0 && ny < project.height) {
              const targetIdx = ny * project.width + nx;
              bakedSelectionPixels[targetIdx] = true;
              
              const color = movePixels[idx];
              if (color) {
                bakedPixels[targetIdx] = color;
              }
            }
          }
        }
      }
      layerPixels = bakedPixels;
      activeSelection = { active: true, pixels: bakedSelectionPixels };
      
      // Update states
      const updated = { ...project.pixels };
      updated[currentFrameId] = {
        ...updated[currentFrameId],
        [currentLayerId]: bakedPixels
      };
      onUpdatePixels(updated, false);
      setSelection(activeSelection);
      setMoveActive(false);
    }

    if (selectionCommand.action === 'select_all') {
      const arr = new Array(project.width * project.height).fill(true);
      setSelection({ active: true, pixels: arr });
    } else if (selectionCommand.action === 'deselect') {
      setSelection({ active: false, pixels: [] });
    } else if (selectionCommand.action === 'invert') {
      if (activeSelection.active) {
        const arr = activeSelection.pixels.map(p => !p);
        setSelection({ active: true, pixels: arr });
      } else {
        const arr = new Array(project.width * project.height).fill(true);
        setSelection({ active: true, pixels: arr });
      }
    } else if (selectionCommand.action === 'select_by_color') {
      if (layerPixels) {
        const arr = layerPixels.map(color => color === currentColor);
        setSelection({ active: true, pixels: arr });
      }
    } else if (selectionCommand.action === 'fill') {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.cannotFillLockedOrHidden', language), 'error');
        return;
      }
      if (layerPixels) {
        const updatedPixels = { ...project.pixels };
        const nextPixels = [...layerPixels];
        for (let i = 0; i < nextPixels.length; i++) {
          if (!activeSelection.active || activeSelection.pixels[i]) {
            nextPixels[i] = currentColor;
          }
        }
        updatedPixels[currentFrameId] = {
          ...updatedPixels[currentFrameId],
          [currentLayerId]: nextPixels
        };
        onUpdatePixels(updatedPixels, true);
      }
    } else if (selectionCommand.action === 'copy') {
      if (layerPixels) {
        const copiedPixels = [...layerPixels];
        const copiedMask = activeSelection.active ? [...activeSelection.pixels] : new Array(layerPixels.length).fill(true);
        clipboardRef.current = { pixels: copiedPixels, mask: copiedMask };
        showToast?.(translate('canvas.copiedToClipboard', language), 'success');
      }
    } else if (selectionCommand.action === 'cut') {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.cannotCutLockedOrHidden', language), 'error');
        return;
      }
      if (layerPixels) {
        const copiedPixels = [...layerPixels];
        const copiedMask = activeSelection.active ? [...activeSelection.pixels] : new Array(layerPixels.length).fill(true);
        clipboardRef.current = { pixels: copiedPixels, mask: copiedMask };

        const updatedPixels = { ...project.pixels };
        const nextPixels = [...layerPixels];
        for (let i = 0; i < nextPixels.length; i++) {
          if (copiedMask[i]) {
            nextPixels[i] = '';
          }
        }
        updatedPixels[currentFrameId] = {
          ...updatedPixels[currentFrameId],
          [currentLayerId]: nextPixels
        };
        onUpdatePixels(updatedPixels, true);
        showToast?.(translate('canvas.cutToClipboard', language), 'success');
      }
    } else if (selectionCommand.action === 'paste') {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.cannotPasteLockedOrHidden', language), 'error');
        return;
      }
      if (clipboardRef.current) {
        if (layerPixels) {
          const updatedPixels = { ...project.pixels };
          const nextPixels = [...layerPixels];
          const clip = clipboardRef.current;
          for (let i = 0; i < nextPixels.length; i++) {
            if (clip.mask[i]) {
              nextPixels[i] = clip.pixels[i];
            }
          }
          updatedPixels[currentFrameId] = {
            ...updatedPixels[currentFrameId],
            [currentLayerId]: nextPixels
          };
          onUpdatePixels(updatedPixels, true);
          showToast?.(translate('canvas.pastedFromClipboard', language), 'success');
        }
      } else {
        showToast?.(translate('canvas.clipboardEmpty', language), 'error');
      }
    } else if (selectionCommand.action === 'expand_selection') {
      if (activeSelection.active) {
        const w = project.width;
        const h_val = project.height;
        const nextPixels = [...activeSelection.pixels];
        for (let y = 0; y < h_val; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (activeSelection.pixels[idx]) {
              if (x > 0) nextPixels[idx - 1] = true;
              if (x < w - 1) nextPixels[idx + 1] = true;
              if (y > 0) nextPixels[idx - w] = true;
              if (y < h_val - 1) nextPixels[idx + w] = true;
            }
          }
        }
        setSelection({ active: true, pixels: nextPixels });
      }
    } else if (selectionCommand.action === 'contract_selection') {
      if (activeSelection.active) {
        const w = project.width;
        const h_val = project.height;
        const nextPixels = new Array(w * h_val).fill(false);
        for (let y = 0; y < h_val; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (activeSelection.pixels[idx]) {
              const left = x > 0 ? activeSelection.pixels[idx - 1] : false;
              const right = x < w - 1 ? activeSelection.pixels[idx + 1] : false;
              const up = y > 0 ? activeSelection.pixels[idx - w] : false;
              const down = y < h_val - 1 ? activeSelection.pixels[idx + w] : false;
              if (left && right && up && down) {
                nextPixels[idx] = true;
              }
            }
          }
        }
        const hasActive = nextPixels.some(p => p);
        setSelection({ active: hasActive, pixels: hasActive ? nextPixels : [] });
      }
    }
  }, [selectionCommand, project.width, project.height, currentFrameId, currentLayerId, moveActive, moveMask, movePixels, moveOffsetX, moveOffsetY]);

  const getMoveManagerInstance = () => {
    return new MoveManager({
      width: project.width,
      height: project.height,
      currentFrameId,
      currentLayerId,
      pixels: project.pixels,
      selection,
      onUpdatePixels,
      onStartHistoryAction,
      setSelection,
    });
  };

  // --- SELECTION OPERATIONS ---
  const startMoveSelection = (initialDx = 0, initialDy = 0) => {
    if (!selection.active) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    const layerMeta = project.layers.find(l => l.id === currentLayerId);
    if (layerMeta?.locked || !layerMeta?.visible) {
      showToast?.(translate('canvas.cannotMoveLockedOrHidden', language), 'error');
      return;
    }

    // Save history snapshot of original state before we clear selected pixels
    onStartHistoryAction?.();

    // Erase selected pixels from the current canvas layer
    const updated = { ...project.pixels };
    const nextPixels = [...layerPixels];
    for (let i = 0; i < selection.pixels.length; i++) {
      if (selection.pixels[i]) {
        nextPixels[i] = '';
      }
    }
    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextPixels
    };
    onUpdatePixels(updated, false);

    setIsMoveMode(true);
    setDuplicateActive(true);
    setDuplicatePixels([...layerPixels]); // This contains the original pixels before erasing
    setDuplicateMask([...selection.pixels]);
    setDuplicateOffsetX(initialDx);
    setDuplicateOffsetY(initialDy);
  };

  const acceptMove = () => {
    acceptDuplication();
  };

  const cancelMove = () => {
    cancelDuplication();
  };

  const handleDeselect = () => {
    if (transformState.isActive) {
      acceptTransformSelection();
    } else if (duplicateActive) {
      acceptDuplication();
    } else if (moveActive) {
      acceptMove();
    }
    setSelection({ active: false, pixels: [] });
  };

  const moveSelection = (dx: number, dy: number) => {
    if (!selection.active) return;
    
    if (!duplicateActive) {
      startMoveSelection(dx, dy);
    } else {
      setDuplicateOffsetX(prev => prev + dx);
      setDuplicateOffsetY(prev => prev + dy);
    }
  };

  const duplicateSelection = () => {
    if (!selection.active) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    // Enter duplication mode: save snapshot of current state
    setIsMoveMode(false);
    setDuplicateActive(true);
    setDuplicatePixels([...layerPixels]);
    setDuplicateMask([...selection.pixels]);
    setDuplicateOffsetX(0);
    setDuplicateOffsetY(0);
  };

  const acceptDuplication = () => {
    if (!duplicateActive) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    const updated = { ...project.pixels };
    const nextPixels = [...layerPixels];
    const nextSelectionPixels = new Array(project.width * project.height).fill(false);

    // Stamping the duplicated/moved pixels onto the active layer
    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const idx = y * project.width + x;
        if (duplicateMask[idx]) {
          const color = duplicatePixels[idx];
          if (color) {
            const nx = x + duplicateOffsetX;
            const ny = y + duplicateOffsetY;
            if (nx >= 0 && nx < project.width && ny >= 0 && ny < project.height) {
              const targetIdx = ny * project.width + nx;
              nextPixels[targetIdx] = color;
              nextSelectionPixels[targetIdx] = true;
            }
          }
        }
      }
    }

    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextPixels
    };
    onUpdatePixels(updated, false);

    // Set selection mask to represent the new pasted location
    setSelection({ active: true, pixels: nextSelectionPixels });
    setDuplicateActive(false);
  };

  const cancelDuplication = () => {
    if (duplicateActive) {
      if (isMoveMode) {
        // Restore original pixels on cancel
        const updated = { ...project.pixels };
        updated[currentFrameId] = {
          ...updated[currentFrameId],
          [currentLayerId]: duplicatePixels
        };
        onUpdatePixels(updated, false);
      }
    }
    setDuplicateActive(false);
  };

  const rotateSelection = () => {
    if (!selection.active) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
    let hasSelected = false;
    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        if (selection.pixels[y * project.width + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasSelected = true;
        }
      }
    }
    if (!hasSelected) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const updated = { ...project.pixels };
    const nextPixels = new Array(project.width * project.height).fill('');
    const nextSelectionPixels = new Array(project.width * project.height).fill(false);

    for (let i = 0; i < layerPixels.length; i++) {
      if (!selection.pixels[i]) {
        nextPixels[i] = layerPixels[i];
      }
    }

    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const idx = y * project.width + x;
        if (selection.pixels[idx]) {
          const lx = x - cx;
          const ly = y - cy;
          const rx = Math.round(cx - ly);
          const ry = Math.round(cy + lx);

          if (rx >= 0 && rx < project.width && ry >= 0 && ry < project.height) {
            const nIdx = ry * project.width + rx;
            nextPixels[nIdx] = layerPixels[idx];
            nextSelectionPixels[nIdx] = true;
          }
        }
      }
    }

    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextPixels
    };
    onUpdatePixels(updated, true);
    setSelection({ active: true, pixels: nextSelectionPixels });
  };

  const flipSelectionHorizontal = () => {
    if (!selection.active) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    let minX = project.width, maxX = -1;
    let hasSelected = false;
    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        if (selection.pixels[y * project.width + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          hasSelected = true;
        }
      }
    }
    if (!hasSelected) return;

    const updated = { ...project.pixels };
    const nextPixels = new Array(project.width * project.height).fill('');
    const nextSelectionPixels = new Array(project.width * project.height).fill(false);

    for (let i = 0; i < layerPixels.length; i++) {
      if (!selection.pixels[i]) {
        nextPixels[i] = layerPixels[i];
      }
    }

    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const idx = y * project.width + x;
        if (selection.pixels[idx]) {
          const nx = maxX - (x - minX);
          const nIdx = y * project.width + nx;
          nextPixels[nIdx] = layerPixels[idx];
          nextSelectionPixels[nIdx] = true;
        }
      }
    }

    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextPixels
    };
    onUpdatePixels(updated, true);
    setSelection({ active: true, pixels: nextSelectionPixels });
  };

  const flipSelectionVertical = () => {
    if (!selection.active) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    let minY = project.height, maxY = -1;
    let hasSelected = false;
    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        if (selection.pixels[y * project.width + x]) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasSelected = true;
        }
      }
    }
    if (!hasSelected) return;

    const updated = { ...project.pixels };
    const nextPixels = new Array(project.width * project.height).fill('');
    const nextSelectionPixels = new Array(project.width * project.height).fill(false);

    for (let i = 0; i < layerPixels.length; i++) {
      if (!selection.pixels[i]) {
        nextPixels[i] = layerPixels[i];
      }
    }

    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const idx = y * project.width + x;
        if (selection.pixels[idx]) {
          const ny = maxY - (y - minY);
          const nIdx = ny * project.width + x;
          nextPixels[nIdx] = layerPixels[idx];
          nextSelectionPixels[nIdx] = true;
        }
      }
    }

    updated[currentFrameId] = {
      ...updated[currentFrameId],
      [currentLayerId]: nextPixels
    };
    onUpdatePixels(updated, true);
    setSelection({ active: true, pixels: nextSelectionPixels });
  };

  // Force redrawing on state shifts
  useEffect(() => {
    drawCanvas();
  }, [
    project.pixels, project.width, project.height, project.layers,
    currentFrameId, currentLayerId, zoom, panX, panY,
    onionSkinEnabled, onionSkinOpacity, onionSkinSettings, symmetry, tiling, selection, 
    drawStart, gridVisible,
    duplicateActive, duplicateOffsetX, duplicateOffsetY,
    moveActive, moveOffsetX, moveOffsetY, isMoveMode,
    transformState, hoveredHandle
  ]);

  // If frame or layer changes, finalize any active move/duplicate/transform to prevent carrying them over
  useEffect(() => {
    if (transformState.isActive) {
      acceptTransformSelection();
    }
    if (moveActive) {
      cancelMove();
    }
    if (duplicateActive) {
      cancelDuplication();
    }
  }, [currentFrameId, currentLayerId]);

  // ============================================================================
  // CANVAS SYSTEM — PROTECTED SUBSYSTEM BOUNDARY
  //
  // CONTRACT:
  // - Inputs: Viewport dimensions, Project dimensions, panX, panY, zoom, project.pixels, currentLayerId/frameId
  // - Responsibilities: Viewport physical buffer sync, Document coordinate mapping, Document/Artboard presentation, Layer pixel rendering, Tool interaction previews
  // - Strict Boundary: DO NOT own pixel modification, history, layer state management, tool behavior logic, or project persistence.
  // ============================================================================

  // --- 1. Coordinate Transformations (Screen <-> Document) ---
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - panX) / zoom);
    const y = Math.floor((clientY - rect.top - panY) / zoom);

    if (tiling.active) {
      // In tiling mode, wrap drawing coordinates to bounds
      return {
        x: ((x % project.width) + project.width) % project.width,
        y: ((y % project.height) + project.height) % project.height
      };
    }

    if (x >= 0 && x < project.width && y >= 0 && y < project.height) {
      return { x, y };
    }
    return null;
  };

  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (coordDisplayRafRef.current !== null) {
        cancelAnimationFrame(coordDisplayRafRef.current);
      }
    };
  }, []);

  // --- 2. Render Batching & RequestAnimationFrame Loop ---
  const drawCanvas = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const start = performance.now();
      drawCanvasInternal();
      telemetry.recordCanvasRender(performance.now() - start);
    });
  };

  // --- 3. Document / Artboard Presentation Subsystem ---
  // Isolated function responsible purely for the visual appearance of the document sheet
  // and transparency checkerboard. No borders, shadows, or outer frames.
  const drawDocumentArtboardPresentation = (
    ctx: CanvasRenderingContext2D,
    renderWidth: number,
    renderHeight: number
  ) => {
    // 1. Dark low-contrast transparency checkerboard (#1C1C1C and #262626)
    // Scaled at 4x4 logical pixels per checker cell (8x8 pattern) for a clean, non-distracting visual rhythm.
    const cellSize = 4;
    const patternSize = cellSize * 2;
    const patternCanvas = getCachedCanvas(patternCanvasRef, patternSize, patternSize, 'pattern');
    const pctx = patternCanvas.getContext('2d');
    if (pctx) {
      pctx.clearRect(0, 0, patternSize, patternSize);
      // Background base
      pctx.fillStyle = '#1C1C1C';
      pctx.fillRect(0, 0, patternSize, patternSize);
      // Alternating tiles (cell 1,0 and cell 0,1)
      pctx.fillStyle = '#262626';
      pctx.fillRect(cellSize, 0, cellSize, cellSize);
      pctx.fillRect(0, cellSize, cellSize, cellSize);
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, renderWidth, renderHeight);
      }
    } else {
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(0, 0, renderWidth, renderHeight);
    }
  };

  // --- 4. Main Direct Renderer Pipeline ---
  const drawCanvasInternal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed physical viewport size matching containerRef size
    const container = containerRef.current;
    if (!container) return;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    if (viewportWidth <= 0 || viewportHeight <= 0) return;

    if (!Number.isFinite(panX) || !Number.isFinite(panY) || !Number.isFinite(zoom) || zoom <= 0) {
      return;
    }

    if (canvas.width !== viewportWidth || canvas.height !== viewportHeight) {
      telemetry.logAction('CANVAS_RENDER_SIZE_CHANGE', 'Canvas physical dimensions updated', {
        from: `${canvas.width}x${canvas.height}`,
        to: `${viewportWidth}x${viewportHeight}`
      });
      canvas.width = viewportWidth;
      canvas.height = viewportHeight;
    }

    ctx.imageSmoothingEnabled = false;

    // Clear viewport canvas to avoid ghost drawings when panning or resizing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Translate the context by the pan coordinates
    ctx.translate(panX, panY);

    ctx.save();
    // Scale the context by the zoom factor
    ctx.scale(zoom, zoom);

    // Canvas sizes depend on tiling
    const renderWidth = tiling.active ? project.width * 3 : project.width;
    const renderHeight = tiling.active ? project.height * 3 : project.height;

    // Draw Document / Artboard Presentation (Pure transparency sheet without outer stroke)
    drawDocumentArtboardPresentation(ctx, renderWidth, renderHeight);

    ctx.save();
    // Offset the rendering window if tiling is active (so original is in the center)
    if (tiling.active) {
      ctx.translate(project.width, project.height);
    }

    // 2. Draw Onion Skinning (Previous and next frames)
    if (onionSkinEnabled) {
      const frameIdx = project.frames.findIndex(f => f.id === currentFrameId);
      
      const settings: OnionSkinSettings = onionSkinSettings || {
        enabled: true,
        framesBefore: 2,
        framesAfter: 1,
        opacityBefore: onionSkinOpacity / 100,
        opacityAfter: (onionSkinOpacity / 100) * 0.5,
        colorBefore: '#ff0000', // red tint
        colorAfter: '#00ff00',  // green tint
        tintMode: true
      };

      if (frameIdx !== -1) {
        // Draw Previous Frames (Onion Skin)
        for (let i = settings.framesBefore; i >= 1; i--) {
          const prevIdx = frameIdx - i;
          if (prevIdx >= 0) {
            const frameId = project.frames[prevIdx].id;
            const op = settings.opacityBefore * Math.pow(0.5, i - 1);
            if (op > 0.01) {
              if (settings.tintMode) {
                const tintedCanvas = getTintedFrameCanvas(
                  project.width,
                  project.height,
                  frameId,
                  project.layers,
                  project.pixels,
                  settings.colorBefore,
                  settings.tintMode
                );
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.globalAlpha = op;
                ctx.drawImage(tintedCanvas, 0, 0, project.width, project.height);
                ctx.restore();
              } else {
                drawFrameComposite(ctx, frameId, op);
              }
            }
          }
        }

        // Draw Next Frames (Onion Skin)
        for (let j = 1; j <= settings.framesAfter; j++) {
          const nextIdx = frameIdx + j;
          if (nextIdx < project.frames.length) {
            const frameId = project.frames[nextIdx].id;
            const op = settings.opacityAfter * Math.pow(0.5, j - 1);
            if (op > 0.01) {
              if (settings.tintMode) {
                const tintedCanvas = getTintedFrameCanvas(
                  project.width,
                  project.height,
                  frameId,
                  project.layers,
                  project.pixels,
                  settings.colorAfter,
                  settings.tintMode
                );
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.globalAlpha = op;
                ctx.drawImage(tintedCanvas, 0, 0, project.width, project.height);
                ctx.restore();
              } else {
                drawFrameComposite(ctx, frameId, op);
              }
            }
          }
        }
      }
    }

    // 3. Draw Active Frame Layers
    drawFrameLayers(ctx, currentFrameId);

    // 4. Draw Repetitions around (Tiling Preview)
    if (tiling.active) {
      ctx.restore();
      ctx.save();
      
      // We render 3x3 panels around the primary panel
      const offsets = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
      ];

      offsets.forEach(([ox, oy]) => {
        ctx.save();
        ctx.translate((ox + 1) * project.width, (oy + 1) * project.height);
        drawFrameLayers(ctx, currentFrameId, 0.4); // slightly translucent for edges
        ctx.restore();
      });
      
      // Restore translation to central panel for previews & lines
      ctx.translate(project.width, project.height);
    }

    // 4.5 Draw Duplicated Selection Overlay while dragging using optimized ImageData
    if (duplicateActive) {
      ctx.save();
      const dupCanvas = getCachedCanvas(dupCanvasRef, project.width, project.height, 'duplicate');
      const dupCtx = dupCanvas.getContext('2d');
      if (dupCtx) {
        dupCtx.clearRect(0, 0, project.width, project.height);
        const dupImgData = dupCtx.createImageData(project.width, project.height);
        const dupData = dupImgData.data;
        const w = project.width;
        const h = project.height;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (duplicateMask[idx]) {
              const color = duplicatePixels[idx];
              if (color) {
                const nx = x + duplicateOffsetX;
                const ny = y + duplicateOffsetY;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const targetIdx = (ny * w + nx) * 4;
                  const parsed = parseHexColor(color);
                  if (parsed) {
                    dupData[targetIdx] = parsed.r;
                    dupData[targetIdx+1] = parsed.g;
                    dupData[targetIdx+2] = parsed.b;
                    dupData[targetIdx+3] = Math.round(parsed.a * 0.85);
                  }
                }
              }
            }
          }
        }
        dupCtx.putImageData(dupImgData, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(dupCanvas, 0, 0, project.width, project.height);
      }
      ctx.restore();

      // Draw dotted outline bounding box of the duplicate (fast, avoids per-pixel strokeRect)
      ctx.save();
      ctx.strokeStyle = isMoveMode ? '#38bdf8' : '#22c55e'; // green outline for duplicate, blue for move
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
      let hasDuplicate = false;
      for (let i = 0; i < duplicateMask.length; i++) {
        if (duplicateMask[i]) {
          const x = i % project.width;
          const y = Math.floor(i / project.width);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasDuplicate = true;
        }
      }
      if (hasDuplicate) {
        const dMinX = Math.max(0, minX + duplicateOffsetX);
        const dMinY = Math.max(0, minY + duplicateOffsetY);
        const dMaxX = Math.min(project.width - 1, maxX + duplicateOffsetX);
        const dMaxY = Math.min(project.height - 1, maxY + duplicateOffsetY);
        ctx.strokeRect(dMinX, dMinY, dMaxX - dMinX + 1, dMaxY - dMinY + 1);
      }
      ctx.restore();
    }

    // 4.6 Draw Moved Selection Overlay while dragging using optimized ImageData
    if (moveActive) {
      ctx.save();
      const moveCanvas = getCachedCanvas(moveCanvasRef, project.width, project.height, 'move');
      const moveCtx = moveCanvas.getContext('2d');
      if (moveCtx) {
        moveCtx.clearRect(0, 0, project.width, project.height);
        const moveImgData = moveCtx.createImageData(project.width, project.height);
        const moveData = moveImgData.data;
        const w = project.width;
        const h = project.height;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (moveMask[idx]) {
              const color = movePixels[idx];
              if (color) {
                const nx = x + moveOffsetX;
                const ny = y + moveOffsetY;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const targetIdx = (ny * w + nx) * 4;
                  const parsed = parseHexColor(color);
                  if (parsed) {
                    moveData[targetIdx] = parsed.r;
                    moveData[targetIdx+1] = parsed.g;
                    moveData[targetIdx+2] = parsed.b;
                    moveData[targetIdx+3] = Math.round(parsed.a * 255);
                  }
                }
              }
            }
          }
        }
        moveCtx.putImageData(moveImgData, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(moveCanvas, 0, 0, project.width, project.height);
      }
      ctx.restore();
    }

    // 5. Draw Brush Preview & Shape Drafts (Shape preview retained for shape tools only, pen/brush preview disabled for direct isolation)
    const currentCoord = currentCoordRef.current;
    if (drawStart && currentCoord && (isDrawing || (currentTool === 'curve' && curveState))) {
      if (['line', 'rectangle', 'ellipse', 'curve'].includes(currentTool)) {
        ctx.save();
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = brushOpacity / 100;

        let previewPoints: { x: number; y: number }[] = [];
        if (currentTool === 'line') {
          previewPoints = getLinePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y);
        } else if (currentTool === 'rectangle') {
          previewPoints = getRectanglePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y, fillShape);
        } else if (currentTool === 'ellipse') {
          previewPoints = getEllipsePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y, fillShape);
        } else if (currentTool === 'curve' && curveState) {
          if (isDrawing) {
            previewPoints = getLinePoints(curveState.start.x, curveState.start.y, curveState.end.x, curveState.end.y);
          } else {
            previewPoints = getCurvePoints(curveState.start, curveState.end, currentCoord);
          }
        }

        let symmetricPreviews = previewPoints.flatMap(p => 
          getSymmetricPoints(p.x, p.y, project.width, project.height, symmetry)
        );

        if (selection.active) {
          symmetricPreviews = symmetricPreviews.filter(p => {
            if (p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height) {
              return selection.pixels[p.y * project.width + p.x];
            }
            return false;
          });
        }

        symmetricPreviews.forEach(p => {
          if (p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height) {
            ctx.fillRect(p.x, p.y, 1, 1);
          }
        });
        ctx.restore();
      }
    }

    // 5.1 Hover Brush Preview (Temporarily deactivated for direct pixel testing)

    // 5.5 Draw Active Stamp Hover Preview
    if (activeStamp && currentCoord) {
      ctx.save();
      ctx.globalAlpha = 0.65; // semi-transparent preview
      
      const transformed = transformStamp(activeStamp.pixels, activeStamp.width, activeStamp.height, stampRotation, stampFlipH, stampFlipV);
      const halfW = Math.floor(transformed.width / 2);
      const halfH = Math.floor(transformed.height / 2);
      
      for (let sy = 0; sy < transformed.height; sy++) {
        for (let sx = 0; sx < transformed.width; sx++) {
          const color = transformed.pixels[sy * transformed.width + sx];
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            // Draw a stampScale x stampScale square of pixels
            const targetX = currentCoord.x - halfW * stampScale + sx * stampScale;
            const targetY = currentCoord.y - halfH * stampScale + sy * stampScale;
            
            ctx.fillRect(targetX, targetY, stampScale, stampScale);
          }
        }
      }
      ctx.restore();

      // Draw dashed placement bounding box
      ctx.save();
      ctx.strokeStyle = '#C8A96A'; // Brand gold outline
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([2 / zoom, 2 / zoom]);
      const boxX = currentCoord.x - halfW * stampScale;
      const boxY = currentCoord.y - halfH * stampScale;
      const boxW = transformed.width * stampScale;
      const boxH = transformed.height * stampScale;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.restore();
    }

    // 6. Draw Pixel Grids / Grid lines (highly optimized to visible viewport range in a single pass)
    if (gridVisible && zoom >= 4) {
      const minVisibleX = Math.max(0, Math.floor(-panX / zoom));
      const maxVisibleX = Math.min(project.width, Math.ceil((viewportWidth - panX) / zoom));
      const minVisibleY = Math.max(0, Math.floor(-panY / zoom));
      const maxVisibleY = Math.min(project.height, Math.ceil((viewportHeight - panY) / zoom));

      if (minVisibleX <= maxVisibleX && minVisibleY <= maxVisibleY) {
        ctx.save();
        ctx.strokeStyle = gridColor || 'rgba(255, 255, 255, 0.05)';
        const baseAlpha = gridOpacity !== undefined ? gridOpacity / 100 : 0.8;
        // Smoothly modulate grid density at lower zoom levels to preserve low-contrast aesthetic
        const zoomFade = zoom >= 8 ? 1 : Math.max(0.2, (zoom - 3) / 5);
        ctx.globalAlpha = Math.min(1, Math.max(0.02, baseAlpha * zoomFade));
        ctx.lineWidth = 1 / zoom;
        
        const step = Math.max(1, gridSize || 1);
        const startX = Math.floor(minVisibleX / step) * step;
        const startY = Math.floor(minVisibleY / step) * step;

        ctx.beginPath();
        for (let x = startX; x <= maxVisibleX; x += step) {
          ctx.moveTo(x, minVisibleY);
          ctx.lineTo(x, maxVisibleY);
        }
        for (let y = startY; y <= maxVisibleY; y += step) {
          ctx.moveTo(minVisibleX, y);
          ctx.lineTo(maxVisibleX, y);
        }
        ctx.stroke();

        if (step > 1 && zoom >= 8) {
          ctx.beginPath();
          ctx.globalAlpha = Math.min(1, Math.max(0.02, (gridOpacity !== undefined ? (gridOpacity / 100) * 0.4 : 0.12)));
          for (let x = minVisibleX; x <= maxVisibleX; x++) {
            if (x % step !== 0) {
              ctx.moveTo(x, minVisibleY);
              ctx.lineTo(x, maxVisibleY);
            }
          }
          for (let y = minVisibleY; y <= maxVisibleY; y++) {
            if (y % step !== 0) {
              ctx.moveTo(minVisibleX, y);
              ctx.lineTo(maxVisibleX, y);
            }
          }
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 6.5 Draw Clone Stamp Source Reticle / Origin Indicator
    if (cloneSource && currentTool === 'clone_stamp') {
      let activeSourceX = cloneSource.x;
      let activeSourceY = cloneSource.y;

      if (isDrawing && cloneStartOffsetRef.current && currentCoord) {
        activeSourceX = currentCoord.x + cloneStartOffsetRef.current.dx;
        activeSourceY = currentCoord.y + cloneStartOffsetRef.current.dy;
      }

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      ctx.setLineDash([3 / zoom, 2 / zoom]);

      // Draw dashed square around the sampled region
      const halfSize = Math.max(0.5, Math.floor(brushSize / 2));
      const boxSize = Math.max(1, brushSize);
      ctx.strokeRect(activeSourceX - halfSize, activeSourceY - halfSize, boxSize, boxSize);

      // Draw crosshair reticle in center
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(activeSourceX + 0.5 - 2 / zoom, activeSourceY + 0.5);
      ctx.lineTo(activeSourceX + 0.5 + 2 / zoom, activeSourceY + 0.5);
      ctx.moveTo(activeSourceX + 0.5, activeSourceY + 0.5 - 2 / zoom);
      ctx.lineTo(activeSourceX + 0.5, activeSourceY + 0.5 + 2 / zoom);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Lasso path preview while dragging
    if (currentTool === 'lasso_select' && lassoPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(lassoPath[0].x + 0.5, lassoPath[0].y + 0.5);
      for (let i = 1; i < lassoPath.length; i++) {
        ctx.lineTo(lassoPath[i].x + 0.5, lassoPath[i].y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw Symmetry Line Guides
    const cx = Math.floor(project.width / 2);
    const cy = Math.floor(project.height / 2);
    ctx.save();
    ctx.strokeStyle = symmetryAxisColor || '#C8A96A';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);

    if (symmetry.x) {
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, project.height);
      ctx.stroke();
    }
    if (symmetry.y) {
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(project.width, cy);
      ctx.stroke();
    }
    if (symmetry.radial) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(project.width, project.height);
      ctx.moveTo(project.width, 0);
      ctx.lineTo(0, project.height);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // Restores Central Tiling Panel Save (level 3)
    ctx.restore(); // Restores Zoom Scale Save (level 2)

    if (transformState.isActive) {
      drawTransformUI(
        ctx,
        transformState.originalBounds,
        transformState.pivot,
        transformState.translation,
        transformState.scale,
        transformState.rotation,
        zoom,
        hoveredHandle
      );
    }

    ctx.restore(); // Restores Outer Translate Save (level 1)
  };

  const drawFrameComposite = (ctx: CanvasRenderingContext2D, frameId: string, opacity: number) => {
    drawFrameLayers(ctx, frameId, opacity);
  };

  const rasterizePixels = (
    pixels: string[],
    width: number,
    height: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });

    if (!ctx) {
      throw new Error('No se pudo obtener contexto 2D para rasterizar el documento.');
    }

    ctx.imageSmoothingEnabled = false;

    const imageData = ctx.createImageData(width, height);
    const total = Math.min(pixels.length, width * height);

    for (let i = 0; i < total; i++) {
      const color = pixels[i];

      if (!color || color === 'transparent' || color === '') {
        imageData.data[i * 4 + 0] = 0;
        imageData.data[i * 4 + 1] = 0;
        imageData.data[i * 4 + 2] = 0;
        imageData.data[i * 4 + 3] = 0;
        continue;
      }

      const rgba = parseHexColor(color);
      if (!rgba) {
        imageData.data[i * 4 + 0] = 0;
        imageData.data[i * 4 + 1] = 0;
        imageData.data[i * 4 + 2] = 0;
        imageData.data[i * 4 + 3] = 0;
        continue;
      }

      imageData.data[i * 4 + 0] = rgba.r;
      imageData.data[i * 4 + 1] = rgba.g;
      imageData.data[i * 4 + 2] = rgba.b;
      imageData.data[i * 4 + 3] = rgba.a;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas;
  };

  const drawFrameLayers = (ctx: CanvasRenderingContext2D, frameId: string, customAlpha = 1.0) => {
    const framePixels = project.pixels[frameId];
    if (!framePixels) return;

    let transformedPixels: string[] | undefined = undefined;
    if (transformState.isActive && currentFrameId === frameId) {
      const result = transformPixels(
        transformState.originalBounds,
        transformState.pivot,
        transformState.translation,
        transformState.scale,
        transformState.rotation,
        transformState.pixelBuffer,
        transformState.maskBuffer,
        project.width,
        project.height
      );
      transformedPixels = result.pixels;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'source-over';

    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;

      let pixels =
        layer.id === currentLayerId && currentFrameId === frameId && activeStrokeLayerPixelsRef.current
          ? activeStrokeLayerPixelsRef.current
          : (LayerResolutionService.getEffectiveLayerPixels(project, frameId, layer.id)?.pixels || framePixels[layer.id]);

      const isTransformingThisLayer = transformState.isActive && currentFrameId === frameId && layer.id === currentLayerId;
      const effectivePixels = isTransformingThisLayer && transformedPixels ? transformedPixels : pixels;

      if (!effectivePixels || LayerResolutionService.isPixelArrayEmpty(effectivePixels)) continue;

      const layerCanvas = rasterizePixels(
        effectivePixels,
        project.width,
        project.height
      );

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (layer.opacity / 100) * customAlpha));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        layerCanvas,
        0,
        0,
        project.width,
        project.height
      );
      ctx.restore();
    }
  };

  const getBrushPoints = (cx: number, cy: number, fractional?: { x: number; y: number } | null): { x: number; y: number }[] => {
    const isEven = (activeBrush && activeBrush.pixels)
      ? (activeBrush.size * brushSize) % 2 === 0
      : brushSize % 2 === 0;

    const useFractional = fractional !== undefined && fractional !== null;

    const startX = isEven && useFractional ? Math.round(fractional.x) : cx;
    const startY = isEven && useFractional ? Math.round(fractional.y) : cy;

    return brushOffsetsCacheRef.current.map(o => ({
      x: startX + o.dx,
      y: startY + o.dy
    }));
  };

  // --- ADVANCED TOOLS HELPERS ---
  const generateSprayPoints = (center: { x: number; y: number }): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const r = sprayRandomness;
    const attempts = sprayDensity * 3;
    let count = 0;
    for (let i = 0; i < attempts && count < sprayDensity; i++) {
      const dx = Math.floor(Math.random() * (2 * r + 1)) - r;
      const dy = Math.floor(Math.random() * (2 * r + 1)) - r;
      let valid = false;
      if (sprayShape === 'round') {
        valid = (dx * dx + dy * dy) <= r * r;
      } else if (sprayShape === 'square') {
        valid = true;
      } else if (sprayShape === 'cross') {
        valid = (dx === 0 || dy === 0);
      } else if (sprayShape === 'star') {
        valid = (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy));
      }
      if (valid) {
        points.push({ x: center.x + dx, y: center.y + dy });
        count++;
      }
    }
    return points;
  };

  const shouldPaintDither = (x: number, y: number, pattern: string): boolean => {
    switch (pattern) {
      case 'checkerboard':
      case '50%':
        return (x + y) % 2 === 0;
      case 'bayer': {
        const bayerMatrix = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5]
        ];
        return bayerMatrix[Math.abs(y) % 4][Math.abs(x) % 4] < 8;
      }
      case '25%':
        return (x % 2 === 0 && y % 2 === 0);
      case '75%':
        return (x % 2 === 0 && y % 2 === 0) || ((x + y) % 2 !== 0);
      case 'lines':
        return y % 2 === 0;
      case 'cross':
        return (x % 2 === 0 || y % 2 === 0);
      case 'noise':
        return Math.random() < 0.5;
      default:
        return true;
    }
  };

  const getCurvePoints = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    control: { x: number; y: number }
  ): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [];
    const seen = new Set<string>();
    const dist = Math.hypot(end.x - start.x, end.y - start.y) + Math.hypot(control.x - end.x, control.y - end.y);
    const steps = Math.max(12, Math.ceil(dist * 2.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round((1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x);
      const y = Math.round((1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y);
      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        points.push({ x, y });
      }
    }
    return points;
  };

  const handleApplyStampClick = (coord: { x: number; y: number }) => {
    if (!activeStamp) return;
    const framePixels = project.pixels[currentFrameId];
    const layerPixels = framePixels?.[currentLayerId];
    if (!layerPixels) return;

    // Prevent painting on locked or invisible layers
    const layerMeta = project.layers.find(l => l.id === currentLayerId);
    if (layerMeta?.locked || !layerMeta?.visible) return;

    onStartHistoryAction?.();

    const updatedPixels = { ...project.pixels };
    const currentLayerPixels = [...layerPixels];

    const transformed = transformStamp(activeStamp.pixels, activeStamp.width, activeStamp.height, stampRotation, stampFlipH, stampFlipV);
    const halfW = Math.floor(transformed.width / 2);
    const halfH = Math.floor(transformed.height / 2);

    for (let sy = 0; sy < transformed.height; sy++) {
      for (let sx = 0; sx < transformed.width; sx++) {
        const color = transformed.pixels[sy * transformed.width + sx];
        if (color && color !== 'transparent') {
          // Map each pixel to stampScale x stampScale output
          for (let dy = 0; dy < stampScale; dy++) {
            for (let dx = 0; dx < stampScale; dx++) {
              const targetX = coord.x - halfW * stampScale + sx * stampScale + dx;
              const targetY = coord.y - halfH * stampScale + sy * stampScale + dy;

              if (targetX >= 0 && targetX < project.width && targetY >= 0 && targetY < project.height) {
                const idx = targetY * project.width + targetX;
                currentLayerPixels[idx] = color;
              }
            }
          }
        }
      }
    }

    updatedPixels[currentFrameId] = {
      ...updatedPixels[currentFrameId],
      [currentLayerId]: currentLayerPixels
    };
    onUpdatePixels(updatedPixels, false);
  };

  // Helper to compute and apply painted color for a given coordinate
  const applyPointPaint = (
    coord: { x: number; y: number },
    currentLayerPixels: string[],
    initialPixels: string[],
    modifiedList: Array<{ x: number; y: number; color: string }>
  ): boolean => {
    let hasPaintedColor = false;
    let targetPoints: { x: number; y: number }[] = [];
    if (currentTool === 'spray') {
      targetPoints = generateSprayPoints(coord);
    } else {
      const currentCoord = currentCoordRef.current;
      const isCurrent = currentCoord && coord.x === currentCoord.x && coord.y === currentCoord.y;
      targetPoints = getBrushPoints(coord.x, coord.y, isCurrent ? currentFractionalCoordRef.current : null);
    }

    if (selection.active) {
      targetPoints = targetPoints.filter(p => p.y >= 0 && p.y < project.height && p.x >= 0 && p.x < project.width && selection.pixels[p.y * project.width + p.x]);
    }

    let symmetricPoints = targetPoints.flatMap(p => 
      getSymmetricPoints(p.x, p.y, project.width, project.height, symmetry)
    );

    if (tiling.active) {
      symmetricPoints = symmetricPoints.map(p => ({
        x: ((p.x % project.width) + project.width) % project.width,
        y: ((p.y % project.height) + project.height) % project.height
      }));
    } else {
      symmetricPoints = symmetricPoints.filter(p => 
        p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height
      );
    }

    symmetricPoints.forEach(p => {
      const idx = p.y * project.width + p.x;
      if (idx >= 0 && idx < currentLayerPixels.length) {
        let newColor = '';
        let isColor = false;
        if (currentTool === 'eraser') {
          newColor = '';
        } else if (currentTool === 'dithering') {
          if (shouldPaintDither(p.x, p.y, ditheringPattern)) {
            newColor = currentColor;
            isColor = true;
          } else {
            return;
          }
        } else if (currentTool === 'clone_stamp') {
          if (cloneSource) {
            const offset = cloneStartOffsetRef.current || (drawStart ? { dx: cloneSource.x - drawStart.x, dy: cloneSource.y - drawStart.y } : { dx: 0, dy: 0 });
            const sx = p.x + offset.dx;
            const sy = p.y + offset.dy;
            if (sx >= 0 && sx < project.width && sy >= 0 && sy < project.height) {
              const srcIdx = sy * project.width + sx;
              newColor = initialPixels[srcIdx] || '';
              if (initialPixels[srcIdx]) {
                isColor = true;
              }
            } else {
              return;
            }
          } else {
            return;
          }
        } else {
          const patternColor = activeStamp && patternContext.enabled
            ? PatternRenderer.getPixel(
                p.x,
                p.y,
                patternContext,
                activeStamp,
                drawStart?.x ?? 0,
                drawStart?.y ?? 0
              )
            : null;

          if (patternColor !== null) {
            if (patternColor !== 'transparent') {
              newColor = patternColor;
              isColor = true;
            } else {
              return;
            }
          } else {
            newColor = currentColor;
            isColor = true;
          }
        }

        currentLayerPixels[idx] = newColor;
        activeModifiedIndicesRef.current.add(idx);
        modifiedList.push({ x: p.x, y: p.y, color: newColor });
        if (isColor) {
          hasPaintedColor = true;
        }
      }
    });

    return hasPaintedColor;
  };

  // Core DRY Stroke Painting Processor (Incremental O(1) per point)
  const paintStrokePoints = (pointsToPaint: { x: number; y: number }[]) => {
    if (pointsToPaint.length === 0) return;

    const framePixels = project.pixels[currentFrameId];
    if (!framePixels) return;

    if (!activeStrokeLayerPixelsRef.current || !initialLayerPixelsRef.current) {
      const effective = LayerResolutionService.getEffectiveLayerPixels(project, currentFrameId, currentLayerId);
      const src = (effective && effective.pixels && effective.pixels.length > 0)
        ? effective.pixels
        : (framePixels[currentLayerId] || Array(project.width * project.height).fill(''));
      initialLayerPixelsRef.current = src;
      activeStrokeLayerPixelsRef.current = [...src];
      activeModifiedIndicesRef.current.clear();
    }

    const initialPixels = initialLayerPixelsRef.current;
    const currentLayerPixels = activeStrokeLayerPixelsRef.current;
    if (!currentLayerPixels || !initialPixels) return;

    let hasPaintedColor = false;
    const modifiedList: Array<{ x: number; y: number; color: string }> = [];

    pointsToPaint.forEach(coord => {
      const painted = applyPointPaint(coord, currentLayerPixels, initialPixels, modifiedList);
      if (painted) {
        hasPaintedColor = true;
      }
    });

    if (hasPaintedColor) {
      strokeColorToRecordRef.current = currentColor;
    }

    if (modifiedList.length > 0) {
      drawCanvas();
    }
  };

  // Continuous Paint Interpolation Logic
  const handlePaintContinuous = (fromCoord: { x: number; y: number }, toCoord: { x: number; y: number }) => {
    // Prevent painting on locked or invisible layers
    const layerMeta = project.layers.find(l => l.id === currentLayerId);
    if (layerMeta?.locked || !layerMeta?.visible) return;

    if (!activeStrokeLayerPixelsRef.current || !initialLayerPixelsRef.current) {
      const framePixels = project.pixels[currentFrameId];
      const effective = LayerResolutionService.getEffectiveLayerPixels(project, currentFrameId, currentLayerId);
      const src = (effective && effective.pixels && effective.pixels.length > 0)
        ? effective.pixels
        : (framePixels?.[currentLayerId] || Array(project.width * project.height).fill(''));
      initialLayerPixelsRef.current = src;
      activeStrokeLayerPixelsRef.current = [...src];
      activeModifiedIndicesRef.current.clear();
    }

    const isPixelPerfectActive = (pixelPerfect && brushSize === 1 && !activeBrush && (currentTool === 'pen' || currentTool === 'eraser'));

    if (isPixelPerfectActive) {
      // Pixel-perfect requires evaluating the stroke path to filter out L-corners
      const lineCoords = getLinePoints(fromCoord.x, fromCoord.y, toCoord.x, toCoord.y);
      lineCoords.forEach(coord => {
        const lastPoint = strokePointsRef.current[strokePointsRef.current.length - 1];
        if (!lastPoint || lastPoint.x !== coord.x || lastPoint.y !== coord.y) {
          strokePointsRef.current.push(coord);
        }
      });

      const filtered = filterPixelPerfect(strokePointsRef.current);
      const prevFiltered = lastPixelPerfectPointsRef.current;
      
      const currentLayerPixels = activeStrokeLayerPixelsRef.current;
      const initialPixels = initialLayerPixelsRef.current;
      if (!currentLayerPixels || !initialPixels) return;

      const modifiedList: Array<{ x: number; y: number; color: string }> = [];
      let hasPaintedColor = false;

      // Find points in prevFiltered that were removed in filtered (L-corners to revert)
      const filteredSet = new Set(filtered.map(p => `${p.x},${p.y}`));
      prevFiltered.forEach(p => {
        if (!filteredSet.has(`${p.x},${p.y}`)) {
          const idx = p.y * project.width + p.x;
          if (idx >= 0 && idx < currentLayerPixels.length) {
            const restoredColor = initialPixels[idx] || '';
            currentLayerPixels[idx] = restoredColor;
            modifiedList.push({ x: p.x, y: p.y, color: restoredColor });
          }
        }
      });

      // Find points in filtered that are new compared to prevFiltered
      const prevSet = new Set(prevFiltered.map(p => `${p.x},${p.y}`));
      filtered.forEach(p => {
        if (!prevSet.has(`${p.x},${p.y}`)) {
          const painted = applyPointPaint(p, currentLayerPixels, initialPixels, modifiedList);
          if (painted) hasPaintedColor = true;
        }
      });

      lastPixelPerfectPointsRef.current = filtered;

      if (hasPaintedColor) {
        strokeColorToRecordRef.current = currentColor;
      }

      if (modifiedList.length > 0) {
        drawCanvas();
      }
    } else {
      // Standard continuous stroke: compute intermediate line points and paint only the delta
      const lineCoords = getLinePoints(fromCoord.x, fromCoord.y, toCoord.x, toCoord.y);
      const deltaPoints = lineCoords.filter((c, i) => i > 0 || (c.x !== fromCoord.x || c.y !== fromCoord.y));
      if (deltaPoints.length > 0) {
        paintStrokePoints(deltaPoints);
      }
    }
  };

  // Paint Pixel Logic
  const handlePaintPixel = (coord: { x: number; y: number }) => {
    // Prevent painting on locked or invisible layers
    const layerMeta = project.layers.find(l => l.id === currentLayerId);
    if (layerMeta?.locked || !layerMeta?.visible) return;

    if (!activeStrokeLayerPixelsRef.current || !initialLayerPixelsRef.current) {
      const framePixels = project.pixels[currentFrameId];
      const effective = LayerResolutionService.getEffectiveLayerPixels(project, currentFrameId, currentLayerId);
      const src = (effective && effective.pixels && effective.pixels.length > 0)
        ? effective.pixels
        : (framePixels?.[currentLayerId] || Array(project.width * project.height).fill(''));
      initialLayerPixelsRef.current = src;
      activeStrokeLayerPixelsRef.current = [...src];
      activeModifiedIndicesRef.current.clear();
    }

    strokePointsRef.current = [coord];
    lastPixelPerfectPointsRef.current = [coord];
    paintStrokePoints([coord]);
  };

  // --- MOUSE & TOUCH EVENT HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Robust Event Isolation: Abort canvas stroke if event originated from UI controls or buttons
    const targetElement = e.target as HTMLElement | null;
    if (targetElement && (targetElement.tagName === 'BUTTON' || targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.closest('button, input, select, [data-interactive="true"]'))) {
      return;
    }

    strokeStartTimeRef.current = performance.now();
    // Middle click always activates panning
    // Left-click with Pan tool activates panning ONLY if no active/move selection is present
    const hasActiveSelection = selection.active || moveActive || transformState.isActive;
    if (e.button === 1 || (currentTool === 'pan' && !hasActiveSelection) || isPanning) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    if (transformState.isActive) {
      if (hoveredHandle) {
        activeHandleRef.current = hoveredHandle;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartTransformRef.current = { ...transformState };

        if (hoveredHandle === 'rot') {
          const rect = canvasRef.current!.getBoundingClientRect();
          const mouseX = e.clientX - rect.left - panX;
          const mouseY = e.clientY - rect.top - panY;
          const pivotScreenX = transformState.pivot.x * zoom;
          const pivotScreenY = transformState.pivot.y * zoom;
          dragStartAngleRef.current = Math.atan2(mouseY - pivotScreenY, mouseX - pivotScreenX);
        }
        return;
      } else {
        acceptTransformSelection();
        return;
      }
    }

    // Special: Mover tool with an active selection can drag and displace the selection from anywhere
    const isMovingSelectionMode = hasActiveSelection && currentTool === 'pan';
    if (isMovingSelectionMode) {
      let currentOffsetX = duplicateOffsetX;
      let currentOffsetY = duplicateOffsetY;
      if (!duplicateActive) {
        startMoveSelection();
        currentOffsetX = 0;
        currentOffsetY = 0;
      }
      setIsDraggingDuplicate(true);
      setDragDuplicateStart({ x: e.clientX, y: e.clientY });
      setDragDuplicateStartOffset({ x: currentOffsetX, y: currentOffsetY });
      return;
    }

    currentFractionalCoordRef.current = getFractionalCanvasCoords(e.clientX, e.clientY);
    const coord = getSnappedPixelCoords(e.clientX, e.clientY, e);
    if (!coord) return;

    // Handle stamp mode click
    if (activeStamp) {
      handleApplyStampClick(coord);
      return;
    }

    // Handle duplicate dragging interaction
    if (duplicateActive) {
      setIsDraggingDuplicate(true);
      setDragDuplicateStart({ x: e.clientX, y: e.clientY });
      setDragDuplicateStartOffset({ x: duplicateOffsetX, y: duplicateOffsetY });
      return;
    }

    // Handle move dragging interaction when NOT using the Mover tool
    if (moveActive) {
      let clickedInside = false;
      const nx = coord.x - moveOffsetX;
      const ny = coord.y - moveOffsetY;
      if (nx >= 0 && nx < project.width && ny >= 0 && ny < project.height) {
        const idx = ny * project.width + nx;
        if (moveMask[idx]) {
          clickedInside = true;
        }
      }
      if (clickedInside) {
        setIsDraggingMove(true);
        setDragMoveStart({ x: e.clientX, y: e.clientY });
        setDragMoveStartOffset({ x: moveOffsetX, y: moveOffsetY });
        return;
      } else {
        acceptMove();
      }
    }

    // Alt + click to capture Clone Stamp source
    if (e.altKey && currentTool === 'clone_stamp') {
      onChangeCloneSource?.(coord);
      cloneStartOffsetRef.current = null;
      showToast?.(translate('canvas.cloneStampSourceSet', language).replace('{x}', String(coord.x)).replace('{y}', String(coord.y)), 'success');
      return;
    }

    if (currentTool === 'picker') {
      // search topmost visible color across effective layers
      let pickedColor = '';
      for (const layer of project.layers) {
        if (layer.visible) {
          const effective = LayerResolutionService.getEffectiveLayerPixels(project, currentFrameId, layer.id);
          const color = effective?.pixels?.[coord.y * project.width + coord.x];
          if (color && color !== '' && color !== 'transparent') {
            pickedColor = color;
            break;
          }
        }
      }
      if (pickedColor) {
        onPickColor(pickedColor);
        if (onRecordColorUsage) {
          onRecordColorUsage(pickedColor);
        }
      }
      return;
    }

    if (currentTool === 'rect_select' || currentTool === 'ellipse_select') {
      startTransaction();
      setIsDrawing(true);
      setDrawStart(coord);
      currentCoordRef.current = coord;
      scheduleCoordDisplayUpdate(coord);

      const mode = getSelectionModeFromEvent(e);
      dragSelectionModeRef.current = mode;
      dragSelectionInitialMaskRef.current = selectionEngineRef.current ? selectionEngineRef.current.mask.clone() : null;

      applyGeometricSelectionPreview(coord, coord, currentTool, mode);
      return;
    }

    if (currentTool === 'lasso_select') {
      startTransaction();
      setIsDrawing(true);
      setLassoPath([coord]);
      return;
    }

    if (currentTool === 'wand') {
      const framePixels = project.pixels[currentFrameId];
      const activePixels = framePixels?.[currentLayerId];
      if (activePixels) {
        const selected = getMagicWandSelection(activePixels, coord.x, coord.y, project.width, project.height, tolerance, bucketContiguous);
        setSelection({ active: true, pixels: selected });
      }
      return;
    }

    if (currentTool === 'bucket') {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.cannotUseBucketLockedOrHidden', language), 'error');
        return;
      }
      const framePixels = project.pixels[currentFrameId];
      const activePixels = framePixels?.[currentLayerId];
      if (activePixels) {
        let comparisonPixels = activePixels;
        if (bucketRefer === 'all') {
          comparisonPixels = Array(project.width * project.height).fill("");
          for (let i = 0; i < project.width * project.height; i++) {
            for (const layer of project.layers) {
              if (layer.visible) {
                const color = framePixels?.[layer.id]?.[i];
                if (color) {
                  comparisonPixels[i] = color;
                  break;
                }
              }
            }
          }
        }

        startTransaction();
        onStartHistoryAction?.();
        const fillPoints = getBucketFillPoints(
          comparisonPixels,
          coord.x,
          coord.y,
          project.width,
          project.height,
          currentColor,
          {
            contiguous: bucketContiguous,
            tiling: tiling.active,
            symmetry,
            mask: selection.active ? selection.pixels : undefined,
            tolerance
          }
        );
        const updated = { ...project.pixels };
        const layerClone = [...activePixels];
        if (activeStamp && patternContext.enabled) {
          fillPoints.forEach(p => {
            const color = PatternRenderer.getPixel(
              p.x,
              p.y,
              patternContext,
              activeStamp,
              coord.x,
              coord.y
            );
            if (color && color !== 'transparent') {
              layerClone[p.y * project.width + p.x] = color;
            }
          });
        } else {
          fillPoints.forEach(p => {
            layerClone[p.y * project.width + p.x] = currentColor;
          });
        }
        updated[currentFrameId] = {
          ...updated[currentFrameId],
          [currentLayerId]: layerClone
        };
        onUpdatePixels(updated);
        if (fillPoints.length > 0 && onRecordColorUsage) {
          onRecordColorUsage(currentColor);
        }
        endTransaction();
      }
      return;
    }

    // Curve Tool: Step 2 Bending click
    if (currentTool === 'curve') {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.cannotDrawLockedOrHidden', language), 'error');
        return;
      }
      if (!curveState) {
        // Step 1: Start dragging curve line
        setCurveState({ step: 'bend', start: coord, end: coord });
        startTransaction();
        setIsDrawing(true);
        setDrawStart(coord);
        currentCoordRef.current = coord;
        scheduleCoordDisplayUpdate(coord);
      } else {
        // Click during bend mode commits the curve!
        startTransaction();
        onStartHistoryAction?.();
        const drawPoints = getCurvePoints(curveState.start, curveState.end, coord);
        const framePixels = project.pixels[currentFrameId];
        const layerPixels = framePixels?.[currentLayerId];
        if (layerPixels) {
          const updated = { ...project.pixels };
          const layerClone = [...layerPixels];
          
          // 1. Symmetric points calculations
          let finalPoints = drawPoints.flatMap(p => 
            getSymmetricPoints(p.x, p.y, project.width, project.height, symmetry)
          );

          // 2. Tiling wrapping or filtering
          if (tiling.active) {
            finalPoints = finalPoints.map(p => ({
              x: ((p.x % project.width) + project.width) % project.width,
              y: ((p.y % project.height) + project.height) % project.height
            }));
          } else {
            finalPoints = finalPoints.filter(p => 
              p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height
            );
          }

          // 3. Selection masking
          if (selection.active) {
            finalPoints = finalPoints.filter(p => selection.pixels[p.y * project.width + p.x]);
          }

          finalPoints.forEach(p => {
            layerClone[p.y * project.width + p.x] = currentColor;
          });

          updated[currentFrameId] = {
            ...updated[currentFrameId],
            [currentLayerId]: layerClone
          };
          onUpdatePixels(updated, false);
          if (finalPoints.length > 0 && onRecordColorUsage) {
            onRecordColorUsage(currentColor);
          }
        }
        setCurveState(null);
        setIsDrawing(false);
        setDrawStart(null);
        currentCoordRef.current = null;
        scheduleCoordDisplayUpdate(null);
        endTransaction();
      }
      return;
    }

    if (['pen', 'eraser', 'line', 'rectangle', 'ellipse', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.layerLockedOrHidden', language), 'error');
        return;
      }
      onStartHistoryAction?.();
    }

    startTransaction();
    setIsDrawing(true);
    setDrawStart(coord);
    currentCoordRef.current = coord;
    scheduleCoordDisplayUpdate(coord);

    if (['pen', 'eraser', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      if (currentTool === 'clone_stamp' && cloneSource) {
        cloneStartOffsetRef.current = {
          dx: cloneSource.x - coord.x,
          dy: cloneSource.y - coord.y
        };
      }
      lastPaintCoord.current = coord;
      strokePointsRef.current = [];
      lastPixelPerfectPointsRef.current = [];
      initialLayerPixelsRef.current = null;
      activeStrokeLayerPixelsRef.current = null;
      activeModifiedIndicesRef.current.clear();
      handlePaintPixel(coord);
    }
  };

  // Real-time floating ruler indicator tracker (60/120fps hardware accelerated)
  const updateRulerIndicators = (clientX: number, clientY: number) => {
    const drawArea = document.getElementById('canvas-draw-area');
    if (!drawArea) return;
    const rect = drawArea.getBoundingClientRect();
    const rulerX = clientX - rect.left - 24;
    const rulerY = clientY - rect.top - 24;

    const indH = document.getElementById('ruler-indicator-h');
    if (indH) {
      if (rulerX >= 0 && rulerX <= rect.width - 24) {
        indH.style.transform = `translateX(${rulerX}px)`;
        indH.style.opacity = '1';
      } else {
        indH.style.opacity = '0';
      }
    }

    const indV = document.getElementById('ruler-indicator-v');
    if (indV) {
      if (rulerY >= 0 && rulerY <= rect.height - 24) {
        indV.style.transform = `translateY(${rulerY}px)`;
        indV.style.opacity = '1';
      } else {
        indV.style.opacity = '0';
      }
    }
  };

  const hideRulerIndicators = () => {
    const indH = document.getElementById('ruler-indicator-h');
    if (indH) indH.style.opacity = '0';
    const indV = document.getElementById('ruler-indicator-v');
    if (indV) indV.style.opacity = '0';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateRulerIndicators(e.clientX, e.clientY);
    if (transformState.isActive) {
      if (activeHandleRef.current && dragStartMouseRef.current && dragStartTransformRef.current) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - panX;
        const mouseY = e.clientY - rect.top - panY;
        const rawProj = { x: mouseX / zoom, y: mouseY / zoom };
        const snappedProj = getSnappedCoords(rawProj, e);
        const projX = snappedProj ? snappedProj.x : rawProj.x;
        const projY = snappedProj ? snappedProj.y : rawProj.y;

        const startTransform = dragStartTransformRef.current;
        const deltaX = e.clientX - dragStartMouseRef.current.x;
        const deltaY = e.clientY - dragStartMouseRef.current.y;
        const projDeltaX = deltaX / zoom;
        const projDeltaY = deltaY / zoom;

        const h = activeHandleRef.current;

        if (h === 'pivot') {
          const targetX = startTransform.pivot.x + projDeltaX;
          const targetY = startTransform.pivot.y + projDeltaY;
          const snapped = getSnappedCoords({ x: targetX, y: targetY }, e);
          const finalX = snapped ? snapped.x : targetX;
          const finalY = snapped ? snapped.y : targetY;
          setTransformState(prev => ({
            ...prev,
            pivot: {
              x: Math.round(finalX),
              y: Math.round(finalY)
            }
          }));
        } else if (h === 'bounds') {
          const deltaIntX = Math.round(projDeltaX);
          const deltaIntY = Math.round(projDeltaY);
          const targetX = startTransform.originalBounds.x + startTransform.translation.x + deltaIntX;
          const targetY = startTransform.originalBounds.y + startTransform.translation.y + deltaIntY;
          const snapped = getSnappedCoords({ x: targetX, y: targetY }, e);
          const finalX = snapped ? snapped.x : targetX;
          const finalY = snapped ? snapped.y : targetY;
          setTransformState(prev => ({
            ...prev,
            translation: {
              x: Math.round(finalX - startTransform.originalBounds.x),
              y: Math.round(finalY - startTransform.originalBounds.y)
            }
          }));
        } else if (h === 'rot') {
          const pivotScreenX = startTransform.pivot.x * zoom;
          const pivotScreenY = startTransform.pivot.y * zoom;
          const currentAngle = Math.atan2(mouseY - pivotScreenY, mouseX - pivotScreenX);
          let nextRotation = startTransform.rotation + (currentAngle - dragStartAngleRef.current);
          if (e.shiftKey) {
            const snap = Math.PI / 12; // 15 degrees
            nextRotation = Math.round(nextRotation / snap) * snap;
          }
          setTransformState(prev => ({ ...prev, rotation: nextRotation }));
        } else {
          // Scale Handles (tl, tr, bl, br, tc, bc, lc, rc)
          // Unrotate mouse coordinates back to the local unrotated frame using backwardTransform
          const unrotPt = backwardTransform(projX, projY, startTransform.pivot, { x: 1, y: 1 }, { x: 0, y: 0 }, startTransform.rotation);
          const unrotX = unrotPt.x - startTransform.pivot.x;
          const unrotY = unrotPt.y - startTransform.pivot.y;

          // Get original handle offset from pivot
          let ox = 0;
          let oy = 0;
          const { x: ox0, y: oy0, width, height } = startTransform.originalBounds;

          if (h === 'tl') {
            ox = ox0 - startTransform.pivot.x;
            oy = oy0 - startTransform.pivot.y;
          } else if (h === 'tr') {
            ox = (ox0 + width) - startTransform.pivot.x;
            oy = oy0 - startTransform.pivot.y;
          } else if (h === 'bl') {
            ox = ox0 - startTransform.pivot.x;
            oy = (oy0 + height) - startTransform.pivot.y;
          } else if (h === 'br') {
            ox = (ox0 + width) - startTransform.pivot.x;
            oy = (oy0 + height) - startTransform.pivot.y;
          } else if (h === 'tc') {
            ox = (ox0 + width / 2) - startTransform.pivot.x;
            oy = oy0 - startTransform.pivot.y;
          } else if (h === 'bc') {
            ox = (ox0 + width / 2) - startTransform.pivot.x;
            oy = (oy0 + height) - startTransform.pivot.y;
          } else if (h === 'lc') {
            ox = ox0 - startTransform.pivot.x;
            oy = (oy0 + height / 2) - startTransform.pivot.y;
          } else if (h === 'rc') {
            ox = (ox0 + width) - startTransform.pivot.x;
            oy = (oy0 + height / 2) - startTransform.pivot.y;
          }

          let sx = ox !== 0 ? unrotX / ox : startTransform.scale.x;
          let sy = oy !== 0 ? unrotY / oy : startTransform.scale.y;

          // Keep scale from collapsing to exactly 0 or glitching
          if (Math.abs(sx) < 0.05) sx = 0.05 * Math.sign(sx || 1);
          if (Math.abs(sy) < 0.05) sy = 0.05 * Math.sign(sy || 1);

          if (h === 'lc' || h === 'rc') {
            sy = startTransform.scale.y;
          } else if (h === 'tc' || h === 'bc') {
            sx = startTransform.scale.x;
          } else if (e.shiftKey && ['tl', 'tr', 'bl', 'br'].includes(h)) {
            // Proportional scaling for corners
            const avgScale = (Math.abs(sx) + Math.abs(sy)) / 2;
            sx = avgScale * Math.sign(sx);
            sy = avgScale * Math.sign(sy);
          }

          setTransformState(prev => ({
            ...prev,
            scale: { x: sx, y: sy }
          }));
        }
        return;
      } else {
        // Just hover detection
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX - rect.left - panX;
          const mouseY = e.clientY - rect.top - panY;
          const projX = mouseX / zoom;
          const projY = mouseY / zoom;

          // Get handles to test screen distances
          const handles = getTransformHandles(
            transformState.originalBounds,
            transformState.pivot,
            transformState.translation,
            transformState.scale,
            transformState.rotation,
            zoom
          );

          // Find if near any handle (<= 8 screen pixels)
          const found = handles.find(h => {
            const dx = mouseX - h.x;
            const dy = mouseY - h.y;
            return Math.sqrt(dx * dx + dy * dy) <= 8;
          });

          if (found) {
            setHoveredHandle(found.name);
          } else {
            // Check if inside bounding box polygon
            const tl = handles.find(h => h.name === 'tl')!;
            const tr = handles.find(h => h.name === 'tr')!;
            const br = handles.find(h => h.name === 'br')!;
            const bl = handles.find(h => h.name === 'bl')!;
            const polyPoints = [tl, tr, br, bl].map(h => ({ x: h.projectX, y: h.projectY }));

            if (isPointInPolygon(projX, projY, polyPoints)) {
              setHoveredHandle('bounds');
            } else {
              setHoveredHandle(null);
            }
          }
        }
      }
    }

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    // Handle selection duplicate dragging (uses screen coords, runs even if mouse goes outside canvas)
    if (duplicateActive && isDraggingDuplicate && dragDuplicateStart && dragDuplicateStartOffset) {
      const deltaX = e.clientX - dragDuplicateStart.x;
      const deltaY = e.clientY - dragDuplicateStart.y;
      const dx = Math.round(deltaX / zoom);
      const dy = Math.round(deltaY / zoom);
      setDuplicateOffsetX(dragDuplicateStartOffset.x + dx);
      setDuplicateOffsetY(dragDuplicateStartOffset.y + dy);
      return;
    }

    // Handle selection moving dragging (uses screen coords, runs even if mouse goes outside canvas)
    if ((moveActive || (selection.active && currentTool === 'pan')) && isDraggingMove && dragMoveStart && dragMoveStartOffset) {
      const deltaX = e.clientX - dragMoveStart.x;
      const deltaY = e.clientY - dragMoveStart.y;
      const manager = getMoveManagerInstance();
      const nextOffsets = manager.drag(deltaX, deltaY, zoom, dragMoveStartOffset);
      setMoveOffsetX(nextOffsets.offsetX);
      setMoveOffsetY(nextOffsets.offsetY);
      return;
    }

    currentFractionalCoordRef.current = getFractionalCanvasCoords(e.clientX, e.clientY);
    const coord = getSnappedPixelCoords(e.clientX, e.clientY, e);
    if (!coord) {
      currentCoordRef.current = null;
      currentFractionalCoordRef.current = null;
      scheduleCoordDisplayUpdate(null);
      drawCanvas();
      return;
    }

    currentCoordRef.current = coord;
    scheduleCoordDisplayUpdate(coord);

    // Handle curve tool dragging start to end
    if (isDrawing && currentTool === 'curve' && curveState) {
      setCurveState(prev => prev ? { ...prev, end: coord } : null);
      return;
    }

    if (isDrawing && ['pen', 'eraser', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      if (lastPaintCoord.current) {
        handlePaintContinuous(lastPaintCoord.current, coord);
      } else {
        handlePaintPixel(coord);
      }
      lastPaintCoord.current = coord;
    } else if (isDrawing && currentTool === 'lasso_select') {
      setLassoPath(prev => {
        const last = prev[prev.length - 1];
        if (last && (last.x !== coord.x || last.y !== coord.y)) {
          return [...prev, coord];
        }
        return prev;
      });
    } else if (isDrawing && (currentTool === 'rect_select' || currentTool === 'ellipse_select') && drawStart) {
      const mode = dragSelectionModeRef.current;
      applyGeometricSelectionPreview(drawStart, coord, currentTool, mode);
    } else if (isDrawing && ['line', 'rectangle', 'ellipse'].includes(currentTool)) {
      drawCanvas();
    } else if (!isDrawing) {
      drawCanvas();
    }
  };

  const handleMouseUp = () => {
    if (activeHandleRef.current) {
      activeHandleRef.current = null;
      dragStartMouseRef.current = null;
      dragStartTransformRef.current = null;
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingDuplicate) {
      setIsDraggingDuplicate(false);
      setDragDuplicateStart(null);
      setDragDuplicateStartOffset(null);
      return;
    }

    if (isDraggingMove) {
      setIsDraggingMove(false);
      setDragMoveStart(null);
      setDragMoveStartOffset(null);
      return;
    }

    if (isDrawing && (currentTool === 'rect_select' || currentTool === 'ellipse_select')) {
      dragSelectionInitialMaskRef.current = null;
      syncSelectionFromEngine();
      setIsDrawing(false);
      setDrawStart(null);
      endTransaction();
      return;
    }

    if (isDrawing && currentTool === 'curve' && curveState) {
      setIsDrawing(false);
      endTransaction();
      return;
    }

    const currentCoord = currentCoordRef.current;
    if (isDrawing && drawStart && currentCoord) {
      // Shape tools draw permanently on release
      if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'ellipse') {
        let drawPoints: { x: number; y: number }[] = [];
        if (currentTool === 'line') drawPoints = getLinePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y);
        else if (currentTool === 'rectangle') drawPoints = getRectanglePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y, fillShape);
        else if (currentTool === 'ellipse') drawPoints = getEllipsePoints(drawStart.x, drawStart.y, currentCoord.x, currentCoord.y, fillShape);

        const framePixels = project.pixels[currentFrameId];
        const layerPixels = framePixels?.[currentLayerId];
        if (layerPixels) {
          const updated = { ...project.pixels };
          const layerClone = [...layerPixels];

          // 1. Symmetric points calculations
          let finalPoints = drawPoints.flatMap(p => 
            getSymmetricPoints(p.x, p.y, project.width, project.height, symmetry)
          );

          // 2. Tiling wrapping or filtering
          if (tiling.active) {
            finalPoints = finalPoints.map(p => ({
              x: ((p.x % project.width) + project.width) % project.width,
              y: ((p.y % project.height) + project.height) % project.height
            }));
          } else {
            finalPoints = finalPoints.filter(p => 
              p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height
            );
          }

          // 3. Selection masking
          if (selection.active) {
            finalPoints = finalPoints.filter(p => selection.pixels[p.y * project.width + p.x]);
          }

          finalPoints.forEach(p => {
            layerClone[p.y * project.width + p.x] = currentColor;
          });

          updated[currentFrameId] = {
            ...updated[currentFrameId],
            [currentLayerId]: layerClone
          };
          onUpdatePixels(updated);
          if (finalPoints.length > 0 && onRecordColorUsage) {
            onRecordColorUsage(currentColor);
          }
        }
      }
    }

    if (isDrawing && currentTool === 'lasso_select' && lassoPath.length > 0) {
      if (lassoPath.length >= 3) {
        let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
        lassoPath.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        const pad = 1;
        const x1 = Math.max(0, minX - pad);
        const x2 = Math.min(project.width - 1, maxX + pad);
        const y1 = Math.max(0, minY - pad);
        const y2 = Math.min(project.height - 1, maxY + pad);

        const pixels = new Array(project.width * project.height).fill(false);
        for (let y = y1; y <= y2; y++) {
          for (let x = x1; x <= x2; x++) {
            if (isPointInPolygon(x, y, lassoPath)) {
              pixels[y * project.width + x] = true;
            }
          }
        }
        
        lassoPath.forEach(p => {
          if (p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height) {
            pixels[p.y * project.width + p.x] = true;
          }
        });

        setSelection({ active: true, pixels });
      } else {
        const pixels = new Array(project.width * project.height).fill(false);
        lassoPath.forEach(p => {
          if (p.x >= 0 && p.x < project.width && p.y >= 0 && p.y < project.height) {
            pixels[p.y * project.width + p.x] = true;
          }
        });
        setSelection({ active: true, pixels });
      }
      setLassoPath([]);
    }

    if (isDrawing && ['pen', 'eraser', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      if (activeStrokeLayerPixelsRef.current && activeModifiedIndicesRef.current.size > 0) {
        const committedPixels = [...activeStrokeLayerPixelsRef.current];
        const updatedPixels = { ...project.pixels };
        updatedPixels[currentFrameId] = {
          ...updatedPixels[currentFrameId],
          [currentLayerId]: committedPixels
        };
        onUpdatePixels(updatedPixels);
      }
      if (strokeColorToRecordRef.current && onRecordColorUsage) {
        onRecordColorUsage(strokeColorToRecordRef.current);
        strokeColorToRecordRef.current = null;
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    cloneStartOffsetRef.current = null;
    lastPaintCoord.current = null;
    strokePointsRef.current = [];
    lastPixelPerfectPointsRef.current = [];
    initialLayerPixelsRef.current = null;
    activeStrokeLayerPixelsRef.current = null;
    activeModifiedIndicesRef.current.clear();
    strokeColorToRecordRef.current = null;

    // Sync coordinate display state once stroke completes
    if (pendingCoordDisplayRef.current) {
      setCoordDisplay(pendingCoordDisplayRef.current);
    }

    if (strokeStartTimeRef.current !== null) {
      telemetry.recordBrushStroke(performance.now() - strokeStartTimeRef.current);
      strokeStartTimeRef.current = null;
    }
    endTransaction();
  };

  // --- MOBILE TOUCH SUPPORT HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Multi-touch gestures (Pinch-to-zoom & Two-finger Pan)
    if (e.touches.length >= 2) {
      if (isDrawing) {
        setIsDrawing(false);
        setDrawStart(null);
        endTransaction();
      }
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      const dist = Math.hypot(dx, dy);
      pinchRef.current = {
        active: true,
        initialDist: Math.max(1, dist),
        initialZoom: zoom,
        initialPanX: panX,
        initialPanY: panY,
        centerClientX: (t0.clientX + t1.clientX) / 2,
        centerClientY: (t0.clientY + t1.clientY) / 2
      };
      return;
    }

    // Robust Event Isolation: Abort canvas stroke if touch originated from UI controls or buttons
    const targetElement = e.target as HTMLElement | null;
    if (targetElement && (targetElement.tagName === 'BUTTON' || targetElement.tagName === 'INPUT' || targetElement.tagName === 'SELECT' || targetElement.closest('button, input, select, [data-interactive="true"]'))) {
      return;
    }

    strokeStartTimeRef.current = performance.now();
    const touch = e.touches[0];
    const hasActiveSelection = selection.active || moveActive;
    if (currentTool === 'pan' && !hasActiveSelection) {
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panX, y: touch.clientY - panY });
      return;
    }

    // Special: Mover tool with an active selection can drag and displace the selection from anywhere
    const isMovingSelectionMode = hasActiveSelection && currentTool === 'pan';
    if (isMovingSelectionMode) {
      let currentOffsetX = duplicateOffsetX;
      let currentOffsetY = duplicateOffsetY;
      if (!duplicateActive) {
        startMoveSelection();
        currentOffsetX = 0;
        currentOffsetY = 0;
      }
      setIsDraggingDuplicate(true);
      setDragDuplicateStart({ x: touch.clientX, y: touch.clientY });
      setDragDuplicateStartOffset({ x: currentOffsetX, y: currentOffsetY });
      return;
    }

    currentFractionalCoordRef.current = getFractionalCanvasCoords(touch.clientX, touch.clientY);
    const coord = getSnappedPixelCoords(touch.clientX, touch.clientY, e);
    if (!coord) return;

    if (duplicateActive) {
      setIsDraggingDuplicate(true);
      setDragDuplicateStart({ x: touch.clientX, y: touch.clientY });
      setDragDuplicateStartOffset({ x: duplicateOffsetX, y: duplicateOffsetY });
      return;
    }

    // Handle move dragging interaction when NOT using the Mover tool
    if (moveActive) {
      let clickedInside = false;
      const nx = coord.x - moveOffsetX;
      const ny = coord.y - moveOffsetY;
      if (nx >= 0 && nx < project.width && ny >= 0 && ny < project.height) {
        const idx = ny * project.width + nx;
        if (moveMask[idx]) {
          clickedInside = true;
        }
      }
      if (clickedInside) {
        setIsDraggingMove(true);
        setDragMoveStart({ x: touch.clientX, y: touch.clientY });
        setDragMoveStartOffset({ x: moveOffsetX, y: moveOffsetY });
        return;
      } else {
        acceptMove();
      }
    }

    if (['pen', 'eraser', 'line', 'rectangle', 'ellipse', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      const layerMeta = project.layers.find(l => l.id === currentLayerId);
      if (layerMeta?.locked || !layerMeta?.visible) {
        showToast?.(translate('canvas.layerLockedOrHidden', language), 'error');
        return;
      }
      onStartHistoryAction?.();
    }

    startTransaction();
    setIsDrawing(true);
    setDrawStart(coord);
    currentCoordRef.current = coord;
    scheduleCoordDisplayUpdate(coord);

    if (['pen', 'eraser', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      if (currentTool === 'clone_stamp' && cloneSource) {
        cloneStartOffsetRef.current = {
          dx: cloneSource.x - coord.x,
          dy: cloneSource.y - coord.y
        };
      }
      lastPaintCoord.current = coord;
      strokePointsRef.current = [];
      lastPixelPerfectPointsRef.current = [];
      initialLayerPixelsRef.current = null;
      activeStrokeLayerPixelsRef.current = null;
      activeModifiedIndicesRef.current.clear();
      handlePaintPixel(coord);
    } else if (currentTool === 'lasso_select') {
      setLassoPath([coord]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      updateRulerIndicators(e.touches[0].clientX, e.touches[0].clientY);
    }
    // Multi-touch gestures (Pinch-to-zoom & Two-finger Pan)
    if (e.touches.length >= 2 && pinchRef.current?.active) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      const dist = Math.hypot(dx, dy);
      const currentCenterX = (t0.clientX + t1.clientX) / 2;
      const currentCenterY = (t0.clientY + t1.clientY) / 2;

      const scale = dist / pinchRef.current.initialDist;
      const nextZoom = Math.max(1, Math.min(100, Math.round(pinchRef.current.initialZoom * scale * 10) / 10));
      const panDeltaX = currentCenterX - pinchRef.current.centerClientX;
      const panDeltaY = currentCenterY - pinchRef.current.centerClientY;

      setZoom(nextZoom);
      setPanX(Math.round(pinchRef.current.initialPanX + panDeltaX));
      setPanY(Math.round(pinchRef.current.initialPanY + panDeltaY));
      return;
    }

    const touch = e.touches[0];
    if (isPanning) {
      setPanX(touch.clientX - panStart.x);
      setPanY(touch.clientY - panStart.y);
      return;
    }

    // Handle selection duplicate dragging
    if (duplicateActive && isDraggingDuplicate && dragDuplicateStart && dragDuplicateStartOffset) {
      const deltaX = touch.clientX - dragDuplicateStart.x;
      const deltaY = touch.clientY - dragDuplicateStart.y;
      const dx = Math.round(deltaX / zoom);
      const dy = Math.round(deltaY / zoom);
      setDuplicateOffsetX(dragDuplicateStartOffset.x + dx);
      setDuplicateOffsetY(dragDuplicateStartOffset.y + dy);
      return;
    }

    // Handle selection moving dragging
    if ((moveActive || (selection.active && currentTool === 'pan')) && isDraggingMove && dragMoveStart && dragMoveStartOffset) {
      const deltaX = touch.clientX - dragMoveStart.x;
      const deltaY = touch.clientY - dragMoveStart.y;
      const manager = getMoveManagerInstance();
      const nextOffsets = manager.drag(deltaX, deltaY, zoom, dragMoveStartOffset);
      setMoveOffsetX(nextOffsets.offsetX);
      setMoveOffsetY(nextOffsets.offsetY);
      return;
    }

    currentFractionalCoordRef.current = getFractionalCanvasCoords(touch.clientX, touch.clientY);
    const coord = getSnappedPixelCoords(touch.clientX, touch.clientY, e);
    if (!coord) return;

    currentCoordRef.current = coord;
    scheduleCoordDisplayUpdate(coord);
    if (isDrawing && ['pen', 'eraser', 'spray', 'dithering', 'clone_stamp'].includes(currentTool)) {
      if (lastPaintCoord.current) {
        handlePaintContinuous(lastPaintCoord.current, coord);
      } else {
        handlePaintPixel(coord);
      }
      lastPaintCoord.current = coord;
    } else if (isDrawing && currentTool === 'lasso_select') {
      setLassoPath(prev => {
        const last = prev[prev.length - 1];
        if (last && (last.x !== coord.x || last.y !== coord.y)) {
          return [...prev, coord];
        }
        return prev;
      });
    } else if (isDrawing && currentTool === 'rect_select' && drawStart) {
      const x1 = Math.min(drawStart.x, coord.x);
      const x2 = Math.max(drawStart.x, coord.x);
      const y1 = Math.min(drawStart.y, coord.y);
      const y2 = Math.max(drawStart.y, coord.y);

      const pixels = new Array(project.width * project.height).fill(false);
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (x >= 0 && x < project.width && y >= 0 && y < project.height) {
            pixels[y * project.width + x] = true;
          }
        }
      }
      setSelection({ active: true, pixels });
    } else if (isDrawing && ['line', 'rectangle', 'ellipse'].includes(currentTool)) {
      drawCanvas();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
    handleMouseUp();
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 min-h-0 w-full h-full bg-[#0F3D34] border border-[#0F3D34] rounded-xl overflow-hidden relative select-none touch-none ${getCursorClass()}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => {
        handleMouseUp();
        hideRulerIndicators();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        handleTouchEnd(e);
        hideRulerIndicators();
      }}
      onTouchCancel={(e) => {
        handleTouchEnd(e);
        hideRulerIndicators();
      }}
      id="canvas-draw-area"
    >
      
      {/* Rulers */}
      {rulersVisible && (
        <>
          {/* Corner piece */}
          <div 
            className="absolute top-0 left-0 w-6 h-6 ruler-corner bg-[#0C1813] border-r border-b border-[#1A382A] z-30 flex items-center justify-center cursor-default select-none group/corner shadow-xs"
            style={{ width: '24px', height: '24px' }}
            title={`${project.width} × ${project.height} px`}
          >
            <span className="text-[8.5px] font-mono font-bold text-[#C8A96A] group-hover/corner:text-[#E5C378] transition-colors leading-none tracking-tighter">px</span>
          </div>

          {/* Horizontal Ruler */}
          <div 
            className="absolute top-0 left-6 right-0 h-6 z-30 overflow-hidden ruler-bar-horizontal border-b border-[#1A382A] bg-[#0C1813]"
            style={{ top: 0, left: '24px', height: '24px' }}
          >
            <RulerHorizontal
              zoom={zoom}
              panX={panX - 24}
              width={project.width}
              cursorX={coordDisplay ? coordDisplay.x : null}
              onStartDragNewGuide={(e) => handleStartDragNewGuide('horizontal', e)}
              theme={theme}
              themeColor={themeColor}
              language={language}
            />
          </div>

          {/* Vertical Ruler */}
          <div 
            className="absolute top-6 left-0 bottom-0 w-6 z-30 overflow-hidden ruler-bar-vertical border-r border-[#1A382A] bg-[#0C1813]"
            style={{ top: '24px', left: 0, width: '24px' }}
          >
            <RulerVertical
              zoom={zoom}
              panY={panY - 24}
              height={project.height}
              cursorY={coordDisplay ? coordDisplay.y : null}
              onStartDragNewGuide={(e) => handleStartDragNewGuide('vertical', e)}
              theme={theme}
              themeColor={themeColor}
              language={language}
            />
          </div>
        </>
      )}

      {/* Guide Interactive Overlay */}
      {(guidesVisible || snappingEnabled) && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <GuideOverlay
            guides={guides}
            guidesVisible={guidesVisible}
            guidesLocked={guidesLocked}
            zoom={zoom}
            panX={panX}
            panY={panY}
            canvasWidth={project.width}
            canvasHeight={project.height}
            activeDragId={activeDragGuideId}
            onStartDragGuide={handleStartDragGuide}
            onRemoveGuide={(id) => onRemoveGuide?.(id)}
            activeSnapLines={activeSnapLines}
            language={language}
          />
        </div>
      )}

      {/* Physical fixed viewport canvas filling the entire container */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full block pointer-events-none" 
        style={{
          filter: colorBlindness && colorBlindness !== 'none' ? `url(#${colorBlindness})` : undefined
        }}
      />

      {/* Core Selection Overlay Renderer (ADR-SELECTION-001) */}
      {selectionEngineRef.current && (
        <SelectionOverlayRenderer
          selectionEngine={selectionEngineRef.current}
          zoom={zoom}
          panX={panX}
          panY={panY}
          canvasWidth={project.width}
          canvasHeight={project.height}
        />
      )}

      {/* SVG Filters for Color Blindness Simulation */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="protanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix 
              type="matrix" 
              values="0.567 0.433 0     0 0
                      0.558 0.442 0     0 0
                      0     0.242 0.758 0 0
                      0     0     0     1 0" 
            />
          </filter>
          <filter id="deuteranopia" colorInterpolationFilters="sRGB">
            <feColorMatrix 
              type="matrix" 
              values="0.625 0.375 0     0 0
                      0.7   0.3   0     0 0
                      0     0.3   0.7   0 0
                      0     0     0     1 0" 
            />
          </filter>
          <filter id="tritanopia" colorInterpolationFilters="sRGB">
            <feColorMatrix 
              type="matrix" 
              values="0.95  0.05  0     0 0
                      0     0.433 0.567 0 0
                      0     0.475 0.525 0 0
                      0     0     0     1 0" 
            />
          </filter>
        </defs>
      </svg>
      {/* Floating Selection Controls Bar (above canvas) */}
      {(selection.active || moveActive || transformState.isActive) && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] bg-[#0A1A12]/95 border border-[#1E4D40]/80 rounded-xl px-2.5 py-1.5 flex flex-wrap items-center justify-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-20 backdrop-blur-md animate-in fade-in zoom-in duration-200 pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Badge / Identification */}
          <div 
            className="flex items-center gap-1.5 px-2 py-1 bg-[#102419] border border-[#0F3D34] rounded-lg shrink-0 select-none cursor-help"
            title={
              currentTool !== 'pan' && !transformState.isActive && !duplicateActive
                ? (translate('canvas.useMoveToolToDisplace', language) || 'Usa la herramienta Mover para desplazar').replace(/<[^>]*>/g, '')
                : undefined
            }
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[9px] font-black text-[#C8A96A] uppercase tracking-wider leading-none">
              {translate('canvas.selectionLabel', language) || 'SELECCIÓN'}
            </span>
            {transformState.isActive ? (
              <span className="text-[8px] text-amber-300/90 font-mono ml-0.5">({translate('canvas.statusTransforming', language) || 'Transformando'})</span>
            ) : duplicateActive ? (
              <span className="text-[8px] text-amber-300/90 font-mono ml-0.5">({isMoveMode ? (translate('canvas.statusMoving', language) || 'Moviendo') : (translate('canvas.statusDuplicating', language) || 'Duplicando')})</span>
            ) : null}
          </div>

          {transformState.isActive ? (
            <>
              {/* Transformation inputs & controls */}
              <div className="flex flex-wrap items-center gap-1.5 text-slate-300 text-[10px] select-none font-mono">
                {/* Posición Offset */}
                <div className="flex items-center gap-1 bg-[#102419] px-2 py-1 rounded-lg border border-[#0F3D34]">
                  <span className="text-[#C8A96A] font-bold text-[9px]">POS:</span>
                  <span>X:{Math.round(transformState.translation.x)} Y:{Math.round(transformState.translation.y)}</span>
                </div>

                {/* Rotación */}
                <div className="flex items-center gap-1 bg-[#102419] px-2 py-1 rounded-lg border border-[#0F3D34]">
                  <span className="text-[#C8A96A] font-bold text-[9px]">ROT:</span>
                  <span>{Math.round((transformState.rotation * 180) / Math.PI)}°</span>
                </div>

                {/* Escala */}
                <div className="flex items-center gap-1 bg-[#102419] px-2 py-1 rounded-lg border border-[#0F3D34]">
                  <span className="text-[#C8A96A] font-bold text-[9px]">ESC:</span>
                  <span>X:{transformState.scale.x.toFixed(2)} Y:{transformState.scale.y.toFixed(2)}</span>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setTransformState(prev => ({
                      ...prev,
                      translation: { x: 0, y: 0 },
                      scale: { x: 1, y: 1 },
                      rotation: 0,
                    }));
                  }}
                  className="px-2 py-1 bg-[#102419] hover:bg-[#1E4D40] border border-[#0F3D34] rounded-lg text-slate-300 hover:text-white transition-all text-[9px] cursor-pointer"
                  title={translate('canvas.resetTransform', language)}
                >
                  <RotateCcw className="w-3 h-3 text-[#C8A96A]" />
                </button>
              </div>

              <div className="h-4 w-px bg-[#0F3D34] shrink-0 hidden sm:block" />

              {/* Accept & Cancel buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={acceptTransformSelection}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white text-[9px] font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
                  title={translate('canvas.applyTransform', language)}
                >
                  <Check className="w-3 h-3" />
                  <span>{translate('canvas.apply', language)}</span>
                </button>

                <button
                  onClick={cancelTransformSelection}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-lg text-rose-300 hover:text-white transition-all flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                  title={translate('canvas.cancelTransform', language)}
                >
                  <X className="w-3 h-3 text-rose-400" />
                  <span>{translate('canvas.cancel', language)}</span>
                </button>
              </div>
            </>
          ) : duplicateActive ? (
            <>
              <span className="text-[10px] text-[#C8A96A] font-semibold px-1">
                {isMoveMode ? translate('canvas.dragToMoveSelection', language) : translate('canvas.dragToMoveDuplicate', language)}
              </span>

              <div className="h-4 w-px bg-[#0F3D34] shrink-0" />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={acceptDuplication}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white text-[9px] font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
                  title={isMoveMode ? translate('canvas.acceptMove', language) : translate('canvas.acceptDuplicate', language)}
                >
                  <Check className="w-3 h-3" />
                  <span>{translate('canvas.accept', language)}</span>
                </button>

                <button
                  onClick={cancelDuplication}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-lg text-rose-300 hover:text-white transition-all flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                  title={isMoveMode ? translate('canvas.cancelMove', language) : translate('canvas.cancelDuplicate', language)}
                >
                  <X className="w-3 h-3 text-rose-400" />
                  <span>{translate('canvas.cancel', language)}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Primary Actions: Duplicar & Transformar */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={duplicateSelection}
                  className="px-2 py-1 bg-[#0F3D34] hover:bg-[#C8A96A] hover:text-[#0F3D34] rounded-lg text-emerald-100 text-[9px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer border border-[#1E4D40]"
                  title={translate('canvas.duplicateSelection', language)}
                >
                  <Copy className="w-3 h-3" />
                  <span>{translate('canvas.duplicate', language)}</span>
                </button>

                <button
                  onClick={startTransformSelection}
                  className="px-2 py-1 bg-[#0F3D34] hover:bg-[#C8A96A] hover:text-[#0F3D34] rounded-lg text-emerald-100 text-[9px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer border border-[#1E4D40]"
                  title={translate('canvas.freeTransform', language)}
                >
                  <Move className="w-3 h-3" />
                  <span>{translate('canvas.transform', language)}</span>
                </button>
              </div>

              <div className="h-4 w-px bg-[#0F3D34] shrink-0" />

              {/* Orientation Group: Rotar, Reflejar H, Reflejar V (Iconographic) */}
              <div className="flex items-center gap-0.5 bg-[#0F3D34]/40 border border-[#0F3D34] rounded-lg p-0.5 shrink-0">
                <button
                  onClick={rotateSelection}
                  className="p-1 hover:bg-[#1E4D40] rounded text-[#C8A96A] hover:text-white transition cursor-pointer"
                  title={translate('canvas.rotate90', language) || 'Rotar 90°'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={flipSelectionHorizontal}
                  className="p-1 hover:bg-[#1E4D40] rounded text-[#C8A96A] hover:text-white transition cursor-pointer"
                  title={translate('canvas.flipHorizontal', language) || 'Reflejar Horizontal'}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={flipSelectionVertical}
                  className="p-1 hover:bg-[#1E4D40] rounded text-[#C8A96A] hover:text-white transition cursor-pointer"
                  title={translate('canvas.flipVertical', language) || 'Reflejar Vertical'}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-[#0F3D34] shrink-0" />

              {/* Closing Action: Deseleccionar */}
              <button
                onClick={handleDeselect}
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/80 border border-rose-800/60 rounded-lg text-rose-300 hover:text-white text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title={translate('canvas.bakeDeselect', language) || 'Deseleccionar y aplicar'}
              >
                <X className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">{translate('canvas.deselect', language) || 'Deseleccionar'}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Canvas controls */}
      <div className="absolute right-3 sm:right-4 bottom-20 md:bottom-4 flex flex-col gap-1.5 z-10" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        <button
          onClick={handleZoomIn}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-lg text-slate-300 hover:text-white transition shadow-lg touch-manipulation"
          title={translate('canvas.zoomIn', language)}
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={handleZoomOut}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-lg text-slate-300 hover:text-white transition shadow-lg touch-manipulation"
          title={translate('canvas.zoomOut', language)}
        >
          <ZoomOut className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={centerCanvas}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-lg text-slate-300 hover:text-white transition shadow-lg touch-manipulation"
          title={translate('canvas.centerCanvas', language)}
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
        
        {/* Selection cancel button */}
        {selection.active && (
          <button
            onClick={() => setSelection({ active: false, pixels: [] })}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-2 bg-rose-600 hover:bg-rose-500 border border-rose-500 rounded-lg text-white transition shadow-lg text-[10px] font-bold"
          >
            {translate('canvas.removeSelection', language)}
          </button>
        )}
      </div>

      {/* Floating STAMP & PATTERN controls removed: migrated to OptionBar */}

      {/* Floating info panel */}
      <div className="absolute left-2 sm:left-4 top-2 sm:top-4 bg-[#102419]/90 backdrop-blur-xs border border-[#102419] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] text-slate-400 flex flex-wrap gap-2 sm:gap-4 pointer-events-none max-w-[calc(100vw-32px)]">
        <span>{translate('canvas.projectLabel', language)} <b className="text-slate-200">{project.name}</b></span>
        <span>{translate('canvas.canvasLabel', language)} <b className="text-slate-200">{project.width}x{project.height}</b></span>
        <span>{translate('canvas.zoomLabel', language)} <b className="text-slate-200">{Math.round((zoom / 12) * 100)}%</b></span>
        {coordDisplay && (
          <span>{translate('canvas.coordLabel', language)} <b className="text-slate-200">{coordDisplay.x}, {coordDisplay.y}</b></span>
        )}
      </div>

    </div>
  );
})

export default CanvasArea;
