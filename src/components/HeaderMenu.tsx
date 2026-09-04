import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, FolderOpen, Save, FileDown, 
  FileUp, Download, RotateCcw, RotateCw, 
  Trash2, HelpCircle, ArrowLeftRight, ArrowUpDown, 
  Rotate3D, RefreshCw, Palette, Square, CheckSquare, 
  Grid, Maximize2, ZoomIn, ZoomOut, Play, Pause, 
  Plus, Trash, Layout, Info, Sliders, Scissors, Box,
  Copy, Clipboard, Palette as PaletteIcon, HelpCircle as HelpIcon,
  Scaling, Sparkles, ChevronRight, ChevronLeft, FastForward, ToggleLeft, ToggleRight, Layers,
  Settings, Repeat, Database, Cpu, AlertTriangle, ClipboardCheck,
  Menu, X, Pencil, Eraser, PaintBucket, Pipette, Hand, MousePointerClick,
  LifeBuoy, Crop, BookOpen, Compass, Zap, Clock, Heart, Scale
} from 'lucide-react';
import { PixelProject } from '../types';
import { useAWE } from '../hooks/useAWE';
import { parseCompatibleFileToProject } from '../utils/specializedImporters';
import ImportModal from './ImportModal';
import RecentProjectsModal from './RecentProjectsModal';
import GenericPromptModal from './GenericPromptModal';
import { SupportModal } from './SupportModal';
import { translate, LanguageCode } from '../i18n';
import { telemetry } from '../utils/telemetry';
import { OnePixelIcon, OnePixelLogo } from '../branding';
import { LocalPersistence } from '../utils/persistence/LocalPersistence';

interface HeaderMenuProps {
  project: PixelProject | null;
  currentFrameId: string;
  currentLayerId?: string;
  onUpdatePixels?: (newPixels: any, saveSnapshot?: boolean) => void;
  onNewProject: (width: number, height: number, bgFillColor?: string) => void;
  onSaveProject: () => void;
  onSaveAsProject?: () => void;
  onOpenLibrary: () => void;
  onOpenAssetLibrary?: () => void;
  onOpenExport: () => void;
  onQuickExport?: () => void;
  onImportProject: (imported: PixelProject) => void;
  onExportProjectJson: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onMirrorLayer: (direction: 'horizontal' | 'vertical') => void;
  onClearLayer: () => void;
  
  // Custom interactive triggers from menus
  onRotateSprite: (angle: 90 | 180) => void;
  onInvertColors: () => void;
  onPatternsClick: () => void;
  
  // Selection
  onSelectAll: () => void;
  onDeselect: () => void;
  onInvertSelection: () => void;
  onSelectByColor: () => void;
  onFillSelection: () => void;
  onCutSelection: () => void;
  onCopySelection: () => void;
  onPasteSelection: () => void;
  onExpandSelection?: () => void;
  onContractSelection?: () => void;
  onCropToSelection?: () => void;
  onPreferencesClick?: () => void;

  // View settings
  gridVisible: boolean;
  onToggleGrid: () => void;
  onCenterCanvas: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onionSkinEnabled: boolean;
  onToggleOnionSkin: () => void;
  tilingActive: boolean;
  onToggleTiling: () => void;
  symmetryActive: boolean;
  onToggleSymmetry: () => void;

  // Guides & Rulers
  guidesVisible: boolean;
  guidesLocked: boolean;
  rulersVisible: boolean;
  snappingEnabled: boolean;
  onToggleGuides: () => void;
  onToggleGuidesLocked: () => void;
  onToggleRulers: () => void;
  onToggleSnapping: () => void;
  onClearGuides: () => void;

  // Animation
  isPlaying: boolean;
  onTogglePlay: () => void;
  onAddFrame: () => void;
  onDeleteFrame: () => void;
  onDuplicateFrame: (id: string) => void;
  onNextFrame: () => void;
  onPrevFrame: () => void;
  onIncreaseFps: () => void;
  onDecreaseFps: () => void;
  playbackMode?: 'forward' | 'reverse' | 'pingpong';
  onChangePlaybackMode?: (mode: 'forward' | 'reverse' | 'pingpong') => void;
  onChangeFps?: (fps: number) => void;

  // Window Layout
  onResetLayout: () => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  colorsVisible: boolean;
  onToggleColors: () => void;
  toolsVisible: boolean;
  onToggleTools: () => void;
  timelineVisible?: boolean;
  onToggleTimeline?: () => void;
  onMaximizeWorkspace: () => void;

  // Palette Actions
  onLoadPalettePreset: (presetName: string) => void;
  onNewPalette: () => void;
  onInvertPalette: () => void;
  onAddToPalette: () => void;

  // Modals / Overlays
  onAboutClick: () => void;
  onDonateClick?: () => void;
  onHelpClick: (tab?: 'manual' | 'workflows' | 'tips' | 'shortcuts') => void;
  onLegalClick?: (tab?: 'terms' | 'privacy' | 'intellectual_property' | 'licenses' | 'disclaimer' | 'donations' | 'contact') => void;
  onStartTour?: () => void;
  onWelcomeClick?: () => void;

  // Sprite geometry resizes
  onScaleSprite: (w: number, h: number) => void;
  onResizeCanvas: (w: number, h: number) => void;
  onSaveOriginalPattern?: (name: string) => void;

  // Theme selection
  theme: 'standard' | 'dark' | 'light';
  onChangeTheme: (theme: 'standard' | 'dark' | 'light') => void;

