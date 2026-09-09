import React, { useState } from 'react';
import { 
  Menu, X, RotateCcw, RotateCw, Layers, Palette, 
  PenTool, Eraser, PaintBucket, Pipette, Scan, Move, Maximize2, Grid, FilePlus, FolderOpen, 
  Save, FileDown, Download, Film, Settings, HelpCircle, 
  Info, Sparkles, Sliders, Scaling, Eye, Play, Square, Plus,
  Scissors, Copy, Clipboard, CheckSquare, XSquare, FlipHorizontal, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';
import { OnePixelLogo } from '../../branding';
import { LanguageCode, ToolType } from '../../types';
import { translate } from '../../i18n';

export interface MobileTopBarProps {
  projectName?: string;
  projectWidth?: number;
  projectHeight?: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetZoom?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onOpenPanel: (panel: 'tools' | 'layers' | 'color' | 'options' | 'timeline') => void;
  activePanel: 'tools' | 'layers' | 'color' | 'options' | 'timeline' | null;
  currentColor?: string;
  currentTool?: ToolType;
  layersCount?: number;
  isTimelineOpen?: boolean;
  onToggleTimeline?: () => void;
  isLandscape?: boolean;
  language: LanguageCode;

  // Actions for the Mobile Project Menu
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onOpenRecent?: () => void;
  onSaveProject?: () => void;
  onSaveAsProject?: () => void;
  onExportPng?: () => void;
  onExportGif?: () => void;
  onExportZip?: () => void;
  onResizeCanvas?: () => void;
  onScaleSprite?: () => void;
  onOpenPreferences?: () => void;
  onOpenHelp?: () => void;
  onOpenAbout?: () => void;

  // Additional comprehensive mobile actions
  onCutSelection?: () => void;
  onCopySelection?: () => void;
  onPasteSelection?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onInvertSelection?: () => void;
  onMirrorLayer?: () => void;
  onClearLayer?: () => void;
  onRotateSprite?: () => void;
  onInvertColors?: () => void;
  onToggleOnionSkin?: () => void;
  onionSkinEnabled?: boolean;
  onToggleTiling?: () => void;
  tilingActive?: boolean;
  onToggleSymmetry?: () => void;
  symmetryActive?: boolean;
  onTogglePlay?: () => void;
  isPlaying?: boolean;
  onAddFrame?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = React.memo(function MobileTopBar({
  projectName,
  projectWidth,
  projectHeight,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetZoom,
  showGrid,
  onToggleGrid,
  onOpenPanel,
  activePanel,
  currentColor = '#ffffff',
  currentTool = 'pen',
  layersCount = 1,
  isTimelineOpen = false,
  onToggleTimeline,
  isLandscape = false,
  language,
  onNewProject,
  onOpenProject,
  onOpenRecent,
  onSaveProject,
  onSaveAsProject,
  onExportPng,
  onExportGif,
  onExportZip,
  onResizeCanvas,
  onScaleSprite,
  onOpenPreferences,
  onOpenHelp,
  onOpenAbout,
  onCutSelection,
  onCopySelection,
  onPasteSelection,
  onSelectAll,
  onDeselect,
  onInvertSelection,
  onMirrorLayer,
  onClearLayer,
  onRotateSprite,
  onInvertColors,
  onToggleOnionSkin,
  onionSkinEnabled,
  onToggleTiling,
  tilingActive,
  onToggleSymmetry,
  symmetryActive,
  onTogglePlay,
  isPlaying,
  onAddFrame,
  onZoomIn,
  onZoomOut,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamic icon for current tool
  const getToolIcon = (tool: ToolType) => {
    switch (tool) {
      case 'eraser':
        return <Eraser className="w-4 h-4" />;
      case 'bucket':
        return <PaintBucket className="w-4 h-4" />;
      case 'picker':
        return <Pipette className="w-4 h-4" />;
      case 'pan':
        return <Move className="w-4 h-4" />;
      case 'rect_select':
      case 'ellipse_select':
      case 'lasso_select':
      case 'wand':
        return <Scan className="w-4 h-4" />;
      default:
        return <PenTool className="w-4 h-4" />;
    }
  };

  const handleAction = (action?: () => void) => {
    setIsMenuOpen(false);
    action?.();
  };

  return (
    <>
      {/* 1. SINGLE FLOATING TOP LINE (Minimalist, compact, single balanced row without horizontal scrolling) */}
      <header 
        className={`w-full max-w-full box-border px-2.5 sm:px-3 select-none bg-[#102419]/95 backdrop-blur-md border-b border-[#1b3d2b] z-30 shrink-0 ${
          isLandscape 
            ? 'pt-[calc(env(safe-area-inset-top,0px)+0.25rem)] pb-1' 
            : 'pt-[calc(env(safe-area-inset-top,0px)+0.35rem)] pb-1.5'
        }`}
        id="mobile-single-top-bar"
      >
        {/* Single balanced row - no horizontal scroll needed */}
        <div 
          className="w-full flex items-center justify-between gap-1"
          id="mobile-toolbar-bar"
        >
          {/* Left: Minimalist Hamburger Menu & Dimensions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`min-w-[34px] h-[34px] px-2 rounded-lg flex items-center justify-center gap-1 font-medium transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                isMenuOpen
                  ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] shadow-xs'
                  : 'bg-black/30 hover:bg-black/50 text-[#C8A96A] border-[#C8A96A]/20'
              }`}
              title={translate('layout.menu', language) || 'Menú'}
              id="mobile-menu-trigger-btn"
            >
              {isMenuOpen ? <X className="w-4 h-4 shrink-0" strokeWidth={1.8} /> : <Menu className="w-4 h-4 shrink-0" strokeWidth={1.8} />}
              <span className="text-[10.5px] font-bold tracking-tight hidden min-[360px]:inline">
                {translate('layout.menu', language) || 'Menú'}
              </span>
            </button>

            {/* Subtle Dimensions Label - clean typography without oversized boxes */}
            {projectWidth && projectHeight && (
              <span 
                className="text-[10px] font-mono text-[#C8A96A]/80 font-bold whitespace-nowrap px-1 select-none"
                title={`Tamaño del lienzo: ${projectWidth}×${projectHeight}`}
              >
                {projectWidth}×{projectHeight}
              </span>
            )}
          </div>

          {/* Center: History & Viewport actions (Undo, Redo, Fit, Grid) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Undo Button */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition active:scale-90 touch-manipulation cursor-pointer shrink-0 ${
                canUndo
                  ? 'text-slate-200 hover:text-white bg-black/30 hover:bg-black/50 border-white/5 active:border-[#C8A96A]/30'
                  : 'text-slate-600 opacity-25 cursor-not-allowed border-transparent bg-transparent'
              }`}
              id="mobile-btn-undo"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>

            {/* Redo Button */}
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Y)"
              className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition active:scale-90 touch-manipulation cursor-pointer shrink-0 ${
                canRedo
                  ? 'text-slate-200 hover:text-white bg-black/30 hover:bg-black/50 border-white/5 active:border-[#C8A96A]/30'
                  : 'text-slate-600 opacity-25 cursor-not-allowed border-transparent bg-transparent'
              }`}
              id="mobile-btn-redo"
            >
              <RotateCw className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>

            {/* Reset Zoom / Center Canvas */}
            {onResetZoom && (
              <button
                onClick={onResetZoom}
                title="Centrar y encajar lienzo"
                className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-white/5 bg-black/30 text-slate-300 hover:text-white hover:bg-black/50 transition active:scale-90 touch-manipulation cursor-pointer shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            )}

            {/* Grid Toggle */}
            {onToggleGrid && (
              <button
                onClick={onToggleGrid}
                title="Alternar cuadrícula"
                className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition active:scale-90 touch-manipulation cursor-pointer shrink-0 ${
                  showGrid 
                    ? 'text-[#C8A96A] bg-[#C8A96A]/15 border-[#C8A96A]/50 shadow-[0_0_8px_rgba(200,169,106,0.2)]' 
                    : 'text-slate-400 hover:text-white bg-black/30 border-white/5'
                }`}
              >
                <Grid className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Right: Layers count badge & Color/Palette shortcut */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Layers Panel Toggle with compact badge */}
            <button
              onClick={() => onOpenPanel(activePanel === 'layers' ? (null as any) : 'layers')}
              className={`h-[34px] px-2 rounded-lg flex items-center justify-center gap-1 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                activePanel === 'layers'
                  ? 'bg-[#C8A96A]/20 text-[#C8A96A] border-[#C8A96A]/60 shadow-[0_0_8px_rgba(200,169,106,0.2)]'
                  : 'bg-black/30 hover:bg-black/50 text-slate-300 border-white/5'
              }`}
              title="Capas"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
              <span className="text-[10px] font-bold font-mono text-[#C8A96A]">
                {layersCount}
              </span>
            </button>

            {/* Color Panel Toggle with compact color preview */}
            <button
              onClick={() => onOpenPanel(activePanel === 'color' ? (null as any) : 'color')}
              className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                activePanel === 'color'
                  ? 'bg-[#C8A96A]/20 border-[#C8A96A]/60 shadow-[0_0_8px_rgba(200,169,106,0.2)]'
                  : 'bg-black/30 hover:bg-black/50 border-white/5'
              }`}
              title="Color & Paleta"
            >
              <div 
                className="w-4 h-4 rounded-xs border border-white/70 shadow-xs shrink-0"
                style={{ backgroundColor: currentColor }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 2. DEDICATED FULL-SCREEN / MODAL MOBILE PROJECT MENU */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-start p-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] select-none animate-in fade-in duration-200"
          id="mobile-project-menu-overlay"
        >
          {/* Header of Modal */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <OnePixelLogo height={22} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {projectName || 'OnePixel Studio'}
                </span>
                {projectWidth && projectHeight && (
                  <span className="text-[10px] text-[#C8A96A] font-mono">
                    {projectWidth} × {projectHeight} px
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsMenuOpen(false)}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Categories Grid (Fits portrait & landscape without overflow) */}
          <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
            
            {/* Category 1: Proyecto & Archivo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Proyecto & Archivo
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleAction(onNewProject)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <FilePlus className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Nuevo</span>
                    <span className="text-[9px] text-slate-400">Crear lienzo</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenProject)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Abrir</span>
                    <span className="text-[9px] text-slate-400">Cargar archivo</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onSaveProject)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <Save className="w-5 h-5 text-green-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Guardar</span>
                    <span className="text-[9px] text-slate-400">Guardar cambios</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onSaveAsProject)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <FileDown className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Guardar Como</span>
                    <span className="text-[9px] text-slate-400">Descargar .onepixel</span>
                  </div>
                </button>

                {onOpenRecent && (
                  <button
                    onClick={() => handleAction(onOpenRecent)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Sliders className="w-5 h-5 text-[#C8A96A] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Recientes</span>
                      <span className="text-[9px] text-slate-400">Historial de proyectos</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Category 2: Edición & Selección */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Edición & Selección
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {onSelectAll && (
                  <button
                    onClick={() => handleAction(onSelectAll)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Seleccionar Todo</span>
                      <span className="text-[9px] text-slate-400">Todo el lienzo</span>
                    </div>
                  </button>
                )}

                {onDeselect && (
                  <button
                    onClick={() => handleAction(onDeselect)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <XSquare className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Deseleccionar</span>
                      <span className="text-[9px] text-slate-400">Limpiar selección</span>
                    </div>
                  </button>
                )}

                {onInvertSelection && (
                  <button
                    onClick={() => handleAction(onInvertSelection)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Square className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Invertir Selección</span>
                      <span className="text-[9px] text-slate-400">Área inversa</span>
                    </div>
                  </button>
                )}

                {onCutSelection && (
                  <button
                    onClick={() => handleAction(onCutSelection)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Scissors className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Cortar</span>
                      <span className="text-[9px] text-slate-400">Al portapapeles</span>
                    </div>
                  </button>
                )}

                {onCopySelection && (
                  <button
                    onClick={() => handleAction(onCopySelection)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Copy className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Copiar</span>
                      <span className="text-[9px] text-slate-400">Al portapapeles</span>
                    </div>
                  </button>
                )}

                {onPasteSelection && (
                  <button
                    onClick={() => handleAction(onPasteSelection)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Clipboard className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Pegar</span>
                      <span className="text-[9px] text-slate-400">Insertar píxeles</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Category 3: Transformación & Capa */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Transformación & Capa
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {onMirrorLayer && (
                  <button
                    onClick={() => handleAction(onMirrorLayer)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <FlipHorizontal className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Voltear Horizontal</span>
                      <span className="text-[9px] text-slate-400">Espejo capa</span>
                    </div>
                  </button>
                )}

                {onRotateSprite && (
                  <button
                    onClick={() => handleAction(onRotateSprite)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <RefreshCw className="w-4 h-4 text-teal-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Rotar 90°</span>
                      <span className="text-[9px] text-slate-400">Girar en sentido horario</span>
                    </div>
                  </button>
                )}

                {onInvertColors && (
                  <button
                    onClick={() => handleAction(onInvertColors)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Invertir Colores</span>
                      <span className="text-[9px] text-slate-400">Negativo de capa</span>
                    </div>
                  </button>
                )}

                {onClearLayer && (
                  <button
                    onClick={() => handleAction(onClearLayer)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Eraser className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Limpiar Capa</span>
                      <span className="text-[9px] text-slate-400">Borrar contenido</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Category 4: Vista, Ayudas & Animación */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Vista, Ayudas & Animación
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {onToggleOnionSkin && (
                  <button
                    onClick={() => handleAction(onToggleOnionSkin)}
                    className={`min-h-[48px] p-2.5 rounded-2xl border flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left ${
                      onionSkinEnabled
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A]'
                        : 'bg-[#102419] border-[#1b3d2b] hover:border-[#C8A96A]/50'
                    }`}
                  >
                    <Eye className={`w-4 h-4 shrink-0 ${onionSkinEnabled ? 'text-[#C8A96A]' : 'text-slate-300'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Papel Cebolla</span>
                      <span className="text-[9px] text-slate-400">{onionSkinEnabled ? 'Activado' : 'Desactivado'}</span>
                    </div>
                  </button>
                )}

                {onToggleTiling && (
                  <button
                    onClick={() => handleAction(onToggleTiling)}
                    className={`min-h-[48px] p-2.5 rounded-2xl border flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left ${
                      tilingActive
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A]'
                        : 'bg-[#102419] border-[#1b3d2b] hover:border-[#C8A96A]/50'
                    }`}
                  >
                    <Grid className={`w-4 h-4 shrink-0 ${tilingActive ? 'text-[#C8A96A]' : 'text-slate-300'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Modo Baldosa</span>
                      <span className="text-[9px] text-slate-400">{tilingActive ? 'Activado' : 'Desactivado'}</span>
                    </div>
                  </button>
                )}

                {onToggleSymmetry && (
                  <button
                    onClick={() => handleAction(onToggleSymmetry)}
                    className={`min-h-[48px] p-2.5 rounded-2xl border flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left ${
                      symmetryActive
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A]'
                        : 'bg-[#102419] border-[#1b3d2b] hover:border-[#C8A96A]/50'
                    }`}
                  >
                    <FlipHorizontal className={`w-4 h-4 shrink-0 ${symmetryActive ? 'text-[#C8A96A]' : 'text-slate-300'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Simetría</span>
                      <span className="text-[9px] text-slate-400">{symmetryActive ? 'Activada' : 'Desactivada'}</span>
                    </div>
                  </button>
                )}

                {onTogglePlay && (
                  <button
                    onClick={() => handleAction(onTogglePlay)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Play className={`w-4 h-4 shrink-0 ${isPlaying ? 'text-[#C8A96A]' : 'text-emerald-400'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                      <span className="text-[9px] text-slate-400">Animación</span>
                    </div>
                  </button>
                )}

                {onAddFrame && (
                  <button
                    onClick={() => handleAction(onAddFrame)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Nuevo Fotograma</span>
                      <span className="text-[9px] text-slate-400">Añadir a la tira</span>
                    </div>
                  </button>
                )}

                {onZoomIn && (
                  <button
                    onClick={() => handleAction(onZoomIn)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <ZoomIn className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Acercar Zoom</span>
                      <span className="text-[9px] text-slate-400">Aumentar escala</span>
                    </div>
                  </button>
                )}

                {onZoomOut && (
                  <button
                    onClick={() => handleAction(onZoomOut)}
                    className="min-h-[48px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <ZoomOut className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Alejar Zoom</span>
                      <span className="text-[9px] text-slate-400">Reducir escala</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Category 5: Exportar Gráficos */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Exportar Gráficos
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleAction(onExportPng)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Imagen PNG</span>
                    <span className="text-[9px] text-slate-400">Alta resolución</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onExportGif)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <Film className="w-5 h-5 text-purple-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">GIF Animado</span>
                    <span className="text-[9px] text-slate-400">Animación en bucle</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onExportZip)}
                  className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                >
                  <Download className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">Sprite Sheet / ZIP</span>
                    <span className="text-[9px] text-slate-400">Para videojuegos</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Category 6: Lienzo & Sistema */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Lienzo & Sistema
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {onResizeCanvas && (
                  <button
                    onClick={() => handleAction(onResizeCanvas)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Scaling className="w-5 h-5 text-[#C8A96A] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Redimensionar</span>
                      <span className="text-[9px] text-slate-400">Cambiar tamaño lienzo</span>
                    </div>
                  </button>
                )}

                {onScaleSprite && (
                  <button
                    onClick={() => handleAction(onScaleSprite)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Sliders className="w-5 h-5 text-teal-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Escalar Gráfico</span>
                      <span className="text-[9px] text-slate-400">Remuestreo de píxeles</span>
                    </div>
                  </button>
                )}

                {onOpenPreferences && (
                  <button
                    onClick={() => handleAction(onOpenPreferences)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Settings className="w-5 h-5 text-slate-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Preferencias</span>
                      <span className="text-[9px] text-slate-400">Idioma y tema</span>
                    </div>
                  </button>
                )}

                {onOpenHelp && (
                  <button
                    onClick={() => handleAction(onOpenHelp)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Ayuda y Atajos</span>
                      <span className="text-[9px] text-slate-400">Manual de uso</span>
                    </div>
                  </button>
                )}

                {onOpenAbout && (
                  <button
                    onClick={() => handleAction(onOpenAbout)}
                    className="min-h-[50px] p-2.5 rounded-2xl bg-[#102419] border border-[#1b3d2b] hover:border-[#C8A96A]/50 flex items-center gap-2.5 active:scale-95 transition touch-manipulation cursor-pointer text-left"
                  >
                    <Info className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Acerca de</span>
                      <span className="text-[9px] text-slate-400">OnePixel Studio</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
});

export default MobileTopBar;
