import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { translate, LanguageCode } from '../i18n';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFileName: string;
  fileFormat?: string;
  language?: LanguageCode;
  onConfirm: (fileName: string) => Promise<void> | void;
}

export default function SaveAsModal({
  isOpen,
  onClose,
  initialFileName,
  fileFormat = 'onepixel',
  language = 'es',
  onConfirm
}: SaveAsModalProps) {
  const [fileName, setFileName] = useState(initialFileName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanFormat = fileFormat.toLowerCase().replace(/^\./, '');

  useEffect(() => {
    if (isOpen) {
      setFileName(initialFileName || translate('headerMenu.untitled', language));
      setError(null);
      setIsProcessing(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialFileName, language]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fileName.trim();
    if (!cleanName) {
      setError(translate('saveModal.enterFileNameError', language) || 'Por favor ingresa un nombre para el archivo.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm(cleanName);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el archivo.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" id="save-as-modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F3D34]/80 backdrop-blur-sm transition-opacity" 
        onClick={() => {
          if (!isProcessing) onClose();
        }} 
      />

      {/* Modal Card */}
      <div 
        className="relative bg-[#102419] border border-[#234e38] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans" 
        id="save-as-modal"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b3d2b] flex justify-between items-center bg-[#0d1f15]">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-[#C8A96A]" />
            <h3 className="font-bold text-sm tracking-tight text-slate-100">
              {translate('headerMenu.saveAs', language) || 'Guardar como...'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#1b3d2b] text-slate-400 hover:text-white rounded-lg transition"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {translate('saveModal.fileName', language) || 'Nombre del archivo'}
            </label>
            <div className="flex items-center gap-2 bg-[#0a1710] border border-[#234e38] rounded-xl px-3.5 py-2.5 focus-within:border-[#C8A96A] transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-transparent text-xs text-slate-100 focus:outline-none"
                placeholder={translate('saveModal.fileNamePlaceholder', language) || 'Nombre del proyecto'}
                disabled={isProcessing}
              />
              <span className="text-xs font-mono font-bold text-[#C8A96A] shrink-0">
                .{cleanFormat}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              El archivo se descargará con la extensión <span className="text-slate-200 font-mono">.{cleanFormat}</span> conteniendo todas las capas, fotogramas y paleta.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#1b3d2b] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1b3d2b] hover:bg-[#234e38] text-slate-300 font-bold rounded-xl text-xs transition"
              disabled={isProcessing}
            >
              {translate('common.cancel', language) || 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isProcessing || !fileName.trim()}
              className="px-4 py-2 bg-[#C8A96A] hover:bg-[#d8bb7c] disabled:opacity-40 text-[#0F3D34] font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F3D34]/35 border-t-[#0F3D34] rounded-full animate-spin" />
                  <span>{translate('saveModal.saving', language) || 'Guardando...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{translate('saveModal.save', language) || 'Guardar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
