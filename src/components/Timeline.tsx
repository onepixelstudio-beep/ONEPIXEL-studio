import React from 'react';
import { 
  Play, Pause, Plus, Square, 
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast,
  Copy, Trash2, Repeat, Layers, Eye, EyeOff, Lock, Unlock, Pin, Settings, Wrench,
  ArrowLeft, ArrowRight, Tag, Edit3, X, Check
} from 'lucide-react';
import { Frame, Layer, ProjectPixels, AnimationTag, FrameSelectionState, OnionSkinSettings } from '../types';
import { SelectionService } from '../utils/animation/SelectionService';
import { LayerResolutionService } from '../utils/animation/LayerResolutionService';
import { translate, LanguageCode } from '../i18n';
import { animationEventBus } from '../utils/animation/EventBus';

interface TimelineProps {
  frames: Frame[];
  selectedFrameId: string;
  onSelectFrame: (id: string) => void;
  selection?: FrameSelectionState;
  onSelectionChange?: (nextSelection: FrameSelectionState) => void;
  onAddFrame: () => void;
  onDeleteFrame: (id: string) => void;
  onDuplicateFrame: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  fps: number;
  onChangeFps: (fps: number) => void;
  onionSkinEnabled: boolean;
  onToggleOnionSkin: () => void;
  onionSkinOpacity?: number;
  onChangeOnionSkinOpacity?: (opacity: number) => void;
  onionSkinSettings?: OnionSkinSettings;
  onUpdateOnionSkinSettings?: (updater: Partial<OnionSkinSettings>) => void;
  loopEnabled: boolean;
  onToggleLoop: () => void;
  
  // Layers in timeline
  layers: Layer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleStatic?: (id: string) => void;
  pixels: ProjectPixels;
  onReorderFrames?: (draggedId: string, targetId: string) => void;
  onMoveFrameLeft?: () => void;
  onMoveFrameRight?: () => void;
  playbackMode?: 'forward' | 'reverse' | 'pingpong';
  onChangePlaybackMode?: (mode: 'forward' | 'reverse' | 'pingpong') => void;
  onOpenExport?: () => void;
  onChangeFrameDuration?: (index: number, durationMs: number) => void;
  animationTags?: AnimationTag[];
  selectedTagId?: string | null;
  onSelectTag?: (tagId: string | null) => void;
  onAddTag?: (tag: AnimationTag) => void;
  onUpdateTag?: (tagId: string, fields: Partial<Omit<AnimationTag, 'id'>>) => void;
  onDeleteTag?: (tagId: string) => void;
  language: LanguageCode;
}

