import React from 'react';
import { Plus, FolderOpen, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { OnePixelLogo } from '../branding';
import { translate, LanguageCode } from '../i18n';

interface EmptyWorkspaceProps {
  onNewProject?: () => void;
  onOpenWelcome?: () => void;
  onCreateDefault?: () => void;
  title?: string;
  description?: string;
  language?: LanguageCode;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  onNewProject,
  onOpenWelcome,
  onCreateDefault,
  title,
  description,
  language = 'es'
}) => {
  const displayTitle = title || translate('emptyWorkspace.waitingCanvas', language);
  const displayDesc = description || translate('emptyWorkspace.noActiveProject', language);

  return (
    <div className="w-full h-full flex-1 min-h-[300px] bg-[#091E19] border border-[#0F3D34] rounded-2xl flex flex-col items-center justify-center p-6 text-slate-200 relative overflow-hidden shadow-2xl select-none">
      
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#0F3D34]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#102419]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Badge */}
      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        <div className="p-4 bg-[#0F3D34] border border-[#0F3D34] rounded-2xl inline-flex items-center justify-center shadow-xl mb-4">
          <OnePixelLogo height={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102419] border border-[#C8A96A]/40 text-[#C8A96A] text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {translate('emptyWorkspace.resilientSpace', language)}
        </div>

        <h3 className="text-lg font-bold text-slate-100 font-sans mb-1">
          {displayTitle}
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-6">
          {displayDesc}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {onNewProject && (
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A] text-xs font-semibold text-amber-200 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C8A96A]" />
              {translate('emptyWorkspace.newProject', language)}
            </button>
          )}

          {onOpenWelcome && (
            <button
              onClick={onOpenWelcome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102419] hover:bg-[#0F3D34] border border-[#0F3D34] text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              {translate('emptyWorkspace.viewSavedProjects', language)}
            </button>
          )}

          {onCreateDefault && (
            <button
              onClick={onCreateDefault}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102419]/70 hover:bg-[#102419] border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              {translate('emptyWorkspace.restoreDefault', language)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyWorkspace;
