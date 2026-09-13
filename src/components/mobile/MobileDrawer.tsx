import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, PenTool, Layers, Palette
} from 'lucide-react';
import { ToolType, Layer, SymmetrySettings, TilingSettings, LanguageCode } from '../../types';
import { translate } from '../../i18n';
import LayerManager from '../LayerManager';
import MobileToolsPanel from './MobileToolsPanel';
import MobileColorPicker from './MobileColorPicker';

export type MobileDrawerPanel = 'tools' | 'layers' | 'color' | 'options' | 'timeline';

interface MobileDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  activePanel: MobileDrawerPanel | null;
  onSelectPanel: (panel: MobileDrawerPanel) => void;
  
  // Tool states
  currentTool: ToolType;
  onChangeTool: (t: ToolType) => void;
  brushSize: number;
  onChangeBrushSize: (s: number) => void;
  symmetry: SymmetrySettings;
  onChangeSymmetry: (s: SymmetrySettings) => void;
  tiling?: TilingSettings;
  onChangeTiling?: (t: TilingSettings) => void;
  pixelPerfect: boolean;
  onChangePixelPerfect: (val: boolean) => void;

  // Extended tool option states
  activeBrush?: any;
  onChangeActiveBrush?: (brush: any) => void;
  sprayDensity?: number;
  onChangeSprayDensity?: (val: number) => void;
  sprayRandomness?: number;
  onChangeSprayRandomness?: (val: number) => void;
  sprayShape?: 'round' | 'square' | 'cross' | 'star';
  onChangeSprayShape?: (shape: 'round' | 'square' | 'cross' | 'star') => void;
  ditheringPattern?: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise';
  onChangeDitheringPattern?: (pat: 'checkerboard' | 'bayer' | '25%' | '50%' | '75%' | 'lines' | 'cross' | 'noise') => void;
  cloneSource?: { x: number; y: number } | null;
  onChangeCloneSource?: (src: { x: number; y: number } | null) => void;
  isSelectingCloneSource?: boolean;
  onStartSelectCloneSource?: () => void;
  bucketContiguous?: boolean;
  onChangeBucketContiguous?: (val: boolean) => void;
  bucketRefer?: 'active' | 'all';
  onChangeBucketRefer?: (val: 'active' | 'all') => void;
  tolerance?: number;
  onChangeTolerance?: (val: number) => void;
  fillShape?: boolean;
  onChangeFillShape?: (val: boolean) => void;
  selectionActive?: boolean;
  onClearSelection?: () => void;
  onInvertSelection?: () => void;
  onSaveAsStamp?: () => void;
  onOpenAssetLibrary?: () => void;
  activeStamp?: { pixels: string[]; width: number; height: number; name: string } | null;
  onClearActiveStamp?: () => void;
  stampScale?: number;
  onChangeStampScale?: (scale: number | ((prev: number) => number)) => void;
  stampRotation?: number;
  onChangeStampRotation?: (rot: number | ((prev: number) => number)) => void;
  stampFlipH?: boolean;
  onChangeStampFlipH?: (flip: boolean | ((prev: boolean) => boolean)) => void;
  stampFlipV?: boolean;
  onChangeStampFlipV?: (flip: boolean | ((prev: boolean) => boolean)) => void;
  patternMode?: 'stamp' | 'pattern';
  onChangePatternMode?: (mode: 'stamp' | 'pattern') => void;

  // Layer states
  layers: Layer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleStatic?: (id: string) => void;
  onChangeOpacity?: (id: string, opacity: number) => void;
  onMoveLayer?: (id: string, dir: 'up' | 'down') => void;
  onMergeDown?: (id: string) => void;
  onReorderLayers?: (id: string, targetIdx: number) => void;
  onRenameLayer?: (id: string, name: string) => void;
  onChangeBlendMode?: (id: string, mode: string) => void;

  // Color states
  currentColor: string;
  secondaryColor?: string;
  activeColorSlot?: 'primary' | 'secondary';
  onChangeColor: (color: string) => void;
  onChangeSecondaryColor?: (color: string) => void;
  onSwapColors?: () => void;
  onResetDefaultColors?: () => void;
  onChangeActiveColorSlot?: (slot: 'primary' | 'secondary') => void;
  brushOpacity?: number;
  onChangeBrushOpacity?: (opacity: number) => void;
  documentColors?: string[];
  customPalette?: string[];
  onAddToCustomPalette?: (color: string) => void;
  onClearCustomPalette?: () => void;
  onRemoveFromCustomPalette?: (indexOrColor: any) => void;
  onInvertPalette?: () => void;
  onOpenLibrary?: () => void;
  recentColors?: string[];
  onClearRecentColors?: () => void;
  onSaveRecentAsPalette?: () => void;
  language: LanguageCode;
  libraryPalettes?: any;
  onLoadPalette?: (nameOrColors: any, colors?: string[]) => void;
  showToast?: (msg: string, type?: any) => void;
  isLandscape?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = React.memo(function MobileDrawer({
  onClose,
  activePanel,
  onSelectPanel,
  currentTool,
  onChangeTool,
  brushSize,
  onChangeBrushSize,
  symmetry,
  onChangeSymmetry,
  tiling,
  onChangeTiling,
  pixelPerfect,
  onChangePixelPerfect,
  activeBrush,
  onChangeActiveBrush,
  sprayDensity,
  onChangeSprayDensity,
  sprayRandomness,
  onChangeSprayRandomness,
  sprayShape,
  onChangeSprayShape,
  ditheringPattern,
  onChangeDitheringPattern,
  cloneSource,
  onChangeCloneSource,
  isSelectingCloneSource = false,
  onStartSelectCloneSource,
  bucketContiguous,
  onChangeBucketContiguous,
  bucketRefer,
  onChangeBucketRefer,
  tolerance,
  onChangeTolerance,
  fillShape,
  onChangeFillShape,
  selectionActive,
  onClearSelection,
  onInvertSelection,
  onSaveAsStamp,
  onOpenAssetLibrary,
  activeStamp,
  onClearActiveStamp,
  stampScale,
  onChangeStampScale,
  stampRotation,
  onChangeStampRotation,
  stampFlipH,
  onChangeStampFlipH,
  stampFlipV,
  onChangeStampFlipV,
  patternMode,
  onChangePatternMode,
  layers,
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
  onChangeColor,
  onChangeSecondaryColor,
  onSwapColors,
  brushOpacity = 100,
  onChangeBrushOpacity,
  documentColors,
  customPalette,
  onAddToCustomPalette,
  onClearCustomPalette,
  onRemoveFromCustomPalette,
  onInvertPalette,
  onLoadPalette,
  isLandscape = false,
  language
}) {
  if (!activePanel) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex select-none animate-in fade-in duration-200 ${
        isLandscape ? 'items-center justify-center p-3' : 'flex-col justify-end'
      }`}
      onClick={onClose}
      id="mobile-drawer-backdrop"
    >
      <motion.div
        initial={isLandscape ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
        animate={isLandscape ? { scale: 1, opacity: 1 } : { y: 0 }}
        exit={isLandscape ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-[#0B1A13]/98 backdrop-blur-xl border border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-100 ${
          isLandscape 
            ? (activePanel === 'color' ? 'max-w-4xl w-[96vw] max-h-[95dvh] h-[92dvh] rounded-3xl' : 'max-w-xl max-h-[92dvh] rounded-3xl')
            : (activePanel === 'color' ? 'rounded-t-[32px] max-h-[94dvh] h-[90dvh]' : 'rounded-t-[32px] max-h-[88dvh]')
        }`}
        id="mobile-drawer-container"
      >
        {/* Top Drag Bar Handle (Portrait only) */}
        {!isLandscape && (
          <div className="w-full pt-2.5 pb-1 flex justify-center cursor-pointer shrink-0" onClick={onClose}>
            <div className="w-12 h-1 bg-[#C8A96A]/30 rounded-full" />
          </div>
        )}

        {/* 1. INDEPENDENT TOOLS MODAL HEADER */}
        {activePanel === 'tools' && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
                <PenTool className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-100">
                    {translate('toolbar.title', language) || 'Herramientas'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#C8A96A] bg-[#C8A96A]/15 px-2 py-0.5 rounded-full border border-[#C8A96A]/30 font-mono">
                    {currentTool}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Toca una herramienta para aplicarla y volver al lienzo
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer border border-white/10"
              title="Cerrar panel de herramientas"
              id="close-mobile-tools-drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 2. INDEPENDENT COLOR & PALETTE MODAL HEADER */}
        {activePanel === 'color' && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-black/20">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-xl border-2 border-white/80 shadow-md flex items-center justify-center"
                style={{ backgroundColor: currentColor }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-100">
                    {translate('colors.title', language) || 'Color y Paleta'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#C8A96A] bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                    {currentColor.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Selector tradicional de color, muestras amplias y paletas
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer border border-white/10"
              title="Cerrar selector de color"
              id="close-mobile-color-drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 3. INDEPENDENT LAYERS MODAL HEADER */}
        {activePanel === 'layers' && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
                <Layers className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-100">
                    {translate('layers.title', language) || 'Capas'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#C8A96A] bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                    {layers.length} {layers.length === 1 ? 'capa' : 'capas'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Capas del proyecto activo
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition touch-manipulation cursor-pointer border border-white/10"
              title="Cerrar gestor de capas"
              id="close-mobile-layers-drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-3.5">
          
          {/* TAB 1: REDESIGNED TACTILE TOOLS PANEL */}
          {activePanel === 'tools' && (
            <MobileToolsPanel
              currentTool={currentTool}
              onChangeTool={onChangeTool}
              brushSize={brushSize}
              onChangeBrushSize={onChangeBrushSize}
              pixelPerfect={pixelPerfect}
              onChangePixelPerfect={onChangePixelPerfect}
              activeBrush={activeBrush}
              onChangeActiveBrush={onChangeActiveBrush}
              sprayDensity={sprayDensity}
              onChangeSprayDensity={onChangeSprayDensity}
              sprayRandomness={sprayRandomness}
              onChangeSprayRandomness={onChangeSprayRandomness}
              sprayShape={sprayShape}
              onChangeSprayShape={onChangeSprayShape}
              ditheringPattern={ditheringPattern}
              onChangeDitheringPattern={onChangeDitheringPattern}
              cloneSource={cloneSource}
              onChangeCloneSource={onChangeCloneSource}
              isSelectingCloneSource={isSelectingCloneSource}
              onStartSelectCloneSource={onStartSelectCloneSource}
              bucketContiguous={bucketContiguous}
              onChangeBucketContiguous={onChangeBucketContiguous}
              bucketRefer={bucketRefer}
              onChangeBucketRefer={onChangeBucketRefer}
              tolerance={tolerance}
              onChangeTolerance={onChangeTolerance}
              fillShape={fillShape}
              onChangeFillShape={onChangeFillShape}
              symmetry={symmetry}
              onChangeSymmetry={onChangeSymmetry}
              tiling={tiling}
              onChangeTiling={onChangeTiling}
              selectionActive={selectionActive}
              onClearSelection={onClearSelection}
              onInvertSelection={onInvertSelection}
              onSaveAsStamp={onSaveAsStamp}
              onOpenAssetLibrary={onOpenAssetLibrary}
              activeStamp={activeStamp}
              onClearActiveStamp={onClearActiveStamp}
              stampScale={stampScale}
              onChangeStampScale={onChangeStampScale}
              stampRotation={stampRotation}
              onChangeStampRotation={onChangeStampRotation}
              stampFlipH={stampFlipH}
              onChangeStampFlipH={onChangeStampFlipH}
              stampFlipV={stampFlipV}
              onChangeStampFlipV={onChangeStampFlipV}
              patternMode={patternMode}
              onChangePatternMode={onChangePatternMode}
              isLandscape={isLandscape}
              language={language}
              onClose={onClose}
            />
          )}

          {/* TAB 2: LAYERS */}
          {activePanel === 'layers' && (
            <div className="flex flex-col gap-2">
              <LayerManager
                layers={layers}
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

          {/* TAB 3: REDESIGNED TACTILE COLOR SELECTOR & PALETTE */}
          {activePanel === 'color' && (
            <MobileColorPicker
              currentColor={currentColor}
              secondaryColor={secondaryColor}
              onChangeColor={onChangeColor}
              onChangeSecondaryColor={onChangeSecondaryColor}
              onSwapColors={onSwapColors}
              opacity={brushOpacity}
              onChangeOpacity={onChangeBrushOpacity}
              documentColors={documentColors}
              customPalette={customPalette}
              onAddToCustomPalette={onAddToCustomPalette}
              onClearCustomPalette={onClearCustomPalette}
              onRemoveFromCustomPalette={onRemoveFromCustomPalette}
              onInvertPalette={onInvertPalette}
              onLoadPalette={onLoadPalette}
              isLandscape={isLandscape}
              language={language}
              onClose={onClose}
            />
          )}

        </div>
      </motion.div>
    </div>
  );
});

export default MobileDrawer;
