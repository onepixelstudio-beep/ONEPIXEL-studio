import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { translate, LanguageCode } from '../i18n';

export interface PromptField {
  key: string;
  label: string;
  type: 'text' | 'select';
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface GenericPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: PromptField[];
  confirmText?: string;
  cancelText?: string;
  language?: LanguageCode;
  onConfirm: (values: Record<string, string>) => void;
}

export default function GenericPromptModal({
  isOpen,
  onClose,
  title,
  description,
  fields,
  confirmText,
  cancelText,
  language = 'es',
  onConfirm
}: GenericPromptModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const resolvedConfirmText = confirmText || translate('common.confirm', language);
  const resolvedCancelText = cancelText || translate('common.cancel', language);

  // Initialize and reset values when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
        initial[field.key] = field.defaultValue || '';
      });
      setFormValues(initial);
      setError(null);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG_GENERIC_PROMPT_SUBMIT] handleSubmit called');
    
    // Simple validation: check if required fields are non-empty
    for (const field of fields) {
      if (field.type === 'text' && !formValues[field.key]?.trim()) {
        console.log('[DEBUG_GENERIC_PROMPT_SUBMIT] Field validation failed for', field.key);
        setError(`El campo "${field.label}" no puede estar vacío.`);
        return;
      }
    }

    console.log('[DEBUG_GENERIC_PROMPT_SUBMIT] Validation passed. Calling onConfirm with', formValues);
    onConfirm(formValues);
    console.log('[DEBUG_GENERIC_PROMPT_SUBMIT] onConfirm callback executed. Calling onClose');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" id="generic-prompt-modal-container">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-depth/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative bg-brand-petroleum border border-brand-turquoise/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans"
          id="generic-prompt-modal"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-brand-turquoise/30 flex justify-between items-center bg-brand-petroleum">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white uppercase tracking-wider">{title}</h3>
              {description && (
                <p className="text-xs text-slate-400 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-brand-turquoise/20 text-slate-400 hover:text-white rounded-lg transition"
              id="generic-prompt-modal-close"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            {/* Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {field.label}
                  </label>
                  
                  {field.type === 'text' ? (
                    <input
                      type="text"
                      className="w-full bg-brand-depth border border-brand-turquoise/30 focus:border-brand-sage focus:ring-1 focus:ring-brand-sage rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                      placeholder={field.placeholder}
                      value={formValues[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      autoFocus={fields[0].key === field.key}
                      id={`prompt-field-${field.key}`}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        className="w-full bg-brand-depth border border-brand-turquoise/30 focus:border-brand-sage focus:ring-1 focus:ring-brand-sage rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none appearance-none"
                        value={formValues[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        id={`prompt-field-${field.key}`}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-brand-petroleum">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-4 border-t border-brand-turquoise/30 bg-brand-depth flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 hover:bg-brand-turquoise/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition animate-fade-in"
                id="generic-prompt-modal-cancel"
              >
                {resolvedCancelText}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-sage hover:bg-brand-sage/80 text-slate-900 rounded-xl text-xs font-bold shadow-lg shadow-brand-depth/25 flex items-center gap-1.5 transition"
                id="generic-prompt-modal-confirm"
              >
                <Check className="w-3.5 h-3.5" />
                {resolvedConfirmText}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
