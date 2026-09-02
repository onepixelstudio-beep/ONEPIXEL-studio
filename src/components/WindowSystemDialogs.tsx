import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle, HelpCircle, X, Check } from 'lucide-react';
import { windowSystem, DialogRequest } from '../utils/architecture/WindowSystem';
import { translate } from '../i18n';
import { LocalPersistence } from '../utils/persistence/LocalPersistence';

export default function WindowSystemDialogs() {
  const [dialogs, setDialogs] = useState<DialogRequest[]>([]);
  const [promptValues, setPromptValues] = useState<Record<string, string>>({});
  const language = LocalPersistence.getItem<any>('pixel_art_preferences')?.language || 'es';

  useEffect(() => {
    // Subscribe to WindowSystem dialog events
    const unsubscribe = windowSystem.subscribe((activeDialogs) => {
      setDialogs(activeDialogs);
      
      // Seed prompt values for new prompt dialogs
      activeDialogs.forEach(dialog => {
        if (dialog.type === 'prompt' && promptValues[dialog.id] === undefined) {
          setPromptValues(prev => ({
            ...prev,
            [dialog.id]: dialog.defaultValue || ''
          }));
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [promptValues]);

  const handlePromptChange = (dialogId: string, val: string) => {
    setPromptValues(prev => ({
      ...prev,
      [dialogId]: val
    }));
  };

  const handleConfirmPrompt = (dialog: DialogRequest) => {
    const val = promptValues[dialog.id] || '';
    dialog.resolve(val);
  };

  const getIconForDialog = (dialog: DialogRequest) => {
    const title = dialog.title.toLowerCase();
    const msg = dialog.message.toLowerCase();
    if (title.includes('error') || title.includes('fallo') || msg.includes('error')) {
      return <AlertTriangle className="w-5 h-5 text-rose-400" />;
    }
    if (title.includes('advertencia') || title.includes('peligro') || title.includes('limite') || title.includes('confirmar')) {
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
    if (dialog.type === 'prompt') {
      return <HelpCircle className="w-5 h-5 text-[#C8A96A]" />;
    }
    return <Info className="w-5 h-5 text-[#C8A96A]" />;
  };

  if (dialogs.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-4" id="window-system-dialogs-container">
        {/* Render a backdrop for the top-most dialog */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            // Dismiss top dialog if clicked outside (only for alert)
            const topDialog = dialogs[dialogs.length - 1];
            if (topDialog && topDialog.type === 'alert') {
              topDialog.resolve(null);
            }
          }}
          id="window-system-dialogs-backdrop"
        />

        {dialogs.map((dialog, index) => {
          const isTop = index === dialogs.length - 1;
          if (!isTop) return null; // Only show the topmost dialog visibly to avoid stacking confusion

          return (
            <motion.div
              key={dialog.id}
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative bg-[#102419] border border-[#102419] rounded-2xl w-full max-w-sm md:max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans"
              id={`window-dialog-${dialog.id}`}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#102419] flex gap-3 items-center bg-[#102419]">
                <div className="shrink-0 p-1.5 bg-[#102419]/50 border border-[#102419] rounded-xl shadow-inner">
                  {getIconForDialog(dialog)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white tracking-tight uppercase tracking-wider truncate">
                    {dialog.title}
                  </h3>
                </div>
                <button
                  onClick={() => dialog.reject()}
                  className="p-1 hover:bg-[#102419] text-slate-400 hover:text-white rounded-lg transition shrink-0"
                  title={translate('common.close', language)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {dialog.message}
                </p>

                {/* Prompt Field */}
                {dialog.type === 'prompt' && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      className="w-full bg-[#102419]/50 border border-[#102419] focus:border-[#C8A96A] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 transition outline-none"
                      placeholder={dialog.placeholder || translate('patternsModal.typeSearch', language) || '...'}
                      value={promptValues[dialog.id] || ''}
                      onChange={(e) => handlePromptChange(dialog.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmPrompt(dialog);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 border-t border-[#102419] bg-[#102419] flex justify-end gap-2">
                {dialog.type !== 'alert' && (
                  <button
                    onClick={() => dialog.reject()}
                    className="px-3.5 py-2 bg-[#102419] hover:bg-[#102419] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    {dialog.cancelText || translate('common.cancel', language)}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (dialog.type === 'prompt') {
                      handleConfirmPrompt(dialog);
                    } else {
                      dialog.resolve(true);
                    }
                  }}
                  className="px-4 py-2 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  {dialog.confirmText || translate('common.confirm', language)}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
