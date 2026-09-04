import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Layers, Palette, Film, Image, X, Cpu, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, PenTool, Heart } from 'lucide-react';
import { 
  PixelProject, Layer, Frame, ToolType, 
  SymmetrySettings, TilingSettings, OpenProjectTab, AnimationTag, FrameSelectionState,
  OnionSkinSettings, CanonicalPalette
} from './types';
import { SelectionService } from './utils/animation/SelectionService';
import { createEmptyPixels } from './utils/canvas';
import { ProjectLibraryService } from './utils/ProjectLibraryService';
import { LocalPersistence } from './utils/persistence/LocalPersistence';
import { saveProject, saveProjectAs, isFileSystemAccessSupported } from './utils/saveManager';
import { useToasts } from './hooks/useToasts';
import { useTheme, ThemeType } from './hooks/useTheme';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useAWE } from './hooks/useAWE';
import { telemetry } from './utils/telemetry';
import { safeLocalStorage } from './utils/storage';
import { createInitialProject, getProjectContentString } from './utils/projectUtils';
import { DEBUG_SAVE, saveDebug } from './utils/saveDebug';
import { ProjectSerializer } from './utils/serialization/ProjectSerializer';
import { ProjectDeserializer } from './utils/serialization/ProjectDeserializer';
import { WindowSystem } from './utils/architecture/WindowSystem';
import { PreferencesSystem } from './utils/architecture/PreferencesSystem';
import { MatrixTransform } from './utils/MatrixTransform';

const localStorage = safeLocalStorage;


// Import components
import WelcomeScreen from './components/WelcomeScreen';
import HeaderMenu from './components/HeaderMenu';
import { LegalModal } from './components/LegalModal';
import { InitialConsentModal } from './components/InitialConsentModal';
import { hasAcceptedCurrentLegalVersion, LegalSectionId } from './config/LegalConfig';
import Toolbar from './components/Toolbar';
import PreviewPanel from './components/PreviewPanel';
import ColorPanel from './components/ColorPanel';
import LayerManager from './components/LayerManager';
import Timeline from './components/Timeline';
import CanvasArea from './components/CanvasArea';
import LibraryModal from './components/LibraryModal';
import ExportModal from './components/ExportModal';
import PatternsModal from './components/PatternsModal';
import PreferencesModal from './components/PreferencesModal';
import { DonationModal } from './components/DonationModal';
import SaveAsModal from './components/SaveAsModal';
import HelpCenterModal from './components/HelpCenterModal';
import { InteractiveTour } from './components/InteractiveTour';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import QAPanel from './components/QAPanel';
import GenericPromptModal, { PromptField } from './components/GenericPromptModal';
import { OptionBar } from './components/OptionBar';
import CaptureStampModal from './components/CaptureStampModal';
import { CaptureService } from './utils/resources/CaptureService';
import { LibraryService } from './utils/resources/LibraryService';
import AssetLibraryModal from './components/AssetLibraryModal';
import WindowSystemDialogs from './components/WindowSystemDialogs';
import { OnePixelIcon, OnePixelLogo, OnePixelStartupAnimation } from './branding';
import { 
  AppErrorBoundary, 
  HeaderBoundary, 
  SidebarBoundary, 
  CanvasBoundary, 
  TimelineBoundary 
} from './core/resilience/ErrorBoundary';
import EmptyWorkspace from './components/EmptyWorkspace';
import { layerCacheManager } from './utils/animation/LayerCacheManager';
import { UserPreferences } from './types';
import { translate } from './i18n';