const Timeline = React.memo(function Timeline({
  frames,
  selectedFrameId,
  onSelectFrame,
  selection,
  onSelectionChange,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  isPlaying,
  onTogglePlay,
  onStop,
  fps,
  onChangeFps,
  onionSkinEnabled,
  onToggleOnionSkin,
  onionSkinOpacity = 30,
  onChangeOnionSkinOpacity,
  onionSkinSettings,
  onUpdateOnionSkinSettings,
  loopEnabled,
  onToggleLoop,
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisible,
  onToggleLocked,
  onToggleStatic,
  pixels,
  onReorderFrames,
  onMoveFrameLeft,
  onMoveFrameRight,
  playbackMode = 'forward',
  onChangePlaybackMode,
  onOpenExport,
  onChangeFrameDuration,
  animationTags = [],
  selectedTagId = null,
  onSelectTag,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  language
}: TimelineProps) {
  const selectedIndex = frames.findIndex(f => f.id === selectedFrameId);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [showOnionSkinConfig, setShowOnionSkinConfig] = React.useState<boolean>(false);
  const onionSkinPopoverRef = React.useRef<HTMLDivElement>(null);
  const wrenchBtnRef = React.useRef<HTMLButtonElement>(null);

  // Close onion skin config when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!target || !document.body.contains(target)) return;
      if (
        onionSkinPopoverRef.current && 
        !onionSkinPopoverRef.current.contains(target) &&
        wrenchBtnRef.current &&
        !wrenchBtnRef.current.contains(target)
      ) {
        setShowOnionSkinConfig(false);
      }
    };
    if (showOnionSkinConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOnionSkinConfig]);

  // --- TRANSACTION CONTROL & DECOUPLED PIXEL MANAGEMENT ---
  const [localPixels, setLocalPixels] = React.useState(pixels);
  const isTransactionActiveRef = React.useRef(false);
  const latestPixelsRef = React.useRef(pixels);

  // Keep latestPixelsRef in sync with pixels prop and update immediately if no transaction is active
  React.useEffect(() => {
    latestPixelsRef.current = pixels;
    if (!isTransactionActiveRef.current) {
      setLocalPixels(pixels);
    }
  }, [pixels]);

  // Subscribe to decoupled transaction events on animationEventBus
  React.useEffect(() => {
    const unsubStart = animationEventBus.subscribe('TRANSACTION_START', () => {
      isTransactionActiveRef.current = true;
    });

    const unsubEnd = animationEventBus.subscribe('TRANSACTION_END', () => {
      isTransactionActiveRef.current = false;
      setLocalPixels(latestPixelsRef.current);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, []);
  const [editingFrameId, setEditingFrameId] = React.useState<string | null>(null);
  const [editingDuration, setEditingDuration] = React.useState<string>('100');

  // --- TAG ENGINE STATES & REFS ---
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  
  const PRESET_COLORS = [
    '#ff5964', // Coral/Red
    '#f7b05b', // Amber/Orange
    '#35b0ab', // Emerald/Green
    '#38b6ff', // Cyan/Blue
    '#8c52ff', // Violet/Purple
    '#ff66c4'  // Rose/Pink
  ];

  const fallbackSelection: FrameSelectionState = {
    activeFrameId: selectedFrameId,
    focusedFrameId: selectedFrameId,
    anchorFrameId: selectedFrameId,
    selectedFrameIds: selectedFrameId ? [selectedFrameId] : [],
  };
  const activeSelection = selection || fallbackSelection;

  const [dragState, setDragState] = React.useState<{
    tagId: string;
    type: 'resize-start' | 'resize-end' | 'move';
    initialMouseX: number;
    initialStartFrame: number;
    initialEndFrame: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = React.useState<number>(0);

  const [showTagDialog, setShowTagDialog] = React.useState<'create' | 'edit' | null>(null);
  const [dialogTagName, setDialogTagName] = React.useState<string>('');
  const [dialogTagColor, setDialogTagColor] = React.useState<string>('#ff5964');
  const [dialogStartFrame, setDialogStartFrame] = React.useState<number>(0);
  const [dialogEndFrame, setDialogEndFrame] = React.useState<number>(0);
  const [editingTagId, setEditingTagId] = React.useState<string | null>(null);

  // Window-level dragging listener for buttery-smooth tag modifications
  React.useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.initialMouseX;
      const offset = Math.round(deltaX / 36);
      setDragOffset(offset);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const tag = animationTags.find(t => t.id === dragState.tagId);
      if (tag) {
        const deltaX = e.clientX - dragState.initialMouseX;
        const currentOffset = Math.round(deltaX / 36);
        let newStart = tag.startFrameIndex;
        let newEnd = tag.endFrameIndex;
        const length = tag.endFrameIndex - tag.startFrameIndex;

        if (dragState.type === 'resize-start') {
          newStart = Math.max(0, Math.min(tag.endFrameIndex, dragState.initialStartFrame + currentOffset));
        } else if (dragState.type === 'resize-end') {
          newEnd = Math.max(tag.startFrameIndex, Math.min(frames.length - 1, dragState.initialEndFrame + currentOffset));
        } else if (dragState.type === 'move') {
          newStart = dragState.initialStartFrame + currentOffset;
          newEnd = newStart + length;
          if (newStart < 0) {
            newStart = 0;
            newEnd = length;
          }
          if (newEnd > frames.length - 1) {
            newEnd = frames.length - 1;
            newStart = newEnd - length;
          }
        }

        if (newStart !== tag.startFrameIndex || newEnd !== tag.endFrameIndex) {
          onUpdateTag?.(tag.id, { startFrameIndex: newStart, endFrameIndex: newEnd });
        }
      }

      setDragState(null);
      setDragOffset(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, animationTags, frames.length, onUpdateTag]);

  const handleOpenCreateTag = () => {
    const selectedIndices = activeSelection.selectedFrameIds
      .map(id => frames.findIndex(f => f.id === id))
      .filter(idx => idx !== -1);
    const start = selectedIndices.length > 0 ? Math.min(...selectedIndices) : selectedIndex;
    const end = selectedIndices.length > 0 ? Math.max(...selectedIndices) : selectedIndex;
    
    setDialogTagName(translate('timeline.defaultTag', language as any, { num: animationTags.length + 1 }));
    setDialogTagColor(PRESET_COLORS[animationTags.length % PRESET_COLORS.length]);
    setDialogStartFrame(start >= 0 ? start : 0);
    setDialogEndFrame(end >= 0 ? end : 0);
    setShowTagDialog('create');
  };

  const handleOpenEditTag = (tag: AnimationTag) => {
    setEditingTagId(tag.id);
    setDialogTagName(tag.name);
    setDialogTagColor(tag.color);
    setDialogStartFrame(tag.startFrameIndex);
    setDialogEndFrame(tag.endFrameIndex);
    setShowTagDialog('edit');
  };

  const handleSaveTag = () => {
    if (!dialogTagName.trim()) return;

    const start = Math.max(0, Math.min(frames.length - 1, dialogStartFrame));
    const end = Math.max(start, Math.min(frames.length - 1, dialogEndFrame));

    if (showTagDialog === 'create') {
      const newTag: AnimationTag = {
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: dialogTagName.trim(),
        color: dialogTagColor,
        startFrameIndex: start,
        endFrameIndex: end
      };
      onAddTag?.(newTag);
    } else if (showTagDialog === 'edit' && editingTagId) {
      onUpdateTag?.(editingTagId, {
        name: dialogTagName.trim(),
        color: dialogTagColor,
        startFrameIndex: start,
        endFrameIndex: end
      });
    }

    setShowTagDialog(null);
    setEditingTagId(null);
  };

  const handleStepFrame = (direction: 'prev' | 'next') => {
    if (!Array.isArray(frames) || frames.length === 0) return;
    const safeIdx = selectedIndex >= 0 ? selectedIndex : 0;
    if (direction === 'prev' && safeIdx > 0) {
      onSelectFrame(frames[safeIdx - 1].id);
    } else if (direction === 'next' && safeIdx < frames.length - 1) {
      onSelectFrame(frames[safeIdx + 1].id);
    }
  };

  const handleGoToStart = () => {
    if (frames.length > 0) {
      onSelectFrame(frames[0].id);
    }
  };

  const handleGoToEnd = () => {
    if (frames.length > 0) {
      onSelectFrame(frames[frames.length - 1].id);
    }
  };

  // Simple, low-overhead WeakMap cache to avoid scanning pixel arrays whose references haven't changed.
  const nonEmptyCacheRef = React.useRef<WeakMap<any, boolean>>(new WeakMap());

  // Memoize non-empty frame-layer keys to avoid O(Layers * Frames * Pixels_per_layer) loops on every render.
  const nonEmptyKeysSet = React.useMemo(() => {
    const set = new Set<string>();
    if (!localPixels) return set;
    const cache = nonEmptyCacheRef.current;
    for (const frameId of Object.keys(localPixels)) {
      const framePixels = localPixels[frameId];
      if (!framePixels) continue;
      for (const layerId of Object.keys(framePixels)) {
        const layerPixels = framePixels[layerId];
        if (!layerPixels) continue;
        
        let hasData = cache.get(layerPixels);
        if (hasData === undefined) {
          hasData = layerPixels.some(color => color !== '' && color !== undefined);
          cache.set(layerPixels, hasData);
        }
        
        if (hasData) {
          set.add(`${frameId}-${layerId}`);
        }
      }
    }
    return set;
  }, [localPixels]);

  // Helper to detect if a frame-layer contains painted pixels in O(1) time
  const hasFrameData = React.useCallback((frameId: string, layerId: string) => {
    return nonEmptyKeysSet.has(`${frameId}-${layerId}`);
  }, [nonEmptyKeysSet]);

  return (
    <div className="bg-[#0F3D34] border border-[#0F3D34] rounded-lg text-slate-300 font-sans select-none shadow-2xl flex flex-col relative" id="animation-timeline">
      
      {/* 1. TOP BAR: Controls Bar */}
      <div className="bg-[#030408] border-b border-[#0F3D34] px-2 py-0.5 flex flex-wrap items-center justify-between gap-1.5">
        
        {/* Playback Controls group */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase font-extrabold text-[#C8A96A] tracking-wider mr-1 select-none">
            {translate('timeline.title', language)}
          </span>

          <div className="flex items-center bg-[#102419] border border-[#0F3D34] rounded-lg px-1.5 py-0.5 gap-1 shadow-sm">
            {/* Go to Start */}
            <button
              onClick={handleGoToStart}
              disabled={selectedIndex === 0}
              className="p-1 hover:bg-[#0F3D34] text-slate-200 hover:text-white disabled:opacity-30 transition rounded cursor-pointer"
              title={translate('timeline.goToStart', language)}
            >
              <ChevronFirst className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={() => handleStepFrame('prev')}
              disabled={selectedIndex <= 0}
              className="p-1 hover:bg-[#0F3D34] text-slate-200 hover:text-white disabled:opacity-30 transition rounded cursor-pointer"
              title={translate('timeline.prevFrame', language)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Stop */}
            <button
              onClick={onStop}
              className="p-1 hover:bg-rose-900/40 text-slate-200 hover:text-rose-400 transition rounded cursor-pointer"
              title={translate('timeline.stop', language)}
            >
              <Square className="w-3.5 h-3.5 fill-slate-300 hover:fill-rose-400" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className={`p-1 px-2 rounded-md font-bold transition flex items-center justify-center cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-500 text-black font-extrabold shadow' 
                  : 'bg-[#C8A96A] text-[#102419] font-bold hover:bg-[#d8b97a]'
              }`}
              title={isPlaying ? translate('timeline.pause', language) : translate('timeline.play', language)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => handleStepFrame('next')}
              disabled={selectedIndex >= frames.length - 1}
              className="p-1 hover:bg-[#0F3D34] text-slate-200 hover:text-white disabled:opacity-30 transition rounded cursor-pointer"
              title={translate('timeline.nextFrame', language)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Go to End */}
            <button
              onClick={handleGoToEnd}
              disabled={selectedIndex === frames.length - 1}
              className="p-1 hover:bg-[#0F3D34] text-slate-200 hover:text-white disabled:opacity-30 transition rounded cursor-pointer"
              title={translate('timeline.goToEnd', language)}
            >
              <ChevronLast className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Frame Counter Box (# 0) */}
        <div className="flex items-center gap-2">
          <div className="bg-[#102419] px-2.5 py-1 rounded-lg border border-[#0F3D34] text-[11px] font-mono text-[#C8A96A] font-extrabold">
            # {selectedIndex + 1}
          </div>

          <div className="bg-[#102419] border border-[#0F3D34] rounded-lg px-2 py-0.5 text-[11px] font-mono flex items-center gap-1.5">
            <span className="text-slate-400 font-bold select-none">{translate('timeline.speedLabel', language)}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { onChangeFps?.(Math.max(1, fps - 1)); }}
                className="w-5 h-5 bg-[#0F3D34] hover:bg-[#165347] border border-[#C8A96A]/30 text-white rounded flex items-center justify-center font-bold text-xs transition cursor-pointer"
                title="-1 FPS"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="120"
                value={fps}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  onChangeFps?.(Math.max(1, Math.min(120, val)));
                }}
                className="w-10 bg-[#030408] border border-[#0F3D34] rounded text-[11px] text-[#C8A96A] text-center py-0.5 focus:outline-none focus:border-[#C8A96A] font-mono font-extrabold"
                title={translate('timeline.fpsTooltip', language)}
              />
              <button 
                onClick={() => { onChangeFps?.(Math.min(120, fps + 1)); }}
                className="w-5 h-5 bg-[#0F3D34] hover:bg-[#165347] border border-[#C8A96A]/30 text-white rounded flex items-center justify-center font-bold text-xs transition cursor-pointer"
                title="+1 FPS"
              >
                +
              </button>
            </div>
            <span className="text-[#C8A96A] font-bold text-[10px] select-none">FPS</span>
          </div>
        </div>

        {/* Toggles (Onion Skin, Loop) & Action buttons */}
        <div className="flex items-center gap-2">
          {/* Onion Skin with Opacity Slider */}
          <div className="flex items-center gap-1.5 relative">
            <button
              onClick={onToggleOnionSkin}
              className={`p-1.5 rounded-md border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                onionSkinEnabled 
                  ? 'bg-brand-sage/20 border-brand-sage/50 text-brand-sand' 
                  : 'bg-brand-depth border-brand-turquoise/40 text-slate-400 hover:text-slate-200'
              }`}
              title={translate('timeline.onionSkinTooltip', language)}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{translate('timeline.onionSkin', language)}</span>
            </button>
            
            {/* Wrench Button for Advanced Config */}
            <button
              ref={wrenchBtnRef}
              onClick={() => setShowOnionSkinConfig(!showOnionSkinConfig)}
              className={`p-1.5 rounded-md border text-[10px] font-bold flex items-center justify-center transition-all ${
                showOnionSkinConfig 
                  ? 'bg-brand-turquoise/40 border-brand-sage text-white shadow-[0_0_8px_rgba(114,115,214,0.3)]' 
                  : 'bg-brand-depth border-brand-turquoise/40 text-slate-400 hover:text-slate-200 hover:bg-brand-petroleum'
              }`}
              title={translate('timeline.onionSkinConfigTitle', language as any)}
            >
              <Wrench className={`w-3.5 h-3.5 ${showOnionSkinConfig ? 'text-brand-sand' : ''}`} />
            </button>

            {/* Advanced Config Dropdown Popover */}
            {showOnionSkinConfig && (
              <div 
                ref={onionSkinPopoverRef}
                className="absolute bottom-full mb-2 right-0 z-[100] bg-brand-petroleum/95 backdrop-blur-md border border-brand-turquoise/50 rounded-xl shadow-2xl p-4 w-72 text-slate-200 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-brand-turquoise/30 pb-1.5 mb-0.5">
                  <span className="text-xs font-bold text-brand-sand">{translate('timeline.onionSkinPopoverTitle', language as any)}</span>
                  <button 
                    onClick={() => setShowOnionSkinConfig(false)}
                    className="p-0.5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-md transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Frames Before */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>{translate('timeline.framesBefore', language as any)}</span>
                    <span className="font-mono text-brand-sand font-bold">
                      {onionSkinSettings ? onionSkinSettings.framesBefore : 2}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={onionSkinSettings ? onionSkinSettings.framesBefore : 2}
                    onChange={(e) => onUpdateOnionSkinSettings?.({ framesBefore: parseInt(e.target.value) })}
                    className="w-full accent-brand-turquoise cursor-pointer h-1 bg-brand-depth rounded"
                  />
                </div>

                {/* Frames After */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>{translate('timeline.framesAfter', language as any)}</span>
                    <span className="font-mono text-brand-sand font-bold">
                      {onionSkinSettings ? onionSkinSettings.framesAfter : 1}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={onionSkinSettings ? onionSkinSettings.framesAfter : 1}
                    onChange={(e) => onUpdateOnionSkinSettings?.({ framesAfter: parseInt(e.target.value) })}
                    className="w-full accent-brand-turquoise cursor-pointer h-1 bg-brand-depth rounded"
                  />
                </div>

                {/* Opacity Before */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>{translate('timeline.opacityBefore', language as any)}</span>
                    <span className="font-mono text-brand-sand font-bold">
                      {Math.round((onionSkinSettings ? onionSkinSettings.opacityBefore : onionSkinOpacity / 100) * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={Math.round((onionSkinSettings ? onionSkinSettings.opacityBefore : onionSkinOpacity / 100) * 100)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) / 100;
                      onUpdateOnionSkinSettings?.({ opacityBefore: val });
                    }}
                    className="w-full accent-brand-turquoise cursor-pointer h-1 bg-brand-depth rounded"
                  />
                </div>

                {/* Opacity After */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>{translate('timeline.opacityAfter', language as any)}</span>
                    <span className="font-mono text-brand-sand font-bold">
                      {Math.round((onionSkinSettings ? onionSkinSettings.opacityAfter : (onionSkinOpacity / 100) * 0.5) * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={Math.round((onionSkinSettings ? onionSkinSettings.opacityAfter : (onionSkinOpacity / 100) * 0.5) * 100)}
                    onChange={(e) => onUpdateOnionSkinSettings?.({ opacityAfter: parseInt(e.target.value) / 100 })}
                    className="w-full accent-brand-turquoise cursor-pointer h-1 bg-brand-depth rounded"
                  />
                </div>

                {/* Custom Color Before & After */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-400 font-bold">{translate('timeline.colorBefore', language as any)}</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color"
                        value={onionSkinSettings ? onionSkinSettings.colorBefore : '#ff0000'}
                        onChange={(e) => onUpdateOnionSkinSettings?.({ colorBefore: e.target.value })}
                        className="w-6 h-6 bg-transparent border border-brand-turquoise/40 rounded cursor-pointer p-0"
                      />
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
                        {onionSkinSettings ? onionSkinSettings.colorBefore : '#ff0000'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-400 font-bold">{translate('timeline.colorAfter', language as any)}</span>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color"
                        value={onionSkinSettings ? onionSkinSettings.colorAfter : '#00ff00'}
                        onChange={(e) => onUpdateOnionSkinSettings?.({ colorAfter: e.target.value })}
                        className="w-6 h-6 bg-transparent border border-brand-turquoise/40 rounded cursor-pointer p-0"
                      />
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
                        {onionSkinSettings ? onionSkinSettings.colorAfter : '#00ff00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tint Mode Toggle */}
                <label className="flex items-center gap-2 text-[10px] text-slate-300 font-medium cursor-pointer mt-1 select-none hover:text-white">
                  <input 
                    type="checkbox"
                    checked={onionSkinSettings ? onionSkinSettings.tintMode : true}
                    onChange={(e) => onUpdateOnionSkinSettings?.({ tintMode: e.target.checked })}
                    className="rounded border-brand-turquoise/40 bg-brand-depth text-brand-turquoise focus:ring-brand-sage w-3 h-3 cursor-pointer"
                  />
                  <span>{translate('timeline.tintSolid', language as any)}</span>
                </label>
              </div>
            )}
          </div>

          {/* Loop Option */}
          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded-md border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              loopEnabled 
                ? 'bg-brand-sage/20 border-brand-sage/50 text-brand-sand' 
                : 'bg-brand-depth border-brand-turquoise/40 text-slate-400 hover:text-slate-200'
            }`}
            title={translate('timeline.loopTooltip', language)}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>{translate('timeline.loop', language)}</span>
          </button>



          <span className="h-4 w-[1px] bg-[#102419]/40 mx-1" />

          {/* Frame Actions (Add, Duplicate, Delete) */}
          <div className="flex items-center gap-1">
            <button
              onClick={onMoveFrameLeft}
              disabled={frames.length <= 1 || frames[0].id === selectedFrameId}
              className="p-1 hover:bg-brand-turquoise/20 border border-transparent hover:border-brand-turquoise/30 text-slate-400 hover:text-brand-sand rounded transition disabled:opacity-25"
              title={translate('timeline.moveFrameLeft', language)}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveFrameRight}
              disabled={frames.length <= 1 || frames[frames.length - 1].id === selectedFrameId}
              className="p-1 hover:bg-brand-turquoise/20 border border-transparent hover:border-brand-turquoise/30 text-slate-400 hover:text-brand-sand rounded transition disabled:opacity-25"
              title={translate('timeline.moveFrameRight', language)}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="h-4 w-[1px] bg-brand-turquoise/30 mx-0.5" />
            <button
              onClick={onAddFrame}
              className="p-1 hover:bg-brand-turquoise/20 border border-transparent hover:border-brand-turquoise/30 text-slate-400 hover:text-brand-sand rounded transition"
              title={translate('timeline.addFrame', language)}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDuplicateFrame(selectedFrameId)}
              className="p-1 hover:bg-brand-turquoise/20 border border-transparent hover:border-brand-turquoise/30 text-slate-400 hover:text-brand-sand rounded transition"
              title={translate('timeline.duplicateFrame', language)}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteFrame(selectedFrameId)}
              disabled={frames.length <= 1}
              className="p-1 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded transition disabled:opacity-25"
              title={translate('timeline.deleteFrame', language)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. MAIN LAYOUT: Split left Layers list and right Frames Grid */}
      <div className="flex flex-row min-h-[95px] max-h-[155px] w-full bg-brand-depth">
        
        {/* LEFT COLUMN: Layers list track */}
        <div className="w-64 shrink-0 bg-brand-petroleum border-r border-brand-turquoise/30 flex flex-col">
          {/* Tags Track Header Left */}
          <div className="h-6 px-3 flex items-center justify-between border-b border-brand-turquoise/30 bg-brand-depth text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-brand-sand" />
              <span>{translate('timeline.tagsLabel', language)}</span>
            </div>
            <button
              onClick={handleOpenCreateTag}
              className="p-0.5 hover:bg-brand-turquoise/20 text-slate-400 hover:text-white rounded transition"
              title={translate('timeline.createLabel', language)}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Layer Headers Corner */}
          <div className="h-6 px-3 flex items-center justify-between border-b border-brand-turquoise/30 bg-brand-petroleum text-[10px] font-bold text-slate-300 uppercase tracking-wide shrink-0">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-sand" />
              <span>{translate('layers.listTitle', language)}</span>
            </div>
          </div>

          {/* Layer Rows */}
          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
            {layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`h-6 px-2.5 flex items-center justify-between border-b border-brand-turquoise/20 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-brand-sage/20 border-l-2 border-l-brand-sage text-white font-bold' 
                      : 'hover:bg-brand-turquoise/20 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
                    {onToggleStatic ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatic(layer.id);
                        }}
                        className={`p-0.5 rounded transition ${
                          layer.isStatic 
                            ? 'text-amber-400 hover:text-amber-300' 
                            : isSelected ? 'text-brand-sand/60 hover:text-brand-sand' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={layer.isStatic ? translate('layers.staticLayer', language) : translate('layers.toggleStatic', language)}
                      >
                        <Pin className={`w-2.5 h-2.5 shrink-0 ${layer.isStatic ? 'rotate-45 fill-current' : ''}`} />
                      </button>
                    ) : (
                      <Pin className={`w-2.5 h-2.5 shrink-0 ${isSelected ? 'text-brand-sand' : 'text-slate-500'}`} />
                    )}
                    <span className="text-[11px] truncate leading-none select-none font-medium">
                      {layer.name}
                    </span>
                  </div>

                  {/* Layer Quick Toggles - Visible, Editable */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle visible */}
                    <button
                      onClick={() => onToggleVisible(layer.id)}
                      title={layer.visible ? translate('layers.hideLayer', language) : translate('layers.showLayer', language)}
                      className={`p-1.5 rounded transition-all ${layer.visible ? 'text-brand-sand bg-brand-turquoise/10 hover:bg-brand-turquoise/20' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    {/* Toggle locked */}
                    <button
                      onClick={() => onToggleLocked(layer.id)}
                      title={layer.locked ? translate('layers.unlockLayer', language) : translate('layers.lockLayer', language)}
                      className={`p-1.5 rounded transition-all ${layer.locked ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Frame numbers and Keyframe cells grid */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col min-w-0 no-scrollbar"
        >
          {/* Tags track row */}
          <div className="h-6 flex items-center bg-brand-depth border-b border-brand-turquoise/30 min-w-max relative select-none shrink-0">
            {animationTags.map((tag) => {
              const isSelected = selectedTagId === tag.id;
              
              // Calculate live drag visual coordinates
              let start = tag.startFrameIndex;
              let end = tag.endFrameIndex;
              
              if (dragState && dragState.tagId === tag.id) {
                const length = tag.endFrameIndex - tag.startFrameIndex;
                if (dragState.type === 'resize-start') {
                  start = Math.max(0, Math.min(tag.endFrameIndex, dragState.initialStartFrame + dragOffset));
                } else if (dragState.type === 'resize-end') {
                  end = Math.max(tag.startFrameIndex, Math.min(frames.length - 1, dragState.initialEndFrame + dragOffset));
                } else if (dragState.type === 'move') {
                  start = dragState.initialStartFrame + dragOffset;
                  end = start + length;
                  if (start < 0) { start = 0; end = length; }
                  if (end > frames.length - 1) { end = frames.length - 1; start = end - length; }
                }
              }
              
              const leftPos = start * 36;
              const widthPos = (end - start + 1) * 36;
              
              return (
                <div
                  key={tag.id}
                  className={`absolute h-6 top-1 rounded flex items-center justify-between border px-2 select-none group transition-shadow ${
                    isSelected ? 'shadow-[0_0_8px_rgba(255,255,255,0.15)] ring-1 ring-white/10' : ''
                  }`}
                  style={{
                    left: `${leftPos}px`,
                    width: `${widthPos}px`,
                    backgroundColor: `${tag.color}15`,
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                  onMouseDown={(e) => {
                    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest('button')) {
                      return; // let buttons handle click
                    }
                    if (e.target instanceof HTMLDivElement && e.target.classList.contains('drag-handle')) {
                      return; // let drag handle handle
                    }
                    e.stopPropagation();
                    if (onSelectTag) {
                      onSelectTag(isSelected ? null : tag.id);
                    }
                    setDragState({
                      tagId: tag.id,
                      type: 'move',
                      initialMouseX: e.clientX,
                      initialStartFrame: tag.startFrameIndex,
                      initialEndFrame: tag.endFrameIndex
                    });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditTag(tag);
                  }}
                  title={`${translate('timeline.tagsLabel', language)}: ${tag.name} (${start}-${end}) - ${translate('timeline.tagTooltip', language)}`}
                >
                  {/* Left Resize Handle */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize drag-handle hover:bg-white/20 active:bg-white/30 rounded-l"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragState({
                        tagId: tag.id,
                        type: 'resize-start',
                        initialMouseX: e.clientX,
                        initialStartFrame: tag.startFrameIndex,
                        initialEndFrame: tag.endFrameIndex
                      });
                    }}
                    title={translate('timeline.dragStart', language)}
                  />

                  {/* Tag Name Label */}
                  <span className="text-[9px] font-bold truncate leading-none px-1 select-none pointer-events-none">
                    {tag.name}
                  </span>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-[#102419]/90 p-0.5 rounded border border-[#102419]/50 shadow-lg shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditTag(tag)}
                      className="p-0.5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition"
                      title={translate('timeline.edit', language)}
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTag?.(tag.id)}
                      className="p-0.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition"
                      title={translate('timeline.delete', language)}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Right Resize Handle */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize drag-handle hover:bg-white/20 active:bg-white/30 rounded-r"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragState({
                        tagId: tag.id,
                        type: 'resize-end',
                        initialMouseX: e.clientX,
                        initialStartFrame: tag.startFrameIndex,
                        initialEndFrame: tag.endFrameIndex
                      });
                    }}
                    title={translate('timeline.dragEnd', language)}
                  />
                </div>
              );
            })}
          </div>
          
          {/* Numbers header row (0, 3, 6, 9, 12, 15...) */}
          <div className="h-6 flex items-center bg-[#102419] border-b border-[#102419]/40 min-w-max relative shrink-0">
            {frames.map((frame, index) => {
              const isSelected = frame.id === activeSelection.activeFrameId;
              const isMultiSelected = activeSelection.selectedFrameIds.includes(frame.id);
              const isHighlightedTick = index % 3 === 0;
              const isDragOver = dragOverId === frame.id;
              
              return (
                <div
                  key={frame.id}
                  onClick={(e) => {
                    const allFrameIds = frames.map(f => f.id);
                    let nextSelection: FrameSelectionState;
                    if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
                      nextSelection = SelectionService.ctrlShiftClick(activeSelection, allFrameIds, frame.id);
                    } else if (e.shiftKey) {
                      nextSelection = SelectionService.shiftClick(activeSelection, allFrameIds, frame.id);
                    } else if (e.ctrlKey || e.metaKey) {
                      nextSelection = SelectionService.ctrlClick(activeSelection, allFrameIds, frame.id);
                    } else {
                      nextSelection = SelectionService.click(allFrameIds, frame.id);
                    }
                    if (onSelectionChange) {
                      onSelectionChange(nextSelection);
                    }
                    onSelectFrame(nextSelection.activeFrameId);
                  }}
                  onDoubleClick={() => {
                    setEditingFrameId(frame.id);
                    setEditingDuration(String(frame.durationMs ?? 100));
                  }}
                  draggable={editingFrameId !== frame.id}
                  onDragStart={(e) => {
                    if (editingFrameId === frame.id) return;
                    e.dataTransfer.setData('text/plain', frame.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverId !== frame.id) {
                      setDragOverId(frame.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === frame.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverId(null);
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (draggedId && draggedId !== frame.id) {
                      onReorderFrames?.(draggedId, frame.id);
                    }
                  }}
                  title={translate('timeline.dragReorder', language)}
                  className={`w-9 h-full flex flex-col justify-end items-center cursor-move transition-all shrink-0 border-r border-brand-turquoise/20 relative ${
                    isSelected ? 'bg-brand-sand/20' : isMultiSelected ? 'bg-brand-sage/10' : 'hover:bg-brand-turquoise/20'
                  } ${
                    isDragOver ? 'border-l-2 border-l-brand-sand bg-brand-sand/30 scale-105 z-20' : ''
                  }`}
                >
                  {editingFrameId === frame.id ? (
                    <input
                      type="number"
                      autoFocus
                      value={editingDuration}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingDuration(e.target.value)}
                      onBlur={() => {
                        const ms = parseInt(editingDuration) || 100;
                        onChangeFrameDuration?.(index, ms);
                        setEditingFrameId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const ms = parseInt(editingDuration) || 100;
                          onChangeFrameDuration?.(index, ms);
                          setEditingFrameId(null);
                        } else if (e.key === 'Escape') {
                          setEditingFrameId(null);
                        }
                      }}
                      className="w-8 h-5 bg-brand-depth border border-brand-sand rounded text-[8px] text-center font-mono font-bold text-brand-sand focus:outline-none z-30 mb-0.5"
                    />
                  ) : (
                    <>
                      {/* Subtle vertical tick mark */}
                      <span className={`w-[1px] h-1.5 ${isHighlightedTick ? 'bg-brand-sand' : 'bg-slate-600'} absolute bottom-0`} />
                      
                      <span className="text-[8px] font-mono font-bold text-slate-400 leading-none mb-2.5 select-none flex items-center justify-center gap-0.5" title={translate('timeline.durationTooltip', language as any, { ms: frame.durationMs ?? 100 })}>
                        {index}
                        {frame.durationMs !== undefined && frame.durationMs !== 100 && (
                          <span className="text-[6px] text-brand-sand font-black">★</span>
                        )}
                      </span>
                    </>
                  )}

                  {/* Underline for active frame header (Playhead) */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-sand shadow-[0_0_8px_#C8A96A]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid tracks per Layer */}
          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col min-w-max">
            {layers.map((layer) => {
              const isLayerSelected = layer.id === selectedLayerId;
              return (
                <div 
                  key={layer.id} 
                  className={`h-6 flex items-center border-b border-brand-turquoise/20 shrink-0 transition-colors ${
                    isLayerSelected ? 'bg-brand-sage/5' : 'hover:bg-brand-turquoise/10'
                  }`}
                >
                  {frames.map((frame, frameIndex) => {
                    const isFrameSelected = frame.id === activeSelection.activeFrameId;
                    const isFrameMultiSelected = activeSelection.selectedFrameIds.includes(frame.id);
                    const hasData = hasFrameData(frame.id, layer.id);
                    const effective = !hasData ? LayerResolutionService.getEffectiveLayerPixels({ frames, layers, pixels: localPixels }, frame.id, layer.id) : null;
                    const isHeldOrStatic = !hasData && effective && effective.pixels && effective.pixels.length > 0 && !LayerResolutionService.isPixelArrayEmpty(effective.pixels);
                    
                    return (
                      <div
                        key={frame.id}
                        onClick={(e) => {
                          const allFrameIds = frames.map(f => f.id);
                          let nextSelection: FrameSelectionState;
                          if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
                            nextSelection = SelectionService.ctrlShiftClick(activeSelection, allFrameIds, frame.id);
                          } else if (e.shiftKey) {
                            nextSelection = SelectionService.shiftClick(activeSelection, allFrameIds, frame.id);
                          } else if (e.ctrlKey || e.metaKey) {
                            nextSelection = SelectionService.ctrlClick(activeSelection, allFrameIds, frame.id);
                          } else {
                            nextSelection = SelectionService.click(allFrameIds, frame.id);
                          }
                          if (onSelectionChange) {
                            onSelectionChange(nextSelection);
                          }
                          onSelectFrame(nextSelection.activeFrameId);
                          onSelectLayer(layer.id);
                        }}
                        className={`w-9 h-full flex items-center justify-center border-r border-brand-turquoise/20 cursor-pointer shrink-0 transition-all relative ${
                          isFrameSelected && isLayerSelected
                            ? 'bg-brand-depth ring-2 ring-inset ring-brand-sage z-10'
                            : isFrameSelected
                            ? 'bg-brand-sage/15'
                            : isFrameMultiSelected
                            ? 'bg-brand-sage/5'
                            : 'hover:bg-brand-sage/10'
                        }`}
                      >
                        {/* Keyframe Indicator */}
                        {hasData ? (
                          <div 
                            className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${
                              isFrameSelected && isLayerSelected
                                ? 'bg-brand-sand scale-110'
                                : isFrameSelected
                                ? 'bg-brand-sage'
                                : 'bg-slate-500 hover:bg-brand-sand'
                            }`}
                            title={translate('timeline.hasDrawing', language)}
                          />
                        ) : isHeldOrStatic ? (
                          <div 
                            className={`w-2 h-2 rounded-sm transition-all ${
                              layer.isStatic 
                                ? 'bg-amber-400/60 hover:bg-amber-400 ring-1 ring-amber-400/30' 
                                : 'bg-brand-sand/40 hover:bg-brand-sand/70'
                            }`}
                            title={layer.isStatic ? translate('layers.staticLayer', language) : translate('timeline.hasDrawing', language)}
                          />
                        ) : (
                          <div 
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFrameSelected && isLayerSelected
                                ? 'bg-brand-sage/50'
                                : 'bg-brand-turquoise/30'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Simple Animation Tag Dialog Modal */}
      {showTagDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTagDialog(null)}>
          <div className="bg-brand-petroleum border border-brand-turquoise/45 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-300 font-sans" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="bg-brand-depth border-b border-brand-turquoise/30 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {showTagDialog === 'create' 
                  ? translate('timeline.createTagTitle', language as any)
                  : translate('timeline.editTagTitle', language as any)
                }
              </span>
              <button
                onClick={() => setShowTagDialog(null)}
                className="p-1 hover:bg-brand-turquoise/20 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-4 flex flex-col gap-3.5">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {translate('timeline.tagName', language as any)}
                </label>
                <input
                  type="text"
                  value={dialogTagName}
                  onChange={(e) => setDialogTagName(e.target.value)}
                  className="w-full bg-brand-depth border border-brand-turquoise/30 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-sage font-medium"
                  placeholder={translate('timeline.tagPlaceholder', language as any)}
                  autoFocus
                />
              </div>

              {/* Color Preset Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  {translate('timeline.tagColor', language as any)}
                </label>
                <div className="flex items-center gap-2 py-1 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDialogTagColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all relative shrink-0 ${
                        dialogTagColor === color ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {dialogTagColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">✓</span>
                      )}
                    </button>
                  ))}
                  {/* Native color picker as custom fallback */}
                  <input
                    type="color"
                    value={dialogTagColor}
                    onChange={(e) => setDialogTagColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none shrink-0 ml-1"
                    title={translate('colors.customColor', language as any)}
                  />
                </div>
              </div>

              {/* Start / End Frame Indexes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {translate('timeline.startFrame', language as any)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={frames.length - 1}
                    value={dialogStartFrame}
                    onChange={(e) => setDialogStartFrame(Math.max(0, Math.min(frames.length - 1, parseInt(e.target.value) || 0)))}
                    className="w-full bg-brand-depth border border-brand-turquoise/30 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-sage font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {translate('timeline.endFrame', language as any)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={frames.length - 1}
                    value={dialogEndFrame}
                    onChange={(e) => setDialogEndFrame(Math.max(0, Math.min(frames.length - 1, parseInt(e.target.value) || 0)))}
                    className="w-full bg-brand-depth border border-brand-turquoise/30 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-sage font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-brand-depth px-4 py-3 border-t border-brand-turquoise/30 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowTagDialog(null)}
                className="px-3 py-1.5 hover:bg-brand-turquoise/20 rounded text-xs text-slate-400 hover:text-white font-medium transition"
              >
                {translate('common.cancel', language)}
              </button>
              <button
                onClick={handleSaveTag}
                disabled={!dialogTagName.trim()}
                className="bg-brand-sage hover:bg-brand-sage/80 disabled:opacity-40 text-slate-900 font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{translate('common.save', language)}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
})

export default Timeline;
