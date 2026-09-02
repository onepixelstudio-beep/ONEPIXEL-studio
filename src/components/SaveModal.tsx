import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Image, HardDrive, Cloud, AlertCircle } from 'lucide-react';
import { PixelProject } from '../types';
import { translate, LanguageCode } from '../i18n';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PixelProject;
  defaultDestination?: 'local' | 'cloud';
  isLoggedIn: boolean;
  language?: LanguageCode;
  onGoogleSignIn: () => Promise<void>;
  onConfirmSave: (
    fileName: string,
    format: 'onepixel' | 'pdf' | 'png',
    destination: 'local' | 'cloud'
  ) => Promise<void>;
}

export default function SaveModal({
  isOpen,
  onClose,
  project,
  defaultDestination = 'local',
  isLoggedIn,
  language = 'es',
  onGoogleSignIn,
  onConfirmSave
}: SaveModalProps) {
  const [fileName, setFileName] = useState(project.name || translate('headerMenu.untitled', language));
  const [format, setFormat] = useState<'onepixel' | 'pdf' | 'png'>('onepixel');
  const [destination, setDestination] = useState<'local' | 'cloud'>(defaultDestination);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName(project.name || translate('headerMenu.untitled', language));
      setDestination(defaultDestination);
      setError(null);
    }
  }, [isOpen, project, defaultDestination, language]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!fileName.trim()) {
      setError(translate('saveModal.enterFileNameError', language));
      return;
    }
    if (destination === 'cloud' && !isLoggedIn) {
      setError(translate('saveModal.loginRequiredError', language));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onConfirmSave(fileName.trim(), format, destination);
      onClose();
    } catch (err: any) {
      setError(err?.message || translate('saveModal.genericError', language));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" id="save-modal-container">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0F3D34]/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-[#102419] border border-[#102419] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans" id="save-modal">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#102419] flex justify-between items-center bg-[#102419]">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-[#C8A96A]" />
            <h3 className="font-bold text-sm tracking-tight text-slate-100">{translate('saveModal.title', language)}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#102419] text-slate-400 hover:text-white rounded-lg transition"
            disabled={isSaving}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[70vh] no-scrollbar">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-xl flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. File Name Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {translate('saveModal.fileName', language)}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-[#102419]/50 border border-[#102419] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#C8A96A] transition-colors"
              placeholder={translate('saveModal.fileNamePlaceholder', language)}
              disabled={isSaving}
            />
          </div>

          {/* 2. Format Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {translate('saveModal.saveFormat', language)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Onepixel */}
              <button
                type="button"
                onClick={() => setFormat('onepixel')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                  format === 'onepixel'
                    ? 'border-[#C8A96A] bg-[#102419] text-[#C8A96A]'
                    : 'border-[#102419] bg-[#102419]/40 hover:bg-[#102419] text-slate-400'
                }`}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold block leading-tight">.onepixel</span>
                <span className="text-[8px] opacity-75 block leading-none">{translate('saveModal.formatProject', language)}</span>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                  format === 'pdf'
                    ? 'border-[#C8A96A] bg-[#102419] text-[#C8A96A]'
                    : 'border-[#102419] bg-[#102419]/40 hover:bg-[#102419] text-slate-400'
                }`}
                disabled={isSaving}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold block leading-tight">.pdf</span>
                <span className="text-[8px] opacity-75 block leading-none">{translate('saveModal.formatDocument', language)}</span>
              </button>

              {/* PNG */}
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                  format === 'png'
                    ? 'border-[#C8A96A] bg-[#102419] text-[#C8A96A]'
                    : 'border-[#102419] bg-[#102419]/40 hover:bg-[#102419] text-slate-400'
                }`}
                disabled={isSaving}
              >
                <Image className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold block leading-tight">.png</span>
                <span className="text-[8px] opacity-75 block leading-none">{translate('saveModal.formatImage', language)}</span>
              </button>
            </div>
          </div>

          {/* 3. Destination Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {translate('saveModal.destination', language)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Local */}
              <button
                type="button"
                onClick={() => setDestination('local')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 transition ${
                  destination === 'local'
                    ? 'border-[#C8A96A] bg-[#102419] text-[#C8A96A]'
                    : 'border-[#102419] bg-[#102419]/40 hover:bg-[#102419] text-slate-400'
                }`}
                disabled={isSaving}
              >
                <HardDrive className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold">{translate('saveModal.localDisk', language)}</span>
              </button>

              {/* Cloud / Google Drive */}
              <button
                type="button"
                onClick={() => setDestination('cloud')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 transition ${
                  destination === 'cloud'
                    ? 'border-[#C8A96A] bg-[#102419] text-[#C8A96A]'
                    : 'border-[#102419] bg-[#102419]/40 hover:bg-[#102419] text-slate-400'
                }`}
                disabled={isSaving}
              >
                <Cloud className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold">{translate('saveModal.googleDrive', language)}</span>
              </button>
            </div>
          </div>

          {/* Google Sign In Banner if destination is cloud and not logged in */}
          {destination === 'cloud' && !isLoggedIn && (
            <div className="bg-[#102419] border border-[#102419] p-4 rounded-xl space-y-3">
              <span className="text-[10px] text-slate-300 leading-relaxed block">
                {translate('saveModal.driveNotice', language)}
              </span>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="gsi-material-button w-full"
                id="gsi-drive-login-btn"
                disabled={isSaving}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-bold text-xs">{translate('saveModal.linkGoogle', language)}</span>
                </div>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#102419] bg-[#102419] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#102419] hover:bg-[#102419] text-slate-300 font-bold rounded-xl text-xs transition"
            disabled={isSaving}
          >
            {translate('common.cancel', language)}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (destination === 'cloud' && !isLoggedIn)}
            className="px-4 py-2 bg-[#102419] hover:bg-[#C8A96A] hover:text-[#0F3D34] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                <span>{translate('saveModal.saving', language)}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{translate('saveModal.save', language)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