import { playbackController } from './utils/animation/PlaybackController';
import { 
  timelineCommandHistory, 
  InsertFrameCommand, 
  DeleteFrameCommand, 
  DuplicateFrameCommand, 
  MoveFrameCommand, 
  UpdateFrameDurationCommand, 
  AddTagCommand, 
  DeleteTagCommand,
  UpdateTagCommand
} from './utils/animation/CommandSystem';
import { animationEventBus } from './utils/animation/EventBus';
import { actionSystem } from './utils/architecture/ActionSystem';
import { GlobalEventSystem } from './utils/architecture/GlobalEventSystem';
import { ExportPipeline } from './utils/export/ExportPipeline';
import { CancelError } from './utils/export/ExportErrors';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const awe = useAWE(containerRef);

  // --- CORE SYSTEM STATES ---
  const [project, setProject] = useState<PixelProject | null>(null);
  const activeProjectRef = useRef<PixelProject | null>(project);
  useEffect(() => {
    activeProjectRef.current = project;
  }, [project]);

  const [frameSelection, setFrameSelection] = useState<FrameSelectionState>({
    activeFrameId: '',
    focusedFrameId: '',
    anchorFrameId: '',
    selectedFrameIds: [],
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // --- SYNCHRONOUS ANIMATION & FRAME MODEL SANITIZER ---
  // Guarantees that frameSelection, selectedFrameId, selectedLayerId, and selectedTagId
  // never hold orphan, stale, or out-of-bounds references when project state, tabs, active animation, or history change.

  // 1. Sanitize selectedTagId against active project animation tags
  const validTagId = (selectedTagId && project?.animationTags && Array.isArray(project.animationTags))
    ? (project.animationTags.some(t => t.id === selectedTagId) ? selectedTagId : null)
    : null;

  if (validTagId !== selectedTagId) {
    setSelectedTagId(validTagId);
  }

  // 2. Extract current project frame IDs
  const currentProjectFrameIds = Array.isArray(project?.frames)
    ? project.frames.map(f => f.id)
    : [];

  // 3. Extract frame IDs allowed by active animation tag (or all project frames if no active tag)
  const validAnimationTagFrameIds = (() => {
    if (currentProjectFrameIds.length === 0) return [];
    if (!validTagId || !project?.animationTags) return currentProjectFrameIds;

    const tag = project.animationTags.find(t => t.id === validTagId);
    if (!tag) return currentProjectFrameIds;

    const start = Math.max(0, Math.min(currentProjectFrameIds.length - 1, tag.startFrameIndex));
    const end = Math.max(start, Math.min(currentProjectFrameIds.length - 1, tag.endFrameIndex));
    const tagFrameIds = currentProjectFrameIds.slice(start, end + 1);
    return tagFrameIds.length > 0 ? tagFrameIds : currentProjectFrameIds;
  })();

  // 4. Sanitize frameSelection synchronously during render pass
  const sanitizedFrameSelection = SelectionService.sanitize(frameSelection, validAnimationTagFrameIds);

  if (
    sanitizedFrameSelection.activeFrameId !== frameSelection.activeFrameId ||
    sanitizedFrameSelection.focusedFrameId !== frameSelection.focusedFrameId ||
    sanitizedFrameSelection.anchorFrameId !== frameSelection.anchorFrameId ||
    sanitizedFrameSelection.selectedFrameIds.length !== frameSelection.selectedFrameIds.length ||
    sanitizedFrameSelection.selectedFrameIds.some((id, idx) => id !== frameSelection.selectedFrameIds[idx])
  ) {
    setFrameSelection(sanitizedFrameSelection);
  }

  const selectedFrameId = sanitizedFrameSelection.activeFrameId;
  const selectedFrameIdRef = useRef(selectedFrameId);
  useEffect(() => {
    selectedFrameIdRef.current = selectedFrameId;
  }, [selectedFrameId]);

  const setSelectedFrameId = useCallback((id: string) => {
    setFrameSelection(prev => {
      const allFrameIds = (activeProjectRef.current?.frames || []).map(f => f.id);
      return SelectionService.click(allFrameIds, id);
    });
  }, []);

  // 5. Sanitize selectedLayerId synchronously during render pass
  const validLayerId = (project?.layers && Array.isArray(project.layers) && project.layers.length > 0)
    ? (project.layers.some(l => l.id === selectedLayerId) ? selectedLayerId : (project.layers[0]?.id || ''))
    : '';

  if (validLayerId !== selectedLayerId) {
    setSelectedLayerId(validLayerId);
  }

  // Toast Notification State
  const { toasts, showToast, setToasts } = useToasts();

  // Ref to track the "clean" state content representation for each project
  const lastSavedContentRefs = useRef<Record<string, string>>({});
  const lastQuotaWarningRef = useRef<number>(0);
  
  // Undo/Redo stacks hook
  const {
    undoStack,
    redoStack,
    setUndoStack,
    setRedoStack,
    saveSnapshotToHistory,
    handleUndo,
    handleRedo
  } = useUndoRedo(project, setProject);

  // Drawing modifiers
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#C8A96A'); // Gold primary
  const [secondaryColor, setSecondaryColor] = useState<string>('#ffffff');
  const [activeColorSlot, setActiveColorSlot] = useState<'primary' | 'secondary'>('primary');

  const currentColorRef = useRef(currentColor);
  const secondaryColorRef = useRef(secondaryColor);
  const activeColorSlotRef = useRef(activeColorSlot);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  useEffect(() => {
    secondaryColorRef.current = secondaryColor;
  }, [secondaryColor]);

  useEffect(() => {
    activeColorSlotRef.current = activeColorSlot;
  }, [activeColorSlot]);

  const handleSwapColors = useCallback(() => {
    const primary = currentColorRef.current || '#000000';
    const secondary = secondaryColorRef.current || '#ffffff';
    setCurrentColor(secondary);
    setSecondaryColor(primary);
  }, []);

  const handleResetDefaultColors = useCallback(() => {
    setCurrentColor('#000000');
    setSecondaryColor('#ffffff');
  }, []);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [brushSize, setBrushSize] = useState<number>(() => {
    const saved = localStorage.getItem('onepixel_tool_brushSize');
    return saved !== null ? parseInt(saved, 10) : 1;
  });
  const [pixelPerfect, setPixelPerfect] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_tool_pixelPerfect');
    return saved !== null ? saved === 'true' : false;
  });
  const [customPalette, setCustomPalette] = useState<string[]>([]);
  const [libraryPalettes, setLibraryPalettes] = useState<CanonicalPalette[]>([]);

  const loadLibraryPalettes = useCallback(async () => {
    try {
      const allResources = await ProjectLibraryService.loadResources();
      const palettesOnly = allResources.filter(r => r.type === 'palette' && r.name !== '3' && r.name !== '3 (83)' && r.id !== '3');
      const canonicals: CanonicalPalette[] = palettesOnly.map(r => {
        if (r.data && Array.isArray(r.data.colors)) {
          return {
            id: r.id,
            name: r.name,
            colors: r.data.colors,
            version: r.data.version || 1,
            isCustom: r.data.isCustom !== undefined ? r.data.isCustom : true,
            description: r.data.description || r.name
          };
        }
        return {
          id: r.id,
          name: r.name,
          colors: [],
          version: 1,
          isCustom: true,
          description: r.name
        };
      });
      setLibraryPalettes(canonicals);
    } catch (err) {
      console.warn("Error loading library palettes:", err);
    }
  }, []);

  // Symmetry & Tiling
  const [symmetry, setSymmetry] = useState<SymmetrySettings>({
    x: false, y: false, radial: false, radialCount: 4, centerX: 16, centerY: 16
  });
  const [tiling, setTiling] = useState<TilingSettings>({
    active: false, repeatX: true, repeatY: true
  });

  // Animation player
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [onionSkinSettings, setOnionSkinSettings] = useState<OnionSkinSettings>(() => {
    const sys = PreferencesSystem.getInstance();
    const saved = localStorage.getItem('onepixel_onion_skin_settings');
    let fallback: Partial<OnionSkinSettings> = {};
    if (saved) {
      try { fallback = JSON.parse(saved); } catch (e) {}
    }
    return {
      enabled: Boolean(sys.get('onionSkin.enabled') ?? fallback.enabled ?? true),
      framesBefore: Number(sys.get('onionSkin.framesBefore') ?? sys.get('onionSkin.before') ?? fallback.framesBefore ?? 2),
      framesAfter: Number(sys.get('onionSkin.framesAfter') ?? sys.get('onionSkin.after') ?? fallback.framesAfter ?? 1),
      opacityBefore: (sys.get('onionSkin.opacityBefore') !== undefined ? Number(sys.get('onionSkin.opacityBefore')) / 100 : (fallback.opacityBefore ?? 0.5)),
      opacityAfter: (sys.get('onionSkin.opacityAfter') !== undefined ? Number(sys.get('onionSkin.opacityAfter')) / 100 : (fallback.opacityAfter ?? 0.25)),
      colorBefore: String(sys.get('onionSkin.colorBefore') ?? fallback.colorBefore ?? '#ff0000'),
      colorAfter: String(sys.get('onionSkin.colorAfter') ?? fallback.colorAfter ?? '#00ff00'),
      tintMode: Boolean(sys.get('onionSkin.tintMode') ?? fallback.tintMode ?? true)
    };
  });
  const onionSkinEnabled = onionSkinSettings.enabled;
  const onionSkinOpacity = Math.round(onionSkinSettings.opacityBefore * 100);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(true);
  const playIntervalRef = useRef<any | null>(null);

  // Layout & Toggles ("Ventana" controls)
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_sidebar_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [colorsVisible, setColorsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_colors_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [toolsVisible, setToolsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_tools_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [timelineVisible, setTimelineVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_timeline_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [gridVisible, setGridVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_grid_visible');
    return saved !== null ? saved === 'true' : true;
  });

  const [zenModeActive, setZenModeActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_zen_mode_active');
    return saved !== null ? saved === 'true' : false;
  });
  const [autoSaveIntervalMinutes, setAutoSaveIntervalMinutes] = useState<number>(() => {
    return Math.max(1, Number(PreferencesSystem.getInstance().get('saving.autoSaveIntervalMinutes')) || 5);
  });
  const [preZenLayout, setPreZenLayout] = useState<{
    sidebarVisible: boolean;
    colorsVisible: boolean;
    toolsVisible: boolean;
    timelineVisible: boolean;
  } | null>(() => {
    const saved = localStorage.getItem('onepixel_pre_zen_layout');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist layout toggles
  useEffect(() => {
    localStorage.setItem('onepixel_sidebar_visible', String(sidebarVisible));
  }, [sidebarVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_colors_visible', String(colorsVisible));
  }, [colorsVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_tools_visible', String(toolsVisible));
  }, [toolsVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_timeline_visible', String(timelineVisible));
  }, [timelineVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_grid_visible', String(gridVisible));
  }, [gridVisible]);

  // Extract unique active canvas colors from project pixels with debounce and idle scheduling
  const [documentColors, setDocumentColors] = useState<string[]>([]);
  useEffect(() => {
    if (!project || !project.pixels) {
      setDocumentColors([]);
      return;
    }
    let idleHandle: any = null;
    let isCancelled = false;

    const timer = setTimeout(() => {
      const scheduleTask = (typeof window !== 'undefined' && 'requestIdleCallback' in window)
        ? (window as any).requestIdleCallback
        : (cb: any) => setTimeout(cb, 1);

      idleHandle = scheduleTask(() => {
        if (isCancelled) return;
        const colorSet = new Set<string>();
        const addPixelColor = (px: any) => {
          if (
            px && 
            typeof px === 'string' && 
            px !== 'transparent' && 
            px !== '' && 
            px !== 'rgba(0,0,0,0)' && 
            !px.endsWith('00')
          ) {
            colorSet.add(px.toUpperCase());
          }
        };

        if (Array.isArray(project.pixels)) {
          project.pixels.forEach(addPixelColor);
        } else if (typeof project.pixels === 'object') {
          Object.values(project.pixels).forEach((layerObj: any) => {
            if (Array.isArray(layerObj)) {
              layerObj.forEach(addPixelColor);
            } else if (layerObj && typeof layerObj === 'object') {
              Object.values(layerObj).forEach((pxArr: any) => {
                if (Array.isArray(pxArr)) {
                  pxArr.forEach(addPixelColor);
                }
              });
            }
          });
        }
        if (!isCancelled) {
          setDocumentColors(Array.from(colorSet));
        }
      });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (idleHandle !== null) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle);
        }
      }
    };
  }, [project?.pixels, project?.id]);

  // --- GUIDES & RULERS STATES & HANDLERS ---
  const [guidesVisible, setGuidesVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_guides_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [guidesLocked, setGuidesLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_guides_locked');
    return saved !== null ? saved === 'true' : false;
  });
  const [rulersVisible, setRulersVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_rulers_visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [snappingEnabled, setSnappingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_snapping_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [gridSize, setGridSize] = useState<number>(() => {
    const val = PreferencesSystem.getInstance().get('grid.size');
    return typeof val === 'number' ? val : 1;
  });
  const [gridColor, setGridColor] = useState<string>(() => {
    const val = PreferencesSystem.getInstance().get('grid.color');
    return typeof val === 'string' ? val : '#ffffff';
  });
  const [gridOpacity, setGridOpacity] = useState<number>(() => {
    const val = PreferencesSystem.getInstance().get('grid.opacity');
    return typeof val === 'number' ? val : 30;
  });
  const [symmetryAxisColor, setSymmetryAxisColor] = useState<string>(() => {
    const val = PreferencesSystem.getInstance().get('symmetry.axisColor');
    return typeof val === 'string' ? val : '#C8A96A';
  });

  // Subscribe App state to PreferencesSystem changes
  useEffect(() => {
    const sys = PreferencesSystem.getInstance();
    const unsubGrid = sys.subscribe('canvas.showGrid', val => setGridVisible(Boolean(val)));
    const unsubRulers = sys.subscribe('canvas.rulersVisible', val => setRulersVisible(Boolean(val)));
    const unsubGuides = sys.subscribe('canvas.showGuides', val => setGuidesVisible(Boolean(val)));
    const unsubSnap = sys.subscribe('canvas.snappingEnabled', val => setSnappingEnabled(Boolean(val)));
    const unsubSize = sys.subscribe('grid.size', val => setGridSize(typeof val === 'number' ? val : Number(val) || 1));
    const unsubColor = sys.subscribe('grid.color', val => setGridColor(String(val)));
    const unsubOpacity = sys.subscribe('grid.opacity', val => setGridOpacity(typeof val === 'number' ? val : Number(val) || 30));

    const unsubOnionEnabled = sys.subscribe('onionSkin.enabled', val => {
      const b = Boolean(val);
      setOnionSkinSettings(prev => (prev.enabled === b ? prev : { ...prev, enabled: b }));
    });
    const unsubOnionBefore = sys.subscribe('onionSkin.framesBefore', val => {
      const n = Number(val);
      setOnionSkinSettings(prev => (prev.framesBefore === n ? prev : { ...prev, framesBefore: n }));
    });
    const unsubOnionBeforeAlias = sys.subscribe('onionSkin.before', val => {
      const n = Number(val);
      setOnionSkinSettings(prev => (prev.framesBefore === n ? prev : { ...prev, framesBefore: n }));
    });
    const unsubOnionAfter = sys.subscribe('onionSkin.framesAfter', val => {
      const n = Number(val);
      setOnionSkinSettings(prev => (prev.framesAfter === n ? prev : { ...prev, framesAfter: n }));
    });
    const unsubOnionAfterAlias = sys.subscribe('onionSkin.after', val => {
      const n = Number(val);
      setOnionSkinSettings(prev => (prev.framesAfter === n ? prev : { ...prev, framesAfter: n }));
    });
    const unsubOnionOpBefore = sys.subscribe('onionSkin.opacityBefore', val => {
      const n = Number(val) / 100;
      setOnionSkinSettings(prev => (prev.opacityBefore === n ? prev : { ...prev, opacityBefore: n }));
    });
    const unsubOnionOpAfter = sys.subscribe('onionSkin.opacityAfter', val => {
      const n = Number(val) / 100;
      setOnionSkinSettings(prev => (prev.opacityAfter === n ? prev : { ...prev, opacityAfter: n }));
    });
    const unsubOnionColBefore = sys.subscribe('onionSkin.colorBefore', val => {
      const s = String(val);
      setOnionSkinSettings(prev => (prev.colorBefore === s ? prev : { ...prev, colorBefore: s }));
    });
    const unsubOnionColAfter = sys.subscribe('onionSkin.colorAfter', val => {
      const s = String(val);
      setOnionSkinSettings(prev => (prev.colorAfter === s ? prev : { ...prev, colorAfter: s }));
    });
    const unsubOnionTint = sys.subscribe('onionSkin.tintMode', val => {
      const b = Boolean(val);
      setOnionSkinSettings(prev => (prev.tintMode === b ? prev : { ...prev, tintMode: b }));
    });

    const unsubTheme = sys.subscribe('appearance.theme', val => {
      if (val && (val === 'standard' || val === 'dark' || val === 'light')) {
        setTheme(val as ThemeType);
        setPreferences(prev => (prev.theme === val ? prev : { ...prev, theme: val as ThemeType }));
      }
    });
    const unsubThemeColor = sys.subscribe('appearance.themeColor', val => {
      if (val) {
        setPreferences(prev => (prev.interfaceColor === val ? prev : { ...prev, interfaceColor: val }));
      }
    });
    const unsubUiSize = sys.subscribe('ui.interfaceSize', val => {
      if (val) {
        setPreferences(prev => (prev.interfaceSize === val ? prev : { ...prev, interfaceSize: val }));
      }
    });
    const unsubLargeButtons = sys.subscribe('ui.largeButtons', val => {
      const b = Boolean(val);
      setPreferences(prev => (prev.largeButtons === b ? prev : { ...prev, largeButtons: b }));
    });
    const unsubLeftHand = sys.subscribe('ui.leftHandedMode', val => {
      const b = Boolean(val);
      setPreferences(prev => (prev.leftHandedMode === b ? prev : { ...prev, leftHandedMode: b }));
    });
    const unsubBrushSize = sys.subscribe('tools.brushSize', val => {
      const n = Number(val);
      if (n >= 1 && n <= 64) {
        setBrushSize(n);
      }
    });
    const unsubPixelPerfect = sys.subscribe('tools.pixelPerfect', val => {
      const b = Boolean(val);
      setPixelPerfect(b);
    });
    const unsubSymEnabled = sys.subscribe('symmetry.enabled', val => {
      const b = Boolean(val);
      setSymmetry(prev => ({ ...prev, x: b }));
    });
    const unsubSymAxis = sys.subscribe('symmetry.axis', val => {
      setSymmetry(prev => ({
        ...prev,
        x: val === 'horizontal' || val === 'both',
        y: val === 'vertical' || val === 'both',
        radial: val === 'radial'
      }));
    });
    const unsubSymColor = sys.subscribe('symmetry.axisColor', val => {
      if (val) setSymmetryAxisColor(String(val));
    });
    const unsubFps = sys.subscribe('animation.fpsDefault', val => {
      const n = Number(val);
      if (n >= 1 && n <= 60) {
        setProject(prev => prev ? ({ ...prev, fps: n }) : prev);
      }
    });
    const unsubLoop = sys.subscribe('animation.loop', val => {
      setLoopEnabled(Boolean(val));
    });
    const unsubAutoSave = sys.subscribe('saving.autoSaveEnabled', val => {
      const b = Boolean(val);
      setPreferences(prev => (prev.autoSaveEnabled === b ? prev : { ...prev, autoSaveEnabled: b }));
    });
    const unsubAutoSaveInterval = sys.subscribe('saving.autoSaveIntervalMinutes', val => {
      const mins = Math.max(1, Number(val) || 5);
      setAutoSaveIntervalMinutes(mins);
    });
    const unsubHighContrast = sys.subscribe('accessibility.highContrast', val => {
      const b = Boolean(val);
      setPreferences(prev => (prev.highContrast === b ? prev : { ...prev, highContrast: b }));
    });
    const unsubColorBlind = sys.subscribe('accessibility.colorBlindness', val => {
      if (val) {
        setPreferences(prev => (prev.colorBlindness === val ? prev : { ...prev, colorBlindness: val }));
      }
    });
    const unsubLang = sys.subscribe('language.current', val => {
      if (val) {
        setPreferences(prev => (prev.language === val ? prev : { ...prev, language: val }));
      }
    });

    return () => {
      unsubGrid();
      unsubRulers();
      unsubGuides();
      unsubSnap();
      unsubSize();
      unsubColor();
      unsubOpacity();
      unsubOnionEnabled();
      unsubOnionBefore();
      unsubOnionBeforeAlias();
      unsubOnionAfter();
      unsubOnionAfterAlias();
      unsubOnionOpBefore();
      unsubOnionOpAfter();
      unsubOnionColBefore();
      unsubOnionColAfter();
      unsubOnionTint();
      unsubTheme();
      unsubThemeColor();
      unsubUiSize();
      unsubLargeButtons();
      unsubLeftHand();
      unsubBrushSize();
      unsubPixelPerfect();
      unsubSymEnabled();
      unsubSymAxis();
      unsubSymColor();
      unsubFps();
      unsubLoop();
      unsubAutoSave();
      unsubAutoSaveInterval();
      unsubHighContrast();
      unsubColorBlind();
      unsubLang();
    };
  }, []);

  const handleToggleGrid = () => {
    const next = !gridVisible;
    setGridVisible(next);
    PreferencesSystem.getInstance().set('canvas.showGrid', next);
  };

  const handleToggleRulers = () => {
    const next = !rulersVisible;
    setRulersVisible(next);
    PreferencesSystem.getInstance().set('canvas.rulersVisible', next);
  };

  const handleToggleGuides = () => {
    const next = !guidesVisible;
    setGuidesVisible(next);
    PreferencesSystem.getInstance().set('canvas.showGuides', next);
  };

  const handleToggleSnapping = () => {
    const next = !snappingEnabled;
    setSnappingEnabled(next);
    PreferencesSystem.getInstance().set('canvas.snappingEnabled', next);
  };

  // Persist configurations
  useEffect(() => {
    localStorage.setItem('onepixel_guides_visible', String(guidesVisible));
  }, [guidesVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_guides_locked', String(guidesLocked));
  }, [guidesLocked]);

  useEffect(() => {
    localStorage.setItem('onepixel_rulers_visible', String(rulersVisible));
  }, [rulersVisible]);

  useEffect(() => {
    localStorage.setItem('onepixel_snapping_enabled', String(snappingEnabled));
  }, [snappingEnabled]);

  useEffect(() => {
    localStorage.setItem('onepixel_onion_skin_settings', JSON.stringify(onionSkinSettings));
    const sys = PreferencesSystem.getInstance();
    sys.set('onionSkin.enabled', onionSkinSettings.enabled);
    sys.set('onionSkin.framesBefore', onionSkinSettings.framesBefore);
    sys.set('onionSkin.before', onionSkinSettings.framesBefore);
    sys.set('onionSkin.framesAfter', onionSkinSettings.framesAfter);
    sys.set('onionSkin.after', onionSkinSettings.framesAfter);
    sys.set('onionSkin.opacityBefore', Math.round(onionSkinSettings.opacityBefore * 100));
    sys.set('onionSkin.opacityAfter', Math.round(onionSkinSettings.opacityAfter * 100));
    sys.set('onionSkin.colorBefore', onionSkinSettings.colorBefore);
    sys.set('onionSkin.colorAfter', onionSkinSettings.colorAfter);
    sys.set('onionSkin.tintMode', onionSkinSettings.tintMode);
  }, [onionSkinSettings]);

  const handleAddGuide = (type: 'horizontal' | 'vertical', position: number, silent = false, id?: string) => {
    const currentGuides = project.guides || [];
    const actualId = id || `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGuide = {
      id: actualId,
      type,
      position: Math.round(position),
      locked: false,
      isProjectLevel: true
    };
    const updatedGuides = [...currentGuides, newGuide];
    saveSnapshotToHistory(project.pixels, updatedGuides);
    setProject(prev => ({
      ...prev,
      guides: updatedGuides
    }));
    if (!silent) {
      showToast(translate('guides.guideAdded', preferences.language), 'success');
    }
    return actualId;
  };

  const handleMoveGuide = (id: string, newPosition: number) => {
    const currentGuides = project.guides || [];
    const updatedGuides = currentGuides.map(g => 
      g.id === id ? { ...g, position: Math.round(newPosition) } : g
    );
    saveSnapshotToHistory(project.pixels, updatedGuides);
    setProject(prev => ({
      ...prev,
      guides: updatedGuides
    }));
  };

  const handleRemoveGuide = (id: string, silent = false) => {
    const currentGuides = project.guides || [];
    const updatedGuides = currentGuides.filter(g => g.id !== id);
    saveSnapshotToHistory(project.pixels, updatedGuides);
    setProject(prev => ({
      ...prev,
      guides: updatedGuides
    }));
    if (!silent) {
      showToast(translate('guides.guideRemoved', preferences.language), 'success');
    }
  };

  const handleClearGuides = () => {
    saveSnapshotToHistory(project.pixels, []);
    setProject(prev => ({
      ...prev,
      guides: []
    }));
    showToast(translate('guides.allGuidesCleared', preferences.language), 'success');
  };

  // Command Buses to CanvasArea
  const [canvasCommand, setCanvasCommand] = useState<{ action: 'zoom_in' | 'zoom_out' | 'center' | null; timestamp: number }>({ action: null, timestamp: 0 });
  const [selectionCommand, setSelectionCommand] = useState<{ 
    action: 'select_all' | 'deselect' | 'invert' | 'cut' | 'copy' | 'paste' | 'fill' | 'select_by_color' | 'expand_selection' | 'contract_selection' | null; 
    timestamp: number 
  }>({ action: null, timestamp: 0 });

  // Reference Image state removed

  // Modals
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [welcomeNewProjectOpen, setWelcomeNewProjectOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [reExportPluginId, setReExportPluginId] = useState<string | undefined>(undefined);
  const [reExportOptions, setReExportOptions] = useState<Record<string, any> | undefined>(undefined);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [activeStamp, setActiveStamp] = useState<{ pixels: string[]; width: number; height: number; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('onepixel_active_stamp');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [stampScale, setStampScale] = useState<number>(1);
  const [stampRotation, setStampRotation] = useState<number>(0);
  const [stampFlipH, setStampFlipH] = useState<boolean>(false);
  const [stampFlipV, setStampFlipV] = useState<boolean>(false);
  const [patternMode, setPatternMode] = useState<'stamp' | 'pattern'>('stamp');
  const [activeSelection, setActiveSelection] = useState<{ active: boolean; pixels: boolean[] }>({ active: false, pixels: [] });
  const [activeBrush, setActiveBrush] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('onepixel_active_brush');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeStamp) {
      localStorage.setItem('onepixel_active_stamp', JSON.stringify(activeStamp));
    } else {
      localStorage.removeItem('onepixel_active_stamp');
    }
  }, [activeStamp]);

  useEffect(() => {
    if (activeBrush) {
      localStorage.setItem('onepixel_active_brush', JSON.stringify(activeBrush));
    } else {
      localStorage.removeItem('onepixel_active_brush');
    }
  }, [activeBrush]);

  // File Action Modal/Overlay States
  const [closeTabModalOpen, setCloseTabModalOpen] = useState(false);
  const [closeTabId, setCloseTabId] = useState<string | null>(null);
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [isExited, setIsExited] = useState(false);

  // Help, Tour & About overlays
  const [aboutOpen, setAboutOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState<'manual' | 'workflows' | 'tips' | 'shortcuts'>('manual');
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalInitialSection, setLegalInitialSection] = useState<LegalSectionId>('terms');
  const [initialConsentOpen, setInitialConsentOpen] = useState(() => !hasAcceptedCurrentLegalVersion());
  const [tourOpen, setTourOpen] = useState(false);

  // Responsive mobile panel overlay toggle
  const [activeMobilePanel, setActiveMobilePanel] = useState<'tools' | 'layers' | 'color' | 'timeline' | null>(null);

  // Tool states for the newly requested advanced tools
  const [sprayDensity, setSprayDensity] = useState<number>(() => {
    const saved = localStorage.getItem('onepixel_tool_sprayDensity');
    return saved !== null ? parseInt(saved, 10) : 15;
  });
  const [sprayRandomness, setSprayRandomness] = useState<number>(() => {
    const saved = localStorage.getItem('onepixel_tool_sprayRandomness');
    return saved !== null ? parseInt(saved, 10) : 4;
  });
  const [sprayShape, setSprayShape] = useState<'round' | 'square' | 'cross' | 'star'>(() => {
    const saved = localStorage.getItem('onepixel_tool_sprayShape');
    return (saved as any) || 'round';
  });
  const [ditheringPattern, setDitheringPattern] = useState<'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise'>(() => {
    const saved = localStorage.getItem('onepixel_tool_ditheringPattern');
    return (saved as any) || 'checkerboard';
  });
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  const [bucketContiguous, setBucketContiguous] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_tool_bucketContiguous');
    return saved !== null ? saved === 'true' : true;
  });
  const [bucketRefer, setBucketRefer] = useState<'active' | 'all'>(() => {
    const saved = localStorage.getItem('onepixel_tool_bucketRefer');
    return (saved as any) || 'active';
  });
  const [tolerance, setTolerance] = useState<number>(() => {
    const saved = localStorage.getItem('onepixel_tool_tolerance');
    return saved !== null ? parseInt(saved, 10) : 15;
  });
  const [fillShape, setFillShape] = useState<boolean>(() => {
    const saved = localStorage.getItem('onepixel_tool_fillShape');
    return saved !== null ? saved === 'true' : false;
  });

  // Persist tool options
  useEffect(() => {
    localStorage.setItem('onepixel_tool_brushSize', String(brushSize));
    localStorage.setItem('onepixel_tool_pixelPerfect', String(pixelPerfect));
    localStorage.setItem('onepixel_tool_sprayDensity', String(sprayDensity));
    localStorage.setItem('onepixel_tool_sprayRandomness', String(sprayRandomness));
    localStorage.setItem('onepixel_tool_sprayShape', sprayShape);
    localStorage.setItem('onepixel_tool_ditheringPattern', ditheringPattern);
    localStorage.setItem('onepixel_tool_bucketContiguous', String(bucketContiguous));
    localStorage.setItem('onepixel_tool_bucketRefer', bucketRefer);
    localStorage.setItem('onepixel_tool_tolerance', String(tolerance));
    localStorage.setItem('onepixel_tool_fillShape', String(fillShape));
  }, [
    brushSize, pixelPerfect, sprayDensity, sprayRandomness, sprayShape,
    ditheringPattern, bucketContiguous, bucketRefer, tolerance, fillShape
  ]);

  // Theme state hook
  const { theme, setTheme } = useTheme();

  // Generic Prompt Modal state
  const [genericPromptOpen, setGenericPromptOpen] = useState(false);
  const [genericPromptConfig, setGenericPromptConfig] = useState<{
    title: string;
    description?: string;
    fields: PromptField[];
    confirmText?: string;
    cancelText?: string;
    onConfirm: (values: Record<string, string>) => void;
  }>({
    title: '',
    fields: [],
    onConfirm: () => {}
  });

  // System Preferences State
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error("Simulated Crash: Manual core crash triggered from permanent Diagnostics Panel for stability validation.");
  }

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const hasDevQuery = typeof window !== 'undefined' && (
      window.location.search.includes('dev') ||
      window.location.search.includes('debug') ||
      window.location.search.includes('qa')
    );
    const saved = localStorage.getItem('onepixel_preferences');
    const sysTheme = PreferencesSystem.getInstance().get('appearance.theme');
    const savedTheme = (localStorage.getItem('onepixel_theme') as any) || sysTheme || 'standard';

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.autoSaveEnabled === undefined) {
          parsed.autoSaveEnabled = true;
        }
        if (!parsed.language) {
          parsed.language = 'es';
        }
        if (parsed.diagnosticsModeEnabled === undefined) {
          parsed.diagnosticsModeEnabled = hasDevQuery;
        }
        if (!parsed.interfaceColor) {
          const sysColor = PreferencesSystem.getInstance().get('appearance.themeColor');
          parsed.interfaceColor = sysColor || 'gold';
        }
        if (!parsed.theme) {
          parsed.theme = savedTheme;
        }
        return parsed;
      } catch (e) {}
    }
    const sysColor = PreferencesSystem.getInstance().get('appearance.themeColor');
    return {
      digitalPenEnabled: false,
      interfaceSize: 'md',
      largeButtons: false,
      gesturesEnabled: true,
      colorBlindness: 'none',
      highContrast: false,
      interfaceColor: sysColor || 'gold',
      leftHandedMode: false,
      autoSaveEnabled: true,
      language: 'es',
      diagnosticsModeEnabled: hasDevQuery,
      theme: savedTheme
    };
  });

  const handleChangePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('onepixel_preferences', JSON.stringify(newPrefs));
    if (newPrefs.theme && newPrefs.theme !== theme) {
      setTheme(newPrefs.theme);
      PreferencesSystem.getInstance().set('appearance.theme', newPrefs.theme);
    }
    if (newPrefs.interfaceColor) {
      PreferencesSystem.getInstance().set('appearance.themeColor', newPrefs.interfaceColor);
    }
  };

  // Color history state (persists across saved files during session but starts empty and records user drawn/picked colors)
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleColorChange = useCallback((color: string) => {
    if (activeColorSlotRef.current === 'primary') {
      setCurrentColor(color);
    } else {
      setSecondaryColor(color);
    }
  }, []);

  const handleRecordColorUsage = useCallback((color: string) => {
    if (!color) return;
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      return [color, ...filtered].slice(0, 10);
    });
  }, []);

  const handleClearRecentColors = useCallback(() => {
    setRecentColors([]);
  }, []);

  const handleSaveRecentAsPalette = async () => {
    saveDebug('handleSaveRecentAsPalette', 'Iniciando guardado de paleta reciente...', {
      recentColorsCount: recentColors.length,
      projectId: project?.id
    });
    try {
      // 1. Recopilar todos los colores utilizados recientemente y en el lienzo actual
      const canvasColors = new Set<string>();
      if (project && project.pixels) {
        Object.values(project.pixels).forEach((frameLayers: any) => {
          Object.values(frameLayers).forEach((layerPix: any) => {
            if (Array.isArray(layerPix)) {
              layerPix.forEach((col) => {
                if (col && col.startsWith('#')) {
                  canvasColors.add(col.toLowerCase());
                }
              });
            }
          });
        });
      }
      saveDebug('handleSaveRecentAsPalette', 'Colores recopilados del lienzo', { canvasColorsCount: canvasColors.size });

      const allColorsSet = new Set<string>();
      recentColors.forEach(c => {
        if (c && c.startsWith('#')) allColorsSet.add(c.toLowerCase());
      });
      canvasColors.forEach(c => allColorsSet.add(c));

      // 2. Eliminar colores duplicados y crear la paleta limpia (máximo 256 colores para formatos estándar)
      const uniqueColors = Array.from(allColorsSet).slice(0, 256);
      saveDebug('handleSaveRecentAsPalette', 'Colores únicos resultantes (máx 256)', { uniqueColorsCount: uniqueColors.length });

      if (uniqueColors.length === 0) {
        saveDebug('handleSaveRecentAsPalette', 'Fin de flujo por ausencia de colores');
        showToast('No hay colores recientes ni en el lienzo para crear una paleta.', 'error');
        return;
      }

      setGenericPromptConfig({
        title: 'Crear y Guardar Paleta',
        description: 'Introduce el nombre y selecciona el formato en el que deseas guardar tu paleta de colores:',
        fields: [
          { key: 'name', label: 'Nombre de la Paleta', type: 'text', defaultValue: 'Mi Historial de Colores' },
          {
            key: 'format',
            label: 'Formato de Guardado',
            type: 'select',
            defaultValue: 'biblioteca',
            options: [
              { value: 'biblioteca', label: 'Biblioteca de OnePixel (Nube/Local)' },
              { value: 'gpl', label: 'Formato GPL (Aseprite/Photoshop/GIMP)' },
              { value: 'pal', label: 'Formato JASC PAL' },
              { value: 'act', label: 'Formato Photoshop ACT' },
              { value: 'aco', label: 'Formato Photoshop ACO' },
              { value: 'json', label: 'Archivo JSON simple' }
            ]
          }
        ],
        confirmText: 'Guardar Paleta',
        cancelText: 'Cancelar',
        onConfirm: async (values) => {
          setGenericPromptOpen(false);
          const paletteName = values.name.trim() || 'Mi Historial de Colores';
          const chosenFormat = values.format;
          const cleanFileName = paletteName.replace(/\s+/g, '_');

          if (chosenFormat !== 'biblioteca') {
            if (typeof Blob === 'undefined') {
              showToast('La API de navegador "Blob" no está disponible en este entorno.', 'error');
              return;
            }
            if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
              showToast('La API de navegador "URL.createObjectURL" no está disponible en este entorno.', 'error');
              return;
            }
          }

          if (chosenFormat === 'biblioteca') {
            const paletteId = `palette-${Date.now()}`;
            const newResource = {
              id: paletteId,
              name: paletteName,
              type: 'palette' as const,
              data: { colors: uniqueColors },
              tags: ['Historial', 'Reciente'],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            try {
              await ProjectLibraryService.saveResource(newResource);
              showToast(`¡Paleta "${paletteName}" guardada exitosamente en tu Biblioteca!`, 'success');
            } catch (e: any) {
              showToast(`Error al guardar la paleta en la biblioteca: ${e.message || e}`, 'error');
            }
          } else if (chosenFormat === 'gpl') {
            try {
              let gplText = `GIMP Palette\nName: ${paletteName}\nColumns: 16\n#\n`;
              uniqueColors.forEach((color, idx) => {
                const r = parseInt(color.slice(1, 3), 16) || 0;
                const g = parseInt(color.slice(3, 5), 16) || 0;
                const b = parseInt(color.slice(5, 7), 16) || 0;
                gplText += `${r.toString().padStart(3, ' ')} ${g.toString().padStart(3, ' ')} ${b.toString().padStart(3, ' ')} Color ${idx + 1}\n`;
              });
              const blob = new Blob([gplText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${cleanFileName}.gpl`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
              }, 100);
              showToast(`¡Paleta guardada exitosamente como archivo GPL: "${cleanFileName}.gpl"!`, 'success');
            } catch (downloadErr: any) {
              showToast(`La descarga del archivo GPL fue bloqueada por el navegador. Detalle: ${downloadErr.message || downloadErr}`, 'error');
            }
          } else if (chosenFormat === 'pal') {
            try {
              let palText = `JASC-PAL\n0100\n256\n`;
              for (let i = 0; i < 256; i++) {
                const color = uniqueColors[i] || '#000000';
                const r = parseInt(color.slice(1, 3), 16) || 0;
                const g = parseInt(color.slice(3, 5), 16) || 0;
                const b = parseInt(color.slice(5, 7), 16) || 0;
                palText += `${r} ${g} ${b}\n`;
              }
              const blob = new Blob([palText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${cleanFileName}.pal`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
              }, 100);
              showToast(`¡Paleta guardada exitosamente como archivo PAL: "${cleanFileName}.pal"!`, 'success');
            } catch (downloadErr: any) {
              showToast(`La descarga del archivo PAL fue bloqueada por el navegador. Detalle: ${downloadErr.message || downloadErr}`, 'error');
            }
          } else if (chosenFormat === 'act') {
            try {
              const buffer = new ArrayBuffer(768);
              const view = new DataView(buffer);
              for (let i = 0; i < 256; i++) {
                const color = uniqueColors[i] || '#000000';
                const r = parseInt(color.slice(1, 3), 16) || 0;
                const g = parseInt(color.slice(3, 5), 16) || 0;
                const b = parseInt(color.slice(5, 7), 16) || 0;
                view.setUint8(i * 3, r);
                view.setUint8(i * 3 + 1, g);
                view.setUint8(i * 3 + 2, b);
              }
              const blob = new Blob([buffer], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${cleanFileName}.act`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
              }, 100);
              showToast(`¡Paleta guardada exitosamente como archivo ACT: "${cleanFileName}.act"!`, 'success');
            } catch (downloadErr: any) {
              showToast(`La descarga del archivo ACT fue bloqueada por el navegador. Detalle: ${downloadErr.message || downloadErr}`, 'error');
            }
          } else if (chosenFormat === 'aco') {
            try {
              const entrySize = 10;
              const headerSize = 4;
              const fileSize = headerSize + uniqueColors.length * entrySize;
              const buffer = new ArrayBuffer(fileSize);
              const view = new DataView(buffer);
              view.setUint16(0, 1); // ACO version 1
              view.setUint16(2, uniqueColors.length);
              let offset = 4;
              uniqueColors.forEach((color) => {
                const r = (parseInt(color.slice(1, 3), 16) || 0) * 257;
                const g = (parseInt(color.slice(3, 5), 16) || 0) * 257;
                const b = (parseInt(color.slice(5, 7), 16) || 0) * 257;
                view.setUint16(offset, 0); // RGB
                view.setUint16(offset + 2, r);
                view.setUint16(offset + 4, g);
                view.setUint16(offset + 6, b);
                view.setUint16(offset + 8, 0);
                offset += entrySize;
              });
              const blob = new Blob([buffer], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${cleanFileName}.aco`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
              }, 100);
              showToast(`¡Paleta guardada exitosamente como archivo ACO: "${cleanFileName}.aco"!`, 'success');
            } catch (downloadErr: any) {
              showToast(`La descarga del archivo ACO fue bloqueada por el navegador. Detalle: ${downloadErr.message || downloadErr}`, 'error');
            }
          } else if (chosenFormat === 'json') {
            try {
              const blob = new Blob([JSON.stringify(uniqueColors, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${cleanFileName}.json`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
              }, 100);
              showToast(`¡Paleta guardada exitosamente como archivo JSON: "${cleanFileName}.json"!`, 'success');
            } catch (downloadErr: any) {
              showToast(`La descarga del archivo JSON fue bloqueada por el navegador. Detalle: ${downloadErr.message || downloadErr}`, 'error');
            }
          }
        }
      });
      setGenericPromptOpen(true);
    } catch (e: any) {
      saveDebug('handleSaveRecentAsPalette', 'Error crítico general atrapado', { error: e.message || e });
      console.error('[SavePalette Error Critical] Error general en handleSaveRecentAsPalette:', e);
      showToast(`Error al guardar la paleta de colores: ${e.message || e}\n\nNota: Si estás dentro del iframe de previsualización, puedes intentar "Abrir en nueva pestaña" para evitar restricciones.`, 'error');
    }
  };

  // 30 layers warning banner state
  const [layerWarningVisible, setLayerWarningVisible] = useState(false);

  // Playback mode & Direction ref
  const [playbackMode, setPlaybackMode] = useState<'forward' | 'reverse' | 'pingpong'>('forward');
  const pingPongDirRef = useRef<'forward' | 'reverse'>('forward');

  // --- MULTI-PROJECT TAB STATES ---
  const [tabs, setTabs] = useState<OpenProjectTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);
  const isSwitchingTabRef = useRef(false);

  // Synchronize dynamic QA Mode state globally for low-impact telemetry tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__qaModeEnabled__ = !!preferences.diagnosticsModeEnabled;
    }
  }, [preferences.diagnosticsModeEnabled]);

  // --- DIAGNOSTIC TELEMETRY AUDIT TRAIL OBSERVERS ---
  useEffect(() => {
    if (project) {
      const activeFrameIndex = project.frames ? project.frames.findIndex(f => f.id === selectedFrameId) : -1;
      const activeLayerIndex = project.layers ? project.layers.findIndex(l => l.id === selectedLayerId) : -1;
      
      telemetry.updateLastKnownState({
        projectId: project.id,
        projectName: project.name,
        canvasWidth: project.width,
        canvasHeight: project.height,
        layersCount: project.layers ? project.layers.length : 0,
        framesCount: project.frames ? project.frames.length : 0,
        activeFrameId: selectedFrameId,
        activeLayerId: selectedLayerId,
        activeFrameIndex,
        activeLayerIndex
      });
      
      telemetry.logAction('PROJECT_STATE', 'Project state loaded/updated', {
        id: project.id,
        name: project.name,
        width: project.width,
        height: project.height,
        layersCount: project.layers ? project.layers.length : 0,
        framesCount: project.frames ? project.frames.length : 0,
        fps: project.fps,
        activeFrameIndex,
        activeLayerIndex
      });
    }
  }, [project?.id, project?.width, project?.height, selectedFrameId, selectedLayerId]);

  useEffect(() => {
    if (activeTabId) {
      telemetry.updateLastKnownState({ activeTabId });
      telemetry.logAction('TAB_CHANGE', 'Active tab changed', {
        activeTabId,
        tabsCount: tabs.length
      });
    }
  }, [activeTabId]);

  useEffect(() => {
    telemetry.updateLastKnownState({ activeTool: currentTool });
    telemetry.logAction('TOOL_CHANGE', 'Selected tool changed', {
      tool: currentTool
    });
  }, [currentTool]);

  useEffect(() => {
    if (selectedFrameId || selectedLayerId) {
      telemetry.logAction('SELECTION_CHANGE', 'Selected frame or layer changed', {
        selectedFrameId,
        selectedLayerId
      });
    }
  }, [selectedFrameId, selectedLayerId]);

  useEffect(() => {
    if (project?.layers) {
      telemetry.logAction('LAYERS_STRUCTURE', 'Layers configuration changed', {
        layersCount: project.layers.length,
        layers: project.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible, locked: l.locked }))
      });
    }
  }, [project?.layers]);

  // Keep selectedLayerId sanitized and aligned with project.layers
  useEffect(() => {
    if (project?.layers && project.layers.length > 0) {
      const exists = project.layers.some(l => l.id === selectedLayerId);
      if (!exists && selectedLayerId !== '') {
        setSelectedLayerId(project.layers[0].id);
      }
    } else {
      setSelectedLayerId('');
    }
  }, [project?.layers, selectedLayerId]);

  // Sync active selection to telemetry lastKnownState
  useEffect(() => {
    telemetry.updateLastKnownState({
      selectionActive: activeSelection.active,
      selectionPixelsCount: (activeSelection.active && activeSelection.pixels) ? activeSelection.pixels.length : 0
    });
  }, [activeSelection]);

  // Deep telemetry state synchronization for crash diagnosis
  useEffect(() => {
    if (project) {
      telemetry.updateLastKnownState({
        completeProjectState: {
          id: project.id,
          name: project.name,
          width: project.width,
          height: project.height,
          layers: project.layers,
          frames: project.frames,
          fps: project.fps,
          guides: project.guides,
          pixels: project.pixels
        },
        completeTabsState: tabs.map(t => ({
          id: t.id,
          name: t.project.name,
          width: t.project.width,
          height: t.project.height,
          layersCount: t.project.layers?.length,
          framesCount: t.project.frames?.length
        })),
        completeSelectionState: {
          active: activeSelection.active,
          pixelsCount: (activeSelection.active && activeSelection.pixels) ? activeSelection.pixels.length : 0,
          pixels: activeSelection.pixels
        },
        estimatedMemoryMetrics: telemetry.getMetricsSummary()
      });
    }
  }, [project, tabs, activeSelection]);

  // --- SYNCHRONOUS PRE-RENDER INVARIANT VALIDATOR ---
  // Evaluated synchronously during every render cycle to detect any memory/state corruption
  // BEFORE any child component drawing or layout occurs. If an invariant fails, a handled
  // error is thrown and instantly captured by the top-level React ErrorBoundary.
  if (preferences.diagnosticsModeEnabled === true && project && project.id) {
    try {
      // 1. Dimensions greater than zero
      telemetry.checkInvariant(project.width > 0, "Project width must be greater than zero", { width: project.width });
      telemetry.checkInvariant(project.height > 0, "Project height must be greater than zero", { height: project.height });

      // 2. Valid layers structure
      telemetry.checkInvariant(Array.isArray(project.layers), "Project layers must be an array", { type: typeof project.layers });
      telemetry.checkInvariant(project.layers.length > 0, "Project must have at least one layer", { count: project.layers.length });

      // 3. Valid frames structure
      telemetry.checkInvariant(Array.isArray(project.frames), "Project frames must be an array", { type: typeof project.frames });
      telemetry.checkInvariant(project.frames.length > 0, "Project must have at least one frame", { count: project.frames.length });

      // 4. Selected layer exists in current project layers list
      if (selectedLayerId) {
        const layerExists = project.layers.some(l => l.id === selectedLayerId);
        telemetry.checkInvariant(layerExists, "Active layer must exist in project layers list", {
          selectedLayerId,
          availableIds: project.layers.map(l => l.id)
        });
      }

      // 5. Selected frame exists in current project frames list
      if (selectedFrameId) {
        const frameExists = project.frames.some(f => f.id === selectedFrameId);
        telemetry.checkInvariant(frameExists, "Active frame must exist in project frames list", {
          selectedFrameId,
          availableIds: project.frames.map(f => f.id)
        });
      }

      // 6. Pixel array dimension check for active frame and layer
      if (selectedFrameId && selectedLayerId && project.pixels) {
        const framePixels = project.pixels[selectedFrameId];
        if (framePixels) {
          const layerPixels = framePixels[selectedLayerId];
          if (layerPixels) {
            telemetry.checkInvariant(Array.isArray(layerPixels), "Pixels for active layer must be an array", { type: typeof layerPixels });
            const expectedSize = project.width * project.height;
            telemetry.checkInvariant(layerPixels.length === expectedSize, "Pixels array length must match logical width * height", {
              expected: expectedSize,
              actual: layerPixels.length,
              dimensions: `${project.width}x${project.height}`
            });
          }
        }
      }
    } catch (err) {
      console.error("[SYNCHRONOUS INVARIANT VIOLATION DETECTED]", err);
      throw err;
    }
  }
  const [currentUser, setCurrentUser] = useState<any>(null);
  const lastAutosavedProjectRef = useRef<string>('');

  const switchTab = (tabId: string, currentTabsList = tabs) => {
    const target = currentTabsList.find(t => t.id === tabId);
    if (!target) return;
    
    isSwitchingTabRef.current = true;
    setActiveTabId(tabId);
    setProject(target.project);

    const targetFrameIds = Array.isArray(target.project?.frames) ? target.project.frames.map(f => f.id) : [];
    const sanitizedTargetSelection = SelectionService.sanitize({
      activeFrameId: target.selectedFrameId,
      focusedFrameId: target.focusedFrameId || target.selectedFrameId,
      anchorFrameId: target.anchorFrameId || target.selectedFrameId,
      selectedFrameIds: target.selectedFrameIds || (target.selectedFrameId ? [target.selectedFrameId] : []),
    }, targetFrameIds);

    setFrameSelection(sanitizedTargetSelection);

    const targetLayerExists = target.project?.layers?.some(l => l.id === target.selectedLayerId);
    const validLayerId = targetLayerExists ? target.selectedLayerId : (target.project?.layers?.[0]?.id || '');
    setSelectedLayerId(validLayerId);

    setUndoStack(target.undoStack || []);
    setRedoStack(target.redoStack || []);
    setSymmetry(target.symmetry || {
      x: false, y: false, radial: false, radialCount: 4, centerX: target.project.width / 2, centerY: target.project.height / 2
    });
    setTiling(target.tiling || { active: false, repeatX: true, repeatY: true });
    
    setCloneSource(null);
    setActiveSelection({ active: false, pixels: [] });
    setActiveStamp(null);
    setActiveBrush(null);

    setTimeout(() => {
      isSwitchingTabRef.current = false;
    }, 50);
  };

  // Sync state changes back to tabs array
  useEffect(() => {
    if (!activeTabId || isSwitchingTabRef.current || !project) {
      return;
    }

    setTabs(prev => {
      const nextTabs = prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            project,
            fileHandle: project.fileHandle !== undefined ? project.fileHandle : t.fileHandle,
            hasDownloadedInitialFile: project.hasDownloadedInitialFile !== undefined ? project.hasDownloadedInitialFile : t.hasDownloadedInitialFile,
            selectedFrameId,
            selectedLayerId,
            focusedFrameId: frameSelection.focusedFrameId,
            anchorFrameId: frameSelection.anchorFrameId,
            selectedFrameIds: frameSelection.selectedFrameIds,
            undoStack,
            redoStack,
            symmetry,
            tiling
          };
        }
        return t;
      });
      return nextTabs;
    });
  }, [
    activeTabId,
    project,
    selectedFrameId,
    frameSelection,
    selectedLayerId,
    undoStack,
    redoStack,
    symmetry,
    tiling
  ]);

  // Monitor changes to mark the project as modified (Dirty State)
  useEffect(() => {
    if (!project?.id || isSwitchingTabRef.current) return;

    const currentContent = getProjectContentString(project);
    let lastClean = lastSavedContentRefs.current[project.id];

    if (lastClean === undefined) {
      // First time seeing this project in this session.
      // We assume the current state is the "clean" baseline state.
      lastSavedContentRefs.current[project.id] = currentContent;
      lastClean = currentContent;
    }

    const isDirty = currentContent !== lastClean;

    if (project.isModified !== isDirty) {
      setProject(prev => {
        if (prev && prev.id === project.id) {
          return { ...prev, isModified: isDirty };
        }
        return prev;
      });
    }
  }, [project?.name, project?.pixels, project?.layers, project?.frames, project?.fps]);

  // --- DEFAULT CLEAN CANVAS INITIALIZER ---
  const initDefaultCanvas = useCallback((w: number, h: number) => {
    const fresh = createInitialProject(w, h);
    const initialSymmetry = { x: false, y: false, radial: false, radialCount: 4, centerX: w / 2, centerY: h / 2 };
    const initialTiling = { active: false, repeatX: true, repeatY: true };
    const initialTab: OpenProjectTab = {
      id: fresh.id,
      project: fresh,
      selectedFrameId: fresh.frames[0].id,
      selectedLayerId: fresh.layers[0].id,
      undoStack: [],
      redoStack: [],
      symmetry: initialSymmetry,
      tiling: initialTiling
    };

    lastSavedContentRefs.current[fresh.id] = getProjectContentString(fresh);
    setTabs([initialTab]);
    setActiveTabId(fresh.id);
    setProject(fresh);
    setSymmetry(initialSymmetry);
    setTiling(initialTiling);
    setSelectedFrameId(fresh.frames[0].id);
    setSelectedLayerId(fresh.layers[0].id);
    setFrameSelection({
      activeFrameId: fresh.frames[0].id,
      focusedFrameId: fresh.frames[0].id,
      anchorFrameId: fresh.frames[0].id,
      selectedFrameIds: [fresh.frames[0].id],
    });
    setUndoStack([]);
    setRedoStack([]);
    setWelcomeOpen(false);
  }, []);

  // --- LIFECYCLE MANAGEMENT: CLEAN VOLUNTARY EXIT & BEFOREUNLOAD ---
  useEffect(() => {
    const handleVoluntaryExitCleanup = () => {
      const isCrash = localStorage.getItem('onepixel_crash_detected') === 'true';
      if (!isCrash) {
        // User is closing voluntarily: clean all temporary session data and backups
        localStorage.removeItem('pixel_art_active_session');
        localStorage.removeItem('pixel_art_autosave_backup');
        localStorage.removeItem('onepixel_crash_detected');
        localStorage.setItem('onepixel_clean_exit', 'true');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isCrash = localStorage.getItem('onepixel_crash_detected') === 'true';
      if (!isCrash) {
        const hasUnsavedChanges = tabs.some(t => t.project?.isModified);
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?';
          return e.returnValue;
        }
        handleVoluntaryExitCleanup();
      }
    };

    const handlePageHide = () => {
      handleVoluntaryExitCleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [tabs]);

  // --- INITIALIZATION & SESSION LIFECYCLE ---
  useEffect(() => {
    const isCrashDetected = localStorage.getItem('onepixel_crash_detected') === 'true';
    const isCleanExit = localStorage.getItem('onepixel_clean_exit') === 'true';
    const backup = localStorage.getItem('pixel_art_autosave_backup');

    // Scenario 1: Crash / Unexpected closure recovery
    // ONLY attempt to recover if an abnormal exit occurred (crash detected or abrupt termination without clean exit) AND backup exists
    const isAbnormalExit = isCrashDetected || (!isCleanExit && Boolean(backup));

    if (isAbnormalExit && backup) {
      setTimeout(() => {
        try {
          const deserialized = ProjectDeserializer.deserialize(backup);
          if (deserialized && deserialized.project) {
            WindowSystem.getInstance().confirm(
              'Recuperar Proyecto tras Cierre Inesperado',
              `Se ha detectado un cierre inesperado de tu sesión anterior en el proyecto "${deserialized.project.name || 'Sin título'}". ¿Deseas recuperar este trabajo pendiente?`,
              'Sí, Recuperar',
              'Descartar y Nuevo Lienzo'
            ).then((confirmed) => {
              if (confirmed) {
                // Restore backup
                setProject(deserialized.project);
                const restoredSymmetry = deserialized.symmetry || { x: false, y: false, radial: false, radialCount: 4, centerX: deserialized.project.width / 2, centerY: deserialized.project.height / 2 };
                const restoredTiling = deserialized.tiling || { active: false, repeatX: true, repeatY: true };
                setSymmetry(restoredSymmetry);
                setTiling(restoredTiling);
                if (deserialized.customPalette) {
                  setCustomPalette(deserialized.customPalette);
                }
                const restoredTab: OpenProjectTab = {
                  id: deserialized.project.id || `proj-${Date.now()}`,
                  project: deserialized.project,
                  selectedFrameId: deserialized.project.frames[0]?.id || '',
                  selectedLayerId: deserialized.project.layers[0]?.id || '',
                  undoStack: [],
                  redoStack: [],
                  symmetry: restoredSymmetry,
                  tiling: restoredTiling,
                  hasDownloadedInitialFile: deserialized.project.hasDownloadedInitialFile
                };
                lastSavedContentRefs.current[restoredTab.id] = getProjectContentString(deserialized.project);
                setTabs([restoredTab]);
                setActiveTabId(restoredTab.id);
                setSelectedFrameId(restoredTab.selectedFrameId);
                setSelectedLayerId(restoredTab.selectedLayerId);
                setFrameSelection({
                  activeFrameId: restoredTab.selectedFrameId,
                  focusedFrameId: restoredTab.selectedFrameId,
                  anchorFrameId: restoredTab.selectedFrameId,
                  selectedFrameIds: restoredTab.selectedFrameId ? [restoredTab.selectedFrameId] : [],
                });
                setWelcomeOpen(false);
                localStorage.removeItem('pixel_art_autosave_backup');
                localStorage.removeItem('onepixel_crash_detected');
                localStorage.setItem('onepixel_clean_exit', 'false');
                showToast('Proyecto recuperado con éxito tras el cierre inesperado', 'success');
              } else {
                localStorage.removeItem('pixel_art_autosave_backup');
                localStorage.removeItem('onepixel_crash_detected');
                localStorage.setItem('onepixel_clean_exit', 'false');
                initDefaultCanvas(32, 32);
                showToast('Copia descartada. Se ha iniciado un nuevo lienzo limpio.', 'info');
              }
            });
            return;
          }
        } catch (e) {
          console.error('Error parsing crash recovery backup:', e);
        }
      }, 500);
    }

    // Scenario 2: Normal startup (default)
    // Clean start by default: clean temporary session data, ignore past saved projects or past sessions
    localStorage.removeItem('pixel_art_active_session');
    localStorage.removeItem('pixel_art_autosave_backup');
    localStorage.removeItem('onepixel_crash_detected');
    // Mark current session as active (in-progress) until normal clean exit
    localStorage.setItem('onepixel_clean_exit', 'false');

    // Start completely clean as a new canvas (32x32)
    initDefaultCanvas(32, 32);

    // Force welcome screen open on normal startup
    setWelcomeOpen(true);
    setWelcomeNewProjectOpen(false);

    // Load custom swatches session
    const swatches = localStorage.getItem('pixel_art_custom_swatches');
    if (swatches) {
      try {
        setCustomPalette(JSON.parse(swatches));
      } catch (e) {}
    }

    // Load library palettes
    loadLibraryPalettes();

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [loadLibraryPalettes, initDefaultCanvas]);

  // Background Interval Auto-backup
  useEffect(() => {
    if (!project?.id || !preferences.autoSaveEnabled || tabs.length === 0) {
      return;
    }
    
    const intervalMs = Math.max(5000, autoSaveIntervalMinutes * 60 * 1000);
    const interval = setInterval(() => {
      try {
        const currentStr = ProjectSerializer.serializeToString(project, {
          symmetry,
          tiling,
          customPalette
        });
        if (currentStr !== lastAutosavedProjectRef.current) {
          try {
            localStorage.setItem('pixel_art_autosave_backup', currentStr);
            lastAutosavedProjectRef.current = currentStr;
            console.log('Copia de seguridad automática guardada de forma segura.');
          } catch (storageErr: any) {
            const now = Date.now();
            if (now - lastQuotaWarningRef.current > 60000) {
              lastQuotaWarningRef.current = now;
              showToast(translate('storage.quotaExceededToast' as any, preferences.language) || 'Almacenamiento local lleno. Exporta tu proyecto (.onepixel) para respaldar tus cambios.', 'error', 5000);
            }
          }
        }
      } catch (err: any) {
        console.warn('Auto-save backup failed:', err);
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [project, preferences.autoSaveEnabled, autoSaveIntervalMinutes, symmetry, tiling, customPalette, tabs.length]);

  // Auto-backup session locally on change if auto-save is enabled (Throttled/debounced session save)
  useEffect(() => {
    if (project?.id && preferences.autoSaveEnabled && tabs.length > 0) {
      const handler = setTimeout(() => {
        try {
          const sessionStr = ProjectSerializer.serializeToString(project, {
            symmetry,
            tiling,
            customPalette
          });
          localStorage.setItem('pixel_art_active_session', sessionStr);
          localStorage.setItem('pixel_art_autosave_backup', sessionStr);
        } catch (err: any) {
          if (err.name === 'QuotaExceededError' || err.code === 22 || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn('Could not auto-save active session due to localStorage quota limits.');
          } else {
            console.error('Error auto-saving session:', err);
          }
        }
      }, 2000); // debounce of 2 seconds to avoid freezing UI on every pixel stroke

      return () => {
        clearTimeout(handler);
      };
    } else {
      if (tabs.length === 0) {
        localStorage.removeItem('pixel_art_active_session');
      }
    }
  }, [project, preferences.autoSaveEnabled, symmetry, tiling, customPalette, tabs.length]);

  // --- PLAYBACK ENGINE ---
  useEffect(() => {
    const unsubTick = animationEventBus.subscribe('PLAYBACK_TICK', (data: { index: number }) => {
      const idx = data.index;
      if (project?.frames && idx >= 0 && idx < project.frames.length) {
        setSelectedFrameId(project.frames[idx].id);
      }
    });

    const unsubState = animationEventBus.subscribe('PLAYBACK_STATE_CHANGED', (data: { isPlaying: boolean }) => {
      setIsPlaying(data.isPlaying);
    });

    return () => {
      unsubTick();
      unsubState();
    };
  }, [project?.frames, setSelectedFrameId]);

  // Keep playback controller configured with the latest project context
  useEffect(() => {
    if (!project?.frames) return;
    const activeIndex = project.frames.findIndex(f => f.id === selectedFrameId);
    playbackController.setConfig(
      project.frames,
      activeIndex >= 0 ? activeIndex : 0,
      playbackMode,
      loopEnabled,
      1.0 // speed multiplier
    );
  }, [project?.frames, selectedFrameId, playbackMode, loopEnabled]);

  // Keep active tag synced with playback controller
  useEffect(() => {
    const activeTag = project?.animationTags?.find(t => t.id === selectedTagId) || null;
    playbackController.setActiveTag(activeTag);
  }, [selectedTagId, project?.animationTags]);

  const handleStopAnimation = useCallback(() => {
    playbackController.stop();
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      playbackController.pause();
    } else {
      const activeIndex = activeProjectRef.current.frames.findIndex(f => f.id === selectedFrameIdRef.current);
      playbackController.setConfig(
        activeProjectRef.current.frames,
        activeIndex >= 0 ? activeIndex : 0,
        playbackMode,
        loopEnabled,
        1.0 // speed multiplier
      );
      playbackController.start();
    }
  }, [isPlaying, playbackMode, loopEnabled]);

  const handleChangeFrameDuration = (index: number, durationMs: number) => {
    const cmd = new UpdateFrameDurationCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      index,
      durationMs
    );
    timelineCommandHistory.pushAndExecute(cmd);
  };



  // --- KEYBOARD SHORTCUTS FOR UNDO / REDO ---
  const shortcutsHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  const handleGlobalShortcuts = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.hasAttribute('contenteditable'))) {
      return;
    }

    // Log shortcut keys to telemetry audit trail
    telemetry.logAction('KEYBOARD_SHORTCUT', `Key pressed: ${e.key}`, {
      key: e.key,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey
    });
    
    if (e.key === 'Tab') {
      e.preventDefault();
      handleToggleZenMode();
      return;
    }

    if (e.key === 'Escape') {
      setFrameSelection(prev => SelectionService.escape(prev));
    }

    // Play/Pause on Space bar (prevent browser scroll)
    if (e.key === ' ') {
      e.preventDefault();
      handleTogglePlay();
      return;
    }

    // F1 key for Help manual
    if (e.key === 'F1') {
      e.preventDefault();
      setHelpOpen(true);
      return;
    }

    // Alt modifier shortcuts (Nuevo cuadro: Alt+F, Borrar cuadro: Alt+D)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        handleAddFrame();
        return;
      } else if (key === 'd') {
        e.preventDefault();
        handleDeleteFrame(selectedFrameId);
        return;
      }
    }

    // Frame navigation shortcuts
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextFrame();
        return;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevFrame();
        return;
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleClearCustomPalette();
        return;
      }
    }

    const isZ = e.key.toLowerCase() === 'z';
    const isY = e.key.toLowerCase() === 'y';
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && !e.shiftKey && isZ) {
      e.preventDefault();
      handleUndo();
    } else if (isCtrl && isY) {
      e.preventDefault();
      handleRedo();
    } else if (isCtrl && e.shiftKey && isZ) {
      e.preventDefault();
      handleRedo();
    } else if (isCtrl) {
      // Selection and Canvas commands with Ctrl
      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        triggerSelection('copy');
      } else if (key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAsProject();
        } else {
          handleSaveActiveProject();
        }
      } else if (key === 'x') {
        e.preventDefault();
        triggerSelection('cut');
      } else if (key === 'v') {
        e.preventDefault();
        triggerSelection('paste');
      } else if (key === 'a') {
        e.preventDefault();
        triggerSelection('select_all');
      } else if (key === 'd') {
        e.preventDefault();
        triggerSelection('deselect');
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        triggerCanvasAction('zoom_in');
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        triggerCanvasAction('zoom_out');
      } else if (e.key === '0') {
        e.preventDefault();
        triggerCanvasAction('center');
      } else if (e.key === ';') {
        e.preventDefault();
        if (e.shiftKey) {
          setGuidesLocked(prev => {
            const next = !prev;
            showToast(next ? 'Guías bloqueadas' : 'Guías desbloqueadas', 'info');
            return next;
          });
        } else {
          setGuidesVisible(prev => {
            const next = !prev;
            showToast(next ? 'Guías mostradas' : 'Guías ocultas', 'info');
            return next;
          });
        }
      }
    } else {
      // Tool hotkeys without Ctrl
      const key = e.key.toLowerCase();
      if (key === 'x') {
        e.preventDefault();
        handleSwapColors();
      } else if (key === 'd') {
        e.preventDefault();
        handleResetDefaultColors();
      } else if (key === 'b') {
        e.preventDefault();
        setCurrentTool('pen');
      } else if (key === 'e') {
        e.preventDefault();
        setCurrentTool('eraser');
      } else if (key === 'g') {
        e.preventDefault();
        setCurrentTool('bucket');
      } else if (key === 'i') {
        e.preventDefault();
        setCurrentTool('picker');
      } else if (key === 'l') {
        e.preventDefault();
        setCurrentTool('line');
      } else if (key === 'r') {
        e.preventDefault();
        setCurrentTool('rectangle');
      } else if (key === 'c') {
        e.preventDefault();
        setCurrentTool('ellipse');
      } else if (key === 's') {
        e.preventDefault();
        setCurrentTool('spray');
      } else if (key === 't') {
        e.preventDefault();
        setCurrentTool('clone_stamp');
      } else if (key === 'm') {
        e.preventDefault();
        setCurrentTool('rect_select');
      } else if (key === 'q') {
        e.preventDefault();
        setCurrentTool('lasso_select');
      } else if (key === 'w') {
        e.preventDefault();
        setCurrentTool('wand');
      } else if (key === 'h') {
        e.preventDefault();
        setCurrentTool('pan');
      } else if (e.key === '[' || e.key === ',') {
        e.preventDefault();
        setBrushSize(prev => Math.max(1, prev - 1));
      } else if (e.key === ']' || e.key === '.') {
        e.preventDefault();
        setBrushSize(prev => Math.min(32, prev + 1));
      }
    }
  };

  useEffect(() => {
    shortcutsHandlerRef.current = handleGlobalShortcuts;
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      shortcutsHandlerRef.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);

  // --- DRAWING / PIXEL UPDATES ---
  const handleStartHistoryAction = useCallback((customPixels?: any) => {
    saveSnapshotToHistory(customPixels || activeProjectRef.current.pixels);
  }, [saveSnapshotToHistory]);

  const handleUpdatePixels = useCallback((newPixels: any, saveSnapshot = false) => {
    if (saveSnapshot) {
      saveSnapshotToHistory(activeProjectRef.current.pixels);
    }
    setProject(prev => ({ ...prev, pixels: newPixels }));
  }, [saveSnapshotToHistory]);

  // --- LAYER MANAGER ACTIONS ---
  const handleAddLayer = () => {
    saveSnapshotToHistory(project.pixels);
    const newId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newId,
      name: `Capa ${project.layers.length + 1}`,
      opacity: 100,
      visible: true,
      locked: false
    };

    const updatedPixels = { ...project.pixels };
    project.frames.forEach(frame => {
      updatedPixels[frame.id] = {
        ...updatedPixels[frame.id],
        [newId]: createEmptyPixels(project.width, project.height)
      };
    });

    setProject(prev => {
      const nextLayers = [newLayer, ...prev.layers];
      if (nextLayers.length === 31) {
        setLayerWarningVisible(true);
      }
      return {
        ...prev,
        layers: nextLayers,
        pixels: updatedPixels
      };
    });
    setSelectedLayerId(newId);
  };

  const handleDeleteLayer = (id: string) => {
    if (project.layers.length <= 1) return;
    const targetLayer = project.layers.find(l => l.id === id);
    const layerName = targetLayer ? targetLayer.name : 'capa';

    setGenericPromptConfig({
      title: 'Eliminar Capa',
      description: `¿Estás seguro de que deseas eliminar la capa "${layerName}"? Esta operación es irreversible y eliminará todos los dibujos de esta capa en todos los fotogramas.`,
      fields: [],
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        saveSnapshotToHistory(project.pixels);

        const updatedLayers = project.layers.filter(l => l.id !== id);
        const updatedPixels = { ...project.pixels };
        project.frames.forEach(frame => {
          const frameLayers = { ...updatedPixels[frame.id] };
          delete frameLayers[id];
          updatedPixels[frame.id] = frameLayers;
        });

        setProject(prev => ({ ...prev, layers: updatedLayers, pixels: updatedPixels }));
        if (selectedLayerId === id) {
          setSelectedLayerId(updatedLayers[0].id);
        }
        showToast('Capa eliminada con éxito', 'success');
      }
    });
    setGenericPromptOpen(true);
  };

  const handleDuplicateLayer = (id: string) => {
    saveSnapshotToHistory(project.pixels);
    const origin = project.layers.find(l => l.id === id);
    if (!origin) return;

    const newId = `layer-dup-${Date.now()}`;
    const newLayer: Layer = {
      id: newId,
      name: `${origin.name} (Copia)`,
      opacity: origin.opacity,
      visible: true,
      locked: false
    };

    const updatedPixels = { ...project.pixels };
    project.frames.forEach(frame => {
      updatedPixels[frame.id] = {
        ...updatedPixels[frame.id],
        [newId]: [...(updatedPixels[frame.id][id] || createEmptyPixels(project.width, project.height))]
      };
    });

    const idx = project.layers.findIndex(l => l.id === id);
    const updatedLayers = [...project.layers];
    updatedLayers.splice(idx, 0, newLayer);

    if (updatedLayers.length === 31) {
      setLayerWarningVisible(true);
    }

    setProject(prev => ({ ...prev, layers: updatedLayers, pixels: updatedPixels }));
    setSelectedLayerId(newId);
  };

  const handleToggleLayerVisible = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    }));
  }, []);

  const handleToggleLayerLocked = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
    }));
  }, []);

  const handleToggleLayerStatic = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, isStatic: !l.isStatic } : l)
    }));
  }, []);

  const handleChangeLayerOpacity = useCallback((id: string, opacity: number) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, opacity } : l)
    }));
  }, []);

  const handleRenameLayer = useCallback((id: string, newName: string) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, name: newName } : l)
    }));
  }, []);

  const handleChangeLayerBlendMode = useCallback((id: string, blendMode: string) => {
    setProject(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, blendMode } : l)
    }));
  }, []);

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = project.layers.findIndex(l => l.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= project.layers.length) return;

    saveSnapshotToHistory({ ...project.pixels });
    const updatedLayers = [...project.layers];
    const [moved] = updatedLayers.splice(idx, 1);
    updatedLayers.splice(targetIdx, 0, moved);

    setProject(prev => ({ ...prev, layers: updatedLayers }));
  };

  const handleReorderLayers = (id: string, targetIdx: number) => {
    const idx = project.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    if (targetIdx < 0 || targetIdx >= project.layers.length) return;
    if (idx === targetIdx) return;

    saveSnapshotToHistory({ ...project.pixels });
    const updatedLayers = [...project.layers];
    const [moved] = updatedLayers.splice(idx, 1);
    updatedLayers.splice(targetIdx, 0, moved);

    setProject(prev => ({ ...prev, layers: updatedLayers }));
  };

  const handleMergeDownLayer = (id: string) => {
    const idx = project.layers.findIndex(l => l.id === id);
    if (idx === -1 || idx === project.layers.length - 1) return;

    saveSnapshotToHistory(project.pixels);
    const lowerLayer = project.layers[idx + 1];
    
    const updatedPixels = { ...project.pixels };
    project.frames.forEach(frame => {
      const topArr = updatedPixels[frame.id][id] || createEmptyPixels(project.width, project.height);
      const bottomArr = updatedPixels[frame.id][lowerLayer.id] || createEmptyPixels(project.width, project.height);
      const mergedArr = [...bottomArr];

      for (let i = 0; i < project.width * project.height; i++) {
        if (topArr[i]) {
          mergedArr[i] = topArr[i];
        }
      }
      updatedPixels[frame.id][lowerLayer.id] = mergedArr;
      delete updatedPixels[frame.id][id];
    });

    const updatedLayers = project.layers.filter(l => l.id !== id);

    setProject(prev => ({ ...prev, layers: updatedLayers, pixels: updatedPixels }));
    setSelectedLayerId(lowerLayer.id);
  };

  // --- TIMELINE / FRAME ACTIONS ---
  const handleAddFrame = () => {
    saveSnapshotToHistory(project.pixels);
    const newId = `frame-${Date.now()}`;
    const newIndex = project.frames.length;
    const newName = `Cuadro ${project.frames.length + 1}`;
    const cmd = new InsertFrameCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      newIndex,
      newId,
      newName,
      100 // duration
    );
    timelineCommandHistory.pushAndExecute(cmd);
    setSelectedFrameId(newId);
  };

  const handleDeleteFrame = (id: string) => {
    if (project.frames.length <= 1) return;
    const index = project.frames.findIndex(f => f.id === id);
    if (index === -1) return;
    const frameNumber = index + 1;

    setGenericPromptConfig({
      title: 'Eliminar Fotograma',
      description: `¿Estás seguro de que deseas eliminar el fotograma #${frameNumber}? Todos los dibujos de este fotograma se perderán.`,
      fields: [],
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        saveSnapshotToHistory(project.pixels);
        const cmd = new DeleteFrameCommand(
          () => project,
          (proj) => {
            setProject(proj);
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
          },
          index
        );
        timelineCommandHistory.pushAndExecute(cmd);
        
        // Choose selected frame index
        const remainingFrames = project.frames.filter(f => f.id !== id);
        if (remainingFrames.length > 0) {
          const nextActiveIndex = Math.min(index, remainingFrames.length - 1);
          setSelectedFrameId(remainingFrames[nextActiveIndex].id);
        }
        showToast('Fotograma eliminado con éxito', 'success');
      }
    });
    setGenericPromptOpen(true);
  };

  const handleDuplicateFrame = (id: string) => {
    const index = project.frames.findIndex(f => f.id === id);
    if (index === -1) return;
    saveSnapshotToHistory(project.pixels);
    const newId = `frame-dup-${Date.now()}`;
    const name = `Copia de cuadro`;

    const cmd = new DuplicateFrameCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      index,
      newId,
      name
    );
    timelineCommandHistory.pushAndExecute(cmd);
    setSelectedFrameId(newId);
  };

  // --- ANIMATION TAG ACTIONS ---
  const handleAddTag = (tag: AnimationTag) => {
    const cmd = new AddTagCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      tag
    );
    timelineCommandHistory.pushAndExecute(cmd);
    setSelectedTagId(tag.id);
  };

  const handleUpdateTag = (tagId: string, fields: Partial<Omit<AnimationTag, 'id'>>) => {
    const cmd = new UpdateTagCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      tagId,
      fields
    );
    timelineCommandHistory.pushAndExecute(cmd);
  };

  const handleDeleteTag = (tagId: string) => {
    const cmd = new DeleteTagCommand(
      () => project,
      (proj) => {
        setProject(proj);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, project: proj } : t));
      },
      tagId
    );
    timelineCommandHistory.pushAndExecute(cmd);
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
    }
  };

  // --- EDITOR LEVEL MENU ACTIONS ---
  const handleNewProject = async (width: number, height: number, bgFillColor?: string) => {
    if (width < 4 || width > 600 || height < 4 || height > 600) {
      showToast('El documento excede el límite máximo permitido de 600×600 px.', 'error');
      return;
    }
    const fresh = createInitialProject(width, height, bgFillColor);
    let finalProject = fresh;

    // In browsers with native File System Access (Chromium / Edge top-level):
    // Prompt native file picker immediately upon project creation to establish folder + filename + fileHandle
    if (isFileSystemAccessSupported()) {
      try {
        const result = await saveProjectAs(fresh, fresh.name, 'onepixel', 'Nuevo');
        if (result.success && result.savedViaHandle) {
          const derivedName = result.actualName || fresh.name;
          finalProject = {
            ...fresh,
            name: derivedName,
            fileHandle: result.fileHandle,
            hasDownloadedInitialFile: true,
            hasBeenSavedLocally: true,
            isModified: false
          };
          lastSavedContentRefs.current[finalProject.id] = getProjectContentString(finalProject);
          showToast(`¡Proyecto "${finalProject.name}.onepixel" creado y guardado!`, 'success');
        } else if (result.cancelled) {
          finalProject = {
            ...fresh,
            isModified: false
          };
        }
      } catch (err: any) {
        console.warn('Error en la selección inicial de archivo para el nuevo proyecto:', err);
      }
    }

    const newTab: OpenProjectTab = {
      id: finalProject.id,
      project: finalProject,
      selectedFrameId: finalProject.frames[0].id,
      selectedLayerId: finalProject.layers[0].id,
      undoStack: [],
      redoStack: [],
      symmetry: { x: false, y: false, radial: false, radialCount: 4, centerX: width / 2, centerY: height / 2 },
      tiling: { active: false, repeatX: true, repeatY: true },
      fileHandle: finalProject.fileHandle,
      hasDownloadedInitialFile: finalProject.hasDownloadedInitialFile
    };

    setWelcomeOpen(false);
    setTabs(prev => {
      const nextTabs = [...prev, newTab];
      setTimeout(() => switchTab(finalProject.id, nextTabs), 0);
      return nextTabs;
    });
    syncProjectWithPersistenceAndRecents(finalProject);
  };

  const syncProjectWithPersistenceAndRecents = useCallback((proj: PixelProject) => {
    try {
      const serializedObj = ProjectSerializer.serializeToObj(proj, {
        symmetry,
        tiling,
        customPalette,
        extra: { lastSaved: Date.now(), hasBeenSavedLocally: true }
      });
      const canonicalProject: PixelProject = {
        ...serializedObj,
        fileHandle: proj.fileHandle,
        hasDownloadedInitialFile: proj.hasDownloadedInitialFile
      };

      LocalPersistence.saveProject(canonicalProject);
      LocalPersistence.saveActiveSession(canonicalProject);

      const stored = localStorage.getItem('pixel_art_recent_projects');
      let recents: any[] = [];
      if (stored) {
        try {
          recents = JSON.parse(stored);
        } catch (e) {
          recents = [];
        }
      }
      recents = recents.filter((r: any) => r.id !== proj.id && r.name !== proj.name);
      recents.unshift({
        id: canonicalProject.id,
        name: canonicalProject.name,
        width: canonicalProject.width,
        height: canonicalProject.height,
        timestamp: Date.now(),
        projectData: canonicalProject
      });
      recents = recents.slice(0, 5);
      try {
        localStorage.setItem('pixel_art_recent_projects', JSON.stringify(recents));
      } catch (quotaErr) {
        recents = recents.map((item, idx) => ({
          ...item,
          projectData: idx === 0 ? item.projectData : undefined,
          isMetadataOnly: idx !== 0
        }));
        try {
          localStorage.setItem('pixel_art_recent_projects', JSON.stringify(recents));
        } catch (e2) {}
      }
    } catch (err) {
      console.warn('Error synchronizing project with persistence:', err);
    }
  }, [symmetry, tiling, customPalette]);

  async function handleSaveActiveProject() {
    if (!project) return;
    saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] USER_ACTION', {
      action: 'Ctrl+S / Archivo -> Guardar',
      projectId: project.id,
      projectName: project.name,
      activeTabId,
      hasProjectFileHandle: !!project.fileHandle,
      hasTabFileHandle: !!tabs.find(t => t.id === activeTabId)?.fileHandle,
      hasDownloadedInitialFile: !!project.hasDownloadedInitialFile,
      hasBeenSavedLocally: project.hasBeenSavedLocally,
      fileFormat: project.fileFormat
    });

    try {
      // Find the active handle from project or active tab
      const currentHandle = project.fileHandle || tabs.find(t => t.id === activeTabId)?.fileHandle;
      const currentHasDownloaded = project.hasDownloadedInitialFile || tabs.find(t => t.id === activeTabId)?.hasDownloadedInitialFile || false;

      saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] BEFORE_SERIALIZE', {
        projectId: project.id,
        currentHandleName: currentHandle?.name || null,
        hasDownloadedInitialFile: currentHasDownloaded
      });

      // Conserve all project state (layers, animations, palettes, symmetry, etc.)
      const serialized = ProjectSerializer.serializeToObj(project, {
        symmetry,
        tiling,
        customPalette,
        extra: { lastSaved: Date.now() }
      });

      const updatedProject: PixelProject = {
        ...serialized,
        fileHandle: currentHandle,
        hasDownloadedInitialFile: currentHasDownloaded
      };

      saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] BEFORE_SAVE_PROJECT', {
        projectId: updatedProject.id,
        projectName: updatedProject.name,
        hasFileHandle: !!updatedProject.fileHandle,
        fileHandleName: updatedProject.fileHandle?.name || null,
        hasDownloadedInitialFile: !!updatedProject.hasDownloadedInitialFile
      });

      // Execute saveProject:
      // - Overwrites directly if fileHandle exists.
      // - If no handle & Chromium: prompts native picker.
      // - If no handle & Firefox/Safari/iframe:
      //     - First time: downloads initial physical file once.
      //     - Later times: persists locally without download spam.
      const result = await saveProject(updatedProject);

      saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] SAVE_RESULT', {
        success: result.success,
        savedViaHandle: result.savedViaHandle,
        hasResultHandle: !!result.fileHandle,
        actualName: result.actualName,
        hasDownloadedInitialFile: result.hasDownloadedInitialFile,
        cancelled: result.cancelled,
        error: result.error ? (result.error.message || result.error) : null
      });

      if (result.cancelled) {
        saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] SAVE_CANCELLED', {
          action: 'Operación cancelada por el usuario'
        });
        return; // User cancelled file picker
      }

      if (result.success) {
        const projectWithHandle: PixelProject = {
          ...updatedProject,
          name: result.actualName || updatedProject.name,
          fileHandle: result.savedViaHandle ? (result.fileHandle || currentHandle) : null,
          hasDownloadedInitialFile: result.hasDownloadedInitialFile !== undefined ? result.hasDownloadedInitialFile : true,
          hasBeenSavedLocally: true,
          isModified: false
        };

        saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] HANDLE_ATTACHED', {
          projectId: projectWithHandle.id,
          projectName: projectWithHandle.name,
          hasFileHandle: !!projectWithHandle.fileHandle,
          fileHandleName: projectWithHandle.fileHandle?.name || null,
          hasDownloadedInitialFile: projectWithHandle.hasDownloadedInitialFile
        });

        lastSavedContentRefs.current[projectWithHandle.id] = getProjectContentString(projectWithHandle);
        setProject(projectWithHandle);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { 
          ...t, 
          project: projectWithHandle, 
          fileHandle: projectWithHandle.fileHandle,
          hasDownloadedInitialFile: projectWithHandle.hasDownloadedInitialFile
        } : t));
        syncProjectWithPersistenceAndRecents(projectWithHandle);
        
        let successMsg = `¡Proyecto guardado como "${projectWithHandle.name}.${projectWithHandle.fileFormat || 'onepixel'}"!`;
        if (result.savedViaHandle) {
          successMsg = `¡Proyecto guardado en disco como "${projectWithHandle.name}.${projectWithHandle.fileFormat || 'onepixel'}"!`;
        } else if (currentHasDownloaded) {
          successMsg = `Proyecto guardado localmente`;
        } else {
          successMsg = `¡Proyecto descargado y guardado como "${projectWithHandle.name}.${projectWithHandle.fileFormat || 'onepixel'}"!`;
        }

        showToast(successMsg, 'success');
      } else {
        throw result.error || new Error('No se pudo completar el guardado del proyecto.');
      }
    } catch (e: any) {
      saveDebug('handleSaveActiveProject', '[DEBUG_SAVE] SAVE_ERROR', {
        errorName: e.name,
        errorMessage: e.message || String(e),
        errorStack: e.stack
      });
      console.error('[Save Error Critical] Error en handleSaveActiveProject:', e);
      showToast(`Error al guardar: ${e.message || e}`, 'error');
    }
  }

  async function handleSaveAsProject() {
    if (!project) return;
    saveDebug('handleSaveAsProject', '[DEBUG_SAVE] USER_ACTION', {
      action: 'Ctrl+Shift+S / Archivo -> Guardar Como',
      projectId: project.id,
      projectName: project.name,
      activeTabId,
      hasProjectFileHandle: !!project.fileHandle,
      hasTabFileHandle: !!tabs.find(t => t.id === activeTabId)?.fileHandle,
      hasBeenSavedLocally: project.hasBeenSavedLocally,
      fileFormat: project.fileFormat
    });

    // If File System Access API is not supported (Firefox, Safari, iframe), open the explicit SaveAsModal
    if (!isFileSystemAccessSupported()) {
      setSaveAsModalOpen(true);
      return;
    }

    // Otherwise, in Chromium top-level, use native picker directly
    await executeSaveAsWorkflow(project.name);
  }

  async function executeSaveAsWorkflow(chosenName: string) {
    if (!project) return;
    try {
      const serialized = ProjectSerializer.serializeToObj(project, {
        symmetry,
        tiling,
        customPalette,
        extra: { lastSaved: Date.now() }
      });

      const updatedProject: PixelProject = {
        ...serialized,
        name: chosenName.trim() || project.name,
        fileHandle: undefined
      };

      saveDebug('handleSaveAsProject', '[DEBUG_SAVE] CALLING_SAVE_AS', {
        suggestedName: updatedProject.name,
        format: project.fileFormat || 'onepixel'
      });

      const result = await saveProjectAs(updatedProject, updatedProject.name, project.fileFormat || 'onepixel');

      saveDebug('handleSaveAsProject', '[DEBUG_SAVE] SAVE_RESULT', {
        success: result.success,
        savedViaHandle: result.savedViaHandle,
        hasResultHandle: !!result.fileHandle,
        actualName: result.actualName,
        cancelled: result.cancelled,
        error: result.error ? (result.error.message || result.error) : null
      });

      if (result.cancelled) {
        saveDebug('handleSaveAsProject', '[DEBUG_SAVE] SAVE_CANCELLED', {
          action: 'Operación cancelada por el usuario en Guardar Como'
        });
        return; // User cancelled file picker or modal
      }

      if (result.success) {
        const projectWithHandle: PixelProject = {
          ...updatedProject,
          name: result.actualName || updatedProject.name,
          fileHandle: result.savedViaHandle ? result.fileHandle : null,
          hasDownloadedInitialFile: true,
          hasBeenSavedLocally: true,
          isModified: false
        };

        saveDebug('handleSaveAsProject', '[DEBUG_SAVE] HANDLE_ATTACHED', {
          projectId: projectWithHandle.id,
          projectName: projectWithHandle.name,
          hasFileHandle: !!projectWithHandle.fileHandle,
          fileHandleName: projectWithHandle.fileHandle?.name || null
        });

        lastSavedContentRefs.current[projectWithHandle.id] = getProjectContentString(projectWithHandle);
        setProject(projectWithHandle);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { 
          ...t, 
          project: projectWithHandle, 
          fileHandle: projectWithHandle.fileHandle,
          hasDownloadedInitialFile: true
        } : t));
        syncProjectWithPersistenceAndRecents(projectWithHandle);

        showToast(
          translate('toasts.savedAsSuccess', preferences.language) || `¡Proyecto guardado exitosamente como "${projectWithHandle.name}.${projectWithHandle.fileFormat || 'onepixel'}"!`,
          'success'
        );
      } else {
        throw result.error || new Error('No se pudo completar el guardado con Guardar Como.');
      }
    } catch (e: any) {
      saveDebug('handleSaveAsProject', '[DEBUG_SAVE] SAVE_ERROR', {
        errorName: e.name,
        errorMessage: e.message || String(e),
        errorStack: e.stack
      });
      console.error('[SaveAs Error Critical] Error en handleSaveAsProject:', e);
      showToast(`Error en Guardar Como: ${e.message || e}`, 'error');
    }
  }

  const handleImportProject = (imported: PixelProject) => {
    const deserialized = ProjectDeserializer.deserialize(imported);
    const cleanProj = deserialized.project;

    if (cleanProj.width > 600 || cleanProj.height > 600) {
      showToast(`El documento excede el límite máximo permitido de 600×600 px (${cleanProj.width}×${cleanProj.height} px).`, 'error');
      return;
    }

    const projId = cleanProj.id || `proj-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const cleanImported = { ...cleanProj, id: projId };

    const newTab: OpenProjectTab = {
      id: projId,
      project: cleanImported,
      selectedFrameId: cleanImported.frames[0]?.id || '',
      selectedLayerId: cleanImported.layers[0]?.id || '',
      undoStack: [],
      redoStack: [],
      symmetry: deserialized.symmetry,
      tiling: deserialized.tiling,
      fileHandle: cleanImported.fileHandle,
      fileFormat: cleanImported.fileFormat
    };

    if (deserialized.customPalette) {
      setCustomPalette(deserialized.customPalette);
    }

    setWelcomeOpen(false);
    syncProjectWithPersistenceAndRecents(cleanImported);
    setTabs(prev => {
      const nextTabs = [...prev, newTab];
      setTimeout(() => switchTab(projId, nextTabs), 0);
      return nextTabs;
    });
  };

  const handleExportProjectJson = async () => {
    saveDebug('handleExportProjectJson', 'Exportando proyecto activo con saveManager...');
    const result = await saveProject(project);
    if (result.success) {
      showToast('Proyecto exportado con éxito.', 'success');
    } else {
      showToast('Error al exportar el proyecto.', 'error');
    }
  };

  const requestCloseTab = (tabId: string) => {
    const targetTab = tabs.find(t => t.id === tabId);
    if (!targetTab) return;

    if (targetTab.project?.isModified) {
      setCloseTabId(tabId);
      setCloseTabModalOpen(true);
    } else {
      executeCloseTab(tabId, false);
    }
  };

  const executeCloseTab = async (tabId: string, saveFirst = false) => {
    const targetTab = tabs.find(t => t.id === tabId);
    if (!targetTab) return;

    if (saveFirst) {
      // Trigger save of that specific tab's project using centralized saveManager
      const result = await saveProject(targetTab.project);
      if (!result.success) {
        showToast('Error al guardar el proyecto antes de cerrar.', 'error');
        return; // Prevent closing if saving failed
      }
      showToast('Proyecto guardado correctamente.', 'success');
    }

    const remainingTabs = tabs.filter(t => t.id !== tabId);
    if (remainingTabs.length === 0) {
      setTabs([]);
      setActiveTabId('');
      setProject(null);
      setSelectedFrameId('');
      setSelectedLayerId('');
      setUndoStack([]);
      setRedoStack([]);
      localStorage.removeItem('pixel_art_active_session');
    } else {
      const closingIndex = tabs.findIndex(t => t.id === tabId);
      const nextActiveIndex = Math.min(closingIndex, remainingTabs.length - 1);
      const nextTab = remainingTabs[nextActiveIndex >= 0 ? nextActiveIndex : 0];

      if (tabId === activeTabId) {
        switchTab(nextTab.id, remainingTabs);
      }
      setTabs(remainingTabs);
    }

    setCloseTabModalOpen(false);
    setCloseTabId(null);
  };

  const executeCloseAll = () => {
    setTabs([]);
    setActiveTabId('');
    setProject(null);
    setSelectedFrameId('');
    setSelectedLayerId('');
    setUndoStack([]);
    setRedoStack([]);
    setCloseAllModalOpen(false);
    localStorage.removeItem('pixel_art_active_session');
    localStorage.removeItem('pixel_art_autosave_backup');
  };

  const handleCloseAllRequest = () => {
    const hasUnsavedChanges = tabs.some(t => t.project?.isModified);
    if (hasUnsavedChanges) {
      setCloseAllModalOpen(true);
    } else {
      executeCloseAll();
    }
  };

  const executeExit = () => {
    localStorage.removeItem('pixel_art_active_session');
    localStorage.removeItem('pixel_art_autosave_backup');
    localStorage.removeItem('onepixel_crash_detected');
    localStorage.setItem('onepixel_clean_exit', 'true');
    setIsExited(true);
    setExitModalOpen(false);
  };

  const handleMirrorLayer = (direction: 'horizontal' | 'vertical') => {
    if (!project) return;
    const framePixels = project.pixels[selectedFrameId];
    const layerPixels = framePixels?.[selectedLayerId];
    if (!layerPixels) return;

    saveSnapshotToHistory(project.pixels);
    const updated = { ...project.pixels };
    const mirrored = [...layerPixels];

    for (let y = 0; y < project.height; y++) {
      for (let x = 0; x < project.width; x++) {
        const ox = direction === 'horizontal' ? project.width - 1 - x : x;
        const oy = direction === 'vertical' ? project.height - 1 - y : y;
        
        mirrored[y * project.width + x] = layerPixels[oy * project.width + ox];
      }
    }

    updated[selectedFrameId] = {
      ...updated[selectedFrameId],
      [selectedLayerId]: mirrored
    };
    setProject(prev => ({ ...prev, pixels: updated }));
  };

  const handleClearLayer = () => {
    if (!project) return;
    const framePixels = project.pixels[selectedFrameId];
    const layerPixels = framePixels?.[selectedLayerId];
    if (!layerPixels) return;

    saveSnapshotToHistory(project.pixels);
    const updated = { ...project.pixels };
    updated[selectedFrameId] = {
      ...updated[selectedFrameId],
      [selectedLayerId]: createEmptyPixels(project.width, project.height)
    };
    setProject(prev => prev ? ({ ...prev, pixels: updated }) : null);
  };

  // --- EXTENDED MENU ACTIONS (Rotar, Invertir, Presets, Ventanas) ---
  const handleRotateSprite = (angle: 90 | 180) => {
    if (!project) return;
    saveSnapshotToHistory(project.pixels);
    const updated = { ...project.pixels };
    const w = project.width;
    const h = project.height;

    project.frames.forEach(frame => {
      project.layers.forEach(layer => {
        const original = project.pixels[frame.id]?.[layer.id];
        if (!original) return;

        const res = angle === 90 
          ? MatrixTransform.rotate90(original, w, h)
          : MatrixTransform.rotate180(original, w, h);
        updated[frame.id] = {
          ...updated[frame.id],
          [layer.id]: res.data
        };
      });
    });

    setProject(prev => prev ? ({ ...prev, pixels: updated }) : null);
  };

  const handleInvertColors = () => {
    if (!project) return;
    saveSnapshotToHistory(project.pixels);
    const updated = { ...project.pixels };

    const invertColor = (hex: string) => {
      if (!hex || hex === '') return '';
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      
      const ir = (255 - r).toString(16).padStart(2, '0');
      const ig = (255 - g).toString(16).padStart(2, '0');
      const ib = (255 - b).toString(16).padStart(2, '0');
      return `#${ir}${ig}${ib}`;
    };

    project.frames.forEach(frame => {
      project.layers.forEach(layer => {
        const original = project.pixels[frame.id]?.[layer.id];
        if (!original) return;
        const inverted = original.map(invertColor);
        updated[frame.id] = {
          ...updated[frame.id],
          [layer.id]: inverted
        };
      });
    });

    setProject(prev => prev ? ({ ...prev, pixels: updated }) : null);
  };

  const handleLoadPalettePreset = (name: string) => {
    const presets: Record<string, string[]> = {
      'Resprite Classic': ['#1a1b2e', '#2a2b4d', '#3d3e75', '#5556a3', '#C8A96A', '#9596f2', '#bcbdff', '#e0e1ff', '#2d162c', '#4d2042', '#752d5b', '#a33c75', '#d65193', '#f272b1', '#ff9ecf', '#ffcce3'],
      'Fantasy PICO-8': ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'],
      'GameBoy Retro': ['#071821', '#306850', '#86c06c', '#e0f8cf'],
      'Cyberpunk 2077': ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226'],
      'Retro NES': ['#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000']
    };
    const colors = presets[name];
    if (colors) {
      setCustomPalette(colors);
      localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(colors));
      if (colors.length > 0) setCurrentColor(colors[0]);
    }
  };

  const handleLoadExtractedPalette = useCallback((colors: string[]) => {
    setCustomPalette(colors);
    localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(colors));
    if (colors.length > 0) setCurrentColor(colors[0]);
  }, []);

  const handleResetLayout = () => {
    setSidebarVisible(true);
    setColorsVisible(true);
    setToolsVisible(true);
    setGridVisible(true);
    setTimelineVisible(true);
    setZenModeActive(false);
    localStorage.removeItem('onepixel_zen_mode_active');
    localStorage.removeItem('onepixel_pre_zen_layout');
  };

  const handleToggleZenMode = () => {
    setZenModeActive(prev => {
      const nextZen = !prev;
      localStorage.setItem('onepixel_zen_mode_active', String(nextZen));
      
      if (nextZen) {
        // Guardar estado actual
        const currentLayout = {
          sidebarVisible,
          colorsVisible,
          toolsVisible,
          timelineVisible
        };
        setPreZenLayout(currentLayout);
        localStorage.setItem('onepixel_pre_zen_layout', JSON.stringify(currentLayout));
        
        // Ocultar paneles
        setSidebarVisible(false);
        setColorsVisible(false);
        setToolsVisible(false);
        setTimelineVisible(false);
        
        showToast(translate('layout.zenModeActivated', preferences.language) || 'Modo Zen activado (Tab para salir)', 'info');
      } else {
        // Restaurar estado guardado
        const saved = localStorage.getItem('onepixel_pre_zen_layout');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed) {
          setSidebarVisible(parsed.sidebarVisible);
          setColorsVisible(parsed.colorsVisible);
          setToolsVisible(parsed.toolsVisible);
          setTimelineVisible(parsed.timelineVisible);
        } else {
          setSidebarVisible(true);
          setColorsVisible(true);
          setToolsVisible(true);
          setTimelineVisible(true);
        }
        showToast(translate('layout.zenModeDeactivated', preferences.language) || 'Modo Zen desactivado', 'info');
      }
      return nextZen;
    });
  };

  const toggleSidebarManual = () => {
    setSidebarVisible(v => {
      const next = !v;
      setToolsVisible(next);
      return next;
    });
    setZenModeActive(false);
  };

  const toggleToolsManual = () => {
    setToolsVisible(v => {
      const next = !v;
      setSidebarVisible(next);
      return next;
    });
    setZenModeActive(false);
  };

  const toggleColorsManual = () => {
    setColorsVisible(v => !v);
    setZenModeActive(false);
  };

  const toggleTimelineManual = () => {
    setTimelineVisible(v => !v);
    setZenModeActive(false);
  };

  const handleAddToCustomPalette = useCallback((col: string) => {
    setCustomPalette(prev => {
      const lower = col.toLowerCase();
      if (!prev.some(c => c.toLowerCase() === lower)) {
        const updated = [...prev, col];
        localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const handleRemoveFromCustomPalette = useCallback((col: string) => {
    setCustomPalette(prev => {
      const updated = prev.filter(c => c.toLowerCase() !== col.toLowerCase());
      localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClearCustomPalette = useCallback(() => {
    setCustomPalette([]);
    localStorage.removeItem('pixel_art_custom_swatches');
  }, []);

  const triggerSelection = (action: 'select_all' | 'deselect' | 'invert' | 'cut' | 'copy' | 'paste' | 'fill' | 'select_by_color') => {
    setSelectionCommand({ action, timestamp: Date.now() });
  };

  const triggerCanvasAction = (action: 'zoom_in' | 'zoom_out' | 'center') => {
    setCanvasCommand({ action, timestamp: Date.now() });
  };

  const handleOpenExportDialog = useCallback(() => {
    setIsPlaying(false);
    setExportOpen(true);
  }, []);

  const handleQuickExport = useCallback(async () => {
    if (!project) {
      showToast(translate('common.error', preferences.language) || 'No hay un proyecto activo para exportar.', 'error');
      return;
    }

    try {
      setIsPlaying(false);
      const result = await ExportPipeline.execute({
        project,
        pluginId: 'png',
        scale: 1,
        options: {
          filename: project.name || 'pixel-art',
          transparent: true,
          range: 'all'
        }
      });

      showToast(`¡Exportación rápida guardada: "${result.filename}.png"!`, 'success');
    } catch (err: any) {
      if (err instanceof CancelError || err?.name === 'CancelError' || err?.name === 'AbortError' || err?.message?.includes('cancelado') || err?.message?.includes('cancelled')) {
        return;
      }
      console.error('Error en exportación rápida:', err);
      showToast(`Error al exportar: ${err.message || err}`, 'error');
    }
  }, [project, preferences.language, showToast]);

  const handleOpenLibrary = useCallback(() => {
    setLibraryOpen(true);
  }, []);

  const handleToggleOnionSkin = useCallback(() => {
    setOnionSkinSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const handleSetOnionSkinOpacity = useCallback((opacity: number) => {
    const valBefore = opacity / 100;
    setOnionSkinSettings(prev => ({ 
      ...prev, 
      opacityBefore: valBefore
    }));
  }, []);

  const handleUpdateOnionSkinSettings = useCallback((updater: Partial<OnionSkinSettings>) => {
    setOnionSkinSettings(prev => ({ ...prev, ...updater }));
  }, []);

  const handleToggleLoop = useCallback(() => {
    setLoopEnabled(prev => !prev);
  }, []);

  const handleNextFrame = () => {
    if (!project?.frames || project.frames.length <= 1) return;
    const rawIdx = project.frames.findIndex(f => f.id === selectedFrameId);
    const currentIdx = rawIdx >= 0 ? rawIdx : 0;
    const nextIdx = (currentIdx + 1) % project.frames.length;
    setSelectedFrameId(project.frames[nextIdx].id);
  };

  const handlePrevFrame = () => {
    if (!project?.frames || project.frames.length <= 1) return;
    const rawIdx = project.frames.findIndex(f => f.id === selectedFrameId);
    const currentIdx = rawIdx >= 0 ? rawIdx : 0;
    const prevIdx = (currentIdx - 1 + project.frames.length) % project.frames.length;
    setSelectedFrameId(project.frames[prevIdx].id);
  };

  const handleIncreaseFps = useCallback(() => {
    setProject(prev => ({ ...prev, fps: Math.min(120, prev.fps + 1) }));
  }, []);

  const handleDecreaseFps = useCallback(() => {
    setProject(prev => ({ ...prev, fps: Math.max(1, prev.fps - 1) }));
  }, []);

  const handleChangeFps = useCallback((fps: number) => {
    setProject(prev => ({ ...prev, fps: Math.max(1, Math.min(120, fps)) }));
  }, []);

  const handleReorderFrames = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const proj = activeProjectRef.current;
    const sourceIndex = proj.frames.findIndex(f => f.id === draggedId);
    const targetIndex = proj.frames.findIndex(f => f.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const cmd = new MoveFrameCommand(
      () => activeProjectRef.current,
      (updatedProj) => {
        setProject(updatedProj);
        setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, project: updatedProj } : t));
      },
      sourceIndex,
      targetIndex
    );
    timelineCommandHistory.pushAndExecute(cmd);
  }, []);

  const handleMoveFrameLeft = useCallback(() => {
    const proj = activeProjectRef.current;
    const currentIdx = proj.frames.findIndex(f => f.id === selectedFrameIdRef.current);
    if (currentIdx <= 0) return;
    
    saveSnapshotToHistory(proj.pixels);
    const cmd = new MoveFrameCommand(
      () => activeProjectRef.current,
      (updatedProj) => {
        setProject(updatedProj);
        setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, project: updatedProj } : t));
      },
      currentIdx,
      currentIdx - 1
    );
    timelineCommandHistory.pushAndExecute(cmd);
  }, [saveSnapshotToHistory]);

  const handleMoveFrameRight = useCallback(() => {
    const proj = activeProjectRef.current;
    const currentIdx = proj.frames.findIndex(f => f.id === selectedFrameIdRef.current);
    if (currentIdx === -1 || currentIdx >= proj.frames.length - 1) return;
    
    saveSnapshotToHistory(proj.pixels);
    const cmd = new MoveFrameCommand(
      () => activeProjectRef.current,
      (updatedProj) => {
        setProject(updatedProj);
        setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, project: updatedProj } : t));
      },
      currentIdx,
      currentIdx + 1
    );
    timelineCommandHistory.pushAndExecute(cmd);
  }, [saveSnapshotToHistory]);

  const triggerSelectionExpand = () => {
    setSelectionCommand({ action: 'expand_selection', timestamp: Date.now() });
  };

  const triggerSelectionContract = () => {
    setSelectionCommand({ action: 'contract_selection', timestamp: Date.now() });
  };

  const handleMaximizeWorkspace = () => {
    setSidebarVisible(false);
    setColorsVisible(false);
    setToolsVisible(false);
    setGridVisible(false);
    setTimelineVisible(false);
  };

  const handleInvertPalette = () => {
    const inverted = customPalette.map(hex => {
      if (!hex || hex === '') return '';
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      const ir = (255 - r).toString(16).padStart(2, '0');
      const ig = (255 - g).toString(16).padStart(2, '0');
      const ib = (255 - b).toString(16).padStart(2, '0');
      return `#${ir}${ig}${ib}`;
    });
    setCustomPalette(inverted);
    localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(inverted));
  };

  const handleResizeCanvas = (newW: number, newH: number) => {
    try {
      if (!project) throw new Error("No active project found during canvas resize");
      if (newW < 4 || newW > 600 || newH < 4 || newH > 600) {
        showToast('El documento excede el límite máximo permitido de 600×600 px.', 'error');
        return;
      }
      telemetry.logAction('ACTION_CANVAS_RESIZE', 'Initiated canvas resize', { from: `${project.width}x${project.height}`, to: `${newW}x${newH}` });
      saveSnapshotToHistory(project.pixels);
      const oldW = project.width;
      const oldH = project.height;
      const updatedPixels = { ...project.pixels };

      project.frames.forEach(frame => {
        let frameLayers = updatedPixels[frame.id] ? { ...updatedPixels[frame.id] } : {};
        project.layers.forEach(layer => {
          const oldArr = project.pixels[frame.id]?.[layer.id] || [];
          const newArr = new Array(newW * newH).fill('');
          for (let y = 0; y < Math.min(oldH, newH); y++) {
            for (let x = 0; x < Math.min(oldW, newW); x++) {
              newArr[y * newW + x] = oldArr[y * oldW + x] || '';
            }
          }
          frameLayers[layer.id] = newArr;
        });
        updatedPixels[frame.id] = frameLayers;
      });

      const updatedProject = {
        ...project,
        width: newW,
        height: newH,
        pixels: updatedPixels
      };

      if (activeSelection.active) {
        const newPixels = new Array(newW * newH).fill(false);
        for (let y = 0; y < Math.min(oldH, newH); y++) {
          for (let x = 0; x < Math.min(oldW, newW); x++) {
            newPixels[y * newW + x] = activeSelection.pixels[y * oldW + x] || false;
          }
        }
        setActiveSelection({ active: true, pixels: newPixels });
      } else {
        setActiveSelection({ active: false, pixels: [] });
      }

      setSelectionCommand({ action: 'deselect', timestamp: Date.now() });
      layerCacheManager.clear();

      setProject(updatedProject);
      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        project: updatedProject
      } : t));
    } catch (e) {
      telemetry.reportFatalError(e, 'CANVAS_RESIZE');
    }
  };

  const handleScaleSprite = (newW: number, newH: number) => {
    try {
      if (!project) throw new Error("No active project found during sprite scale");
      if (newW < 4 || newW > 600 || newH < 4 || newH > 600) {
        showToast('El documento excede el límite máximo permitido de 600×600 px.', 'error');
        return;
      }
      telemetry.logAction('ACTION_SPRITE_SCALE', 'Initiated sprite scaling', { from: `${project.width}x${project.height}`, to: `${newW}x${newH}` });
      saveSnapshotToHistory(project.pixels);
      const oldW = project.width;
      const oldH = project.height;
      const updatedPixels = { ...project.pixels };

      project.frames.forEach(frame => {
        let frameLayers = updatedPixels[frame.id] ? { ...updatedPixels[frame.id] } : {};
        project.layers.forEach(layer => {
          const oldArr = project.pixels[frame.id]?.[layer.id] || [];
          const newArr = new Array(newW * newH).fill('');
          for (let y = 0; y < newH; y++) {
            for (let x = 0; x < newW; x++) {
              const ox = Math.floor((x * oldW) / newW);
              const oy = Math.floor((y * oldH) / newH);
              newArr[y * newW + x] = oldArr[oy * oldW + ox] || '';
            }
          }
          frameLayers[layer.id] = newArr;
        });
        updatedPixels[frame.id] = frameLayers;
      });

      const updatedProject = {
        ...project,
        width: newW,
        height: newH,
        pixels: updatedPixels
      };

      if (activeSelection.active) {
        const newPixels = new Array(newW * newH).fill(false);
        for (let y = 0; y < newH; y++) {
          for (let x = 0; x < newW; x++) {
            const ox = Math.floor((x * oldW) / newW);
            const oy = Math.floor((y * oldH) / newH);
            newPixels[y * newW + x] = activeSelection.pixels[oy * oldW + ox] || false;
          }
        }
        setActiveSelection({ active: true, pixels: newPixels });
      } else {
        setActiveSelection({ active: false, pixels: [] });
      }

      setSelectionCommand({ action: 'deselect', timestamp: Date.now() });
      layerCacheManager.clear();

      setProject(updatedProject);
      setTabs(prev => prev.map(t => t.id === activeTabId ? {
        ...t,
        project: updatedProject
      } : t));
    } catch (e) {
      telemetry.reportFatalError(e, 'SPRITE_SCALE');
    }
  };

  const handleExportDiagnosticsReport = () => {
    try {
      const stateInfo = telemetry.getLastKnownState();
      const auditTrail = telemetry.getAuditTrail();
      const metricsSummary = telemetry.getMetricsSummary();
      const zoom = stateInfo?.zoomLevel || 100;

      const report = {
        appName: "OnePixel Studio",
        appVersion: "1.4.0-diagnostics",
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        screen: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        } : null,
        reportType: "MANUAL_DIAGNOSTICS_REPORT",
        metrics: metricsSummary,
        lastKnownState: {
          ...stateInfo,
          undoStackSize: undoStack.length,
          redoStackSize: redoStack.length,
          viewport: {
            zoomLevel: zoom,
            activeTool: currentTool,
            selectedFrameId,
            selectedLayerId
          }
        },
        auditTrail: auditTrail.slice(-100)
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `diagnostics-report-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      telemetry.logAction('DIAGNOSTICS_DOWNLOAD', 'User manually exported complete diagnostics report');
      showToast('Informe de diagnóstico exportado correctamente.', 'success');
    } catch (e) {
      console.error('Failed to manually download diagnostics report:', e);
      showToast('Error al exportar el informe de diagnóstico.', 'error');
    }
  };

  const handleToggleDiagnosticsMode = () => {
    const nextVal = !preferences.diagnosticsModeEnabled;
    const newPrefs = {
      ...preferences,
      diagnosticsModeEnabled: nextVal
    };
    handleChangePreferences(newPrefs);
    showToast(nextVal ? 'Modo de diagnóstico activado.' : 'Modo de diagnóstico desactivado.', 'info');
  };

  const handleCropToSelection = useCallback(() => {
    if (!project || !activeSelection.active || activeSelection.pixels.length === 0) {
      showToast('No hay ninguna selección activa para recortar.', 'error');
      return;
    }

    const oldW = project.width;
    const oldH = project.height;

    let minX = oldW;
    let maxX = -1;
    let minY = oldH;
    let maxY = -1;

    for (let y = 0; y < oldH; y++) {
      for (let x = 0; x < oldW; x++) {
        if (activeSelection.pixels[y * oldW + x]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      showToast('No hay ninguna selección activa para recortar.', 'error');
      return;
    }

    const newW = maxX - minX + 1;
    const newH = maxY - minY + 1;

    saveSnapshotToHistory(project.pixels);

    const updatedPixels: Record<string, Record<string, string[]>> = {};

    for (const frame of project.frames) {
      const frameId = frame.id;
      updatedPixels[frameId] = {};
      const frameData = project.pixels[frameId] || {};

      for (const layer of project.layers) {
        const oldLayerPixels = frameData[layer.id] || [];
        const newLayerPixels = new Array(newW * newH).fill('');

        for (let y = 0; y < newH; y++) {
          for (let x = 0; x < newW; x++) {
            const srcX = minX + x;
            const srcY = minY + y;
            if (srcX >= 0 && srcX < oldW && srcY >= 0 && srcY < oldH) {
              newLayerPixels[y * newW + x] = oldLayerPixels[srcY * oldW + srcX] || '';
            }
          }
        }

        updatedPixels[frameId][layer.id] = newLayerPixels;
      }
    }

    const updatedProject: PixelProject = {
      ...project,
      width: newW,
      height: newH,
      pixels: updatedPixels
    };

    setActiveSelection({ active: false, pixels: [] });
    setSelectionCommand({ action: 'deselect', timestamp: Date.now() });
    layerCacheManager.clear();

    setProject(updatedProject);
    setTabs(prev => prev.map(t => t.id === activeTabId ? {
      ...t,
      width: newW,
      height: newH,
      project: updatedProject
    } : t));

    showToast(`Lienzo recortado a ${newW}x${newH}px`, 'success');
  }, [project, activeSelection, saveSnapshotToHistory, activeTabId, showToast]);

  const handleSaveOriginalPattern = (patternName: string) => {
    const framePixels = project.pixels[selectedFrameId];
    const layerPixels = framePixels?.[selectedLayerId];
    if (!layerPixels) {
      showToast('Error: No hay píxeles en la capa actual.', 'error');
      return;
    }

    let startX = 0, startY = 0;
    let cropW = project.width;
    let cropH = project.height;

    // We can crop the pattern size to the active selection bounding box if active, otherwise full screen
    if (activeSelection.active) {
      let minX = project.width, maxX = -1, minY = project.height, maxY = -1;
      let hasSel = false;
      for (let y = 0; y < project.height; y++) {
        for (let x = 0; x < project.width; x++) {
          if (activeSelection.pixels[y * project.width + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasSel = true;
          }
        }
      }
      if (hasSel) {
        startX = minX;
        startY = minY;
        cropW = maxX - minX + 1;
        cropH = maxY - minY + 1;
      }
    }

    // Capture the colors
    const pixels: string[] = [];
    for (let y = startY; y < startY + cropH; y++) {
      for (let x = startX; x < startX + cropW; x++) {
        const color = layerPixels[y * project.width + x] || '';
        pixels.push(color);
      }
    }

    const newPattern = {
      id: `custom-${Date.now()}`,
      name: patternName || `Patrón Original`,
      category: 'custom',
      pixels,
      width: cropW,
      height: cropH
    };

    // Load existing custom patterns, append, and save
    const stored = localStorage.getItem('resprite_custom_patterns');
    let customList = [];
    if (stored) {
      try {
        customList = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    const updatedList = [...customList, newPattern];
    localStorage.setItem('resprite_custom_patterns', JSON.stringify(updatedList));

    showToast(`¡Patrón original "${patternName}" guardado correctamente! Podrás usarlo en la herramienta de Patrones de Textura.`, 'success');
  };

  const handleSaveStamp = (name: string, tags: string[], mode: 'exact' | 'trimmed') => {
    try {
      const framePixels = project.pixels?.[selectedFrameId];
      const layerPixels = framePixels?.[selectedLayerId];
      
      if (!layerPixels || !activeSelection.active || !activeSelection.pixels) {
        showToast(translate('toolbar.saveStampError', preferences.language || 'es'), 'error');
        return;
      }

      // Convert selection pixels and layer pixels into a StampResource
      const stamp = CaptureService.captureSelection(
        activeSelection.pixels,
        layerPixels,
        project.width,
        project.height,
        {
          name,
          tags,
          mode
        }
      );

      // Save using LibraryService
      LibraryService.saveStamp(stamp);

      showToast(translate('toolbar.saveStampSuccess', preferences.language || 'es'), 'success');
    } catch (err: any) {
      showToast(`${translate('toolbar.saveStampError', preferences.language || 'es')}: ${err.message || err}`, 'error');
    }
  };

  // Expose the real editor API for automated QA Certification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).onePixelQA = {
        project,
        setProject,
        tabs,
        setTabs,
        activeTabId,
        setActiveTabId,
        setSelectedFrameId,
        selectedLayerId,
        setSelectedLayerId,
        undoStack,
        redoStack,
        handleUndo,
        handleRedo,
        currentTool,
        setCurrentTool,
        handleAddLayer,
        handleDeleteLayer,
        handleDuplicateLayer,
        handleResizeCanvas,
        handleScaleSprite,
        handleAddFrame,
        handleDeleteFrame,
        handleDuplicateFrame,
        handleMoveFrameLeft,
        handleMoveFrameRight,
        handleRotateSprite,
        handleUpdatePixels,
        switchTab,
        executeCloseTab,
        activeSelection,
        setActiveSelection,
        saveSnapshotToHistory
      };
    }
  }, [
    project, setProject, tabs, setTabs, activeTabId, setActiveTabId,
    setSelectedFrameId, selectedLayerId, setSelectedLayerId,
    undoStack, redoStack, handleUndo, handleRedo, currentTool, setCurrentTool,
    handleAddLayer, handleDeleteLayer, handleDuplicateLayer,
    handleResizeCanvas, handleScaleSprite, handleAddFrame, handleDeleteFrame,
    handleDuplicateFrame, handleMoveFrameLeft, handleMoveFrameRight,
    handleRotateSprite, handleUpdatePixels, switchTab, executeCloseTab,
    activeSelection, setActiveSelection, saveSnapshotToHistory
  ]);

  // --- ACTION SYSTEM & GLOBAL EVENTS REGISTRATION ---
  useEffect(() => {
    // Register actions in ActionSystem
    const registerActions = () => {
      actionSystem.registerAction({
        id: 'tool.pen', name: 'Pincel', category: 'Herramientas',
        execute: () => setCurrentTool('pen')
      });
      actionSystem.registerAction({
        id: 'tool.eraser', name: 'Borrador', category: 'Herramientas',
        execute: () => setCurrentTool('eraser')
      });
      actionSystem.registerAction({
        id: 'tool.line', name: 'Línea', category: 'Herramientas',
        execute: () => setCurrentTool('line')
      });
      actionSystem.registerAction({
        id: 'tool.rectangle', name: 'Rectángulo', category: 'Herramientas',
        execute: () => setCurrentTool('rectangle')
      });
      actionSystem.registerAction({
        id: 'tool.ellipse', name: 'Elipse', category: 'Herramientas',
        execute: () => setCurrentTool('ellipse')
      });
      actionSystem.registerAction({
        id: 'tool.bucket', name: 'Bote de Pintura', category: 'Herramientas',
        execute: () => setCurrentTool('bucket')
      });
      actionSystem.registerAction({
        id: 'tool.picker', name: 'Gotero de Color', category: 'Herramientas',
        execute: () => setCurrentTool('picker')
      });
      actionSystem.registerAction({
        id: 'tool.rect_select', name: 'Selección Rectangular', category: 'Herramientas',
        execute: () => setCurrentTool('rect_select')
      });
      actionSystem.registerAction({
        id: 'tool.lasso_select', name: 'Selección de Lazo', category: 'Herramientas',
        execute: () => setCurrentTool('lasso_select')
      });
      actionSystem.registerAction({
        id: 'tool.wand', name: 'Varita Mágica', category: 'Herramientas',
        execute: () => setCurrentTool('wand')
      });
      actionSystem.registerAction({
        id: 'tool.spray', name: 'Aerosol / Spray', category: 'Herramientas',
        execute: () => setCurrentTool('spray')
      });
      actionSystem.registerAction({
        id: 'tool.clone_stamp', name: 'Tampón de Clonar', category: 'Herramientas',
        execute: () => setCurrentTool('clone_stamp')
      });
      actionSystem.registerAction({
        id: 'tool.pan', name: 'Mano / Pan', category: 'Herramientas',
        execute: () => setCurrentTool('pan')
      });

      actionSystem.registerAction({
        id: 'edit.undo', name: 'Deshacer', category: 'Edición',
        execute: () => handleUndo()
      });
      actionSystem.registerAction({
        id: 'edit.redo', name: 'Rehacer', category: 'Edición',
        execute: () => handleRedo()
      });
      actionSystem.registerAction({
        id: 'edit.select_all', name: 'Seleccionar Todo', category: 'Edición',
        execute: () => triggerSelection('select_all')
      });
      actionSystem.registerAction({
        id: 'edit.deselect', name: 'Deseleccionar', category: 'Edición',
        execute: () => triggerSelection('deselect')
      });
      actionSystem.registerAction({
        id: 'edit.delete', name: 'Borrar Selección', category: 'Edición',
        execute: () => {
          if (!activeSelection.active || !activeSelection.pixels) return;
          saveSnapshotToHistory(project.pixels);

          const updatedPixels = { ...project.pixels };
          const framePixels = { ...(updatedPixels[selectedFrameId] || {}) };
          const layerPixels = [...(framePixels[selectedLayerId] || [])];
          
          if (layerPixels.length > 0) {
            for (let i = 0; i < layerPixels.length; i++) {
              if (activeSelection.pixels[i]) {
                layerPixels[i] = '';
              }
            }
            framePixels[selectedLayerId] = layerPixels;
            updatedPixels[selectedFrameId] = framePixels;
            setProject(prev => ({ ...prev, pixels: updatedPixels }));
            showToast('Selección borrada', 'success');
          }
        }
      });

      actionSystem.registerAction({
        id: 'project.save', name: 'Guardar Proyecto', category: 'Proyecto',
        execute: () => handleSaveActiveProject()
      });
      actionSystem.registerAction({
        id: 'project.save_as', name: 'Guardar como...', category: 'Proyecto',
        execute: () => handleSaveAsProject()
      });
      actionSystem.registerAction({
        id: 'project.export', name: 'Exportar Proyecto', category: 'Proyecto',
        execute: () => setExportOpen(true)
      });
      actionSystem.registerAction({
        id: 'project.quick_export', name: 'Exportación rápida', category: 'Proyecto',
        execute: () => handleQuickExport()
      });

      actionSystem.registerAction({
        id: 'view.zoom_in', name: 'Acercar Zoom', category: 'Vista',
        execute: () => triggerCanvasAction('zoom_in')
      });
      actionSystem.registerAction({
        id: 'view.zoom_out', name: 'Alejar Zoom', category: 'Vista',
        execute: () => triggerCanvasAction('zoom_out')
      });
      actionSystem.registerAction({
        id: 'view.center', name: 'Centrar Vista', category: 'Vista',
        execute: () => triggerCanvasAction('center')
      });
      actionSystem.registerAction({
        id: 'view.zen_mode', name: 'Modo Zen', category: 'Vista',
        execute: () => handleToggleZenMode()
      });

      actionSystem.registerAction({
        id: 'animation.play', name: 'Reproducir / Pausar', category: 'Animación',
        execute: () => handleTogglePlay()
      });
      actionSystem.registerAction({
        id: 'animation.next', name: 'Siguiente Cuadro', category: 'Animación',
        execute: () => handleNextFrame()
      });
      actionSystem.registerAction({
        id: 'animation.prev', name: 'Cuadro Anterior', category: 'Animación',
        execute: () => handlePrevFrame()
      });
      actionSystem.registerAction({
        id: 'animation.add_frame', name: 'Nuevo Cuadro', category: 'Animación',
        execute: () => handleAddFrame()
      });
      actionSystem.registerAction({
        id: 'animation.delete_frame', name: 'Borrar Cuadro', category: 'Animación',
        execute: () => handleDeleteFrame(selectedFrameIdRef.current)
      });

      actionSystem.registerAction({
        id: 'help.open', name: 'Abrir Centro de Ayuda', category: 'Ayuda',
        execute: () => setHelpOpen(true)
      });
    };

    registerActions();

    // Set up global notifications listener via the EventBus subscribe method
    const unsubscribeNotification = animationEventBus.subscribe('SHOW_NOTIFICATION', (data: any) => {
      showToast(data.message, data.type || 'info');
    });

    return () => {
      unsubscribeNotification();
      actionSystem.clear();
    };
  }, [
    project, selectedFrameId, selectedLayerId, activeSelection, setCurrentTool,
    handleUndo, handleRedo, triggerSelection, handleSaveActiveProject,
    triggerCanvasAction, setExportOpen, handleQuickExport, handleToggleZenMode, handleTogglePlay,
    handleNextFrame, handlePrevFrame, handleAddFrame, handleDeleteFrame, showToast,
    saveSnapshotToHistory
  ]);

  return (
    <AppErrorBoundary>
      <div 
        ref={containerRef}
        className={`h-screen max-h-screen overflow-hidden text-slate-100 flex flex-col selection:bg-brand-sage/30 selection:text-white antialiased font-sans theme-${theme} interface-${preferences.interfaceColor || 'gold'} ui-${preferences.interfaceSize === 'sm' ? 'compact' : preferences.interfaceSize === 'lg' ? 'comfortable' : preferences.interfaceSize === 'xl' ? 'spacious' : 'normal'} colorblind-${preferences.colorBlindness || 'none'} ${preferences.highContrast ? 'high-contrast' : ''} ${
          awe.isMobileLandscape
            ? 'p-0.5 gap-0.5'
            : preferences.interfaceSize === 'sm' 
            ? 'p-0.5 gap-0.5' 
            : preferences.interfaceSize === 'lg' 
            ? 'p-1 gap-1' 
            : preferences.interfaceSize === 'xl'
            ? 'p-1.5 gap-1.5'
            : 'p-0.5 sm:p-1 gap-0.5 sm:gap-1'
        }`} 
        id="app-root"
      >
      
      {/* Hidden Color Blindness SVG Filters */}
      <svg id="colorblind-filters" style={{ display: 'none' }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05,  0, 0, 0, 0,  0,  0.433, 0.567, 0, 0,  0,  0.475, 0.525, 0, 0,  0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
      
      {/* Top Dropdown Header Menu (Includes the 9 requested menu bars) */}
      <HeaderBoundary>
        <HeaderMenu 
          project={project}
          currentFrameId={selectedFrameId}
          currentLayerId={selectedLayerId}
          currentTool={currentTool}
          currentColor={currentColor}
          onMobilePanelToggle={(panel) => setActiveMobilePanel(activeMobilePanel === panel ? null : panel)}
          onUpdatePixels={handleUpdatePixels}
          onNewProject={handleNewProject}
          onSaveProject={handleSaveActiveProject}
          onSaveAsProject={handleSaveAsProject}
          onOpenLibrary={handleOpenLibrary}
          onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
          onOpenExport={handleOpenExportDialog}
          onQuickExport={handleQuickExport}
          onImportProject={handleImportProject}
          onUpdateProject={(updated, newLayerId) => {
            setProject(updated);
            if (newLayerId) {
              setSelectedLayerId(newLayerId);
            }
          }}
          onExportProjectJson={handleExportProjectJson}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCloseProject={() => requestCloseTab(activeTabId)}
          onCloseAllProjects={handleCloseAllRequest}
          onExitApplication={() => setExitModalOpen(true)}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onMirrorLayer={handleMirrorLayer}
          onClearLayer={handleClearLayer}
          onRotateSprite={handleRotateSprite}
          onInvertColors={handleInvertColors}
          onPatternsClick={() => setPatternsOpen(true)}
          
          onSelectAll={() => triggerSelection('select_all')}
          onDeselect={() => triggerSelection('deselect')}
          onInvertSelection={() => triggerSelection('invert')}
          onSelectByColor={() => triggerSelection('select_by_color')}
          onFillSelection={() => triggerSelection('fill')}
          onCutSelection={() => triggerSelection('cut')}
          onCopySelection={() => triggerSelection('copy')}
          onPasteSelection={() => triggerSelection('paste')}
          onExpandSelection={triggerSelectionExpand}
          onContractSelection={triggerSelectionContract}
          onCropToSelection={handleCropToSelection}
          onPreferencesClick={() => setPreferencesOpen(true)}

          gridVisible={gridVisible}
          onToggleGrid={handleToggleGrid}
          onCenterCanvas={() => triggerCanvasAction('center')}
          onZoomIn={() => triggerCanvasAction('zoom_in')}
          onZoomOut={() => triggerCanvasAction('zoom_out')}
          onionSkinEnabled={onionSkinEnabled}
          onToggleOnionSkin={handleToggleOnionSkin}
          tilingActive={tiling.active}
          onToggleTiling={() => setTiling(t => ({ ...t, active: !t.active }))}
          symmetryActive={symmetry.x || symmetry.y}
          onToggleSymmetry={() => setSymmetry(s => ({ ...s, x: !s.x, y: !s.y }))}

          guidesVisible={guidesVisible}
          guidesLocked={guidesLocked}
          rulersVisible={rulersVisible}
          snappingEnabled={snappingEnabled}
          onToggleGuides={handleToggleGuides}
          onToggleGuidesLocked={() => setGuidesLocked(!guidesLocked)}
          onToggleRulers={handleToggleRulers}
          onToggleSnapping={handleToggleSnapping}
          onClearGuides={handleClearGuides}

          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onAddFrame={handleAddFrame}
          onDeleteFrame={() => handleDeleteFrame(selectedFrameId)}
          onDuplicateFrame={handleDuplicateFrame}
          onNextFrame={handleNextFrame}
          onPrevFrame={handlePrevFrame}
          onIncreaseFps={handleIncreaseFps}
          onDecreaseFps={handleDecreaseFps}
          playbackMode={playbackMode}
          onChangePlaybackMode={setPlaybackMode}
          onChangeFps={handleChangeFps}

          onResetLayout={handleResetLayout}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={toggleSidebarManual}
          colorsVisible={colorsVisible}
          onToggleColors={toggleColorsManual}
          toolsVisible={toolsVisible}
          onToggleTools={toggleToolsManual}
          timelineVisible={timelineVisible}
          onToggleTimeline={toggleTimelineManual}
          onMaximizeWorkspace={handleMaximizeWorkspace}

          onLoadPalettePreset={handleLoadPalettePreset}
          onNewPalette={handleClearCustomPalette}
          onInvertPalette={handleInvertPalette}
          onAddToPalette={() => handleAddToCustomPalette(currentColor)}

          onAboutClick={() => setAboutOpen(true)}
          onDonateClick={() => setDonationOpen(true)}
          onHelpClick={(tab) => {
            setHelpInitialTab(tab || 'manual');
            setHelpOpen(true);
          }}
          onLegalClick={(section) => {
            setLegalInitialSection((section as any) || 'terms');
            setLegalOpen(true);
          }}
          onStartTour={() => setTourOpen(true)}
          onWelcomeClick={() => setWelcomeOpen(true)}

          onScaleSprite={handleScaleSprite}
          onResizeCanvas={handleResizeCanvas}
          onSaveOriginalPattern={handleSaveOriginalPattern}
          theme={theme}
          onChangeTheme={setTheme}
          showToast={showToast}
          language={preferences.language}
          onDiagnosticsClick={() => setDiagnosticsOpen(true)}
          onQAClick={() => setQaOpen(true)}
          onExportDiagnosticsReport={handleExportDiagnosticsReport}
          onSimulateCrash={() => setShouldCrash(true)}
          diagnosticsModeEnabled={preferences.diagnosticsModeEnabled}
          onToggleDiagnosticsMode={handleToggleDiagnosticsMode}
        />
      </HeaderBoundary>

      {/* Tab bar representing open projects (completely hidden in mobile landscape to maximize canvas workspace) */}
      {!awe.isMobileLandscape && (
        <div className="px-2 py-0.5 flex items-center gap-1 overflow-x-auto scrollbar-thin shrink-0" id="project-tabs-container">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (!isActive) switchTab(tab.id);
                }}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition select-none max-w-[180px] shrink-0 border ${
                  isActive
                    ? 'bg-[#102419] border-[#C8A96A] text-slate-100 shadow-md'
                    : 'bg-[#102419]/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#102419]'
                }`}
              >
                {/* Active dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] shrink-0" />
                )}
                {/* Tab Title */}
                <span className="truncate pr-4 font-sans flex items-center gap-1" title={tab.project?.name}>
                  {tab.project?.name || translate('common.untitled', preferences.language)}
                  {tab.project?.isModified && (
                    <span className="text-amber-400 font-extrabold ml-0.5 animate-pulse" title={translate('layout.unsavedChanges', preferences.language)}>*</span>
                  )}
                </span>
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestCloseTab(tab.id);
                  }}
                  className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            onClick={() => handleNewProject(32, 32)}
            className="flex items-center justify-center p-1.5 rounded-lg border border-[#102419]/40 hover:border-[#C8A96A]/50 bg-[#102419] hover:bg-[#102419] text-slate-400 hover:text-slate-200 transition"
            title={translate('layout.newProjectTab', preferences.language)}
          >
            <span className="text-xs font-bold font-sans px-1">+ {translate('layout.newProjectTab', preferences.language)}</span>
          </button>
        </div>
      )}

      {/* Flexible Full Workspace with collapsing sections */}
      {layerWarningVisible && (
        <div className="bg-amber-600/25 border border-amber-500/50 rounded-xl px-4 py-2.5 mx-4 flex items-center justify-between text-xs text-amber-200" id="layers-warning-banner">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{translate('layout.layerLimitWarning', preferences.language)}</span>
          </div>
          <button 
            onClick={() => setLayerWarningVisible(false)}
            className="p-1 hover:bg-amber-500/20 rounded font-bold text-white transition leading-none text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className={`flex-1 flex ${awe.isMobile ? 'flex-col' : 'flex-row'} min-h-0 ${preferences.leftHandedMode ? (awe.isMobile ? '' : 'flex-row-reverse') : ''}`} style={preferences.interfaceSize === 'sm' ? { fontSize: '11px' } : preferences.interfaceSize === 'lg' ? { fontSize: '15px' } : preferences.interfaceSize === 'xl' ? { fontSize: '17px' } : {}}>
        
        {/* Left Column 1: Vertical Slim Toolbar - hidden on mobile, shown on tablet/desktop */}
        <SidebarBoundary>
          <div 
            className={`${awe.isMobile ? 'hidden' : 'block'} relative shrink-0 transition-all duration-300 ease-in-out`}
            style={{
              width: sidebarVisible ? (awe.width < 1200 ? '172px' : '198px') : '0px',
              marginInlineEnd: sidebarVisible ? (awe.interfaceDensity === 'compact' ? '2px' : '4px') : '0px',
            }}
            id="left-toolbar-wrapper"
          >
            {/* Transitioning Inner Container */}
            <div 
              className="w-full h-full flex flex-col gap-2 transition-all duration-300 ease-in-out pr-0.5 scrollbar-thin"
              style={{
                opacity: sidebarVisible ? 1 : 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                pointerEvents: sidebarVisible ? 'auto' : 'none'
              }}
            >
              <Toolbar 
                currentTool={currentTool}
                onChangeTool={setCurrentTool}
                brushSize={brushSize}
                onChangeBrushSize={setBrushSize}
                symmetry={symmetry}
                onChangeSymmetry={setSymmetry}
                tiling={tiling}
                onChangeTiling={setTiling}
                sprayDensity={sprayDensity}
                onChangeSprayDensity={setSprayDensity}
                sprayRandomness={sprayRandomness}
                onChangeSprayRandomness={setSprayRandomness}
                sprayShape={sprayShape}
                onChangeSprayShape={setSprayShape}
                ditheringPattern={ditheringPattern}
                onChangeDitheringPattern={setDitheringPattern}
                cloneSource={cloneSource}
                onChangeCloneSource={setCloneSource}
                activeBrush={activeBrush}
                onChangeActiveBrush={setActiveBrush}
                pixelPerfect={pixelPerfect}
                onChangePixelPerfect={setPixelPerfect}
                bucketContiguous={bucketContiguous}
                onChangeBucketContiguous={setBucketContiguous}
                bucketRefer={bucketRefer}
                onChangeBucketRefer={setBucketRefer}
                language={preferences.language}
                largeButtons={preferences.largeButtons}
              />

              <LayerManager 
                layers={project?.layers || []}
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onToggleVisible={handleToggleLayerVisible}
                onToggleLocked={handleToggleLayerLocked}
                onToggleStatic={handleToggleLayerStatic}
                onChangeOpacity={handleChangeLayerOpacity}
                onMoveLayer={handleMoveLayer}
                onMergeDown={handleMergeDownLayer}
                onReorderLayers={handleReorderLayers}
                onRenameLayer={handleRenameLayer}
                onChangeBlendMode={handleChangeLayerBlendMode}
                language={preferences.language}
              />
            </div>

            {/* Toggle Handle Button */}
            <button
              onClick={toggleSidebarManual}
              className={`absolute top-1/2 -translate-y-1/2 cursor-pointer z-30 flex items-center justify-center transition-all duration-200 border bg-brand-petroleum hover:bg-brand-turquoise border-brand-turquoise/30 text-slate-400 hover:text-white shadow-lg touch-manipulation`}
              style={{
                width: awe.isTablet ? '18px' : '14px',
                height: awe.isTablet ? '54px' : '48px',
                [preferences.leftHandedMode ? 'left' : 'right']: awe.isTablet ? '-18px' : '-14px',
                borderTopRightRadius: preferences.leftHandedMode ? '0px' : '6px',
                borderBottomRightRadius: preferences.leftHandedMode ? '0px' : '6px',
                borderTopLeftRadius: preferences.leftHandedMode ? '6px' : '0px',
                borderBottomLeftRadius: preferences.leftHandedMode ? '6px' : '0px',
                borderLeftWidth: preferences.leftHandedMode ? '1px' : '0px',
                borderRightWidth: preferences.leftHandedMode ? '0px' : '1px',
              }}
              title={sidebarVisible ? "Ocultar Panel Izquierdo" : "Mostrar Panel Izquierdo"}
            >
              {sidebarVisible ? (
                preferences.leftHandedMode ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                preferences.leftHandedMode ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </SidebarBoundary>



        {/* Center Workspace (Canvas and Timeline - the LARGEST section) */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${
          awe.isMobileLandscape ? 'gap-0.5' : (awe.interfaceDensity === 'compact' ? 'gap-0.5' : 'gap-1')
        }`}>
          
          {/* Options Bar (hidden in mobile landscape to maximize canvas workspace; options are accessible via Tools panel) */}
          {!awe.isMobileLandscape && (
            <OptionBar
              currentTool={currentTool}
              language={preferences.language || 'es'}
              brushSize={brushSize}
              onChangeBrushSize={setBrushSize}
              pixelPerfect={pixelPerfect}
              onChangePixelPerfect={setPixelPerfect}
              activeBrush={activeBrush}
              onChangeActiveBrush={setActiveBrush}
              sprayDensity={sprayDensity}
              onChangeSprayDensity={setSprayDensity}
              sprayRandomness={sprayRandomness}
              onChangeSprayRandomness={setSprayRandomness}
              sprayShape={sprayShape}
              onChangeSprayShape={setSprayShape}
              ditheringPattern={ditheringPattern}
              onChangeDitheringPattern={setDitheringPattern}
              cloneSource={cloneSource}
              onChangeCloneSource={setCloneSource}
              bucketContiguous={bucketContiguous}
              onChangeBucketContiguous={setBucketContiguous}
              bucketRefer={bucketRefer}
              onChangeBucketRefer={setBucketRefer}
              tolerance={tolerance}
              onChangeTolerance={setTolerance}
              symmetry={symmetry}
              onChangeSymmetry={setSymmetry}
              tiling={tiling}
              onChangeTiling={setTiling}
              fillShape={fillShape}
              onChangeFillShape={setFillShape}
              selectionActive={activeSelection.active}
              onClearSelection={() => triggerSelection('deselect')}
              onInvertSelection={() => triggerSelection('invert')}
              onSaveAsStamp={() => setIsCaptureModalOpen(true)}
              onOpenAssetLibrary={() => setAssetLibraryOpen(true)}
              activeStamp={activeStamp}
              onClearActiveStamp={() => setActiveStamp(null)}
              stampScale={stampScale}
              onChangeStampScale={setStampScale}
              stampRotation={stampRotation}
              onChangeStampRotation={setStampRotation}
              stampFlipH={stampFlipH}
              onChangeStampFlipH={setStampFlipH}
              stampFlipV={stampFlipV}
              onChangeStampFlipV={setStampFlipV}
              patternMode={patternMode}
              onChangePatternMode={setPatternMode}
            />
          )}
          
          {/* Main drawing canvas area (centered, most highlighted component) */}
          <div className={`flex-1 min-h-0 w-full flex flex-col ${awe.isMobileLandscape ? 'pb-14' : ''}`}>
            <CanvasBoundary>
              {(!project || !project.frames || project.frames.length === 0 || tabs.length === 0) ? (
                <EmptyWorkspace 
                  onNewProject={() => {
                    setWelcomeNewProjectOpen(true);
                    setWelcomeOpen(true);
                  }}
                  onOpenWelcome={() => setWelcomeOpen(true)}
                  onCreateDefault={() => handleNewProject(32, 32)}
                />
              ) : (
                <CanvasArea 
                  key={project.id}
                  project={project}
                  language={preferences.language}
                  currentFrameId={selectedFrameId}
                  currentLayerId={selectedLayerId}
                  currentTool={currentTool}
                  currentColor={currentColor}
                  brushOpacity={brushOpacity}
                  brushSize={brushSize}
                  symmetry={symmetry}
                  tiling={tiling}
                  onionSkinEnabled={onionSkinEnabled}
                  onionSkinOpacity={onionSkinOpacity}
                  onionSkinSettings={onionSkinSettings}
                  onUpdatePixels={handleUpdatePixels}
                  onStartHistoryAction={handleStartHistoryAction}
                  onPickColor={handleColorChange}
                  gridVisible={gridVisible}
                  canvasCommand={canvasCommand}
                  selectionCommand={selectionCommand}
                  onSelectionChange={setActiveSelection}
                  sprayDensity={sprayDensity}
                  sprayRandomness={sprayRandomness}
                  sprayShape={sprayShape}
                  ditheringPattern={ditheringPattern}
                  cloneSource={cloneSource}
                  onChangeCloneSource={setCloneSource}
                  activeStamp={activeStamp}
                  onClearActiveStamp={() => setActiveStamp(null)}
                  activeBrush={activeBrush}
                  onRecordColorUsage={handleRecordColorUsage}
                  pixelPerfect={pixelPerfect}
                  bucketContiguous={bucketContiguous}
                  bucketRefer={bucketRefer}
                  tolerance={tolerance}
                  fillShape={fillShape}
                  
                  gridSize={gridSize}
                  gridColor={gridColor}
                  gridOpacity={gridOpacity}
                  symmetryAxisColor={symmetryAxisColor}

                  guides={project.guides || []}
                  guidesVisible={guidesVisible}
                  guidesLocked={guidesLocked}
                  rulersVisible={rulersVisible}
                  snappingEnabled={snappingEnabled}
                  onAddGuide={handleAddGuide}
                  onMoveGuide={handleMoveGuide}
                  onRemoveGuide={handleRemoveGuide}
                  colorBlindness={preferences.colorBlindness}
                  theme={theme}
                  themeColor={preferences.interfaceColor}
                />
              )}
            </CanvasBoundary>
          </div>
        </div>

        {/* Right Column (Preview Panel + Color Selector) - matches canvas height, non-collapsible */}
        <SidebarBoundary>
          <div 
            className={`${awe.isMobile ? 'hidden' : 'flex'} flex-col shrink-0 h-full select-none gap-1.5`}
            style={{
              width: awe.width < 1200 ? '240px' : '264px',
              marginInlineStart: awe.interfaceDensity === 'compact' ? '2px' : '4px',
            }}
            id="right-column-container"
          >
            {/* Always-visible Preview Panel beside canvas */}
            <div className="w-full shrink-0" id="preview-panel-dock">
              <PreviewPanel 
                project={project}
                currentFrameId={selectedFrameId}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                language={preferences.language}
              />
            </div>

            {/* Fixed, full vertical stretch Color Panel (no collapse button, matching canvas height, scrollable) */}
            <div 
              className="flex-1 min-h-0 w-full flex flex-col overflow-hidden"
              id="right-column-wrapper"
            >
              <ColorPanel 
                currentColor={currentColor}
                secondaryColor={secondaryColor}
                activeColorSlot={activeColorSlot}
                onChangeColor={handleColorChange}
                onChangeSecondaryColor={setSecondaryColor}
                onSwapColors={handleSwapColors}
                onResetDefaultColors={handleResetDefaultColors}
                onChangeActiveColorSlot={setActiveColorSlot}
                opacity={brushOpacity}
                onChangeOpacity={setBrushOpacity}
                documentColors={documentColors}
                customPalette={customPalette}
                onAddToCustomPalette={handleAddToCustomPalette}
                onClearCustomPalette={handleClearCustomPalette}
                onRemoveFromCustomPalette={handleRemoveFromCustomPalette}
                onInvertPalette={handleInvertPalette}
                onSavePaletteToLibrary={handleOpenLibrary}
                onOpenLibrary={handleOpenLibrary}
                recentColors={recentColors}
                onClearRecentColors={handleClearRecentColors}
                onSaveRecentAsPalette={handleSaveRecentAsPalette}
                language={preferences.language}
                libraryPalettes={libraryPalettes}
                onLoadPalette={(colors) => {
                  setCustomPalette(colors);
                  localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(colors));
                  if (colors.length > 0) setCurrentColor(colors[0]);
                }}
                showToast={showToast}
              />
            </div>
          </div>
        </SidebarBoundary>

      </div>

      {/* Animation Timeline (placed on the very bottom, stretching across the entire width) - hidden on mobile, shown on tablet/desktop */}
      <TimelineBoundary>
        <div 
          className={`${awe.isMobile ? 'hidden' : 'block'} w-full relative transition-all duration-300 ease-in-out shrink-0`}
          style={{
            height: timelineVisible ? 'auto' : '0px',
            maxHeight: timelineVisible ? '500px' : '0px',
            marginTop: timelineVisible ? '2px' : '0px',
            overflow: timelineVisible ? 'visible' : 'hidden'
          }}
          id="bottom-timeline-wrapper"
        >
          {/* Transitioning Inner Container */}
          <div
            className="w-full transition-all duration-300 ease-in-out"
            style={{
              opacity: timelineVisible ? 1 : 0,
              overflow: timelineVisible ? 'visible' : 'hidden',
              pointerEvents: timelineVisible ? 'auto' : 'none'
            }}
          >
            <Timeline 
              frames={project?.frames || []}
              selectedFrameId={selectedFrameId}
              onSelectFrame={setSelectedFrameId}
              selection={frameSelection}
              onSelectionChange={setFrameSelection}
              onAddFrame={handleAddFrame}
              onDeleteFrame={handleDeleteFrame}
              onDuplicateFrame={handleDuplicateFrame}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onStop={handleStopAnimation}
              fps={project?.fps || 12}
              onChangeFps={handleChangeFps}
              onionSkinEnabled={onionSkinEnabled}
              onToggleOnionSkin={handleToggleOnionSkin}
              onionSkinOpacity={onionSkinOpacity}
              onChangeOnionSkinOpacity={handleSetOnionSkinOpacity}
              onionSkinSettings={onionSkinSettings}
              onUpdateOnionSkinSettings={handleUpdateOnionSkinSettings}
              loopEnabled={loopEnabled}
              onToggleLoop={handleToggleLoop}
              layers={project?.layers || []}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onToggleVisible={handleToggleLayerVisible}
              onToggleLocked={handleToggleLayerLocked}
              onToggleStatic={handleToggleLayerStatic}
              pixels={project?.pixels || {}}
              onReorderFrames={handleReorderFrames}
              onMoveFrameLeft={handleMoveFrameLeft}
              onMoveFrameRight={handleMoveFrameRight}
              playbackMode={playbackMode}
              onChangePlaybackMode={setPlaybackMode}
              onOpenExport={handleOpenExportDialog}
              onChangeFrameDuration={handleChangeFrameDuration}
              animationTags={project?.animationTags || []}
              selectedTagId={selectedTagId}
              onSelectTag={setSelectedTagId}
              onAddTag={handleAddTag}
              onUpdateTag={handleUpdateTag}
              onDeleteTag={handleDeleteTag}
              language={preferences.language}
            />
          </div>

          {/* Toggle Handle Button */}
          <button
            onClick={toggleTimelineManual}
            className="absolute left-1/2 -translate-x-1/2 top-[-16px] w-16 h-4 bg-brand-petroleum hover:bg-brand-turquoise border-t border-x border-brand-turquoise/30 text-slate-400 hover:text-white rounded-t-lg flex items-center justify-center cursor-pointer z-30 transition-all duration-150 shadow-md touch-manipulation"
            title={timelineVisible ? "Ocultar Línea de Tiempo" : "Mostrar Línea de Tiempo"}
          >
            {timelineVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </TimelineBoundary>

      {/* --- MOBILE-ONLY PANEL TOGGLE DOCK --- */}
      {awe.isMobile && (
        <div className={`fixed left-1/2 -translate-x-1/2 bg-[#102419]/95 border border-[#102419] shadow-2xl flex items-center z-40 backdrop-blur-md transition-all duration-150 ${
          awe.isMobileLandscape
            ? 'bottom-2 px-3 py-1.5 rounded-full gap-3 justify-center'
            : 'bottom-4 px-3 py-1.5 rounded-2xl gap-2 sm:gap-4 w-[92%] max-w-sm justify-around'
        }`} id="mobile-navigation-dock">
          {/* 1. Herramientas */}
          <button
            onClick={() => setActiveMobilePanel(activeMobilePanel === 'tools' ? null : 'tools')}
            className={`flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer ${
              awe.isMobileLandscape 
                ? 'w-9 h-9 rounded-full' 
                : 'flex-col gap-0.5 min-w-[56px] min-h-[44px] p-1.5 rounded-xl'
            } ${
              activeMobilePanel === 'tools' 
                ? (awe.isMobileLandscape ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md' : 'bg-[#102419] text-[#C8A96A] font-bold shadow-inner')
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={translate('toolbar.title', preferences.language) || 'Herramientas'}
            id="mobile-btn-tools"
          >
            <PenTool className="w-5 h-5" />
            {!awe.isMobileLandscape && (
              <span className="text-[9px] tracking-tight">{translate('toolbar.title', preferences.language) || 'Herramientas'}</span>
            )}
          </button>

          {/* 2. Capas */}
          <button
            onClick={() => setActiveMobilePanel(activeMobilePanel === 'layers' ? null : 'layers')}
            className={`flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer ${
              awe.isMobileLandscape 
                ? 'w-9 h-9 rounded-full' 
                : 'flex-col gap-0.5 min-w-[56px] min-h-[44px] p-1.5 rounded-xl'
            } ${
              activeMobilePanel === 'layers' 
                ? (awe.isMobileLandscape ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md' : 'bg-[#102419] text-[#C8A96A] font-bold shadow-inner')
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={translate('layers.title', preferences.language) || 'Capas'}
            id="mobile-btn-layers"
          >
            <Layers className="w-5 h-5" />
            {!awe.isMobileLandscape && (
              <span className="text-[9px] tracking-tight">{translate('layers.title', preferences.language) || 'Capas'}</span>
            )}
          </button>

          {/* 3. Color */}
          <button
            onClick={() => setActiveMobilePanel(activeMobilePanel === 'color' ? null : 'color')}
            className={`flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer ${
              awe.isMobileLandscape 
                ? 'w-9 h-9 rounded-full' 
                : 'flex-col gap-0.5 min-w-[56px] min-h-[44px] p-1.5 rounded-xl'
            } ${
              activeMobilePanel === 'color' 
                ? (awe.isMobileLandscape ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md' : 'bg-[#102419] text-[#C8A96A] font-bold shadow-inner')
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={translate('colors.title', preferences.language) || 'Color'}
            id="mobile-btn-color"
          >
            <Palette className="w-5 h-5" />
            {!awe.isMobileLandscape && (
              <span className="text-[9px] tracking-tight">{translate('colors.title', preferences.language) || 'Color'}</span>
            )}
          </button>

          {/* 4. Animación */}
          <button
            onClick={() => setActiveMobilePanel(activeMobilePanel === 'timeline' ? null : 'timeline')}
            className={`flex items-center justify-center transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer ${
              awe.isMobileLandscape 
                ? 'w-9 h-9 rounded-full' 
                : 'flex-col gap-0.5 min-w-[56px] min-h-[44px] p-1.5 rounded-xl'
            } ${
              activeMobilePanel === 'timeline' 
                ? (awe.isMobileLandscape ? 'bg-[#C8A96A] text-[#102419] font-bold shadow-md' : 'bg-[#102419] text-[#C8A96A] font-bold shadow-inner')
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={translate('timeline.title', preferences.language) || 'Animación'}
            id="mobile-btn-timeline"
          >
            <Film className="w-5 h-5" />
            {!awe.isMobileLandscape && (
              <span className="text-[9px] tracking-tight">{translate('timeline.title', preferences.language) || 'Animación'}</span>
            )}
          </button>
        </div>
      )}

      {/* --- MOBILE MODAL PANEL DRAWERS --- */}
      {awe.isMobile && activeMobilePanel && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in"
          onClick={() => setActiveMobilePanel(null)}
          id="mobile-panel-backdrop"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#102419] border border-[#102419] rounded-2xl w-[94vw] overflow-y-auto shadow-2xl relative flex flex-col text-slate-200 ${
              awe.isMobileLandscape 
                ? 'p-2.5 max-h-[92vh] max-w-xl gap-2' 
                : (activeMobilePanel === 'timeline' ? 'p-3 sm:p-4 max-w-2xl max-h-[82vh] gap-3' : 'p-3 sm:p-4 max-w-md max-h-[82vh] gap-3')
            }`}
            id="mobile-panel-drawer"
          >
            {/* Header of mobile drawer */}
            <div className="flex items-center justify-between border-b border-[#102419] pb-2">
              <h4 className="text-xs font-black tracking-widest text-[#C8A96A] uppercase flex items-center gap-2">
                {activeMobilePanel === 'tools' && <><PenTool className="w-4 h-4 text-[#C8A96A]" /> {translate('toolbar.title', preferences.language) || 'Herramientas'}</>}
                {activeMobilePanel === 'layers' && <><Layers className="w-4 h-4 text-[#C8A96A]" /> {translate('layers.title', preferences.language) || 'Capas'}</>}
                {activeMobilePanel === 'color' && <><Palette className="w-4 h-4 text-[#C8A96A]" /> {translate('colors.title', preferences.language) || 'Color'}</>}
                {activeMobilePanel === 'timeline' && <><Film className="w-4 h-4 text-[#C8A96A]" /> {translate('timeline.title', preferences.language) || 'Animación'}</>}
              </h4>
              <button 
                onClick={() => setActiveMobilePanel(null)}
                className="p-1.5 rounded-lg bg-[#102419]/60 hover:bg-[#102419] text-slate-300 hover:text-white transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                title={translate('layout.closePanel', preferences.language)}
                id="close-mobile-panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content of mobile drawer */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeMobilePanel === 'tools' && (
                <div className="flex flex-col gap-3 pb-2">
                  <Toolbar 
                    currentTool={currentTool}
                    onChangeTool={(t) => {
                      setCurrentTool(t);
                    }}
                    brushSize={brushSize}
                    onChangeBrushSize={setBrushSize}
                    symmetry={symmetry}
                    onChangeSymmetry={setSymmetry}
                    tiling={tiling}
                    onChangeTiling={setTiling}
                    sprayDensity={sprayDensity}
                    onChangeSprayDensity={setSprayDensity}
                    sprayRandomness={sprayRandomness}
                    onChangeSprayRandomness={setSprayRandomness}
                    sprayShape={sprayShape}
                    onChangeSprayShape={setSprayShape}
                    ditheringPattern={ditheringPattern}
                    onChangeDitheringPattern={setDitheringPattern}
                    cloneSource={cloneSource}
                    onChangeCloneSource={setCloneSource}
                    activeBrush={activeBrush}
                    onChangeActiveBrush={setActiveBrush}
                    pixelPerfect={pixelPerfect}
                    onChangePixelPerfect={setPixelPerfect}
                    bucketContiguous={bucketContiguous}
                    onChangeBucketContiguous={setBucketContiguous}
                    bucketRefer={bucketRefer}
                    onChangeBucketRefer={setBucketRefer}
                    language={preferences.language}
                    largeButtons={preferences.largeButtons}
                  />
                </div>
              )}

              {activeMobilePanel === 'layers' && (
                <div className="flex flex-col gap-3 pb-2">
                  <LayerManager 
                    layers={project?.layers || []}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    onAddLayer={handleAddLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onDuplicateLayer={handleDuplicateLayer}
                    onToggleVisible={handleToggleLayerVisible}
                    onToggleLocked={handleToggleLayerLocked}
                    onToggleStatic={handleToggleLayerStatic}
                    onChangeOpacity={handleChangeLayerOpacity}
                    onMoveLayer={handleMoveLayer}
                    onMergeDown={handleMergeDownLayer}
                    onReorderLayers={handleReorderLayers}
                    onRenameLayer={handleRenameLayer}
                    onChangeBlendMode={handleChangeLayerBlendMode}
                    language={preferences.language}
                  />
                </div>
              )}

              {activeMobilePanel === 'color' && (
                <div className="pb-2">
                  <ColorPanel 
                    currentColor={currentColor}
                    secondaryColor={secondaryColor}
                    activeColorSlot={activeColorSlot}
                    onChangeColor={handleColorChange}
                    onChangeSecondaryColor={setSecondaryColor}
                    onSwapColors={handleSwapColors}
                    onResetDefaultColors={handleResetDefaultColors}
                    onChangeActiveColorSlot={setActiveColorSlot}
                    opacity={brushOpacity}
                    onChangeOpacity={setBrushOpacity}
                    documentColors={documentColors}
                    customPalette={customPalette}
                    onAddToCustomPalette={handleAddToCustomPalette}
                    onClearCustomPalette={handleClearCustomPalette}
                    onRemoveFromCustomPalette={handleRemoveFromCustomPalette}
                    onInvertPalette={handleInvertPalette}
                    onSavePaletteToLibrary={handleOpenLibrary}
                    onOpenLibrary={handleOpenLibrary}
                    recentColors={recentColors}
                    onClearRecentColors={handleClearRecentColors}
                    onSaveRecentAsPalette={handleSaveRecentAsPalette}
                    language={preferences.language}
                    libraryPalettes={libraryPalettes}
                    onLoadPalette={(colors) => {
                      setCustomPalette(colors);
                      localStorage.setItem('pixel_art_custom_swatches', JSON.stringify(colors));
                      if (colors.length > 0) setCurrentColor(colors[0]);
                    }}
                    showToast={showToast}
                  />
                </div>
              )}

              {activeMobilePanel === 'timeline' && (
                <div className="pb-2 overflow-x-auto max-w-full">
                  <Timeline 
                    frames={project?.frames || []}
                    selectedFrameId={selectedFrameId}
                    onSelectFrame={setSelectedFrameId}
                    selection={frameSelection}
                    onSelectionChange={setFrameSelection}
                    onAddFrame={handleAddFrame}
                    onDeleteFrame={handleDeleteFrame}
                    onDuplicateFrame={handleDuplicateFrame}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    onStop={handleStopAnimation}
                    fps={project?.fps || 12}
                    onChangeFps={handleChangeFps}
                    onionSkinEnabled={onionSkinEnabled}
                    onToggleOnionSkin={handleToggleOnionSkin}
                    onionSkinOpacity={onionSkinOpacity}
                    onChangeOnionSkinOpacity={handleSetOnionSkinOpacity}
                    onionSkinSettings={onionSkinSettings}
                    onUpdateOnionSkinSettings={handleUpdateOnionSkinSettings}
                    loopEnabled={loopEnabled}
                    onToggleLoop={handleToggleLoop}
                    layers={project?.layers || []}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    onToggleVisible={handleToggleLayerVisible}
                    onToggleLocked={handleToggleLayerLocked}
                    onToggleStatic={handleToggleLayerStatic}
                    pixels={project?.pixels || {}}
                    onReorderFrames={handleReorderFrames}
                    onMoveFrameLeft={handleMoveFrameLeft}
                    onMoveFrameRight={handleMoveFrameRight}
                    playbackMode={playbackMode}
                    onChangePlaybackMode={setPlaybackMode}
                    onOpenExport={handleOpenExportDialog}
                    animationTags={project?.animationTags || []}
                    selectedTagId={selectedTagId}
                    onSelectTag={setSelectedTagId}
                    onAddTag={handleAddTag}
                    onUpdateTag={handleUpdateTag}
                    onDeleteTag={handleDeleteTag}
                    language={preferences.language}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- FLOATING OVERLAY MODALS & DIALOGS --- */}
      
      {/* Resource Library Modal */}
      <LibraryModal 
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onLoadProject={handleImportProject}
        onLoadPalette={(colors) => {
          colors.forEach(handleAddToCustomPalette);
          if (colors.length > 0) setCurrentColor(colors[0]);
        }}
        onLoadBrush={(brushData) => {
          if (brushData) {
            setActiveBrush(brushData);
            showToast('Pincel personalizado cargado', 'success');
          }
        }}
        onLoadTexture={(textureData) => {
          if (textureData) {
            if (textureData.colors && Array.isArray(textureData.colors)) {
              textureData.colors.forEach(handleAddToCustomPalette);
              if (textureData.colors.length > 0) setCurrentColor(textureData.colors[0]);
            } else if (textureData.pixels) {
              const w = textureData.width || 8;
              const h = textureData.height || 8;
              const pixels = Array.isArray(textureData.pixels) 
                ? textureData.pixels.map((p: any) => typeof p === 'string' ? p : p ? '#ffffff' : '')
                : [];
              setActiveStamp({
                pixels,
                width: w,
                height: h,
                name: textureData.name || 'Textura cargada'
              });
              showToast('Textura cargada en herramienta de sello', 'success');
            }
          }
        }}
        currentProjectData={project}
        currentPaletteColors={customPalette}
        showToast={showToast}
        language={preferences.language}
      />

      {/* Advanced Exporter Modal */}
      {project && (
        <ExportModal 
          isOpen={exportOpen}
          onClose={() => {
            setExportOpen(false);
            setReExportPluginId(undefined);
            setReExportOptions(undefined);
          }}
          project={project}
          selectedFrameId={selectedFrameId}
          showToast={showToast}
          initialPluginId={reExportPluginId}
          initialOptions={reExportOptions}
          language={preferences.language}
        />
      )}

      {/* Save As Modal for non-FileSystemAccess environments */}
      {project && (
        <SaveAsModal
          isOpen={saveAsModalOpen}
          onClose={() => setSaveAsModalOpen(false)}
          initialFileName={project.name}
          fileFormat={project.fileFormat || 'onepixel'}
          language={preferences.language}
          onConfirm={async (newName) => {
            await executeSaveAsWorkflow(newName);
          }}
        />
      )}

      {/* Texture Patterns Modal */}
      {project && (
        <PatternsModal 
          isOpen={patternsOpen}
          onClose={() => setPatternsOpen(false)}
          project={project}
          currentFrameId={selectedFrameId}
          currentLayerId={selectedLayerId}
          selection={activeSelection}
          onUpdatePixels={handleUpdatePixels}
          onStartHistoryAction={handleStartHistoryAction}
          onApplyPatternStamp={(pattern) => setActiveStamp(pattern)}
          language={preferences.language}
        />
      )}

      {/* Capture Stamp Modal */}
      <CaptureStampModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        language={preferences.language || 'es'}
        onSave={handleSaveStamp}
      />

      {/* Professional Asset Library Modal */}
      <AssetLibraryModal
        isOpen={assetLibraryOpen}
        onClose={() => setAssetLibraryOpen(false)}
        language={preferences.language || 'es'}
        onApplyAsset={(asset) => {
          if (asset && asset.data && asset.data.pixels) {
            setActiveStamp({
              pixels: asset.data.pixels,
              width: asset.width,
              height: asset.height,
              name: asset.name
            });
          }
        }}
        showToast={showToast}
      />

      {/* Interactive Help Center Modal */}
      <HelpCenterModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        language={preferences.language}
        initialTab={helpInitialTab}
        onStartTour={() => setTourOpen(true)}
      />

      {/* Interactive Guided Tour */}
      <InteractiveTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        language={preferences.language}
        onOpenManual={() => {
          setHelpInitialTab('manual');
          setHelpOpen(true);
        }}
      />

      {/* Welcome Screen */}
      <WelcomeScreen
        isOpen={welcomeOpen}
        initialNewProjectModal={welcomeNewProjectOpen}
        onClose={() => {
          setWelcomeOpen(false);
          setWelcomeNewProjectOpen(false);
        }}
        onLoadProject={(proj) => {
          handleImportProject(proj);
          setWelcomeOpen(false);
          setWelcomeNewProjectOpen(false);
        }}
        onNewProject={(w, h, bg) => {
          handleNewProject(w, h, bg);
          setWelcomeOpen(false);
          setWelcomeNewProjectOpen(false);
        }}
        onOpenPreferences={() => {
          setPreferencesOpen(true);
        }}
        onOpenHelp={() => {
          setHelpOpen(true);
        }}
        showToast={showToast}
        currentProject={project}
        onApplyPreset={(preset) => {
          const s = preset.settings;
          if (s.tool) setCurrentTool(s.tool);
          if (s.brushSize) setBrushSize(s.brushSize);
          if (s.onionSkin !== undefined) {
            setOnionSkinSettings(prev => ({ ...prev, enabled: s.onionSkin }));
          }
          if (s.gridVisible !== undefined) setGridVisible(s.gridVisible);
          if (s.sidebarVisible !== undefined) setSidebarVisible(s.sidebarVisible);
          if (s.colorsVisible !== undefined) setColorsVisible(s.colorsVisible);
          if (s.timelineVisible !== undefined) setTimelineVisible(s.timelineVisible);
          if (s.symmetry) setSymmetry(s.symmetry);
        }}
        onTriggerReExport={(pluginId, options) => {
          setReExportPluginId(pluginId);
          setReExportOptions(options);
          setExportOpen(true);
        }}
        language={preferences.language}
      />

      {/* About Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 bg-[#0F3D34]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#102419] border border-[#0F3D34] rounded-2xl p-6 max-w-xl w-full text-slate-200 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-center mb-3 overflow-x-auto no-scrollbar py-1">
              <OnePixelLogo height={48} />
            </div>
            <span className="text-[10px] text-[#C8A96A] font-mono tracking-widest uppercase">Versión Oficial v1.2.0</span>
            <p className="text-xs text-slate-300 my-4 leading-relaxed font-sans">
              Un potente editor de pixel art y animación diseñado para la web moderna. Construido con la filosofía donde todo dibujo nace de un único píxel.
            </p>
            <div className="text-[10px] font-mono text-slate-400 mb-3 bg-[#0F3D34] py-1.5 px-3 rounded-lg border border-[#102419]/50">
              Paleta: Estratos Marinos (60/30/10)
            </div>

            {/* Legal quick navigation links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLegalInitialSection('terms');
                  setLegalOpen(true);
                }}
                className="text-[11px] text-[#C8A96A] hover:text-[#d9bb7c] hover:underline px-2.5 py-1 rounded-lg bg-[#0F3D34]/70 border border-[#C8A96A]/30 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{translate('legal.navTerms', preferences.language) || 'Términos de uso'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegalInitialSection('privacy');
                  setLegalOpen(true);
                }}
                className="text-[11px] text-[#C8A96A] hover:text-[#d9bb7c] hover:underline px-2.5 py-1 rounded-lg bg-[#0F3D34]/70 border border-[#C8A96A]/30 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{translate('legal.navPrivacy', preferences.language) || 'Privacidad'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegalInitialSection('licenses');
                  setLegalOpen(true);
                }}
                className="text-[11px] text-[#C8A96A] hover:text-[#d9bb7c] hover:underline px-2.5 py-1 rounded-lg bg-[#0F3D34]/70 border border-[#C8A96A]/30 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{translate('legal.navLicenses', preferences.language) || 'Licencias Open Source'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLegalInitialSection('intellectual_property');
                  setLegalOpen(true);
                }}
                className="text-[11px] text-slate-300 hover:text-white hover:underline px-2.5 py-1 rounded-lg bg-[#0F3D34]/70 border border-slate-700/50 transition flex items-center gap-1 cursor-pointer"
              >
                <span>{translate('legal.navLegal', preferences.language) || 'Información Legal'}</span>
              </button>
            </div>

            <div className="flex gap-2 w-full mt-2">
              <button 
                onClick={() => { setAboutOpen(false); setDonationOpen(true); }}
                className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                <span>Apoyar el proyecto</span>
              </button>
              <button 
                onClick={() => setAboutOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#152e20] border border-[#102419] rounded-xl text-xs font-bold text-white transition shadow-md active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Legal & Privacy Center Modal */}
      <LegalModal
        isOpen={legalOpen}
        onClose={() => setLegalOpen(false)}
        language={preferences.language}
        initialTab={legalInitialSection}
        onOpenDonate={() => {
          setLegalOpen(false);
          setDonationOpen(true);
        }}
        showToast={showToast}
      />

      {/* Mandatory First-Run Legal Consent Modal */}
      <InitialConsentModal
        isOpen={initialConsentOpen}
        onAccept={() => {
          setInitialConsentOpen(false);
          setWelcomeOpen(false);
          if (!project) {
            initDefaultCanvas(32, 32);
          }
        }}
        onDecline={() => {
          setIsExited(true);
        }}
        currentLanguage={preferences.language}
        onChangeLanguage={(newLang) => {
          handleChangePreferences({
            ...preferences,
            language: newLang
          });
        }}
      />

      {/* Donation Modal */}
      <DonationModal
        isOpen={donationOpen}
        onClose={() => setDonationOpen(false)}
        language={preferences.language}
        showToast={showToast}
      />

      {/* Preferences Modal */}
      <PreferencesModal 
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        preferences={preferences}
        onChangePreferences={handleChangePreferences}
      />

      {/* 30 Layers Warning Pop-up */}
      {layerWarningVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" id="layers-warning-modal">
          <div className="bg-[#102419] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-2">
              <span className="text-amber-500 font-bold text-lg shrink-0">⚠️ ADVERTENCIA: Límite de rendimiento</span>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Has creado la <strong>capa 31</strong>. OnePixel Studio te informa por seguridad de tu proyecto que superar las 30 capas puede causar que la aplicación se vuelva lenta o presente fallas de rendimiento dependiendo de las especificaciones de tu dispositivo.
            </p>
            <button 
              onClick={() => setLayerWarningVisible(false)}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold text-white transition shadow-md"
            >
              Entendido, continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Cerrar una Pestaña */}
      {closeTabModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" id="close-tab-modal">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-md w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-3">
              <span className="text-rose-400 font-bold text-base shrink-0">{translate('layout.closeProjectWarning', preferences.language)}</span>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {translate('headerMenu.closeProjectConfirm', preferences.language) || 'Do you want to save changes before closing?'}
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (closeTabId) executeCloseTab(closeTabId, true);
                }}
                className="w-full py-2.5 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] rounded-xl text-xs font-bold text-white transition shadow-md"
              >
                {translate('common.saveAndClose', preferences.language)}
              </button>
              <button 
                onClick={() => {
                  if (closeTabId) executeCloseTab(closeTabId, false);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition shadow-md"
              >
                {translate('headerMenu.closeWithoutSaving', preferences.language) || 'Close without Saving'}
              </button>
              <button 
                onClick={() => {
                  setCloseTabModalOpen(false);
                  setCloseTabId(null);
                }}
                className="w-full py-2.5 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {translate('common.cancel', preferences.language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Cerrar Todos los Archivos */}
      {closeAllModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" id="close-all-modal">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-3">
              <span className="text-rose-400 font-bold text-base shrink-0">{translate('layout.closeAllTabsWarning', preferences.language)}</span>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {translate('headerMenu.closeAllProjectsConfirm', preferences.language) || 'Are you sure you want to close all open tabs?'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCloseAllModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {translate('common.cancel', preferences.language)}
              </button>
              <button 
                onClick={executeCloseAll}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition shadow-md"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Salir del Programa */}
      {exitModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200" id="exit-application-modal">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-3">
              <span className="text-red-400 font-bold text-base shrink-0">🚪 Salir del Programa</span>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas salir de OnePixel Studio? Al darle cancelar ya no se ejecutará la opción de salir.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setExitModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Cancelar
              </button>
              <button 
                onClick={executeExit}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition shadow-md"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exited splash screen overlay */}
      {isExited && (
        <div className="fixed inset-0 bg-[#0c0d16] flex flex-col items-center justify-center p-6 z-[99999]" id="exited-program-view">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight font-sans">
              OnePixel Studio se ha cerrado
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Has salido de la sesión de forma segura. Tu espacio de trabajo ha sido limpiado y las cookies locales del proyecto activo han sido eliminadas.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/40 rounded-xl text-xs font-bold text-[#C8A96A] transition shadow-lg inline-flex items-center gap-2"
            >
              Reiniciar OnePixel Studio
            </button>
          </div>
        </div>
      )}

      {/* Hidden SVG Color Blindness filters */}
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      <DiagnosticsPanel
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        language={preferences.language || 'es'}
        project={project}
        undoStackLength={undoStack.length}
        redoStackLength={redoStack.length}
        activeTool={currentTool}
        selectedFrameId={selectedFrameId}
        selectedLayerId={selectedLayerId}
        onSimulateCrash={() => setShouldCrash(true)}
      />

      <QAPanel
        isOpen={qaOpen}
        onClose={() => setQaOpen(false)}
        project={project}
        undoStackLength={undoStack.length}
        redoStackLength={redoStack.length}
        activeTool={currentTool}
        selectedFrameId={selectedFrameId}
        selectedLayerId={selectedLayerId}
      />

      {/* Reusable Generic Prompt Modal */}
      <GenericPromptModal
        isOpen={genericPromptOpen}
        onClose={() => setGenericPromptOpen(false)}
        title={genericPromptConfig.title}
        description={genericPromptConfig.description}
        fields={genericPromptConfig.fields}
        confirmText={genericPromptConfig.confirmText}
        cancelText={genericPromptConfig.cancelText}
        language={preferences.language}
        onConfirm={genericPromptConfig.onConfirm}
      />

      {/* Unified WindowSystem Overlay Dialogs */}
      <WindowSystemDialogs />

      {/* Official Institutional Startup Splash Screen */}
      {showSplashScreen && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[999999] bg-[#0F3D34] flex items-center justify-center p-4 pointer-events-auto select-none"
        >
          <OnePixelStartupAnimation
            onComplete={() => {
              setShowSplashScreen(false);
            }}
          />
        </motion.div>
      )}

      {/* Toast Notification Overlay */}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none" id="toasts-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : 'bg-[#0F3D34]/95 border-[#C8A96A]/50 text-[#C8A96A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition p-1 rounded hover:bg-white/10 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      </div>
    </AppErrorBoundary>
  );
}
