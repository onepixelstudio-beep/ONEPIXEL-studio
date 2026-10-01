import React, { useRef, useEffect } from 'react';
import { 
  Play, Pause, Plus, ChevronLeft, ChevronRight, 
  Repeat, Eye, PenTool, Eraser, PaintBucket, 
  Pipette, Scan, SlidersHorizontal, Layers,
  Sparkles, Blend, Stamp, Square, Circle, Spline,
  Wand2, CircleDashed, Scissors, Move, X,
  Film, Copy, Trash2, ArrowLeftRight
} from 'lucide-react';
import { ToolType, LanguageCode, PixelProject } from '../../types';
import { previewManager } from '../../core/preview/PreviewManager';

export interface MobileQuickBarProps {
  currentTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  currentColor: string;
  secondaryColor?: string;
  onChangeColor: (color: string) => void;
  onSwapColors?: () => void;
  paletteColors?: string[];
  recentColors?: string[];
  onOpenPanel: (panel: 'tools' | 'layers' | 'color' | 'options' | 'timeline') => void;
  activePanel: 'tools' | 'layers' | 'color' | 'options' | 'timeline' | null;
  onToggleTimeline: () => void;
  isTimelineOpen: boolean;
  isLandscape?: boolean;
  language: LanguageCode;

  // Active Stamp / Sprite options
  activeStamp?: { pixels: string[]; width: number; height: number; name: string } | null;
  onClearActiveStamp?: () => void;

