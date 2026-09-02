import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Camera } from 'lucide-react';
import { translate, LanguageCode } from '../i18n';

interface CaptureStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onSave: (name: string, tags: string[], mode: 'exact' | 'trimmed') => void;
}

export default function CaptureStampModal({
  isOpen,
  onClose,
  language,
  onSave
}: CaptureStampModalProps) {
  const [name, setName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<'exact' | 'trimmed'>('exact');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTagsInput('');
      setMode('exact');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || translate('toolbar.selectionSaveStamp', language);
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    onSave(finalName, tags, mode);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="w-full max-w-md overflow-hidden bg-[#102419] border border-[#102419] rounded-2xl shadow-2xl text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#102419]/60 bg-[#102419]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#C8A96A]/10 text-[#C8A96A]">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-100">
                {translate('toolbar.captureSettings', language)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition"
              style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Stamp Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {translate('toolbar.stampName', language)}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translate('toolbar.stampNamePlaceholder', language)}
                className="w-full px-3 py-2 text-sm bg-[#102419] border border-[#102419] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C8A96A] text-slate-200"
                autoFocus
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {translate('toolbar.stampTags', language)}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={translate('toolbar.stampTagsPlaceholder', language)}
                className="w-full px-3 py-2 text-sm bg-[#102419] border border-[#102419] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C8A96A] text-slate-200"
              />
            </div>

            {/* Capture Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {translate('toolbar.captureMode', language)}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('exact')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                    mode === 'exact'
                      ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                      : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {translate('toolbar.modeExact', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('trimmed')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                    mode === 'trimmed'
                      ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                      : 'bg-[#102419] border-[#102419] text-slate-400 hover:text-slate-200'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {translate('toolbar.modeTrimmed', language)}
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#102419]/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg transition"
                style={{ minHeight: '44px' }}
              >
                {translate('common.cancel', language)}
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-[#C8A96A] hover:bg-[#b59659] text-white rounded-lg shadow-md transition cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                <Check className="w-3.5 h-3.5" />
                {translate('toolbar.selectionSaveStamp', language)}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
