import React from 'react';
import { 
  RotateCcw, RotateCw, Menu, Maximize2, Grid, 
  Sparkles, Check
} from 'lucide-react';
import { OnePixelLogo } from '../../branding';
import { LanguageCode } from '../../types';
import { translate } from '../../i18n';

interface MobileHeaderProps {
  projectName: string;
  projectWidth: number;
  projectHeight: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenMenu: () => void;
  language: LanguageCode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = React.memo(function MobileHeader({
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
  onOpenMenu,
  language
}) {
  return (
    <header 
      className="md:hidden flex items-center justify-between h-11 px-2.5 bg-[#102419] border-b border-[#102419] select-none shrink-0 z-40 text-slate-100"
      id="mobile-app-header"
    >
      {/* Left: Brand & Dimensions */}
      <div className="flex items-center gap-1.5 min-w-0">
        <OnePixelLogo height={18} className="shrink-0" />
        <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
          <span className="text-[10px] font-mono text-[#C8A96A] font-bold">
            {projectWidth}×{projectHeight}
          </span>
        </div>
      </div>

      {/* Center: Quick Undo & Redo (44px touch targets) */}
      <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-xl border border-white/10">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`min-w-[40px] min-h-[36px] px-2 rounded-lg flex items-center justify-center transition active:scale-90 touch-manipulation cursor-pointer ${
            canUndo 
              ? 'text-[#C8A96A] hover:text-white hover:bg-white/10' 
              : 'text-slate-600 opacity-30 cursor-not-allowed'
          }`}
          title={translate('header.undo', language) || 'Deshacer'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`min-w-[40px] min-h-[36px] px-2 rounded-lg flex items-center justify-center transition active:scale-90 touch-manipulation cursor-pointer ${
            canRedo 
              ? 'text-[#C8A96A] hover:text-white hover:bg-white/10' 
              : 'text-slate-600 opacity-30 cursor-not-allowed'
          }`}
          title={translate('header.redo', language) || 'Rehacer'}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Quick Canvas Actions & Menu Trigger (44px touch targets) */}
      <div className="flex items-center gap-1">
        {/* Reset Zoom / Center Canvas */}
        <button
          onClick={onResetZoom}
          className="min-w-[40px] min-h-[36px] p-1.5 rounded-lg text-slate-300 hover:text-white active:scale-90 transition touch-manipulation cursor-pointer"
          title="Centrar y ajustar lienzo"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={`min-w-[40px] min-h-[36px] p-1.5 rounded-lg transition active:scale-90 touch-manipulation cursor-pointer ${
            showGrid 
              ? 'text-[#C8A96A] bg-[#165347]/40' 
              : 'text-slate-400 hover:text-white'
          }`}
          title="Alternar cuadrícula de píxeles"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Full Menu Trigger */}
        <button
          onClick={onOpenMenu}
          className="min-w-[44px] min-h-[36px] px-2 rounded-xl bg-[#C8A96A]/20 hover:bg-[#C8A96A]/30 text-[#C8A96A] border border-[#C8A96A]/40 flex items-center justify-center gap-1 text-xs font-bold active:scale-95 transition touch-manipulation cursor-pointer"
          title="Menú principal"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
});