  // Timeline controls (when timeline is active in bottom bar)
  project?: PixelProject | null;
  selectedFrameId?: string;
  onSelectFrame?: (id: string) => void;
  onAddFrame?: () => void;
  onDeleteFrame?: (id: string) => void;
  onDuplicateFrame?: (id: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  fps?: number;
  onChangeFps?: (fps: number) => void;
  onionSkinEnabled?: boolean;
  onToggleOnionSkin?: () => void;
  loopEnabled?: boolean;
  onToggleLoop?: () => void;
  playbackMode?: 'forward' | 'reverse' | 'pingpong';
  onChangePlaybackMode?: (mode: 'forward' | 'reverse' | 'pingpong') => void;
}

export const MobileQuickBar: React.FC<MobileQuickBarProps> = React.memo(function MobileQuickBar({
  currentTool,
  onChangeTool,
  currentColor,
  secondaryColor = '#000000',
  onChangeColor,
  paletteColors = [],
  recentColors = [],
  onOpenPanel,
  activePanel,
  onToggleTimeline,
  isTimelineOpen,
  isLandscape = false,
  language,
  activeStamp,
  onClearActiveStamp,

  // Animation timeline integration props
  project,
  selectedFrameId,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  isPlaying = false,
  onTogglePlay,
  fps = 12,
  onChangeFps,
  onionSkinEnabled = true,
  onToggleOnionSkin,
  loopEnabled = true,
  onToggleLoop,
  playbackMode = 'forward',
  onChangePlaybackMode
}) {
  // Default swatches if palette is empty
  const defaultPalette = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  // Active palette swatches: unique, non-empty
  const activeSwatches = (paletteColors && paletteColors.length > 0)
    ? Array.from(new Set(paletteColors.filter(Boolean))).slice(0, 32)
    : defaultPalette;

  // Recent canvas colors history: clean unique list
  const historySwatches = (recentColors && recentColors.length > 0)
    ? Array.from(new Set(recentColors.filter(Boolean))).slice(0, 32)
    : [];

  const frames = project?.frames || [];
  const currentFrameIndex = Math.max(0, frames.findIndex(f => f.id === selectedFrameId));
  const totalFrames = frames.length || 1;

  // Basic frequently used tools list as requested: Lápiz, Borrador, Bote de pintura, Gotero, Selección
  const basicTools: { id: ToolType; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'pen', icon: PenTool, label: 'Lápiz' },
    { id: 'eraser', icon: Eraser, label: 'Borrador' },
    { id: 'bucket', icon: PaintBucket, label: 'Bote' },
    { id: 'picker', icon: Pipette, label: 'Gotero' },
    { id: 'rect_select', icon: Scan, label: 'Selección' },
  ];

  const getSecondaryToolInfo = (tool: ToolType): { icon: React.FC<{ className?: string }>; label: string } | null => {
    switch (tool) {
      case 'spray': return { icon: Sparkles, label: 'Spray' };
      case 'dithering': return { icon: Blend, label: 'Dither' };
      case 'clone_stamp': return { icon: Stamp, label: 'Tampón' };
      case 'line': return { icon: Spline, label: 'Línea' };
      case 'curve': return { icon: Spline, label: 'Curva' };
      case 'rectangle': return { icon: Square, label: 'Rect.' };
      case 'ellipse': return { icon: Circle, label: 'Elipse' };
      case 'ellipse_select': return { icon: CircleDashed, label: 'Elíptico' };
      case 'lasso_select': return { icon: Scissors, label: 'Lazo' };
      case 'wand': return { icon: Wand2, label: 'Varita' };
      case 'pan': return { icon: Move, label: 'Mover' };
      default: return null;
    }
  };

  const isBasicTool = basicTools.some(t => t.id === currentTool);
  const secondaryInfo = !isBasicTool ? getSecondaryToolInfo(currentTool) : null;

  // Mini canvas preview for animation frame thumbnails
  const MiniFrameThumb: React.FC<{ frameId: string; isSelected: boolean }> = ({ frameId, isSelected }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !project) return;
      previewManager.renderFrameToCanvas(canvas, project, frameId, {
        backgroundStyle: 'checkered',
        showPixelGrid: false
      });
    }, [frameId, project, project?.pixels]);

    return (
      <canvas 
        ref={canvasRef} 
        width={32} 
        height={32} 
        className="w-8 h-8 object-contain bg-black/40 rounded-lg pointer-events-none"
      />
    );
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 w-full max-w-full z-40 bg-[#102419]/98 backdrop-blur-xl border-t border-[#1b3d2b] shadow-2xl flex flex-col select-none pointer-events-auto transition-all duration-300 ease-out overflow-hidden box-border pb-[env(safe-area-inset-bottom,0px)]"
      id="mobile-bottom-dock"
    >
      {/* ------------------------------------------------------------------ */}
      {/* 4. CAJÓN DE ANIMACIÓN / LÍNEA DE TIEMPO (ASCIENDE AL ACTIVARSE)     */}
      {/* Orden de abajo hacia arriba: Historial -> Paleta -> Herramientas -> Animación */}
      {/* ------------------------------------------------------------------ */}
      {isTimelineOpen && (
        <div 
          className="w-full max-w-full px-2 pt-1.5 pb-1.5 border-b border-white/10 flex flex-col gap-1.5 bg-[#0a1811]/98 animate-in slide-in-from-bottom duration-200 overflow-hidden box-border"
          id="mobile-dock-animation-strip"
        >
          {/* Header Row: Playback, Navigation, Onion Skin, Loop, FPS & Close */}
          <div className="flex items-center justify-between gap-1 w-full max-w-full overflow-hidden">
            {/* Play/Pause Button & Frame Navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onTogglePlay}
                className={`min-w-[44px] h-[34px] px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 touch-manipulation shadow-md ${
                  isPlaying 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[#C8A96A] text-[#102419] hover:bg-[#d8b97a]'
                }`}
                title={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
                id="mobile-anim-play-btn"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                <span className="text-[10px] font-bold">{isPlaying ? 'Pausa' : 'Play'}</span>
              </button>

              {/* Prev / Next buttons */}
              <button
                onClick={() => {
                  if (currentFrameIndex > 0 && onSelectFrame && frames[currentFrameIndex - 1]) {
                    onSelectFrame(frames[currentFrameIndex - 1].id);
                  }
                }}
                disabled={currentFrameIndex <= 0}
                className="w-8 h-[34px] rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300 flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer"
                title="Frame anterior"
                id="mobile-anim-prev-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[10px] font-mono font-bold text-[#C8A96A] px-1 select-none">
                {currentFrameIndex + 1}/{totalFrames}
              </span>

              <button
                onClick={() => {
                  if (currentFrameIndex < frames.length - 1 && onSelectFrame && frames[currentFrameIndex + 1]) {
                    onSelectFrame(frames[currentFrameIndex + 1].id);
                  }
                }}
                disabled={currentFrameIndex >= frames.length - 1}
                className="w-8 h-[34px] rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300 flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer"
                title="Frame siguiente"
                id="mobile-anim-next-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Onion Skin & Loop & Speed controls & Close */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Onion Skin toggle button */}
              <button
                onClick={onToggleOnionSkin}
                className={`min-w-[36px] h-[34px] px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 touch-manipulation cursor-pointer ${
                  onionSkinEnabled
                    ? 'bg-[#C8A96A] text-[#102419] shadow-xs'
                    : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                }`}
                title="Papel cebolla (Onion Skin)"
                id="mobile-anim-onionskin-btn"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden min-[360px]:inline text-[9px]">Cebolla</span>
              </button>

              {/* Loop toggle */}
              <button
                onClick={onToggleLoop}
                className={`w-8 h-[34px] rounded-lg text-[10px] font-bold flex items-center justify-center transition active:scale-95 touch-manipulation cursor-pointer ${
                  loopEnabled
                    ? 'bg-[#165347] text-[#C8A96A] border border-[#C8A96A]/40'
                    : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                }`}
                title="Repetir en bucle"
                id="mobile-anim-loop-btn"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>

              {/* Playback Mode toggle (Normal -> Ping-Pong -> Reversa) */}
              {onChangePlaybackMode && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMode: Record<string, 'forward' | 'reverse' | 'pingpong'> = {
                      forward: 'pingpong',
                      pingpong: 'reverse',
                      reverse: 'forward'
                    };
                    onChangePlaybackMode(nextMode[playbackMode || 'forward'] || 'forward');
                  }}
                  className={`min-w-[34px] h-[34px] px-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation cursor-pointer ${
                    playbackMode === 'pingpong' || playbackMode === 'reverse'
                      ? 'bg-[#165347] text-[#C8A96A] border border-[#C8A96A]/40 shadow-xs'
                      : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                  }`}
                  title={
                    playbackMode === 'pingpong'
                      ? 'Modo: Ping-Pong (⇄)'
                      : playbackMode === 'reverse'
                      ? 'Modo: Reversa (◀)'
                      : 'Modo: Normal (▶)'
                  }
                  id="mobile-anim-playback-mode-btn"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase font-mono">
                    {playbackMode === 'pingpong' ? 'PP' : playbackMode === 'reverse' ? 'REV' : 'FWD'}
                  </span>
                </button>
              )}

              {/* FPS selector & Stepper */}
              <div className="flex items-center bg-black/50 px-1 py-0.5 rounded-lg border border-white/10 h-[34px]">
                <button
                  onClick={() => onChangeFps && onChangeFps(Math.max(1, fps - 1))}
                  className="w-5 h-6 rounded flex items-center justify-center text-[11px] font-bold text-slate-300 hover:text-white active:scale-90 touch-manipulation"
                  title="Disminuir FPS"
                >
                  -
                </button>
                <span className="text-[9px] font-mono font-bold text-[#C8A96A] px-0.5 min-w-[28px] text-center select-none">
                  {fps}fps
                </span>
                <button
                  onClick={() => onChangeFps && onChangeFps(Math.min(60, fps + 1))}
                  className="w-5 h-6 rounded flex items-center justify-center text-[11px] font-bold text-slate-300 hover:text-white active:scale-90 touch-manipulation"
                  title="Aumentar FPS"
                >
                  +
                </button>
              </div>

              {/* Close Timeline Strip Button */}
              {onToggleTimeline && (
                <button
                  onClick={onToggleTimeline}
                  className="w-7 h-[34px] rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer ml-0.5"
                  title="Cerrar línea de tiempo"
                  id="mobile-anim-close-btn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Frame-by-frame Strip with Thumbnails and Quick Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5 w-full max-w-full">
            {frames.map((frame, idx) => {
              const isSelected = frame.id === selectedFrameId;
              return (
                <div
                  key={frame.id}
                  onClick={() => onSelectFrame && onSelectFrame(frame.id)}
                  className={`relative shrink-0 flex flex-col items-center gap-0.5 p-1 rounded-xl border-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    isSelected
                      ? 'border-[#C8A96A] bg-[#165347]/90 shadow-md ring-1 ring-[#C8A96A]'
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                  }`}
                  title={`Fotograma #${idx + 1}`}
                >
                  <MiniFrameThumb frameId={frame.id} isSelected={isSelected} />
                  
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className={`text-[8.5px] font-mono font-bold ${isSelected ? 'text-[#C8A96A]' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>

                    {/* Frame in-card actions when selected */}
                    {isSelected && (
                      <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDuplicateFrame && onDuplicateFrame(frame.id)}
                          className="p-0.5 rounded bg-black/50 hover:bg-black/80 text-slate-200 hover:text-white active:scale-90 transition touch-manipulation"
                          title="Duplicar fotograma"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFrame && onDeleteFrame(frame.id)}
                          disabled={frames.length <= 1}
                          className="p-0.5 rounded bg-black/50 hover:bg-rose-500/30 text-rose-300 disabled:opacity-20 active:scale-90 transition touch-manipulation"
                          title="Eliminar fotograma"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Frame Button */}
            <button
              onClick={onAddFrame}
              className="shrink-0 min-w-[50px] h-[52px] rounded-xl border-2 border-dashed border-[#C8A96A]/50 bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 text-[#C8A96A] flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation cursor-pointer"
              title="Añadir fotograma"
              id="mobile-anim-add-frame-btn"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[7.5px] font-bold">+Frame</span>
            </button>

            {/* Quick Duplicate Selected Frame Button in Strip */}
            <button
              onClick={() => {
                if (selectedFrameId && onDuplicateFrame) {
                  onDuplicateFrame(selectedFrameId);
                }
              }}
              className="shrink-0 min-w-[48px] h-[52px] rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation cursor-pointer"
              title="Duplicar fotograma seleccionado"
              id="mobile-anim-duplicate-btn"
            >
              <Copy className="w-3.5 h-3.5 text-[#C8A96A]" />
              <span className="text-[7.5px] font-bold">Duplicar</span>
            </button>

            {/* Quick Delete Selected Frame Button in Strip */}
            <button
              onClick={() => {
                if (selectedFrameId && onDeleteFrame) {
                  onDeleteFrame(selectedFrameId);
                }
              }}
              disabled={frames.length <= 1}
              className="shrink-0 min-w-[44px] h-[52px] rounded-xl border border-white/10 bg-black/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 disabled:opacity-20 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation cursor-pointer"
              title="Eliminar fotograma seleccionado"
              id="mobile-anim-delete-btn"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[7.5px] font-bold">Borrar</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ACTIVE STAMP NOTIFICATION BANNER                                    */}
      {/* ------------------------------------------------------------------ */}
      {activeStamp && (
        <div 
          className="w-full px-3 py-1 bg-[#C8A96A]/20 border-b border-[#C8A96A]/40 flex items-center justify-between text-[11px] text-[#C8A96A] font-bold"
          id="mobile-active-stamp-strip"
        >
          <button 
            onClick={() => onOpenPanel('tools')}
            className="flex items-center gap-1.5 truncate cursor-pointer hover:underline text-left"
            title="Ajustar escala, rotación o modo del sello"
          >
            <Stamp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sello: {activeStamp.name || 'Activo'}</span>
            <span className="text-[9px] text-[#C8A96A]/80 font-normal">(Opciones)</span>
          </button>
          {onClearActiveStamp && (
            <button 
              onClick={onClearActiveStamp}
              className="p-1 rounded-md hover:bg-red-500/20 text-red-300 transition active:scale-90"
              title="Quitar sello"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. BARRA DE HERRAMIENTAS BÁSICAS DE USO FRECUENTE                 */}
      {/* Situada justo encima de la paleta de colores activa              */}
      {/* Lápiz, Borrador, Bote de pintura, Gotero, Selección + Más opciones */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className={`w-full max-w-full px-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none bg-[#0a1811]/95 border-b border-white/5 box-border ${
          isLandscape ? 'py-0.5' : 'py-1'
        }`}
        id="mobile-basic-tools-row"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-around sm:justify-start">
          {basicTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (isSelected) {
                    onOpenPanel('tools');
                  } else {
                    onChangeTool(tool.id);
                  }
                }}
                className={`rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                  isLandscape 
                    ? 'min-w-[34px] h-[28px] px-1.5' 
                    : 'min-w-[40px] h-[34px] px-2'
                } ${
                  isSelected
                    ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-black shadow-md'
                    : 'bg-black/35 hover:bg-black/60 text-slate-300 border-white/10'
                }`}
                title={`${tool.label}${isSelected ? ' (Toca para opciones)' : ''}`}
              >
                <Icon className={isLandscape ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
                <span className="text-[10px] font-bold hidden min-[380px]:inline">
                  {tool.label}
                </span>
              </button>
            );
          })}

          {/* Active Secondary / Specialized Tool (if one is chosen from the tools panel) */}
          {secondaryInfo && (
            <button
              onClick={() => onOpenPanel('tools')}
              className={`rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-black shadow-md ring-1 ring-[#C8A96A]/50 animate-in fade-in duration-150 ${
                isLandscape ? 'min-w-[34px] h-[28px] px-1.5' : 'min-w-[40px] h-[34px] px-2'
              }`}
              title={`Herramienta activa: ${secondaryInfo.label}. Toca para abrir opciones.`}
            >
              <secondaryInfo.icon className={isLandscape ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
              <span className="text-[10px] font-bold">
                {secondaryInfo.label}
              </span>
            </button>
          )}
        </div>

        {/* Action buttons: Animation Timeline & Advanced Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Animation Timeline Toggle Button */}
          {onToggleTimeline && (
            <button
              onClick={onToggleTimeline}
              className={`rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                isLandscape ? 'min-w-[36px] h-[28px] px-1.5' : 'min-w-[42px] h-[34px] px-2'
              } ${
                isTimelineOpen
                  ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-black shadow-md'
                  : 'bg-black/40 hover:bg-black/60 text-[#C8A96A] border-white/10'
              }`}
              title={isTimelineOpen ? 'Ocultar línea de tiempo' : 'Línea de tiempo de animación'}
              id="mobile-btn-quickbar-timeline"
            >
              <Film className={isLandscape ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
              <span className="text-[10px] font-bold">Anim</span>
            </button>
          )}

          {/* Shortcut button to open all advanced tools & settings */}
          <button
            onClick={() => onOpenPanel(activePanel === 'tools' ? (null as any) : 'tools')}
            className={`rounded-xl flex items-center justify-center gap-1 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
              isLandscape ? 'min-w-[30px] h-[28px] px-1' : 'min-w-[34px] h-[34px] px-1.5'
            } ${
              activePanel === 'tools'
                ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-bold shadow-md'
                : 'bg-black/40 hover:bg-black/60 text-slate-400 border-white/10'
            }`}
            title="Ver todas las herramientas y pinceles"
          >
            <SlidersHorizontal className={isLandscape ? "w-3 h-3" : "w-3.5 h-3.5"} />
            <span className="text-[9px] font-bold hidden min-[440px]:inline">Más</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2 & 1. PALETA DE COLORES Y HISTORIAL                               */}
      {/* En landscape se combinan en una sola fila compacta                */}
      {/* ------------------------------------------------------------------ */}
      {isLandscape ? (
        <div 
          className="w-full max-w-full px-2 py-0.5 flex items-center gap-1.5 overflow-hidden box-border bg-[#07130d]"
          id="mobile-landscape-color-row"
        >
          {/* Active Palette Tag / Shortcut to full Color Panel */}
          <button
            onClick={() => onOpenPanel('color')}
            className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 active:scale-95 transition touch-manipulation cursor-pointer"
            title="Abrir selector y paletas de color"
          >
            <div 
              className="w-3 h-3 rounded-xs border border-white/80 shadow-xs shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider">
              Paleta
            </span>
          </button>

          {/* Palette Swatches */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 shrink-0 max-w-[42%]">
            {activeSwatches.slice(0, 16).map((color, idx) => {
              const isSelected = currentColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={`land-palette-${color}-${idx}`}
                  onClick={() => onChangeColor(color)}
                  className={`min-w-[22px] min-h-[22px] w-[22px] h-[22px] rounded-lg transition-transform active:scale-90 touch-manipulation cursor-pointer shrink-0 flex items-center justify-center ${
                    isSelected ? 'scale-110 ring-2 ring-[#C8A96A] ring-offset-1 ring-offset-[#102419]' : 'hover:scale-105'
                  }`}
                  title={`Color de paleta: ${color}`}
                >
                  <div 
                    className="w-full h-full rounded-lg border border-white/20 shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })}
          </div>

          <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

          {/* History Label */}
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Historial
          </span>

          {/* History Swatches */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
            {historySwatches.length > 0 ? (
              historySwatches.slice(0, 12).map((color, idx) => {
                const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={`land-history-${color}-${idx}`}
                    onClick={() => onChangeColor(color)}
                    className={`min-w-[20px] min-h-[20px] w-[20px] h-[20px] rounded-md transition-transform active:scale-90 touch-manipulation cursor-pointer shrink-0 flex items-center justify-center ${
                      isSelected ? 'scale-110 ring-2 ring-[#C8A96A] ring-offset-1 ring-offset-[#102419]' : 'hover:scale-105'
                    }`}
                    title={`Color usado: ${color}`}
                  >
                    <div 
                      className="w-full h-full rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                );
              })
            ) : (
              <span className="text-[8.5px] text-slate-500 italic truncate">
                Sin historial
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. PALETA DE COLORES ACTIVA */}
          <div 
            className="w-full max-w-full px-2 pt-1 pb-0.5 flex items-center gap-1.5 overflow-hidden box-border"
            id="mobile-active-palette-row"
          >
            {/* Active Palette Tag / Shortcut to full Color Panel */}
            <button
              onClick={() => onOpenPanel('color')}
              className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 active:scale-95 transition touch-manipulation cursor-pointer"
              title="Abrir selector y paletas de color"
            >
              <div 
                className="w-3.5 h-3.5 rounded-sm border border-white/80 shadow-xs shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wider">
                Paleta
              </span>
            </button>

            {/* Scrollable Palette Colors Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
              {activeSwatches.map((color, idx) => {
                const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={`palette-${color}-${idx}`}
                    onClick={() => onChangeColor(color)}
                    className={`min-w-[30px] min-h-[30px] w-[30px] h-[30px] rounded-xl transition-transform active:scale-90 touch-manipulation cursor-pointer shrink-0 flex items-center justify-center ${
                      isSelected ? 'scale-110 ring-2 ring-[#C8A96A] ring-offset-1 ring-offset-[#102419]' : 'hover:scale-105'
                    }`}
                    title={`Color de paleta: ${color}`}
                  >
                    <div 
                      className="w-full h-full rounded-xl border border-white/20 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. HISTORIAL DE COLORES USADOS EN EL LIENZO */}
          <div 
            className="w-full max-w-full px-2 pt-0.5 pb-2 flex items-center gap-1.5 overflow-hidden border-t border-white/5 box-border"
            id="mobile-color-history-row"
          >
            {/* History Label */}
            <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                Historial
              </span>
            </div>

            {/* Scrollable Color History Swatches */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
              {historySwatches.length > 0 ? (
                historySwatches.map((color, idx) => {
                  const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={`history-${color}-${idx}`}
                      onClick={() => onChangeColor(color)}
                      className={`min-w-[26px] min-h-[26px] w-[26px] h-[26px] rounded-lg transition-transform active:scale-90 touch-manipulation cursor-pointer shrink-0 flex items-center justify-center ${
                        isSelected ? 'scale-110 ring-2 ring-[#C8A96A] ring-offset-1 ring-offset-[#102419]' : 'hover:scale-105'
                      }`}
                      title={`Color usado: ${color}`}
                    >
                      <div 
                        className="w-full h-full rounded-lg border border-white/20 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  );
                })
              ) : (
                <span className="text-[9px] text-slate-500 italic px-1 truncate">
                  Pinta en el lienzo para registrar colores...
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default MobileQuickBar;
