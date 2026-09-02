import React, { useState, useEffect } from 'react';
import { X, Layers, Image, Check, Maximize2, Settings, FileUp, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { translate, LanguageCode } from '../i18n';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  projectWidth: number;
  projectHeight: number;
  onConfirm: (options: {
    placement: 'new_layer' | 'current_layer';
    scaleMode: 'fit' | 'original' | 'custom';
    customWidth: number;
    customHeight: number;
    resizeCanvas: boolean;
  }) => void;
  language?: LanguageCode;
}

export default function ImportModal({
  isOpen,
  onClose,
  fileName,
  imageWidth,
  imageHeight,
  projectWidth,
  projectHeight,
  onConfirm,
  language = 'es',
}: ImportModalProps) {
  const [placement, setPlacement] = useState<'new_layer' | 'current_layer'>('new_layer');
  const [scaleMode, setScaleMode] = useState<'fit' | 'original' | 'custom'>('fit');
  const [customWidth, setCustomWidth] = useState(projectWidth);
  const [customHeight, setCustomHeight] = useState(projectHeight);
  const [resizeCanvas, setResizeCanvas] = useState(false);

  // Sync custom size when modal opens or dimensions change
  useEffect(() => {
    if (scaleMode === 'fit') {
      setCustomWidth(projectWidth);
      setCustomHeight(projectHeight);
    } else if (scaleMode === 'original') {
      setCustomWidth(imageWidth);
      setCustomHeight(imageHeight);
    }
  }, [scaleMode, projectWidth, projectHeight, imageWidth, imageHeight]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm({
      placement,
      scaleMode,
      customWidth: Math.max(1, Math.min(600, customWidth)),
      customHeight: Math.max(1, Math.min(600, customHeight)),
      resizeCanvas,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[200] overflow-y-auto" id="import-options-modal-overlay">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#102419] border border-[#102419] rounded-2xl max-w-lg w-full text-slate-200 shadow-2xl relative overflow-hidden"
        id="import-options-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#102419]/60 bg-[#10111d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {translate('importModal.title', language)}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium font-mono truncate max-w-[280px] sm:max-w-[340px]">
                {translate('importModal.fileLabel', language)} {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#102419] text-slate-400 hover:text-white rounded-lg transition"
            title={translate('importModal.close', language)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 px-6 py-3 bg-[#0c0d18]/60 border-b border-[#102419]/30 text-[11px] font-mono">
          <div className="flex flex-col gap-0.5 border-r border-[#102419]/30 pr-2">
            <span className="text-slate-500 uppercase text-[9px] font-bold">{translate('importModal.originalImage', language)}</span>
            <span className="text-amber-400 font-bold">{imageWidth} x {imageHeight} px</span>
          </div>
          <div className="flex flex-col gap-0.5 pl-2">
            <span className="text-slate-500 uppercase text-[9px] font-bold">{translate('importModal.currentCanvas', language)}</span>
            <span className="text-[#C8A96A] font-bold">{projectWidth} x {projectHeight} px</span>
          </div>
        </div>

        {/* Main Content Form */}
        <div className="p-6 flex flex-col gap-5 text-xs">
          
          {/* 1. Placement Destination */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C8A96A]" />
              {translate('importModal.placementDestination', language)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlacement('new_layer')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  placement === 'new_layer'
                    ? 'bg-[#C8A96A]/10 border-[#C8A96A] text-white shadow-[0_0_8px_rgba(200,169,106,0.15)]'
                    : 'bg-[#102419] border-[#102419] hover:border-[#0F3D34] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${placement === 'new_layer' ? 'border-[#C8A96A] bg-[#C8A96A]' : 'border-slate-500'}`}>
                    {placement === 'new_layer' && <div className="w-1 h-1 bg-white rounded-full" />}
                  </div>
                  <span className="font-bold">{translate('importModal.newLayer', language)}</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-normal pl-5">
                  {translate('importModal.newLayerDesc', language)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlacement('current_layer')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  placement === 'current_layer'
                    ? 'bg-[#C8A96A]/10 border-[#C8A96A] text-white shadow-[0_0_8px_rgba(200,169,106,0.15)]'
                    : 'bg-[#102419] border-[#102419] hover:border-[#0F3D34] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${placement === 'current_layer' ? 'border-[#C8A96A] bg-[#C8A96A]' : 'border-slate-500'}`}>
                    {placement === 'current_layer' && <div className="w-1 h-1 bg-white rounded-full" />}
                  </div>
                  <span className="font-bold">{translate('importModal.activeLayer', language)}</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-normal pl-5">
                  {translate('importModal.activeLayerDesc', language)}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Scale & Sizing */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#C8A96A]" />
              {translate('importModal.scaleIntegration', language)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'fit', label: translate('importModal.fitToCanvas', language), desc: translate('importModal.autoScale', language) },
                { id: 'custom', label: translate('importModal.custom', language), desc: translate('importModal.manualScale', language) }
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setScaleMode(mode.id as any)}
                  className={`p-2.5 rounded-xl border text-center flex flex-col gap-0.5 transition ${
                    scaleMode === mode.id
                      ? 'bg-[#C8A96A]/10 border-[#C8A96A] text-white shadow-[0_0_8px_rgba(139,92,246,0.15)]'
                      : 'bg-[#102419] border-[#102419] hover:border-[#3f416a] text-slate-300'
                  }`}
                >
                  <span className="font-bold text-[11px]">{mode.label}</span>
                  <span className="text-[9px] text-slate-500">{mode.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom sizing inputs (only shown if custom is chosen) */}
            {scaleMode === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-[#102419] border border-[#102419]/40 p-3 rounded-xl grid grid-cols-2 gap-4 mt-1"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">{translate('importModal.destWidth', language)}</span>
                  <div className="flex items-center gap-1 bg-[#102419] border border-[#102419] rounded-lg px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Math.max(1, Math.min(600, parseInt(e.target.value) || 32)))}
                      className="w-full bg-transparent text-white font-mono font-bold text-center outline-none focus:ring-0"
                    />
                    <span className="text-slate-500 font-mono text-[9px]">px</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">{translate('importModal.destHeight', language)}</span>
                  <div className="flex items-center gap-1 bg-[#102419] border border-[#102419] rounded-lg px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Math.max(1, Math.min(600, parseInt(e.target.value) || 32)))}
                      className="w-full bg-transparent text-white font-mono font-bold text-center outline-none focus:ring-0"
                    />
                    <span className="text-slate-500 font-mono text-[9px]">px</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 3. Canvas Resizing options (checkbox) */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              {translate('importModal.resizeCanvasTitle', language)}
            </label>
            <button
              type="button"
              onClick={() => setResizeCanvas(!resizeCanvas)}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                resizeCanvas
                  ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  : 'bg-[#102419] border-[#102419] hover:border-[#3f416a] text-slate-300'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${resizeCanvas ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-500'}`}>
                {resizeCanvas && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">{translate('importModal.resizeOnePixelStudio', language)}</span>
                <span className="text-[10px] text-slate-500 leading-normal">
                  {translate('importModal.resizeCanvasDesc', language).replace('{size}', `${customWidth}x${customHeight}`)}
                </span>
              </div>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#102419]/60 bg-[#10111d] justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#102419] hover:bg-[#102419] border border-[#102419] rounded-xl font-bold text-slate-300 transition text-xs"
          >
            {translate('common.cancel', language)}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="px-6 py-2 bg-[#C8A96A] hover:bg-[#b59659] rounded-xl font-bold text-white shadow-md active:scale-[0.98] transition flex items-center gap-1.5 text-xs"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{translate('importModal.importButton', language)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
