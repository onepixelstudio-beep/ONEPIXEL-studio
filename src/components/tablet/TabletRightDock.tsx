import React, { useState } from 'react';
import { Palette, Layers, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { PixelProject, LanguageCode } from '../../types';
import ColorPanel from '../ColorPanel';
import LayerManager from '../LayerManager';
import PreviewPanel from '../PreviewPanel';

interface TabletRightDockProps {
  project: PixelProject | null;
  selectedFrameId: string;
  selectedLayerId?: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleVisible: (layerId: string) => void;
  onToggleLocked: (layerId: string) => void;
  onToggleStatic?: (layerId: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onMergeDown: (layerId: string) => void;
  onReorderLayers?: (id: string, targetIdx: number) => void;
  onRenameLayer?: (layerId: string, name: string) => void;
  onChangeBlendMode?: (layerId: string, mode: any) => void;

  // Color props
  currentColor: string;
  secondaryColor: string;
  activeColorSlot: 'primary' | 'secondary';
  onChangeColor: (color: string) => void;
  onChangeSecondaryColor: (color: string) => void;
  onSwapColors: () => void;
  onResetDefaultColors: () => void;
  onChangeActiveColorSlot: (slot: 'primary' | 'secondary') => void;
  brushOpacity: number;
  onChangeBrushOpacity: (opacity: number) => void;
  documentColors: string[];
  customPalette: string[];
  onAddToCustomPalette: (color: string) => void;
  onClearCustomPalette: () => void;
  onRemoveFromCustomPalette?: (color: string) => void;
  onInvertPalette: () => void;
  onOpenLibrary: () => void;
  recentColors: string[];
  onClearRecentColors: () => void;
  onSaveRecentAsPalette: () => void;
  libraryPalettes?: any[];
  onLoadPalette: (colors: string[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;

  // Preview props
  isPlaying: boolean;
  onTogglePlay: () => void;

  // General
  language: LanguageCode;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const TabletRightDock: React.FC<TabletRightDockProps> = React.memo(function TabletRightDock({
  project,
  selectedFrameId,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisible,
  onToggleLocked,
  onToggleStatic,
  onChangeOpacity,
  onMoveLayer,
  onMergeDown,
  onReorderLayers,
  onRenameLayer,
  onChangeBlendMode,

  currentColor,
  secondaryColor,
  activeColorSlot,
  onChangeColor,
  onChangeSecondaryColor,
  onSwapColors,
  onResetDefaultColors,
  onChangeActiveColorSlot,
  brushOpacity,
  onChangeBrushOpacity,
  documentColors,
  customPalette,
  onAddToCustomPalette,
  onClearCustomPalette,
  onRemoveFromCustomPalette,
  onInvertPalette,
  onOpenLibrary,
  recentColors,
  onClearRecentColors,
  onSaveRecentAsPalette,
  libraryPalettes,
  onLoadPalette,
  showToast,

  isPlaying,
  onTogglePlay,
  language,
  isOpen,
  onToggleOpen
}) {
  const [activeTab, setActiveTab] = useState<'color' | 'layers' | 'preview'>('color');
  const layersCount = project?.layers?.length || 1;

  return (
    <div 
      className="relative shrink-0 transition-all duration-300 ease-in-out select-none h-full"
      style={{
        width: isOpen ? '252px' : '0px',
      }}
      id="tablet-right-dock-container"
    >
      {/* Dock Content */}
      <div 
        className="w-[252px] h-full flex flex-col bg-[#102419] border border-[#1b3d2b] rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        {/* Top Tab Bar Navigation */}
        <div className="flex items-center bg-[#0b1b12] border-b border-[#1b3d2b] p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('color')}
            className={`flex-1 min-h-[38px] h-[38px] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer touch-manipulation active:scale-95 ${
              activeTab === 'color'
                ? 'bg-[#0F3D34] text-[#C8A96A] border border-[#C8A96A]/50 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#153022]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Color</span>
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 min-h-[38px] h-[38px] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer touch-manipulation active:scale-95 ${
              activeTab === 'layers'
                ? 'bg-[#0F3D34] text-[#C8A96A] border border-[#C8A96A]/50 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#153022]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Capas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#102419] text-[#C8A96A] border border-[#C8A96A]/30">
              {layersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 min-h-[38px] h-[38px] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer touch-manipulation active:scale-95 ${
              activeTab === 'preview'
                ? 'bg-[#0F3D34] text-[#C8A96A] border border-[#C8A96A]/50 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#153022]'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>

        {/* Tab Body View */}
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col p-1.5">
          {activeTab === 'color' && (
            <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
              <ColorPanel 
                currentColor={currentColor}
                secondaryColor={secondaryColor}
                activeColorSlot={activeColorSlot}
                onChangeColor={onChangeColor}
                onChangeSecondaryColor={onChangeSecondaryColor}
                onSwapColors={onSwapColors}
                onResetDefaultColors={onResetDefaultColors}
                onChangeActiveColorSlot={onChangeActiveColorSlot}
                opacity={brushOpacity}
                onChangeOpacity={onChangeBrushOpacity}
                documentColors={documentColors}
                customPalette={customPalette}
                onAddToCustomPalette={onAddToCustomPalette}
                onClearCustomPalette={onClearCustomPalette}
                onRemoveFromCustomPalette={onRemoveFromCustomPalette}
                onInvertPalette={onInvertPalette}
                onSavePaletteToLibrary={onOpenLibrary}
                onOpenLibrary={onOpenLibrary}
                recentColors={recentColors}
                onClearRecentColors={onClearRecentColors}
                onSaveRecentAsPalette={onSaveRecentAsPalette}
                language={language}
                libraryPalettes={libraryPalettes}
                onLoadPalette={onLoadPalette}
                showToast={showToast}
              />
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
              <LayerManager 
                layers={project?.layers || []}
                selectedLayerId={selectedLayerId}
                onSelectLayer={onSelectLayer}
                onAddLayer={onAddLayer}
                onDeleteLayer={onDeleteLayer}
                onDuplicateLayer={onDuplicateLayer}
                onToggleVisible={onToggleVisible}
                onToggleLocked={onToggleLocked}
                onToggleStatic={onToggleStatic}
                onChangeOpacity={onChangeOpacity}
                onMoveLayer={onMoveLayer}
                onMergeDown={onMergeDown}
                onReorderLayers={onReorderLayers}
                onRenameLayer={onRenameLayer}
                onChangeBlendMode={onChangeBlendMode}
                language={language}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="w-full h-full flex flex-col gap-3 p-2 overflow-y-auto custom-scrollbar items-center">
              <div className="w-full bg-[#0b1b12] border border-[#1b3d2b] p-3 rounded-xl flex flex-col items-center gap-3">
                <PreviewPanel 
                  project={project}
                  currentFrameId={selectedFrameId}
                  isPlaying={isPlaying}
                  onTogglePlay={onTogglePlay}
                  language={language}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Handle Button to open/collapse dock */}
      <button
        onClick={onToggleOpen}
        className="absolute top-1/2 -translate-y-1/2 -left-4 w-4 h-14 bg-[#102419] hover:bg-[#1b3d2b] border-y border-l border-[#1b3d2b] text-slate-400 hover:text-white rounded-l-lg flex items-center justify-center cursor-pointer z-30 transition-all duration-150 shadow-lg touch-manipulation"
        title={isOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
      >
        {isOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
});