  onCloseProject?: () => void;
  onCloseAllProjects?: () => void;
  onExitApplication?: () => void;
  onUpdateProject?: (updated: PixelProject, selectedLayerId?: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  language?: LanguageCode;
  onDiagnosticsClick?: () => void;
  onQAClick?: () => void;
  onExportDiagnosticsReport?: () => void;
  onSimulateCrash?: () => void;
  diagnosticsModeEnabled?: boolean;
  onToggleDiagnosticsMode?: () => void;
  currentTool?: string;
  currentColor?: string;
  onMobilePanelToggle?: (panel: 'tools' | 'layers' | 'color' | 'timeline' | null) => void;
}

const HeaderMenu = React.memo(function HeaderMenu({
  project,
  language = 'es',
  currentFrameId,
  currentLayerId,
  currentTool,
  currentColor,
  onMobilePanelToggle,
  onUpdatePixels,
  onNewProject,
  onSaveProject,
  onSaveAsProject,
  onOpenLibrary,
  onOpenAssetLibrary,
  onOpenExport,
  onQuickExport,
  onImportProject,
  onExportProjectJson,
  onUndo,
  onRedo,
  onCloseProject,
  onCloseAllProjects,
  onExitApplication,
  onUpdateProject,
  canUndo,
  canRedo,
  onMirrorLayer,
  onClearLayer,
  onRotateSprite,
  onInvertColors,
  onPatternsClick,
  onSelectAll,
  onDeselect,
  onInvertSelection,
  onSelectByColor,
  onFillSelection,
  onCutSelection,
  onCopySelection,
  onPasteSelection,
  onExpandSelection,
  onContractSelection,
  onCropToSelection,
  onPreferencesClick,
  gridVisible,
  onToggleGrid,
  onCenterCanvas,
  onZoomIn,
  onZoomOut,
  onionSkinEnabled,
  onToggleOnionSkin,
  tilingActive,
  onToggleTiling,
  symmetryActive,
  onToggleSymmetry,
  guidesVisible,
  guidesLocked,
  rulersVisible,
  snappingEnabled,
  onToggleGuides,
  onToggleGuidesLocked,
  onToggleRulers,
  onToggleSnapping,
  onClearGuides,
  isPlaying,
  onTogglePlay,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onNextFrame,
  onPrevFrame,
  onIncreaseFps,
  onDecreaseFps,
  playbackMode = 'forward',
  onChangePlaybackMode,
  onChangeFps,
  onResetLayout,
  sidebarVisible,
  onToggleSidebar,
  colorsVisible,
  onToggleColors,
  toolsVisible,
  onToggleTools,
  timelineVisible = true,
  onToggleTimeline,
  onMaximizeWorkspace,
  onLoadPalettePreset,
  onNewPalette,
  onInvertPalette,
  onAddToPalette,
  onAboutClick,
  onDonateClick,
  onHelpClick,
  onLegalClick,
  onStartTour,
  onWelcomeClick,
  onScaleSprite,
  onResizeCanvas,
  onSaveOriginalPattern,
  theme,
  onChangeTheme,
  showToast,
  onDiagnosticsClick,
  onQAClick,
  onExportDiagnosticsReport,
  onSimulateCrash,
  diagnosticsModeEnabled,
  onToggleDiagnosticsMode
}: HeaderMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  
  const awe = useAWE();
  const isMobile = awe.isMobile;
  
  const openFileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeMenu && !isMobileMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu, isMobileMenuOpen]);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newWidth, setNewWidth] = useState(32);
  const [newHeight, setNewHeight] = useState(32);
  const [bgType, setBgType] = useState<'transparent' | 'white' | 'color'>('transparent');
  const [customBgColor, setCustomBgColor] = useState('#6366f1');

  // Modals for resize, scale, and save pattern
  const [resizeModalOpen, setResizeModalOpen] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(32);
  const [resizeHeight, setResizeHeight] = useState(32);

  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [scaleWidth, setScaleWidth] = useState(64);
  const [scaleHeight, setScaleHeight] = useState(64);

  const [savePatternModalOpen, setSavePatternModalOpen] = useState(false);
  const [savePatternName, setSavePatternName] = useState('');

  const [activePrompt, setActivePrompt] = useState<{
    title: string;
    description?: string;
    fields: Array<{ key: string; label: string; type: 'text' | 'select'; defaultValue?: string; options?: Array<{ value: string; label: string }>; placeholder?: string }>;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (values: Record<string, string>) => void;
  } | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [recentModalOpen, setRecentModalOpen] = useState(false);
  const [importFileData, setImportFileData] = useState<{
    file: File;
    name: string;
    width: number;
    height: number;
    parsedProj?: PixelProject;
  } | null>(null);

  const [tutorialStep, setTutorialStep] = useState(0);

  // Helper to save recent project data
  const saveToRecents = (proj: PixelProject) => {
    try {
      // Store in durable local database
      try {
        LocalPersistence.saveProject(proj);
      } catch (e) {}

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
        id: proj.id,
        name: proj.name,
        width: proj.width,
        height: proj.height,
        timestamp: Date.now(),
        projectData: proj
      });
      recents = recents.slice(0, 5);

      // Attempt to save to localStorage
      try {
        localStorage.setItem('pixel_art_recent_projects', JSON.stringify(recents));
      } catch (quotaErr: any) {
        // If quota is exceeded, strip pixel data from older projects (index > 0) to save space
        recents = recents.map((item, idx) => {
          if (idx === 0) {
            return item; // Keep the active/latest one complete if possible
          } else {
            return {
              ...item,
              projectData: item.projectData ? {
                ...item.projectData,
                pixels: {} // Remove pixel array data to save massive space
              } : undefined,
              isMetadataOnly: true
            };
          }
        });

        try {
          localStorage.setItem('pixel_art_recent_projects', JSON.stringify(recents));
        } catch (quotaErr2: any) {
          // If still exceeded, strip pixel data from all items, including the active one
          recents = recents.map(item => ({
            ...item,
            projectData: item.projectData ? {
              ...item.projectData,
              pixels: {}
            } : undefined,
            isMetadataOnly: true
          }));

          try {
            localStorage.setItem('pixel_art_recent_projects', JSON.stringify(recents));
          } catch (quotaErr3: any) {
            console.error('Totally unable to save recents even without pixel data:', quotaErr3);
          }
        }
      }
    } catch (err) {
      console.error('Error writing to recents:', err);
    }
  };

  // Automatically add/update the current project to recent list on key state changes
  React.useEffect(() => {
    if (project && project.id) {
      saveToRecents(project);
    }
  }, [project?.id, project?.name]);

  const getRecents = (): any[] => {
    try {
      const stored = localStorage.getItem('pixel_art_recent_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const localProjects = LocalPersistence.listProjects();
      if (localProjects && localProjects.length > 0) {
        return localProjects.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          width: p.width,
          height: p.height,
          timestamp: p.lastSaved || Date.now(),
          projectData: p
        }));
      }
    } catch (err) {
      console.error('Error reading recents:', err);
    }
    return [];
  };

  // Convert and fit local image using the professional ImportModal flow
  const handleImportLocalImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Log the file import attempt in telemetry
    telemetry.logAction('IMAGE_IMPORT_START', `Importing local image file: ${file.name}`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Reset input value to allow importing the same file consecutively
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['png', 'jpeg', 'jpg', 'gif', 'bmp', 'webp', 'psd', 'ora', 'ase', 'aseprite'].includes(ext || '')) {
      showToast?.('Solo se pueden importar formatos de imagen (PNG, JPEG, GIF, BMP, WEBP, PSD, ORA, ASE, ASEPRITE).', 'error');
      return;
    }

    try {
      const parsedProj = await parseCompatibleFileToProject(file);
      setImportFileData({
        file,
        name: file.name,
        width: parsedProj.width,
        height: parsedProj.height,
        parsedProj
      });
      setImportModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast?.('Error al analizar el archivo de imagen para importar.', 'error');
    }
  };

  const handleConfirmImport = async (options: {
    placement: 'new_layer' | 'current_layer';
    scaleMode: 'fit' | 'original' | 'custom';
    customWidth: number;
    customHeight: number;
    resizeCanvas: boolean;
  }) => {
    if (!importFileData || !importFileData.parsedProj) return;
    setImportModalOpen(false);

    try {
      const { parsedProj } = importFileData;
      
      // Calculate target dimensions for the placed image content
      let targetW = project.width;
      let targetH = project.height;

      if (options.scaleMode === 'original') {
        targetW = parsedProj.width;
        targetH = parsedProj.height;
      } else if (options.scaleMode === 'custom') {
        targetW = options.customWidth;
        targetH = options.customHeight;
      }

      if (targetW > 600 || targetH > 600 || targetW < 4 || targetH < 4) {
        showToast?.('Las dimensiones de importación deben estar entre 4 y 600 px.', 'error');
        return;
      }

      // Pre-merge all visible layers of the imported project onto a flat array of size parsedProj.width * parsedProj.height
      const frame0Id = parsedProj.frames[0]?.id;
      const mergedPixels = new Array(parsedProj.width * parsedProj.height).fill('');

      for (let i = parsedProj.layers.length - 1; i >= 0; i--) {
        const layer = parsedProj.layers[i];
        if (!layer.visible) continue;
        const layerPixels = parsedProj.pixels[frame0Id]?.[layer.id];
        if (!layerPixels) continue;
        for (let p = 0; p < layerPixels.length; p++) {
          if (layerPixels[p]) {
            mergedPixels[p] = layerPixels[p];
          }
        }
      }

      // Now, scale this flat representation to targetW x targetH
      let scaledPixels = mergedPixels;
      if (parsedProj.width !== targetW || parsedProj.height !== targetH) {
        scaledPixels = new Array(targetW * targetH).fill('');
        for (let y = 0; y < targetH; y++) {
          const srcY = Math.floor((y / targetH) * parsedProj.height);
          for (let x = 0; x < targetW; x++) {
            const srcX = Math.floor((x / targetW) * parsedProj.width);
            scaledPixels[y * targetW + x] = mergedPixels[srcY * parsedProj.width + srcX] || '';
          }
        }
      }

      // Determine the final canvas dimensions.
      // If we are resizing the current canvas, they match targetW x targetH. Otherwise they match current project.width x project.height.
      let finalW = project.width;
      let finalH = project.height;

      if (options.resizeCanvas) {
        finalW = targetW;
        finalH = targetH;
      }

      // Prepare final array of size finalW * finalH
      let finalPixelsArray = new Array(finalW * finalH).fill('');
      if (targetW === finalW && targetH === finalH) {
        finalPixelsArray = scaledPixels;
      } else {
        // Place the scaled image, cropping or padding transparently, centering or positioning top-left
        for (let y = 0; y < Math.min(targetH, finalH); y++) {
          for (let x = 0; x < Math.min(targetW, finalW); x++) {
            finalPixelsArray[y * finalW + x] = scaledPixels[y * targetW + x] || '';
          }
        }
      }

      // If the user wants to resize the canvas, let's update the project dimensions and all other layers synchronously!
      let updatedProject = { ...project };

      if (options.resizeCanvas && (finalW !== project.width || finalH !== project.height)) {
        const updatedPixels: typeof project.pixels = {};
        project.frames.forEach(frame => {
          updatedPixels[frame.id] = {};
          project.layers.forEach(layer => {
            const oldArr = project.pixels[frame.id]?.[layer.id] || [];
            const newArr = new Array(finalW * finalH).fill('');
            for (let y = 0; y < Math.min(project.height, finalH); y++) {
              for (let x = 0; x < Math.min(project.width, finalW); x++) {
                newArr[y * finalW + x] = oldArr[y * project.width + x] || '';
              }
            }
            updatedPixels[frame.id][layer.id] = newArr;
          });
        });

        updatedProject.width = finalW;
        updatedProject.height = finalH;
        updatedProject.pixels = updatedPixels;
      }

      // Now handle placement
      const activeFrameId = currentFrameId || project.frames[0]?.id;

      if (options.placement === 'new_layer') {
        const newLayerId = `layer-imported-${Date.now()}`;
        const newLayer = {
          id: newLayerId,
          name: `Capa Importada - ${importFileData.name.split('.')[0]}`,
          opacity: 100,
          visible: true,
          locked: false
        };

        // Create empty pixel arrays of size finalW * finalH for this new layer in all frames
        const updatedPixels = { ...updatedProject.pixels };
        updatedProject.frames.forEach(frame => {
          if (!updatedPixels[frame.id]) updatedPixels[frame.id] = {};
          
          if (frame.id === activeFrameId) {
            updatedPixels[frame.id][newLayerId] = finalPixelsArray;
          } else {
            updatedPixels[frame.id][newLayerId] = new Array(finalW * finalH).fill('');
          }
        });

        updatedProject.layers = [newLayer, ...updatedProject.layers];
        updatedProject.pixels = updatedPixels;

        // Save this updated project (which automatically selects the new layer)
        if (onUpdateProject) {
          onUpdateProject(updatedProject, newLayerId);
        }
      } else {
        // Placement in Current Layer (Capa Activa)
        const targetLayerId = currentLayerId || project.layers[0]?.id;
        if (!targetLayerId) {
          showToast?.('No hay capas activas en el proyecto.', 'error');
          return;
        }

        const updatedPixels = { ...updatedProject.pixels };
        if (!updatedPixels[activeFrameId]) {
          updatedPixels[activeFrameId] = {};
        }
        updatedPixels[activeFrameId][targetLayerId] = finalPixelsArray;
        updatedProject.pixels = updatedPixels;

        if (onUpdateProject) {
          onUpdateProject(updatedProject);
        }
      }

      showToast?.(
        options.placement === 'new_layer'
          ? translate('headerMenu.importSuccessNewLayer', language as any)
          : translate('headerMenu.importSuccessActiveLayer', language as any),
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast?.(translate('headerMenu.importError', language as any), 'error');
    }
  };

  // Strictly reordered menuHeaders in the requested sequence:
  // Archivo, Editar, Ver, Seleccionar, Sprite, Paleta, Animación, Ventana, Ayuda
  const menuHeaders = [
    { id: 'archivo', label: translate('headerMenu.archivo', language as any) },
    { id: 'editar', label: translate('headerMenu.editar', language as any) },
    { id: 'ver', label: translate('headerMenu.ver', language as any) },
    { id: 'seleccionar', label: translate('headerMenu.seleccion', language as any) },
    { id: 'sprite', label: translate('headerMenu.sprite', language as any) },
    { id: 'paleta', label: translate('headerMenu.paleta', language as any) },
    { id: 'animacion', label: translate('headerMenu.animacion', language as any) },
    { id: 'ventana', label: translate('headerMenu.ventana', language as any) },
    { id: 'ayuda', label: translate('headerMenu.ayuda', language as any) }
  ];

  const processOpenedFile = async (file: File, fileHandle?: any) => {
    // Log the project open attempt in telemetry
    telemetry.logAction('FILE_IMPORT_START', `Opening file: ${file.name}`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // 1. Native formats (.onepixel, .pixelproject, .json)
    if (ext === 'onepixel' || ext === 'pixelproject' || ext === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.id && parsed.width && parsed.layers && parsed.pixels) {
            if (parsed.width > 600 || parsed.height > 600) {
              showToast?.(translate('toasts.maxResolutionExceeded', language as any), 'error');
              return;
            }
            setActivePrompt({
              title: translate('headerMenu.openProjectTitle', language as any),
              description: translate('headerMenu.openCanvasSizeDesc', language as any, { width: parsed.width, height: parsed.height }),
              fields: [
                { key: 'sizeStr', label: translate('headerMenu.openDimensionsLabel', language as any), type: 'text', defaultValue: `${parsed.width},${parsed.height}` }
              ],
              confirmText: translate('headerMenu.openConfirm', language as any),
              onConfirm: (values) => {
                const sizeStr = values.sizeStr;
                let targetW = parsed.width;
                let targetH = parsed.height;
                if (sizeStr) {
                  if (sizeStr.includes(',')) {
                    const parts = sizeStr.split(',');
                    targetW = parseInt(parts[0]) || parsed.width;
                    targetH = parseInt(parts[1]) || parsed.height;
                  } else {
                    const parsedSize = parseInt(sizeStr);
                    if (parsedSize) {
                      targetW = parsedSize;
                      targetH = parsedSize;
                    }
                  }
                }

                if (targetW > 600 || targetH > 600 || targetW < 4 || targetH < 4) {
                  showToast?.(translate('headerMenu.canvasLimitsError', language as any), 'error');
                  return;
                }

                let finalParsed = parsed;
                if (targetW !== parsed.width || targetH !== parsed.height) {
                  const scaledPixels: any = {};
                  for (const frameId of Object.keys(parsed.pixels)) {
                    scaledPixels[frameId] = {};
                    for (const layerId of Object.keys(parsed.pixels[frameId])) {
                      const arr = parsed.pixels[frameId][layerId];
                      if (Array.isArray(arr)) {
                        const newArr = new Array(targetW * targetH).fill('');
                        for (let y = 0; y < targetH; y++) {
                          const srcY = Math.floor((y / targetH) * parsed.height);
                          for (let x = 0; x < targetW; x++) {
                            const srcX = Math.floor((x / targetW) * parsed.width);
                            newArr[y * targetW + x] = arr[srcY * parsed.width + srcX] || '';
                          }
                        }
                        scaledPixels[frameId][layerId] = newArr;
                      }
                    }
                  }
                  finalParsed = {
                    ...parsed,
                    width: targetW,
                    height: targetH,
                    pixels: scaledPixels
                  };
                }

                const finalWithMetadata = {
                  ...finalParsed,
                  fileHandle: fileHandle || undefined,
                  hasBeenSavedLocally: true,
                  fileFormat: 'onepixel'
                };
                onImportProject(finalWithMetadata as PixelProject);
                showToast?.(translate('headerMenu.projectOpenedSuccess', language as any), 'success');
              }
            });
          } else {
            showToast?.(translate('headerMenu.nativeInvalidError', language as any), 'error');
          }
        } catch (err) {
          showToast?.(translate('headerMenu.nativeReadError', language as any), 'error');
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. Image and Specialized formats (PNG, JPEG, GIF, PSD, ORA, ASE, BMP, WEBP)
    if (['png', 'jpeg', 'jpg', 'gif', 'bmp', 'webp', 'psd', 'ora', 'ase', 'aseprite'].includes(ext || '')) {
      try {
        const newProject = await parseCompatibleFileToProject(file);
        setActivePrompt({
          title: translate('headerMenu.openImageTitle', language as any),
          description: translate('headerMenu.openCanvasSizeDesc', language as any, { width: newProject.width, height: newProject.height }),
          fields: [
            { key: 'sizeStr', label: translate('headerMenu.openDimensionsLabel', language as any), type: 'text', defaultValue: `${newProject.width},${newProject.height}` }
          ],
          confirmText: translate('headerMenu.openConfirm', language as any),
          onConfirm: (values) => {
            const sizeStr = values.sizeStr;
            let targetW = newProject.width;
            let targetH = newProject.height;
            if (sizeStr) {
              if (sizeStr.includes(',')) {
                const parts = sizeStr.split(',');
                targetW = parseInt(parts[0]) || newProject.width;
                targetH = parseInt(parts[1]) || newProject.height;
              } else {
                const parsedSize = parseInt(sizeStr);
                if (parsedSize) {
                  targetW = parsedSize;
                  targetH = parsedSize;
                }
              }
            }

            if (targetW > 600 || targetH > 600 || targetW < 4 || targetH < 4) {
              showToast?.(translate('headerMenu.canvasLimitsError', language as any), 'error');
              return;
            }

            let scaledProject = newProject;
            if (targetW !== newProject.width || targetH !== newProject.height) {
              const scaledPixels: any = {};
              for (const frameId of Object.keys(newProject.pixels)) {
                scaledPixels[frameId] = {};
                for (const layerId of Object.keys(newProject.pixels[frameId])) {
                  const arr = newProject.pixels[frameId][layerId];
                  if (Array.isArray(arr)) {
                    const newArr = new Array(targetW * targetH).fill('');
                    for (let y = 0; y < targetH; y++) {
                      const srcY = Math.floor((y / targetH) * newProject.height);
                      for (let x = 0; x < targetW; x++) {
                        const srcX = Math.floor((x / targetW) * newProject.width);
                        newArr[y * targetW + x] = arr[srcY * newProject.width + srcX] || '';
                      }
                    }
                    scaledPixels[frameId][layerId] = newArr;
                  }
                }
              }
              scaledProject = {
                ...newProject,
                width: targetW,
                height: targetH,
                pixels: scaledPixels
              };
            }

            onImportProject(scaledProject);
            showToast?.(translate('headerMenu.projectOpenedSuccess', language as any), 'success');
          }
        });
      } catch (err) {
        console.error(err);
        showToast?.(translate('headerMenu.nativeReadError', language as any), 'error');
      }
    } else {
      showToast?.(translate('headerMenu.nativeInvalidError', language as any), 'error');
    }
  };

  const handleOpenProjectClick = async () => {
    setActiveMenu(null);
    if (typeof window !== 'undefined' && typeof (window as any).showOpenFilePicker === 'function') {
      try {
        const handles = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Archivos compatibles (*.onepixel, *.json, imágenes)',
              accept: {
                'application/json': ['.onepixel', '.pixelproject', '.json'],
                'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.psd', '.ora', '.ase', '.aseprite']
              }
            }
          ],
          multiple: false
        });
        if (handles && handles.length > 0) {
          const handle = handles[0];
          const file = await handle.getFile();
          await processOpenedFile(file, handle);
          return;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        // If blocked by browser policy, fallback to input
      }
    }
    openFileInputRef.current?.click();
  };

  const handleOpenFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow opening the same file consecutively
    e.target.value = '';

    await processOpenedFile(file);
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleMenuMouseEnter = (menuId: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menuId);
    }
  };

  const triggerCustomNewProject = () => {
    setActivePrompt({
      title: translate('headerMenu.newProject', language as any),
      description: translate('headerMenu.subNewProject', language as any),
      fields: [
        { key: 'resolution', label: translate('headerMenu.openDimensionsLabel', language as any), type: 'text', defaultValue: '32' }
      ],
      confirmText: translate('common.confirm', language as any),
      onConfirm: (values) => {
        const res = values.resolution;
        let w = 32, h = 32;
        if (res.includes(',')) {
          const parts = res.split(',');
          w = parseInt(parts[0]) || 32;
          h = parseInt(parts[1]) || 32;
        } else {
          w = parseInt(res) || 32;
          h = w;
        }
        if (w < 4 || w > 600 || h < 4 || h > 600) {
          showToast?.(translate('headerMenu.canvasLimitsError', language as any), 'error');
          return;
        }
        onNewProject(w, h);
      }
    });
  };

  const triggerResizeCanvas = () => {
    setResizeWidth(project?.width || 32);
    setResizeHeight(project?.height || 32);
    setResizeModalOpen(true);
  };

  const triggerScaleSprite = () => {
    setScaleWidth((project?.width || 32) * 2);
    setScaleHeight((project?.height || 32) * 2);
    setScaleModalOpen(true);
  };

  const triggerCloseProject = () => {
    setActivePrompt({
      title: translate('headerMenu.closeProjectTitle', language as any),
      description: translate('headerMenu.closeProjectDesc', language as any),
      fields: [],
      confirmText: translate('headerMenu.closeProject', language as any),
      onConfirm: () => {
        onNewProject(32, 32);
      }
    });
  };

  return (
    <div ref={menuContainerRef} className={`flex flex-col ${awe.isMobileLandscape ? 'gap-0' : 'gap-1'} w-full relative z-[100] select-none font-sans`} id="header-menu-container">
      
      {/* 1. Brand Header (Hidden in mobile landscape to maximize vertical canvas space) */}
      {!awe.isMobileLandscape && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 shrink-0">
            <OnePixelLogo height={20} className="shrink-0" />
          </div>
          <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
            v1.2.0
          </div>
        </div>
      )}

      {/* 2. Options Bar */}
      <div className={`bg-[#102419] border border-[#102419]/80 ${
        awe.isMobileLandscape 
          ? 'px-1.5 py-0.5 min-h-[28px] rounded-md' 
          : 'px-2 md:px-3 py-1 rounded-lg'
      } flex flex-col md:flex-row items-stretch md:items-center justify-start text-slate-100 shadow-lg animate-in slide-in-from-top-1 duration-150 overflow-visible`} id="header-menu-bar">
        
        {/* Mobile Landscape Header Row: Minimalist bar with essential menu and undo/redo only */}
        {awe.isMobileLandscape && (
          <div className="flex items-center justify-between w-full py-0.5 px-1">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <OnePixelLogo height={18} className="shrink-0" />
            </div>

            {/* Essential Controls: Undo/Redo and Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Undo / Redo */}
              <div className="flex items-center gap-1 bg-[#102419] px-1.5 py-0.5 rounded-lg border border-[#102419]/70">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Deshacer (Ctrl+Z)"
                  className={`flex items-center justify-center p-1 rounded-md transition-all duration-150 ${
                    canUndo
                      ? 'text-[#C8A96A] hover:text-white bg-[#102419] hover:bg-[#102419]/80 active:scale-95'
                      : 'text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  id="mobile-land-undo-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Rehacer (Ctrl+Y)"
                  className={`flex items-center justify-center p-1 rounded-md transition-all duration-150 ${
                    canRedo
                      ? 'text-[#C8A96A] hover:text-white bg-[#102419] hover:bg-[#102419]/80 active:scale-95'
                      : 'text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  id="mobile-land-redo-btn"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/30 transition-all active:scale-95 shrink-0"
                id="mobile-land-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                <span>{isMobileMenuOpen ? translate('common.close', language) : translate('layout.menu', language)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Portrait Header Row */}
        {isMobile && !awe.isMobileLandscape && (
          <div className="flex items-center justify-between w-full py-1">
            {/* Mobile Undo/Redo */}
            <div className="flex items-center gap-1.5 bg-[#102419] px-1.5 py-0.5 rounded-lg border border-[#102419]/70">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Deshacer (Ctrl+Z)"
                className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${
                  canUndo
                    ? 'text-[#C8A96A] hover:text-white bg-[#102419] hover:bg-[#102419]/80 active:scale-95'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Rehacer (Ctrl+Y)"
                className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${
                  canRedo
                    ? 'text-[#C8A96A] hover:text-white bg-[#102419] hover:bg-[#102419]/80 active:scale-95'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Tool and Color Indicators (Mobile-Only) */}
            <div className="flex items-center gap-1.5 bg-[#102419] border border-[#102419]/60 px-2 py-0.5 rounded-lg shrink-0">
              {/* Tool */}
              <button
                onClick={() => onMobilePanelToggle?.('tools')}
                className="flex items-center gap-1 text-[10px] text-slate-300 font-bold hover:text-white transition active:scale-95"
                title={translate('layout.viewTools', language)}
              >
                {currentTool === 'pen' && <Pencil className="w-3 h-3 text-[#C8A96A]" />}
                {currentTool === 'eraser' && <Eraser className="w-3 h-3 text-[#C8A96A]" />}
                {currentTool === 'bucket' && <PaintBucket className="w-3 h-3 text-[#C8A96A]" />}
                {currentTool === 'dropper' && <Pipette className="w-3 h-3 text-[#C8A96A]" />}
                {currentTool === 'pan' && <Hand className="w-3 h-3 text-[#C8A96A]" />}
                {!['pen', 'eraser', 'bucket', 'dropper', 'pan'].includes(currentTool || '') && <MousePointerClick className="w-3 h-3 text-[#C8A96A]" />}
                <span className="uppercase text-[9px] font-bold tracking-wider text-[#C8A96A]">
                  {translate(`toolbar.${currentTool}` as any, language)}
                </span>
              </button>

              <span className="w-[1px] h-3 bg-[#102419]" />

              {/* Color */}
              <button
                onClick={() => onMobilePanelToggle?.('color')}
                className="flex items-center gap-1 text-[10px] text-slate-300 font-bold hover:text-white transition active:scale-95"
                title={translate('colors.title', language)}
              >
                <div 
                  className="w-3 h-3 rounded-full border border-white/20 shadow-inner" 
                  style={{ backgroundColor: currentColor || '#ffffff' }}
                />
                <span className="text-[9px] font-mono tracking-tight text-slate-400">
                  {(currentColor || '#FFFFFF').toUpperCase()}
                </span>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/30 transition-all active:scale-95"
            >
              {isMobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              <span>{isMobileMenuOpen ? translate('common.close', language) : translate('layout.menu', language)}</span>
            </button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input 
          ref={openFileInputRef}
          type="file"
          accept=".onepixel,.pixelproject,.json,.png,.jpg,.jpeg,.gif,.bmp,.webp,.psd,.ora,.ase,.aseprite"
          className="hidden"
          onChange={handleOpenFileChange}
        />

        <input 
          ref={importFileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.bmp,.webp,.psd,.ora,.ase,.aseprite"
          className="hidden"
          onChange={handleImportLocalImageChange}
        />

        {/* Dropdowns lists */}
        {(!isMobile || isMobileMenuOpen) && (
          <div className={`${
            awe.isMobileLandscape
              ? 'absolute top-full left-0 right-0 mt-1 bg-[#102419] border border-[#102419] rounded-xl p-2 z-[150] shadow-2xl flex flex-wrap gap-1 max-h-[75vh] overflow-y-auto'
              : isMobile
              ? 'flex flex-col gap-1 w-full py-1 border-t border-[#102419]/50 mt-1.5 pt-1.5 overflow-visible'
              : 'hidden md:flex flex-row items-center gap-0.5 py-1 w-auto shrink-0 overflow-visible'
          }`}>
          {menuHeaders.map((header, idx) => {
            const isOpen = activeMenu === header.id;
            const alignRight = idx >= 5; // Paleta, Animación, Ventana, Ayuda are aligned right to prevent screen overflow
            return (
              <div key={header.id} className="relative shrink-0 overflow-visible w-full md:w-auto">
                <button
                  onClick={() => handleMenuClick(header.id)}
                  onMouseEnter={() => !isMobileMenuOpen ? handleMenuMouseEnter(header.id) : undefined}
                  className={`w-full md:w-auto text-left md:text-center px-3 py-1.5 md:py-1.5 rounded-lg text-xs font-semibold hover:bg-[#102419] transition flex items-center justify-between md:justify-center ${
                    isOpen ? 'bg-[#102419] text-[#C8A96A] font-bold' : 'text-slate-300'
                  }`}
                >
                  <span>{header.label}</span>
                  <ChevronRight className={`w-3.5 h-3.5 md:hidden transition-transform duration-200 ${isOpen ? 'rotate-90 text-[#C8A96A]' : 'text-slate-500'}`} />
                </button>

                {/* Dropdown Items Overlay */}
                {isOpen && (
                  <div className={`md:absolute ${alignRight ? 'md:right-0 md:left-auto' : 'md:left-0 md:right-auto'} md:mt-2 md:w-64 md:shadow-2xl md:shadow-black/70 relative w-full mt-1 bg-[#102419] border border-[#1b3d2b] rounded-xl p-1.5 z-[110] flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[350px] overflow-y-auto md:max-h-none ring-1 ring-white/5`}>
                    
                    {/* ARCHIVO Dropdown */}
                    {header.id === 'archivo' && (
                      <>
                        {/* Nuevo */}
                        <button onClick={() => { setNewModalOpen(true); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <FilePlus className="w-3.5 h-3.5 text-white shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.newProject', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('layout.createCanvasDesc', language)}</span>
                          </div>
                        </button>

                        {/* Abrir */}
                        <button onClick={handleOpenProjectClick} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <FolderOpen className="w-3.5 h-3.5 text-white shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{translate('headerMenu.openProject', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.openProjectDesc', language as any)}</span>
                          </div>
                        </button>

                        {/* Abrir Reciente */}
                        <button
                          onClick={() => {
                            setRecentModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{translate('headerMenu.openRecent', language as any)}</span>
                            <span className="text-[9px] text-slate-500">Historial y proyectos recientes</span>
                          </div>
                        </button>

                        <hr className="border-[#102419]/40 my-0.5" />

                        {/* Guardar */}
                        <button onClick={() => { onSaveProject(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Save className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.save', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('layout.saveOnepixelDesc', language)}</span>
                          </div>
                        </button>

                        {/* Guardar Como */}
                        <button onClick={() => { onSaveAsProject?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <FileDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.saveAs', language as any)}</span>
                            <span className="text-[9px] text-slate-500">Elegir ubicación y nombre del proyecto (.onepixel)</span>
                          </div>
                        </button>

                        {/* Importar */}
                        <button onClick={() => { importFileInputRef.current?.click(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" id="btn-colocar-importar-imagen">
                          <FileUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.importImage', language as any)}</span>
                            <span className="text-[9px] text-slate-500">Insertar imagen (PNG, JPG, PSD, ORA, ASE)</span>
                          </div>
                        </button>

                        {/* Exportación rápida */}
                        <button onClick={() => { onQuickExport?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" id="btn-menu-quick-export">
                          <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.quickExport', language as any) || 'Exportación rápida'}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.quickExportDesc', language as any) || 'Guardar imagen PNG directa'}</span>
                          </div>
                        </button>

                        {/* Exportar */}
                        <button onClick={() => { onOpenExport(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Download className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.export', language as any)}</span>
                            <span className="text-[9px] text-slate-500">Múltiples formatos avanzados</span>
                          </div>
                        </button>

                        {/* Preferencias */}
                        <button onClick={() => { onPreferencesClick?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Settings className="w-3.5 h-3.5 text-white shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.preferences', language as any)}</span>
                            <span className="text-[9px] text-slate-500">Configuración básica y avanzada</span>
                          </div>
                        </button>

                        {/* Pantalla de Bienvenida */}
                        <button onClick={() => { onWelcomeClick?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('welcome.tabWelcome', language) || 'Welcome'}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.welcomeDesc', language as any) || 'Screen'}</span>
                          </div>
                        </button>

                        <hr className="border-[#102419]/40 my-0.5" />

                        {/* Cerrar */}
                        <button onClick={() => { onCloseProject?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-rose-400 text-slate-300 transition">
                          <Square className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.closeProject', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('layout.closeActiveFileDesc', language)}</span>
                          </div>
                        </button>

                        {/* Cerrar Todo */}
                        <button onClick={() => { onCloseAllProjects?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-rose-400 text-slate-300 transition">
                          <Layout className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.closeAllProjects', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.closeAllProjectsDesc', language as any) || 'Close all'}</span>
                          </div>
                        </button>

                        {/* Salir */}
                        <button onClick={() => { onExitApplication?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-red-400 text-slate-300 transition">
                          <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold">{translate('headerMenu.exit', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('layout.closeStudioDesc', language)}</span>
                          </div>
                        </button>
                      </>
                    )}

                    {/* EDITAR Dropdown */}
                    {header.id === 'editar' && (
                      <>
                        <button disabled={!canUndo} onClick={() => { onUndo(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition disabled:opacity-40">
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.undo', language as any)}</span>
                        </button>
                        <button disabled={!canRedo} onClick={() => { onRedo(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition disabled:opacity-40">
                          <RotateCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.redo', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onCutSelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Scissors className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.cut', language as any)}</span>
                        </button>
                        <button onClick={() => { onCopySelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.copy', language as any)}</span>
                        </button>
                        <button onClick={() => { onPasteSelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Clipboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.paste', language as any)}</span>
                        </button>
                        {onCropToSelection && (
                          <button onClick={() => { onCropToSelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-[#C8A96A] text-slate-300 transition">
                            <Crop className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                            <span>Recortar al Área Seleccionada</span>
                          </button>
                        )}
                        <button onClick={() => { onClearLayer(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-rose-400 text-slate-300 transition">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{translate('headerMenu.clearLayer', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onMirrorLayer('horizontal'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.mirrorHorizontal', language as any)}</span>
                        </button>
                        <button onClick={() => { onMirrorLayer('vertical'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.mirrorVertical', language as any)}</span>
                        </button>
                      </>
                    )}

                    {/* VER Dropdown */}
                    {header.id === 'ver' && (
                      <>
                        <button onClick={() => { onCenterCanvas(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Maximize2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('canvas.centerCanvas', language) || translate('layout.centerCanvas', language)}</span>
                        </button>
                        <button onClick={() => { onZoomIn(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ZoomIn className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.zoomIn', language as any)}</span>
                        </button>
                        <button onClick={() => { onZoomOut(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ZoomOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.zoomOut', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onToggleGrid(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Grid className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.showGrid', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${gridVisible ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleOnionSkin(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.onionSkin', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${onionSkinEnabled ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleTiling(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Layout className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.tiling', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${tilingActive ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleSymmetry(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.symmetryGuides', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${symmetryActive ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onToggleRulers(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Grid className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.showRulers', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${rulersVisible ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleGuides(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Layout className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.showGuides', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${guidesVisible ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleGuidesLocked(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.lockGuides', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${guidesLocked ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onToggleSnapping(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{translate('headerMenu.smartSnapping', language as any)}</span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${snappingEnabled ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                        </button>
                        <button onClick={() => { onClearGuides(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-rose-400 text-slate-300 transition">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{translate('headerMenu.clearAllGuides', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onOpenLibrary(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" title={translate('headerMenu.resourceLibrary', language as any)}>
                          <Database className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span>{translate('headerMenu.resourceLibrary', language as any)}</span>
                        </button>
                        {onOpenAssetLibrary && (
                          <button onClick={() => { onOpenAssetLibrary(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" title={translate('headerMenu.assetLibrary', language as any)}>
                            <Box className="w-3.5 h-3.5 text-white shrink-0" />
                            <span className="font-bold text-slate-100">{translate('headerMenu.assetLibrary', language as any)}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* SELECCIONAR Dropdown */}
                    {header.id === 'seleccionar' && (
                      <>
                        <button onClick={() => { onSelectAll(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <CheckSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.selectAll', language as any)}</span>
                        </button>
                        <button onClick={() => { onDeselect(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.deselect', language as any)}</span>
                        </button>
                        <button onClick={() => { onInvertSelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.invertSelection', language as any)}</span>
                        </button>
                        <button onClick={() => { onSelectByColor(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <PaletteIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.selectByColor', language as any)}</span>
                        </button>
                        <button onClick={() => { onFillSelection(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{translate('headerMenu.fillSelection', language as any)}</span>
                        </button>
                        <hr className="border-[#102419]/40 my-1" />
                        <button onClick={() => { onExpandSelection?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Maximize2 className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.expandSelection', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.expandSelectionDesc', language as any)}</span>
                          </div>
                        </button>
                        <button onClick={() => { onContractSelection?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Sliders className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold">{translate('headerMenu.contractSelection', language as any)}</span>
                            <span className="text-[9px] text-slate-500">{translate('headerMenu.contractSelectionDesc', language as any)}</span>
                          </div>
                        </button>
                      </>
                    )}

                    {/* SPRITE Dropdown */}
                    {header.id === 'sprite' && (
                      <>
                        <button onClick={() => { onRotateSprite(90); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Rotate3D className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.rotate90', language as any)}</span>
                        </button>
                        <button onClick={() => { onRotateSprite(180); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.rotate180', language as any)}</span>
                        </button>
                        <button onClick={() => { onInvertColors(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.invertColors', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onPatternsClick(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" title="Biblioteca de Patrones y Texturas">
                          <Layers className="w-3.5 h-3.5 text-white shrink-0" />
                          <span className="font-bold text-slate-200">{translate('headerMenu.texturePatterns', language as any)}</span>
                        </button>
                        <button onClick={() => { setSavePatternName(`Patrón Original ${Date.now().toString().slice(-4)}`); setSavePatternModalOpen(true); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Save className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>{translate('headerMenu.saveOriginalPattern', language as any)}</span>
                        </button>
                        <button onClick={() => { setResizeWidth(project?.width || 32); setResizeHeight(project?.height || 32); setResizeModalOpen(true); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Layout className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>{translate('headerMenu.resizeCanvas', language as any)}</span>
                        </button>
                        <button onClick={() => { setScaleWidth((project?.width || 32) * 2); setScaleHeight((project?.height || 32) * 2); setScaleModalOpen(true); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Scaling className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span>{translate('headerMenu.scaleSprite', language as any)}</span>
                        </button>
                      </>
                    )}

                    {/* PALETA Dropdown */}
                    {header.id === 'paleta' && (
                      <>
                        <button onClick={() => { onNewPalette(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <PaletteIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{translate('headerMenu.newPalette', language as any)}</span>
                        </button>
                        <button onClick={() => { onAddToPalette(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.addColor', language as any)}</span>
                        </button>
                        <button onClick={() => { onInvertPalette(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.invertPalette', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        <span className="text-[9px] uppercase font-bold text-slate-500 px-3 py-1 block">{translate('headerMenu.presets', language as any)}</span>
                        <button onClick={() => { onLoadPalettePreset('Resprite Classic'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          OnePixel Classic
                        </button>
                        <button onClick={() => { onLoadPalettePreset('Fantasy PICO-8'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          Fantasy PICO-8
                        </button>
                        <button onClick={() => { onLoadPalettePreset('GameBoy Retro'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          GameBoy Retro
                        </button>
                        <button onClick={() => { onLoadPalettePreset('Cyberpunk 2077'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          Cyberpunk 2077
                        </button>
                        <button onClick={() => { onLoadPalettePreset('Retro NES'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          Retro NES
                        </button>
                      </>
                    )}

                    {/* ANIMACION Dropdown */}
                    {header.id === 'animacion' && (
                      <div className="flex flex-col gap-1 select-none">
                        <button onClick={() => { onTogglePlay(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{translate('headerMenu.pauseAnimation', language as any)}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{translate('headerMenu.playAnimation', language as any)}</span>
                            </>
                          )}
                        </button>
                        <button onClick={() => { onNextFrame(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.nextFrame', language as any)}</span>
                        </button>
                        <button onClick={() => { onPrevFrame(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.prevFrame', language as any)}</span>
                        </button>
                        <hr className="border-[#102419] my-1" />
                        
                        <button onClick={() => { onAddFrame(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.addFrame', language as any)}</span>
                        </button>
                        <button onClick={() => { onDeleteFrame(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-rose-400 text-slate-300 transition">
                          <Trash className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{translate('headerMenu.removeFrame', language as any)}</span>
                        </button>
                        <button onClick={() => { onDuplicateFrame(currentFrameId); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.duplicateCurrentFrame', language as any)}</span>
                        </button>
                        
                        <hr className="border-[#102419] my-1" />
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {translate('headerMenu.animationEffects', language as any)}
                        </div>

                        {/* Modo Normal / Adelante */}
                        <button onClick={() => { onChangePlaybackMode?.('forward'); setActiveMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex flex-col gap-0.5 hover:bg-[#102419] transition ${playbackMode === 'forward' ? 'bg-[#102419] text-white' : 'text-slate-300'}`}>
                          <div className="flex items-center gap-2">
                            <Play className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="font-semibold">{translate('headerMenu.normalPlayback', language as any)}</span>
                          </div>
                          <span className="text-[9px] text-slate-500">{translate('headerMenu.normalPlaybackDesc', language as any)}</span>
                        </button>

                        {/* Modo Ping Pong */}
                        <button onClick={() => { onChangePlaybackMode?.('pingpong'); setActiveMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex flex-col gap-0.5 hover:bg-[#102419] transition ${playbackMode === 'pingpong' ? 'bg-[#102419] text-white' : 'text-slate-300'}`}>
                          <div className="flex items-center gap-2">
                            <Repeat className="w-3 h-3 text-[#C8A96A] shrink-0" />
                            <span className="font-semibold">{translate('headerMenu.pingPong', language as any)}</span>
                          </div>
                          <span className="text-[9px] text-slate-500">{translate('headerMenu.pingPongDesc', language as any)}</span>
                        </button>

                        {/* Modo Reversa */}
                        <button onClick={() => { onChangePlaybackMode?.('reverse'); setActiveMenu(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex flex-col gap-0.5 hover:bg-[#102419] transition ${playbackMode === 'reverse' ? 'bg-[#102419] text-white' : 'text-slate-300'}`}>
                          <div className="flex items-center gap-2">
                            <ChevronLeft className="w-3 h-3 text-white shrink-0" />
                            <span className="font-semibold">{translate('headerMenu.reverse', language as any)}</span>
                          </div>
                          <span className="text-[9px] text-slate-500">{translate('headerMenu.reverseDesc', language as any)}</span>
                        </button>

                        {/* Exportar Sprite Sheet */}
                        <button onClick={() => { onOpenExport(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex flex-col gap-0.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <div className="flex items-center gap-2">
                            <Grid className="w-3 h-3 text-white shrink-0" />
                            <span className="font-semibold">{translate('headerMenu.exportSpriteSheet', language as any)}</span>
                          </div>
                          <span className="text-[9px] text-slate-500">{translate('headerMenu.exportSpriteSheetDesc', language as any)}</span>
                        </button>

                        <hr className="border-[#102419] my-1" />
                        
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {translate('headerMenu.animationSpeed', language as any)}
                        </div>
                        <div className="px-3 pb-2 pt-1 flex items-center justify-between gap-2 bg-[#0F3D34]/40 rounded-lg mx-2 my-1 border border-[#102419]/30">
                          <span className="text-[10px] text-slate-400 font-medium">{translate('headerMenu.adjustFps', language as any)}</span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => { onChangeFps?.(Math.max(1, (project?.fps || 12) - 1)); }}
                              className="w-5 h-5 bg-[#102419] hover:bg-rose-500/20 border border-[#102419] text-slate-300 hover:text-rose-400 rounded flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={project?.fps || 12}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                onChangeFps?.(Math.max(1, Math.min(120, val)));
                              }}
                              className="w-12 bg-[#0F3D34] border border-[#102419] rounded text-[11px] text-[#C8A96A] text-center py-0.5 focus:outline-none focus:border-[#C8A96A] font-mono font-bold"
                            />
                            <button 
                              onClick={() => { onChangeFps?.(Math.min(120, (project?.fps || 12) + 1)); }}
                              className="w-5 h-5 bg-[#102419] hover:bg-emerald-500/20 border border-[#102419] text-slate-300 hover:text-emerald-400 rounded flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VENTANA Dropdown */}
                    {header.id === 'ventana' && (
                      <>
                        <button onClick={() => { onToggleSidebar(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <span>{translate('headerMenu.showLeftPanel', language as any)}</span>
                          {sidebarVisible ? <ToggleRight className="w-4 h-4 text-[#C8A96A] shrink-0" /> : <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />}
                        </button>
                        <button onClick={() => { onToggleColors(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <span>{translate('headerMenu.showColorsPanel', language as any)}</span>
                          {colorsVisible ? <ToggleRight className="w-4 h-4 text-[#C8A96A] shrink-0" /> : <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />}
                        </button>
                        <button onClick={() => { onToggleTools(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <span>{translate('headerMenu.showToolsBar', language as any)}</span>
                          {toolsVisible ? <ToggleRight className="w-4 h-4 text-[#C8A96A] shrink-0" /> : <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />}
                        </button>
                        <button onClick={() => { onToggleTimeline?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <span>{translate('headerMenu.showTimeline', language as any)}</span>
                          {timelineVisible ? <ToggleRight className="w-4 h-4 text-[#C8A96A] shrink-0" /> : <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />}
                        </button>
                        <button onClick={() => { onMaximizeWorkspace(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-white transition">
                          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{translate('headerMenu.maximizeWorkspace', language as any)}</span>
                        </button>
                        
                        <hr className="border-[#102419] my-1" />
                        <span className="text-[8px] uppercase font-bold text-slate-500 px-3 py-1 block tracking-wider">{translate('headerMenu.colorMode', language as any)}</span>
                        <div className="flex flex-col gap-0.5 px-1 pb-1">
                          <button 
                            onClick={() => { onChangeTheme('light'); setActiveMenu(null); }} 
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                              theme === 'light' ? 'bg-[#102419] text-[#C8A96A] font-bold' : 'hover:bg-[#102419]/50 text-slate-300'
                            }`}
                          >
                            <span>{translate('headerMenu.light', language as any)}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                          </button>
                          <button 
                            onClick={() => { onChangeTheme('dark'); setActiveMenu(null); }} 
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                              theme === 'dark' ? 'bg-[#102419] text-[#C8A96A] font-bold' : 'hover:bg-[#102419]/50 text-slate-300'
                            }`}
                          >
                            <span>{translate('headerMenu.dark', language as any)}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                          </button>
                          <button 
                            onClick={() => { onChangeTheme('standard'); setActiveMenu(null); }} 
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                              theme === 'standard' ? 'bg-[#102419] text-[#C8A96A] font-bold' : 'hover:bg-[#102419]/50 text-slate-300'
                            }`}
                          >
                            <span>{translate('headerMenu.standard', language as any)}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${theme === 'standard' ? 'bg-[#C8A96A] shadow-[0_0_6px_#C8A96A]' : 'bg-slate-700'}`} />
                          </button>
                        </div>
                        <hr className="border-[#102419] my-1" />
                        <button onClick={() => { onResetLayout(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Layout className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.resetLayout', language as any)}</span>
                        </button>
                      </>
                    )}

                    {/* AYUDA Dropdown */}
                    {header.id === 'ayuda' && (
                      <>
                        <button onClick={() => { onHelpClick('manual'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <BookOpen className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span className="font-semibold text-white">{translate('headerMenu.userManual', language as any)}</span>
                        </button>
                        <button onClick={() => { onHelpClick('workflows'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Zap className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span>{translate('headerMenu.workflowGuides', language as any)}</span>
                        </button>
                        <button onClick={() => { if (onStartTour) { onStartTour(); } else { setTutorialStep(0); setTutorialOpen(true); } setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Compass className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span>{translate('headerMenu.interactiveTour', language as any)}</span>
                        </button>
                        <button onClick={() => { onHelpClick('tips'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{translate('headerMenu.proTips', language as any)}</span>
                        </button>
                        <button onClick={() => { onHelpClick('shortcuts'); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{translate('headerMenu.shortcutsManual', language as any)}</span>
                        </button>
                        <div className="my-1 border-t border-[#102419]/60" />
                        <button 
                          onClick={() => { setSupportModalOpen(true); setActiveMenu(null); }} 
                          className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition"
                          id="menu-help-send-report-btn"
                        >
                          <LifeBuoy className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span className="font-semibold text-slate-200">{translate('supportReport.menuItem', language as any)}</span>
                        </button>
                        <button 
                          onClick={() => { onDonateClick?.(); setActiveMenu(null); }} 
                          className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-rose-300 transition"
                          id="menu-help-donate-btn"
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 fill-rose-500/20" />
                          <span>{translate('headerMenu.donate', language as any)}</span>
                        </button>
                        <button 
                          onClick={() => { onLegalClick?.('terms'); setActiveMenu(null); }} 
                          className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition"
                          id="menu-help-legal-info-btn"
                        >
                          <Scale className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span className="text-slate-200">{translate('headerMenu.legalInfo', language as any) || 'Información Legal y Términos'}</span>
                        </button>
                        <button onClick={() => { onAboutClick(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{translate('headerMenu.about', language as any)}</span>
                        </button>

                        {(() => {
                          const showDeveloperSection = !!diagnosticsModeEnabled || (typeof window !== 'undefined' && (window.location.search.includes('dev') || window.location.search.includes('debug') || window.location.search.includes('qa')));
                          return showDeveloperSection && (
                            <>
                              {/* Diagnostics & Developer Section */}
                              <div className="my-1 border-t border-[#102419]/40" />
                              
                              <button onClick={() => { onDiagnosticsClick?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                                <span>Panel de Diagnóstico</span>
                              </button>

                              <button onClick={() => { onQAClick?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition" id="qa-mode-menu-btn">
                                <ClipboardCheck className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                                <span className="font-semibold text-white">Panel de Control de Calidad (QA)</span>
                              </button>
                              
                              <button onClick={() => { onExportDiagnosticsReport?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                                <Download className="w-3.5 h-3.5 text-white shrink-0" />
                                <span>{translate('layout.exportReport', language)}</span>
                              </button>
                              
                              <button onClick={() => { onSimulateCrash?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419]/60 hover:text-red-300 text-red-400/90 transition">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span>{translate('headerMenu.simulateCrash', language as any) || 'Simulate Crash'}</span>
                              </button>
                              
                              <button onClick={() => { onToggleDiagnosticsMode?.(); setActiveMenu(null); }} className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-[#102419] hover:text-white text-slate-300 transition">
                                {diagnosticsModeEnabled ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                                <span>{translate('layout.devTools', language)}</span>
                              </button>
                            </>
                          );
                        })()}
                      </>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

        {/* Undo / Redo controls on the empty side of the options bar */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 ml-auto shrink-0 bg-[#0F3D34] px-1.5 py-0.5 rounded-lg border border-[#102419]/70 my-0.5" id="undo-redo-toolbar-controls">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${
                canUndo
                  ? 'text-[#C8A96A] hover:text-white bg-[#102419] hover:bg-[#102419]/80 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              id="undo-action-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-[#102419]" />

            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Y)"
              className={`flex items-center justify-center p-1.5 rounded-md transition-all duration-150 ${
                canRedo
                  ? 'text-[#C8A96A] hover:text-white bg-[#0F3D34] hover:bg-[#C8A96A]/20 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              id="redo-action-btn"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* --- TUTORIAL OVERLAY MODAL --- */}
      {tutorialOpen && (() => {
        const tutorialSteps = [
          {
            title: '1. Mesa de Trabajo & Navegación',
            badge: 'Navegación',
            description: 'Aprende a moverte con fluidez y precisión milimétrica en el lienzo:',
            tips: [
              { label: 'Panorámica / Desplazamiento', text: 'Mantén pulsada la Barra Espaciadora y arrastra con el ratón, o usa el botón central del ratón para desplazarte.' },
              { label: 'Zoom Centrado', text: 'Usa la rueda del ratón hacia arriba o abajo para acercar y alejar sin perder nitidez de píxel.' },
              { label: 'Ajuste Automático', text: 'Presiona Ctrl+0 o el botón de centrado para encajar tu documento en el centro del viewport.' }
            ]
          },
          {
            title: '2. Herramientas de Dibujo & Píxel Perfecto',
            badge: 'Dibujo',
            description: 'Herramientas esenciales para trazar arte retro con máxima limpieza:',
            tips: [
              { label: 'Lápiz (B) & Borrador (E)', text: 'Dibuja y borra píxel a píxel. Cambia el tamaño de pincel en la barra superior.' },
              { label: 'Modo Píxel Perfecto', text: 'Actívalo en la barra superior para eliminar automáticamente esquinas dobles o artefactos de trazo.' },
              { label: 'Líneas (L), Rectángulos (U) & Círculos', text: 'Mantén Shift para bloquear ángulos rectos o proporciones cuadradas y circulares 1:1.' },
              { label: 'Cubo de Relleno (G) & Cuentagotas (I)', text: 'Rellena áreas contiguas por tolerancia y captura colores directamente del lienzo.' }
            ]
          },
          {
            title: '3. Capas & Modos de Fusión',
            badge: 'Estructura',
            description: 'Organiza tu ilustración en planos independientes y no destructivos:',
            tips: [
              { label: 'Gestión de Capas', text: 'Crea, duplica, reorganiza y fusiona capas desde el panel lateral derecho.' },
              { label: 'Visibilidad & Bloqueo', text: 'Oculta o bloquea capas para proteger fondos o lineart mientras coloreas detalles.' },
              { label: 'Modos de Mezcla', text: 'Aplica modos como Multiplicar, Superponer o Pantalla para crear sombras e iluminaciones dinámicas.' }
            ]
          },
          {
            title: '4. Animación, Fotogramas & Papel Cebolla',
            badge: 'Animación',
            description: 'Crea secuencias fluidas y spritesheets animados con la línea de tiempo:',
            tips: [
              { label: 'Línea de Tiempo Inferior', text: 'Añade nuevos fotogramas, duplica poses clave y ajusta la velocidad en FPS.' },
              { label: 'Papel Cebolla (Onion Skin)', text: 'Visualiza sombras translúcidas de los fotogramas anterior y siguiente para facilitar la interpolación.' },
              { label: 'Etiquetas de Animación', text: 'Agrupa fotogramas en animaciones nombradas (ej. "Idle", "Caminar", "Atacar") con bucle personalizado.' }
            ]
          },
          {
            title: '5. Paletas de Color & Exportación',
            badge: 'Exportación',
            description: 'Gestiona armonías de color y exporta tus activos listos para videojuegos:',
            tips: [
              { label: 'Paletas de Color', text: 'Usa presets retro (GameBoy, NES, PICO-8, DB32) o crea y guarda tus propias paletas personalizadas.' },
              { label: 'Guardado Nativo (.onepixel)', text: 'Guarda tu proyecto completo con capas, etiquetas y configuraciones sin pérdida.' },
              { label: 'Exportación Escalada (1x a 10x)', text: 'Exporta en PNG, GIF animado, APNG o Sprite Sheet con escalado entero de píxel nítido.' }
            ]
          }
        ];

        const currentStepData = tutorialSteps[tutorialStep] || tutorialSteps[0];
        const isFirstStep = tutorialStep === 0;
        const isLastStep = tutorialStep === tutorialSteps.length - 1;

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-lg w-full text-slate-200 shadow-2xl relative flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C8A96A] animate-pulse" />
                  <h3 className="text-base font-bold text-white">Tutorial de OnePixel Studio</h3>
                </div>
                <span className="text-[11px] font-bold text-[#C8A96A] bg-[#0F3D34] px-2.5 py-0.5 rounded-full border border-[#102419]">
                  {tutorialStep + 1} / {tutorialSteps.length}
                </span>
              </div>

              {/* Title & Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-100">{currentStepData.title}</h4>
                <span className="text-[10px] font-semibold text-slate-400 bg-[#102419] px-2 py-0.5 rounded">
                  {currentStepData.badge}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Tips Container */}
              <div className="space-y-2 text-xs mb-5 max-h-60 overflow-y-auto pr-1">
                {currentStepData.tips.map((t, idx) => (
                  <div key={idx} className="bg-[#0F3D34] p-2.5 rounded-lg border border-[#102419]/70">
                    <strong className="text-[#C8A96A] block mb-0.5 font-bold">{t.label}:</strong>
                    <p className="text-slate-300 text-[11px] leading-snug">{t.text}</p>
                  </div>
                ))}
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {tutorialSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTutorialStep(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === tutorialStep ? 'w-6 bg-[#C8A96A]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Paso ${i + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button 
                    onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                    className="py-2 px-3 bg-[#0F3D34] hover:bg-[#102419] border border-[#102419] rounded-xl text-xs font-semibold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{translate('headerMenu.tutorialPrevStep', language as any)}</span>
                  </button>
                )}

                {isLastStep ? (
                  <button 
                    onClick={() => setTutorialOpen(false)}
                    className="flex-1 py-2.5 bg-[#C8A96A] hover:bg-[#0F3D34] rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer text-center"
                  >
                    {translate('headerMenu.tutorialStartStudio', language as any)}
                  </button>
                ) : (
                  <button 
                    onClick={() => setTutorialStep(prev => Math.min(tutorialSteps.length - 1, prev + 1))}
                    className="flex-1 py-2.5 bg-[#C8A96A] hover:bg-[#0F3D34] rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>{translate('headerMenu.tutorialNextStep', language as any)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button 
                  onClick={() => setTutorialOpen(false)}
                  className="py-2 px-3 bg-transparent hover:bg-[#102419] rounded-xl text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {translate('headerMenu.tutorialClose', language as any)}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* --- SUPPORT / ENVIAR REPORTE MODAL --- */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        language={language as LanguageCode}
        project={project}
        showToast={showToast}
      />



      {/* --- NUEVO PROYECTO MODAL --- */}
      {newModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-2">
              <FilePlus className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">{translate('headerMenu.newProjectModalTitle', language as any)}</h3>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Width / Height inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.widthLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={newWidth} 
                    onChange={(e) => setNewWidth(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.heightLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={newHeight} 
                    onChange={(e) => setNewHeight(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">{translate('headerMenu.quickPresets', language as any)}</label>
                <div className="grid grid-cols-4 gap-1">
                  {[16, 32, 48, 64, 128, 256, 512].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setNewWidth(size);
                        setNewHeight(size);
                      }}
                      className={`py-1 px-2 rounded-md border text-[10px] font-mono transition ${
                        newWidth === size && newHeight === size
                          ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A] font-bold'
                          : 'bg-[#102419] border-[#102419] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Style selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">{translate('headerMenu.backgroundLabel', language as any)}</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'transparent', label: translate('headerMenu.bgTransparent', language as any) },
                    { id: 'white', label: translate('headerMenu.bgWhite', language as any) },
                    { id: 'color', label: translate('headerMenu.bgColor', language as any) }
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setBgType(bg.id as any)}
                      className={`py-1 px-1.5 rounded-md border text-[10px] font-semibold transition ${
                        bgType === bg.id
                          ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A] font-bold'
                          : 'bg-[#102419] border-[#102419] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Selector */}
              {bgType === 'color' && (
                <div className="flex items-center gap-2 bg-[#102419] border border-[#102419] p-2 rounded-lg">
                  <label className="text-slate-400 text-[10px] flex-1 font-medium">{translate('headerMenu.chooseBgColor', language as any)}</label>
                  <input 
                    type="color" 
                    value={customBgColor} 
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-slate-300 uppercase">{customBgColor}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-6">
              <button 
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                {translate('common.cancel', language as any)}
              </button>
              <button 
                type="button"
                onClick={() => {
                  let bgColor: string | undefined = undefined;
                  if (bgType === 'white') {
                    bgColor = '#ffffff';
                  } else if (bgType === 'color') {
                    bgColor = customBgColor;
                  }
                  onNewProject(newWidth, newHeight, bgColor);
                  setNewModalOpen(false);
                }}
                className="flex-1 py-2 bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/40 rounded-xl text-xs font-bold text-[#C8A96A] transition shadow-md cursor-pointer"
              >
                {translate('headerMenu.accept', language as any)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REDIMENSIONAR LIENZO MODAL --- */}
      {resizeModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-2">
              <Layout className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">{translate('headerMenu.resizeCanvasModalTitle', language as any)}</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              {translate('headerMenu.resizeCanvasModalDesc', language as any)}
            </p>

            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.widthLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={resizeWidth} 
                    onChange={(e) => setResizeWidth(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.heightLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={resizeHeight} 
                    onChange={(e) => setResizeHeight(Math.max(4, Math.min(600, parseInt(e.target.value) || 32)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">{translate('headerMenu.commonDimensions', language as any)}</label>
                <div className="grid grid-cols-4 gap-1">
                  {[16, 32, 48, 64, 128, 256, 512].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setResizeWidth(size);
                        setResizeHeight(size);
                      }}
                      className={`py-1 px-2 rounded-md border text-[10px] font-mono transition ${
                        resizeWidth === size && resizeHeight === size
                          ? 'bg-[#0F3D34] border-[#C8A96A] text-[#C8A96A] font-bold'
                          : 'bg-[#102419] border-[#102419] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                type="button"
                onClick={() => setResizeModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                {translate('common.cancel', language as any)}
              </button>
              <button 
                type="button"
                onClick={() => {
                  onResizeCanvas(resizeWidth, resizeHeight);
                  setResizeModalOpen(false);
                }}
                className="flex-1 py-2 bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/40 rounded-xl text-xs font-bold text-[#C8A96A] transition shadow-md cursor-pointer"
              >
                {translate('common.apply', language as any)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ESCALAR SPRITE MODAL --- */}
      {scaleModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-2">
              <Scaling className="w-5 h-5 text-[#C8A96A]" />
              <h3 className="text-sm font-bold text-white">{translate('headerMenu.scaleSpriteModalTitle', language as any)}</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              {translate('headerMenu.scaleSpriteModalDesc', language as any)}
            </p>

            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.widthLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={scaleWidth} 
                    onChange={(e) => setScaleWidth(Math.max(4, Math.min(600, parseInt(e.target.value) || 64)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 font-medium">{translate('headerMenu.heightLabel', language as any)}</label>
                  <input 
                    type="number" 
                    value={scaleHeight} 
                    onChange={(e) => setScaleHeight(Math.max(4, Math.min(600, parseInt(e.target.value) || 64)))}
                    className="bg-[#102419] border border-[#102419] rounded-lg p-2 text-white text-center focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Scalers */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">{translate('headerMenu.quickMultipliers', language as any)}</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: translate('headerMenu.scaleHalf', language as any), scale: 0.5 },
                    { label: translate('headerMenu.scaleDouble', language as any), scale: 2 },
                    { label: translate('headerMenu.scaleQuad', language as any), scale: 4 }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setScaleWidth(Math.min(600, Math.max(4, Math.round((project?.width || 32) * item.scale))));
                        setScaleHeight(Math.min(600, Math.max(4, Math.round((project?.height || 32) * item.scale))));
                      }}
                      className="py-1 px-1 rounded-md border border-[#102419] bg-[#102419] hover:border-slate-500 text-[10px] text-slate-300 font-mono transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                type="button"
                onClick={() => setScaleModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                {translate('common.cancel', language as any)}
              </button>
              <button 
                type="button"
                onClick={() => {
                  onScaleSprite(scaleWidth, scaleHeight);
                  setScaleModalOpen(false);
                }}
                className="flex-1 py-2 bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/40 rounded-xl text-xs font-bold text-[#C8A96A] transition shadow-md cursor-pointer"
              >
                {translate('headerMenu.scaleButton', language as any)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GUARDAR PATRÓN ORIGINAL MODAL --- */}
      {savePatternModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#102419] border border-[#102419] rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 border-b border-[#102419] pb-2">
              <Save className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">{translate('headerMenu.saveOriginalPatternModalTitle', language as any)}</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              {translate('headerMenu.saveOriginalPatternModalDesc', language as any)}
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 font-medium">{translate('headerMenu.patternNameLabel', language as any)}</label>
                <input 
                  type="text" 
                  value={savePatternName} 
                  onChange={(e) => setSavePatternName(e.target.value)}
                  placeholder="Ej: Mi Textura Césped"
                  className="bg-[#102419] border border-[#102419] rounded-lg p-2.5 text-white focus:ring-1 focus:ring-[#C8A96A] outline-none font-semibold font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                type="button"
                onClick={() => setSavePatternModalOpen(false)}
                className="flex-1 py-2 bg-[#102419] hover:bg-[#102419] rounded-xl text-xs font-semibold text-slate-300 transition"
              >
                {translate('common.cancel', language as any)}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (onSaveOriginalPattern) {
                    onSaveOriginalPattern(savePatternName);
                  }
                  setSavePatternModalOpen(false);
                }}
                className="flex-1 py-2 bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/40 rounded-xl text-xs font-bold text-[#C8A96A] transition shadow-md cursor-pointer"
              >
                {translate('headerMenu.savePatternButton', language as any)}
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && importFileData && (
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          fileName={importFileData.name}
          imageWidth={importFileData.width}
          imageHeight={importFileData.height}
          projectWidth={project?.width || 32}
          projectHeight={project?.height || 32}
          onConfirm={handleConfirmImport}
          language={language}
        />
      )}

      {activePrompt && (
        <GenericPromptModal
          isOpen={true}
          onClose={() => setActivePrompt(null)}
          title={activePrompt.title}
          description={activePrompt.description}
          fields={activePrompt.fields}
          confirmText={activePrompt.confirmText}
          cancelText={activePrompt.cancelText}
          onConfirm={(values) => {
            activePrompt.onConfirm(values);
            setActivePrompt(null);
          }}
        />
      )}

      {/* Recent Projects Modal */}
      {recentModalOpen && (
        <RecentProjectsModal
          isOpen={recentModalOpen}
          onClose={() => setRecentModalOpen(false)}
          onOpenProject={(proj) => {
            saveToRecents(proj);
            onImportProject(proj);
          }}
          showToast={showToast}
          language={language}
        />
      )}

    </div>
  );
})

export default HeaderMenu;
