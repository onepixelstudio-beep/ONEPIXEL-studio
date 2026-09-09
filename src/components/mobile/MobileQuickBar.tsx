import React, { useRef, useEffect } from 'react';
import { 
  Play, Pause, Plus, ChevronLeft, ChevronRight, 
  Repeat, Eye, PenTool, Eraser, PaintBucket, 
  Pipette, Scan, SlidersHorizontal, Layers
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

  // Animation timeline integration props
  project,
  selectedFrameId,
  onSelectFrame,
  onAddFrame,
  isPlaying = false,
  onTogglePlay,
  fps = 12,
  onChangeFps,
  onionSkinEnabled = true,
  onToggleOnionSkin,
  loopEnabled = true,
  onToggleLoop
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
          className="w-full max-w-full px-2 pt-1.5 pb-1 border-b border-white/10 flex flex-col gap-1 bg-black/40 animate-in slide-in-from-bottom duration-200 overflow-hidden box-border"
          id="mobile-dock-animation-strip"
        >
          {/* Header Row: Controls, Onion Skin status, Playback & FPS */}
          <div className="flex items-center justify-between gap-1 w-full max-w-full overflow-hidden">
            {/* Play/Pause Button & Frame Navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onTogglePlay}
                className={`min-w-[40px] min-h-[34px] px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 touch-manipulation shadow-md ${
                  isPlaying 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[#C8A96A] text-[#102419]'
                }`}
                title={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
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
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300 flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer"
                title="Frame anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] font-mono font-bold text-[#C8A96A] px-0.5">
                {currentFrameIndex + 1}/{totalFrames}
              </span>

              <button
                onClick={() => {
                  if (currentFrameIndex < frames.length - 1 && onSelectFrame && frames[currentFrameIndex + 1]) {
                    onSelectFrame(frames[currentFrameIndex + 1].id);
                  }
                }}
                disabled={currentFrameIndex >= frames.length - 1}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300 flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer"
                title="Frame siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Onion Skin & Loop & Speed controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Onion Skin toggle button */}
              <button
                onClick={onToggleOnionSkin}
                className={`min-w-[34px] min-h-[30px] px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 touch-manipulation ${
                  onionSkinEnabled
                    ? 'bg-[#C8A96A] text-[#102419] shadow-xs'
                    : 'bg-black/40 text-slate-400 hover:text-white'
                }`}
                title="Papel cebolla (Onion Skin)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden min-[360px]:inline text-[9px]">Cebolla</span>
              </button>

              {/* Loop toggle */}
              <button
                onClick={onToggleLoop}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition active:scale-95 touch-manipulation ${
                  loopEnabled
                    ? 'bg-[#165347] text-[#C8A96A] border border-[#C8A96A]/40'
                    : 'bg-black/40 text-slate-400 hover:text-white'
                }`}
                title="Repetir en bucle"
              >
                <Repeat className="w-3 h-3" />
              </button>

              {/* FPS selector */}
              <div className="flex items-center bg-black/50 px-1 py-0.5 rounded-lg border border-white/10">
                {[8, 12, 24].map((f) => (
                  <button
                    key={f}
                    onClick={() => onChangeFps && onChangeFps(f)}
                    className={`min-w-[20px] min-h-[22px] px-1 rounded text-[9px] font-mono font-bold transition active:scale-90 touch-manipulation ${
                      fps === f
                        ? 'bg-[#C8A96A] text-[#102419]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frame-by-frame Strip with Thumbnails */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5 w-full max-w-full">
            {frames.map((frame, idx) => {
              const isSelected = frame.id === selectedFrameId;
              return (
                <button
                  key={frame.id}
                  onClick={() => onSelectFrame && onSelectFrame(frame.id)}
                  className={`relative shrink-0 flex flex-col items-center gap-0.5 p-1 rounded-xl border-2 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    isSelected
                      ? 'border-[#C8A96A] bg-[#165347]/80 shadow-md ring-1 ring-[#C8A96A]'
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                  }`}
                  title={`Fotograma #${idx + 1}`}
                >
                  <MiniFrameThumb frameId={frame.id} isSelected={isSelected} />
                  <span className={`text-[8px] font-mono font-bold ${isSelected ? 'text-[#C8A96A]' : 'text-slate-400'}`}>
                    #{idx + 1}
                  </span>
                </button>
              );
            })}

            {/* Add Frame Button */}
            <button
              onClick={onAddFrame}
              className="shrink-0 w-9 h-11 rounded-xl border-2 border-dashed border-[#C8A96A]/50 bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 text-[#C8A96A] flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation cursor-pointer"
              title="Añadir fotograma"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[7px] font-bold">+Frame</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. BARRA DE HERRAMIENTAS BÁSICAS DE USO FRECUENTE                 */}
      {/* Situada justo encima de la paleta de colores activa              */}
      {/* Lápiz, Borrador, Bote de pintura, Gotero, Selección + Más opciones */}
      {/* ------------------------------------------------------------------ */}
      <div 
        className="w-full max-w-full px-2 py-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none bg-[#0a1811]/95 border-b border-white/5 box-border"
        id="mobile-basic-tools-row"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-around sm:justify-start">
          {basicTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onChangeTool(tool.id)}
                className={`min-w-[40px] h-[34px] px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-black shadow-md'
                    : 'bg-black/35 hover:bg-black/60 text-slate-300 border-white/10'
                }`}
                title={tool.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold hidden min-[380px]:inline">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shortcut button to open all advanced tools & settings */}
        <button
          onClick={() => onOpenPanel(activePanel === 'tools' ? (null as any) : 'tools')}
          className={`min-w-[34px] h-[34px] px-1.5 rounded-xl flex items-center justify-center gap-1 transition active:scale-95 touch-manipulation cursor-pointer border shrink-0 ${
            activePanel === 'tools'
              ? 'bg-[#C8A96A] text-[#102419] border-[#C8A96A] font-bold shadow-md'
              : 'bg-black/40 hover:bg-black/60 text-slate-400 border-white/10'
          }`}
          title="Ver todas las herramientas y pinceles"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold hidden min-[440px]:inline">Más</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PALETA DE COLORES ACTIVA                                        */}
      {/* Muestras táctiles de la paleta actual con acceso a selector       */}
      {/* ------------------------------------------------------------------ */}
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

      {/* ------------------------------------------------------------------ */}
      {/* 1. HISTORIAL DE COLORES USADOS EN EL LIENZO                        */}
      {/* Orden de abajo hacia arriba: Historial es la fila más inferior    */}
      {/* ------------------------------------------------------------------ */}
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
            // Placeholder hint if user hasn't painted yet
            <span className="text-[9px] text-slate-500 italic px-1 truncate">
              Pinta en el lienzo para registrar colores...
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default MobileQuickBar;
