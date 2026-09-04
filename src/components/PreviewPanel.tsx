import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Eye, Grid } from 'lucide-react';
import { PixelProject } from '../types';
import { translate, LanguageCode } from '../i18n';
import { previewManager } from '../core/preview/PreviewManager';

interface PreviewPanelProps {
  project: PixelProject | null;
  currentFrameId: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  language?: LanguageCode;
  className?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = React.memo(function PreviewPanel({
  project,
  currentFrameId,
  isPlaying = false,
  onTogglePlay,
  language = 'es',
  className = ''
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bgStyle, setBgStyle] = useState<'checkered' | 'dark' | 'light'>('checkered');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);

  // Sync active frame index with currentFrameId
  useEffect(() => {
    if (!project || !project.frames) return;
    const idx = project.frames.findIndex(f => f.id === currentFrameId);
    if (idx !== -1) {
      setActiveFrameIndex(idx);
    }
  }, [currentFrameId, project]);

  // Live animation playback loop for preview when playing
  useEffect(() => {
    if (!isPlaying || !project || !project.frames || project.frames.length <= 1) return;

    const intervalMs = Math.max(16, Math.round(1000 / (project.fps || 12)));
    const timer = setInterval(() => {
      setActiveFrameIndex(prevIdx => {
        return previewManager.getNextFrameIndex(prevIdx, project.frames?.length || 1, 'forward');
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, project]);

  const rafRef = useRef<number | null>(null);

  // Draw preview frame
  const drawCurrentPreview = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas || !project || !project.frames || project.frames.length === 0) return;

      const targetFrame = isPlaying
        ? project.frames[activeFrameIndex] || project.frames[0]
        : project.frames.find(f => f.id === currentFrameId) || project.frames[0];

      if (!targetFrame) return;

      previewManager.renderFrameToCanvas(canvas, project, targetFrame.id, {
        backgroundStyle: bgStyle,
        showPixelGrid: showGrid
      });
    });
  }, [project, currentFrameId, activeFrameIndex, isPlaying, bgStyle, showGrid]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    drawCurrentPreview();
  }, [drawCurrentPreview, project, currentFrameId, activeFrameIndex]);

  if (!project) return null;

  const activeFrameNumber = (project.frames?.findIndex(f => f.id === (isPlaying ? project.frames[activeFrameIndex]?.id : currentFrameId)) ?? 0) + 1;
  const totalFrames = project.frames?.length || 1;

  return (
    <div 
      className={`w-full p-2.5 flex flex-col gap-2 bg-[#0F3D34] border border-[#102419]/60 rounded-xl overflow-hidden shadow-md ${className}`} 
      id="studio-preview-panel"
    >
      {/* Header bar */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span className="text-[10px] uppercase font-bold text-slate-200 tracking-wider">
            {translate('leftPanel.preview', language)}
          </span>
          <span className="bg-[#102419] border border-[#102419]/80 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-[#C8A96A] font-bold">
            {project.width}x{project.height}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Frame indicator */}
          <span className="text-[8.5px] font-mono text-slate-300 bg-[#102419] border border-[#102419]/80 px-1.5 py-0.5 rounded font-bold">
            F {activeFrameNumber}/{totalFrames}
          </span>

          {/* Background toggle buttons */}
          <div className="flex items-center bg-[#102419] rounded p-0.5 border border-[#102419]/60">
            <button
              onClick={() => setBgStyle('checkered')}
              className={`w-4 h-4 rounded-xs flex items-center justify-center text-[8px] font-bold transition cursor-pointer ${
                bgStyle === 'checkered' ? 'bg-[#C8A96A] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={translate('previewPanel.checkeredBg', language)}
            >
              🏁
            </button>
            <button
              onClick={() => setBgStyle('dark')}
              className={`w-4 h-4 rounded-xs flex items-center justify-center text-[8px] font-bold transition cursor-pointer ${
                bgStyle === 'dark' ? 'bg-[#C8A96A] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={translate('previewPanel.darkBg', language)}
            >
              ⬛
            </button>
            <button
              onClick={() => setBgStyle('light')}
              className={`w-4 h-4 rounded-xs flex items-center justify-center text-[8px] font-bold transition cursor-pointer ${
                bgStyle === 'light' ? 'bg-[#C8A96A] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={translate('previewPanel.lightBg', language)}
            >
              ⬜
            </button>
          </div>
        </div>
      </div>

      {/* Static Pixel Art Viewport Container - Full size scaling, centered without cropping */}
      <div className="w-full flex-1 min-h-[140px] max-h-[260px] bg-[#102419] rounded-lg border border-[#102419]/80 p-2 flex items-center justify-center relative overflow-hidden select-none">
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded select-none pointer-events-none transition-all duration-150"
            style={{ 
              imageRendering: 'pixelated',
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Live status badge when playing */}
        {isPlaying && (
          <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-md backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{project.fps} FPS</span>
          </div>
        )}
      </div>

      {/* Controls footer */}
      <div className="flex items-center justify-between px-1 text-[9px] text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePlay?.()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#102419] hover:bg-[#102419]/80 text-slate-200 hover:text-white transition border border-[#102419]/60 font-semibold cursor-pointer"
            title={isPlaying ? translate('previewPanel.pause', language) : translate('previewPanel.playAnimation', language, { fps: project.fps })}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-rose-400" />
                <span>{translate('previewPanel.pause', language)}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{translate('previewPanel.playAnimation', language, { fps: project.fps })}</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => setShowGrid(g => !g)}
          className={`px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer font-medium ${
            showGrid ? 'bg-[#C8A96A]/20 text-[#C8A96A] font-bold border border-[#C8A96A]/40' : 'hover:bg-[#102419] text-slate-400'
          }`}
          title={translate('previewPanel.toggleGrid', language)}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{translate('previewPanel.grid', language)}</span>
        </button>
      </div>
    </div>
  );
});

export default PreviewPanel;
