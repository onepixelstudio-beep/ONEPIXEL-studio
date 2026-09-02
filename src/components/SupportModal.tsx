import React, { useState, useEffect, useMemo } from 'react';
import { 
  LifeBuoy, X, Send, Copy, Download, Check, ChevronDown, ChevronUp, 
  AlertCircle, ShieldCheck, Mail, Info, FileText, Cpu, CheckCircle2,
  ExternalLink, Loader2
} from 'lucide-react';
import { PixelProject } from '../types';
import { translate, LanguageCode } from '../i18n';
import { 
  IssueCategory, 
  SupportFormData, 
  collectSanitizedTechnicalInfo, 
  generatePlainTextReport, 
  generateTechnicalJSON, 
  generateMailtoUrl, 
  copyToClipboardWithFallback, 
  downloadSupportReportFile,
  submitSupportReportToEndpoint,
  SanitizedTechnicalReport
} from '../utils/supportReport';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  project?: PixelProject | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  language = 'es',
  project,
  showToast
}) => {
  const [issueType, setIssueType] = useState<IssueCategory>('tool_error');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [includeTechnicalInfo, setIncludeTechnicalInfo] = useState(true);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Collect live technical diagnostic information whenever modal opens
  const technicalInfo: SanitizedTechnicalReport = useMemo(() => {
    if (!isOpen) return collectSanitizedTechnicalInfo(null);
    return collectSanitizedTechnicalInfo(project);
  }, [isOpen, project]);

  // Reset internal state on opening
  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setDescription('');
      setContactEmail('');
      setIncludeTechnicalInfo(true);
      setShowTechDetails(false);
      setCopied(false);
      setValidationError(null);
      setIsSubmitting(false);
      setSubmittedTrackingId(null);
      setSubmissionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryOptions: { key: IssueCategory; labelKey: string }[] = [
    { key: 'tool_error', labelKey: 'supportReport.typeToolError' },
    { key: 'drawing_issue', labelKey: 'supportReport.typeDrawing' },
    { key: 'animation_issue', labelKey: 'supportReport.typeAnimation' },
    { key: 'import_export_issue', labelKey: 'supportReport.typeImportExport' },
    { key: 'performance_issue', labelKey: 'supportReport.typePerformance' },
    { key: 'ui_visual_issue', labelKey: 'supportReport.typeUIVisual' },
    { key: 'other', labelKey: 'supportReport.typeOther' }
  ];

  const currentCategoryLabel = translate(
    categoryOptions.find(o => o.key === issueType)?.labelKey || 'supportReport.typeOther',
    language
  );

  const validateForm = (): boolean => {
    if (!subject.trim() || !description.trim()) {
      const errorMsg = translate('supportReport.requiredFieldsError', language);
      setValidationError(errorMsg);
      showToast?.(errorMsg, 'error');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const getFormData = (): SupportFormData => ({
    issueType,
    subject: subject.trim(),
    description: description.trim(),
    contactEmail: contactEmail.trim() || undefined,
    includeTechnicalInfo
  });

  const handleDirectSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    const formData = getFormData();
    const result = await submitSupportReportToEndpoint(
      formData,
      includeTechnicalInfo ? technicalInfo : null,
      currentCategoryLabel
    );

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedTrackingId(result.trackingId || 'OP-REGISTERED');
      const successMsg = translate('supportReport.sendSuccess', language);
      showToast?.(successMsg, 'success');
    } else {
      setSubmissionError(result.error || translate('supportReport.sendErrorNote', language));
    }
  };

  const handleSendEmail = () => {
    if (!validateForm()) return;

    try {
      const formData = getFormData();
      const mailtoUrl = generateMailtoUrl(
        formData, 
        includeTechnicalInfo ? technicalInfo : null, 
        currentCategoryLabel
      );

      // Attempt to open email client safely
      window.location.href = mailtoUrl;
      
      const successMsg = translate('supportReport.emailPrepared', language);
      showToast?.(successMsg, 'success');
    } catch (e) {
      console.error('Failed to trigger mailto client:', e);
      const errorMsg = translate('supportReport.emailOpenError', language);
      showToast?.(errorMsg, 'error');
    }
  };

  const handleCopyReport = async () => {
    if (!validateForm()) return;

    const formData = getFormData();
    const plainText = generatePlainTextReport(
      formData, 
      includeTechnicalInfo ? technicalInfo : null, 
      currentCategoryLabel
    );

    const success = await copyToClipboardWithFallback(plainText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      const successMsg = translate('supportReport.copySuccess', language);
      showToast?.(successMsg, 'success');
    } else {
      showToast?.('No se pudo copiar automáticamente. Puedes seleccionar y copiar el texto.', 'error');
    }
  };

  const handleDownloadJSON = () => {
    if (!validateForm()) return;

    const formData = getFormData();
    const jsonStr = generateTechnicalJSON(
      formData, 
      includeTechnicalInfo ? technicalInfo : null, 
      currentCategoryLabel
    );

    downloadSupportReportFile(jsonStr);
    const successMsg = translate('supportReport.downloadSuccess', language);
    showToast?.(successMsg, 'success');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200"
      id="support-report-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div 
        className="bg-[#102419] border border-[#102419]/90 rounded-2xl w-full max-w-xl text-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        id="support-report-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#102419]/80 bg-[#0F3D34]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D34] border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A] shadow-inner">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="support-modal-title" className="text-sm sm:text-base font-bold text-white tracking-wide">
                {translate('supportReport.modalTitle', language)}
              </h2>
              <p className="text-[11px] text-slate-400">
                {translate('supportReport.modalSubtitle', language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102419] transition cursor-pointer touch-manipulation"
            aria-label={translate('common.close', language)}
            id="close-support-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Successful Submission View */}
        {submittedTrackingId ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold text-white">
                {translate('supportReport.sendSuccess', language)}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {translate('supportReport.sendSuccessNote', language).replace('{id}', submittedTrackingId)}
              </p>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl font-mono text-xs text-amber-400 select-all">
              ID: {submittedTrackingId}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-md"
            >
              {translate('common.close', language)}
            </button>
          </div>
        ) : (
          /* Scrollable Form Body */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
            {validationError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 flex items-center gap-2 text-[11px] animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {submissionError && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 space-y-1.5 text-[11px] animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{translate('supportReport.sendErrorNote', language)}</span>
                </div>
                <p className="text-[10px] text-amber-300/80">
                  {submissionError}
                </p>
              </div>
            )}

            {/* Issue Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="support-issue-type">
                <span>{translate('supportReport.issueTypeLabel', language)}</span>
                <span className="text-[#C8A96A]">*</span>
              </label>
              <select
                id="support-issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueCategory)}
                className="w-full py-2 px-3 bg-[#102419] border border-[#102419] rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#C8A96A] transition cursor-pointer"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.key} value={opt.key} className="bg-[#102419] text-slate-200">
                    {translate(opt.labelKey, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="support-subject-input">
                <span>{translate('supportReport.subjectLabel', language)}</span>
                <span className="text-[#C8A96A]">*</span>
              </label>
              <input
                id="support-subject-input"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={translate('supportReport.subjectPlaceholder', language)}
                className="w-full py-2 px-3 bg-[#102419] border border-[#102419] rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C8A96A] transition"
                maxLength={120}
              />
            </div>

            {/* Description Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5" htmlFor="support-description-input">
                <span>{translate('supportReport.descriptionLabel', language)}</span>
                <span className="text-[#C8A96A]">*</span>
              </label>
              <textarea
                id="support-description-input"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={translate('supportReport.descriptionPlaceholder', language)}
                className="w-full p-3 bg-[#102419] border border-[#102419] rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C8A96A] resize-none leading-relaxed transition"
                maxLength={3000}
              />
            </div>

            {/* Optional Contact Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5" htmlFor="support-email-input">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{translate('supportReport.emailLabel', language)}</span>
              </label>
              <input
                id="support-email-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={translate('supportReport.emailPlaceholder', language)}
                className="w-full py-2 px-3 bg-[#102419] border border-[#102419] rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#C8A96A] transition"
              />
            </div>

            {/* Technical Diagnostics Section */}
            <div className="pt-2 border-t border-[#102419]/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeTechnicalInfo}
                    onChange={(e) => setIncludeTechnicalInfo(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#102419] text-[#C8A96A] focus:ring-0 cursor-pointer accent-[#C8A96A]"
                    id="include-tech-info-checkbox"
                  />
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{translate('supportReport.includeTechInfoLabel', language)}</span>
                </label>

                {includeTechnicalInfo && (
                  <button
                    type="button"
                    onClick={() => setShowTechDetails(!showTechDetails)}
                    className="text-[11px] text-[#C8A96A] hover:text-white flex items-center gap-1 font-medium cursor-pointer transition touch-manipulation"
                    id="toggle-tech-details-btn"
                  >
                    <span>{showTechDetails ? translate('supportReport.hideTechInfo', language) : translate('supportReport.viewTechInfo', language)}</span>
                    {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Collapsible Technical Details Viewer */}
              {includeTechnicalInfo && showTechDetails && (
                <div className="p-3 bg-[#102419] border border-[#102419] rounded-xl space-y-2 text-[11px] text-slate-300 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Versión:</span> {technicalInfo.appName} v{technicalInfo.appVersion}
                    </div>
                    <div>
                      <span className="text-slate-500">Plataforma:</span> {technicalInfo.environment.platform}
                    </div>
                    <div>
                      <span className="text-slate-500">Lienzo:</span> {technicalInfo.canvas.canvasDimensions}
                    </div>
                    <div>
                      <span className="text-slate-500">Capas / Frames:</span> {technicalInfo.canvas.layersCount} / {technicalInfo.canvas.framesCount}
                    </div>
                    <div>
                      <span className="text-slate-500">Herramienta:</span> {technicalInfo.editorState.activeTool}
                    </div>
                    <div>
                      <span className="text-slate-500">Zoom:</span> {technicalInfo.editorState.zoomLevel}%
                    </div>
                    <div>
                      <span className="text-slate-500">Historial:</span> {technicalInfo.editorState.undoStepsAvailable} deshacer / {technicalInfo.editorState.redoStepsAvailable} rehacer
                    </div>
                    <div>
                      <span className="text-slate-500">Pantalla:</span> {technicalInfo.environment.screen ? `${technicalInfo.environment.screen.width}x${technicalInfo.environment.screen.height}` : 'N/A'}
                    </div>
                  </div>

                  {technicalInfo.recentActionsSummary.length > 0 && (
                    <div className="pt-2 border-t border-[#102419]/80">
                      <span className="text-slate-500 font-medium block mb-1">Últimos eventos registrados:</span>
                      <div className="max-h-20 overflow-y-auto space-y-0.5 text-[10px] text-slate-400 font-mono scrollbar-thin bg-[#102419]/60 p-1.5 rounded-lg">
                        {technicalInfo.recentActionsSummary.map((item, idx) => (
                          <div key={idx} className="truncate">
                            • [{item.category}] {item.action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy Badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-[#0F3D34]/20 border border-[#0F3D34]/30 px-2.5 py-1.5 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{translate('supportReport.privacyNotice', language)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!submittedTrackingId && (
          <div className="p-4 border-t border-[#102419]/80 bg-[#0F3D34]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              {/* Copy Report Button */}
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 sm:flex-initial py-2 px-3 bg-[#102419] hover:bg-[#152e20] border border-[#102419] rounded-xl text-slate-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                id="copy-support-report-btn"
                title={translate('supportReport.copyReport', language)}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? '¡Copiado!' : translate('supportReport.copyReport', language)}</span>
              </button>

              {/* Download JSON Button */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="flex-1 sm:flex-initial py-2 px-3 bg-[#102419] hover:bg-[#152e20] border border-[#102419] rounded-xl text-slate-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                id="download-support-report-btn"
                title={translate('supportReport.downloadJson', language)}
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">{translate('supportReport.downloadJson', language)}</span>
                <span className="sm:hidden">JSON</span>
              </button>

              {/* Mailto Fallback Button */}
              <button
                type="button"
                onClick={handleSendEmail}
                className="flex-1 sm:flex-initial py-2 px-3 bg-[#102419] hover:bg-[#152e20] border border-[#102419] rounded-xl text-slate-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                id="fallback-mailto-btn"
                title={translate('supportReport.fallbackMailto', language)}
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Mailto</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 bg-transparent hover:bg-[#102419] rounded-xl text-slate-400 hover:text-slate-200 font-semibold text-xs transition cursor-pointer touch-manipulation"
                id="cancel-support-modal-btn"
              >
                {translate('common.cancel', language)}
              </button>

              {/* Submit Report Button */}
              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={isSubmitting}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                id="send-support-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{translate('supportReport.sending', language)}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{translate('supportReport.sendReportBtn', language)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

