import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Copy, Trash2, Repeat, 
  Layers, Eye, X, Check, EyeOff
} from 'lucide-react';
import { Frame, PixelProject, LanguageCode, OnionSkinSettings } from '../../types';
import { translate } from '../../i18n';
import { previewManager } from '../../core/preview/PreviewManager';

interface MobileTimelineProps {
  project: PixelProject | null;
  selectedFrameId: string;
  onSelectFrame: (id: string) => void;
  onAddFrame: () => void;
  onDeleteFrame: (id: string) => void;
  onDuplicateFrame: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  fps: number;
  onChangeFps: (fps: number) => void;
  onionSkinEnabled: boolean;
  onToggleOnionSkin: () => void;
  loopEnabled: boolean;
  onToggleLoop: () => void;
  onClose: () => void;
  language: LanguageCode;
}

export const MobileTimeline: React.FC<MobileTimelineProps> = React.memo(function MobileTimeline({
  project,
  selectedFrameId,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  isPlaying,
  onTogglePlay,
  fps,
  onChangeFps,
  onionSkinEnabled,
  onToggleOnionSkin,
  loopEnabled,
  onToggleLoop,
  onClose,
  language
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const frames = project?.frames || [];
  const currentFrameIndex = Math.max(0, frames.findIndex(f => f.id === selectedFrameId));
  const totalFrames = frames.length || 1;

  // Step next/prev
  const handlePrev = () => {
    if (currentFrameIndex > 0) {
      onSelectFrame(frames[currentFrameIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentFrameIndex < frames.length - 1) {
      onSelectFrame(frames[currentFrameIndex + 1].id);
    }
  };

  // Mini preview canvas component for each frame in the expanded strip
  const FrameThumbnail: React.FC<{ frameId: string; isSelected: boolean }> = ({ frameId, isSelected }) => {
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
        width={36} 
        height={36} 
        className="w-9 h-9 object-contain bg-black/40 rounded border border-white/10"
      />
    );
  };

  // 1. COLLAPSED COMPACT BAR
  if (!isExpanded) {
    return (
      <div 
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[94%] max-w-sm z-30 bg-[#102419]/95 backdrop-blur-md border border-[#102419] rounded-2xl px-2 py-1 shadow-2xl flex items-center justify-between text-slate-100 select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
        id="mobile-timeline-mini"
      >
        {/* Play/Pause Button (44px target) */}
        <button
          onClick={onTogglePlay}
          className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation cursor-pointer ${
            isPlaying 
              ? 'bg-amber-500 text-black font-extrabold shadow-lg' 
              : 'bg-[#C8A96A] text-[#102419] font-bold shadow-md hover:bg-[#d8b97a]'
          }`}
          title={isPlaying ? translate('timeline.pause', language) : translate('timeline.play', language)}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Step Prev Frame */}
        <button
          onClick={handlePrev}
          disabled={currentFrameIndex <= 0}
          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-20 active:scale-90 transition touch-manipulation cursor-pointer"
          title="Fotograma anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Frame Counter Indicator */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-black/30 border border-white/10 cursor-pointer active:scale-95 transition"
          title="Toca para expandir línea de tiempo"
        >
          <span className="text-[11px] font-mono font-black text-[#C8A96A] leading-tight">
            F {currentFrameIndex + 1} / {totalFrames}
          </span>
          <span className="text-[8px] text-slate-400 font-mono">
            {fps} FPS
          </span>
        </div>

        {/* Step Next Frame */}
        <button
          onClick={handleNext}
          disabled={currentFrameIndex >= totalFrames - 1}
          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-20 active:scale-90 transition touch-manipulation cursor-pointer"
          title="Fotograma siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Quick Add Frame Button */}
        <button
          onClick={onAddFrame}
          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-[#C8A96A] hover:text-white bg-[#102419] rounded-xl border border-[#C8A96A]/30 active:scale-90 transition touch-manipulation cursor-pointer"
          title="Añadir nuevo fotograma"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Expand Sheet Button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="min-w-[36px] min-h-[44px] px-1 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition touch-manipulation cursor-pointer"
          title="Expandir panel de animación"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="min-w-[32px] min-h-[44px] px-1 flex items-center justify-center text-slate-500 hover:text-slate-300 active:scale-90 transition touch-manipulation cursor-pointer"
          title="Cerrar barra de animación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. EXPANDED BOTTOM PANEL
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#102419]/98 backdrop-blur-xl border-t border-[#102419] rounded-t-3xl shadow-2xl flex flex-col p-3 pb-6 max-h-[300px] select-none animate-in slide-in-from-bottom duration-200"
      id="mobile-timeline-expanded"
    >
      {/* Drawer Handle & Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C8A96A]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[#C8A96A]">
            {translate('timeline.title', language) || 'Animación'} ({totalFrames} {totalFrames === 1 ? 'Frame' : 'Frames'})
          </h4>
        </div>

        {/* Header Actions: Onion Skin, Loop, Collapse */}
        <div className="flex items-center gap-1.5">
          {/* Onion Skin */}
          <button
            onClick={onToggleOnionSkin}
            className={`min-w-[40px] min-h-[36px] px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 touch-manipulation ${
              onionSkinEnabled 
                ? 'bg-[#C8A96A] text-[#102419]' 
                : 'bg-black/30 text-slate-400 hover:text-white'
            }`}
            title="Papel cebolla (Onion Skin)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Papel</span>
          </button>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            className={`min-w-[40px] min-h-[36px] px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 touch-manipulation ${
              loopEnabled 
                ? 'bg-[#165347] text-[#C8A96A] border border-[#C8A96A]/40' 
                : 'bg-black/30 text-slate-400 hover:text-white'
            }`}
            title="Bucle continuo"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Bucle</span>
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center active:scale-95 transition touch-manipulation cursor-pointer"
            title="Minimizar panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Thumbnails Horizontal Strip */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-3 px-1 my-auto">
        {frames.map((frame, idx) => {
          const isSelected = frame.id === selectedFrameId;
          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame.id)}
              className={`relative shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all cursor-pointer touch-manipulation ${
                isSelected
                  ? 'border-[#C8A96A] bg-[#102419] shadow-lg scale-105'
                  : 'border-white/10 bg-black/30 hover:border-white/20'
              }`}
            >
              {/* Frame thumbnail canvas preview */}
              <FrameThumbnail frameId={frame.id} isSelected={isSelected} />

              {/* Frame number badge */}
              <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#C8A96A]' : 'text-slate-400'}`}>
                #{idx + 1}
              </span>

              {/* Action buttons on active frame */}
              {isSelected && (
                <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDuplicateFrame(frame.id)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 active:scale-90 transition touch-manipulation"
                    title="Duplicar fotograma"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteFrame(frame.id)}
                    disabled={frames.length <= 1}
                    className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-20 active:scale-90 transition touch-manipulation"
                    title="Eliminar fotograma"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Frame Card Button */}
        <button
          onClick={onAddFrame}
          className="shrink-0 w-14 h-18 rounded-xl border-2 border-dashed border-[#C8A96A]/40 bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 text-[#C8A96A] flex flex-col items-center justify-center gap-1 transition active:scale-95 touch-manipulation cursor-pointer"
          title="Añadir fotograma"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-bold">+ Frame</span>
        </button>
      </div>

      {/* Bottom Controls Bar: Playback & Speed */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        {/* Play / Pause (44px target) */}
        <button
          onClick={onTogglePlay}
          className={`min-w-[100px] min-h-[44px] px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 touch-manipulation shadow-lg ${
            isPlaying
              ? 'bg-amber-500 text-black'
              : 'bg-[#C8A96A] text-[#102419]'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
        </button>

        {/* FPS selector presets */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">FPS:</span>
          {[8, 12, 16, 24].map((f) => (
            <button
              key={f}
              onClick={() => onChangeFps(f)}
              className={`min-w-[32px] min-h-[32px] px-1.5 rounded-lg text-[10px] font-mono font-bold transition active:scale-95 touch-manipulation ${
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
  );
});
