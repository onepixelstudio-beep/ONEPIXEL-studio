import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Check, 
  ChevronRight, 
  Globe, 
  HelpCircle,
  Eye,
  Sparkles,
  Info
} from 'lucide-react';
import { OnePixelLogo } from '../branding';
import { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE, saveLegalConsentRecord } from '../config/LegalConfig';
import { getLegalSections, LegalSection } from '../data/legalContent';
import { translate, LanguageCode } from '../i18n';

interface InitialConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
  currentLanguage?: LanguageCode;
  onChangeLanguage?: (lang: LanguageCode) => void;
}

export const InitialConsentModal: React.FC<InitialConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  currentLanguage = 'es',
  onChangeLanguage
}) => {
  const [agreed, setAgreed] = useState(false);
  const [activeDocView, setActiveDocView] = useState<'summary' | 'terms' | 'privacy'>('summary');
  const [lang, setLang] = useState<LanguageCode>(currentLanguage);

  if (!isOpen) return null;

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
    onChangeLanguage?.(newLang);
  };

  const legalSections = getLegalSections(lang);
  const termsSection = legalSections.find(s => s.id === 'terms');
  const privacySection = legalSections.find(s => s.id === 'privacy');

  const handleAcceptAndContinue = () => {
    if (!agreed) return;
    saveLegalConsentRecord(lang);
    onAccept();
  };

  const languagesList: { code: LanguageCode; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
    { code: 'ja', label: '日本語' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh-CN', label: '简体中文' }
  ];

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300"
      id="initial-legal-consent-modal"
    >
      <div 
        className="bg-[#102419] border border-[#1b3d2b] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Branding Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#1b3d2b] bg-[#0c1c13]/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center p-2 bg-[#102419] border border-[#C8A96A]/30 rounded-xl">
              <OnePixelLogo height={32} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {translate('initialConsent.welcomeTitle', lang) || 'Bienvenido a OnePixel Studio'}
              </h2>
              <span className="text-[11px] text-[#C8A96A] font-medium">
                {translate('initialConsent.welcomeSubtitle', lang) || 'Editor y Suite de Animación Pixel Art Local-First'}
              </span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-[#102419] border border-[#1b3d2b] rounded-xl px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              aria-label="Seleccionar idioma de lectura"
            >
              {languagesList.map(l => (
                <option key={l.code} value={l.code} className="bg-[#102419] text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation for Document Preview */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1b3d2b] bg-[#0c1c13]/40 text-xs">
          <button
            onClick={() => setActiveDocView('summary')}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeDocView === 'summary'
                ? 'border-[#C8A96A] text-white bg-[#102419]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{translate('initialConsent.summaryTab', lang) || 'Resumen de Privacidad'}</span>
          </button>
          <button
            onClick={() => setActiveDocView('terms')}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeDocView === 'terms'
                ? 'border-[#C8A96A] text-white bg-[#102419]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C8A96A]" />
            <span>{translate('initialConsent.viewTermsButton', lang) || 'Ver Términos de Uso'}</span>
          </button>
          <button
            onClick={() => setActiveDocView('privacy')}
            className={`px-3 py-1.5 rounded-t-lg font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeDocView === 'privacy'
                ? 'border-[#C8A96A] text-white bg-[#102419]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{translate('initialConsent.viewPrivacyButton', lang) || 'Ver Política de Privacidad'}</span>
          </button>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-200 text-xs leading-relaxed">
          {activeDocView === 'summary' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-slate-300 font-medium text-xs sm:text-sm leading-relaxed">
                {translate('initialConsent.introText', lang) || 
                 'OnePixel Studio está diseñado para respetar la privacidad del usuario y permitir trabajar con tus proyectos de forma local en tu propio navegador.'}
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <div className="p-3 bg-[#0c1c13] border border-[#1b3d2b] rounded-xl flex items-start gap-3 shadow-inner">
                  <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      {translate('initialConsent.privacyHighlight1Title', lang) || 'Sin Seguimiento ni Perfiles'}
                    </strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {translate('initialConsent.privacyHighlight1', lang) || 
                       'Durante el uso normal, OnePixel Studio no realiza seguimiento publicitario, creación de perfiles ni recopilación rutinaria de información personal.'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0c1c13] border border-[#1b3d2b] rounded-xl flex items-start gap-3 shadow-inner">
                  <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      {translate('initialConsent.privacyHighlight2Title', lang) || 'Tus Proyectos son 100% Locales'}
                    </strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {translate('initialConsent.privacyHighlight2', lang) || 
                       'Tus proyectos, dibujos, imágenes y archivos no se envían automáticamente a OnePixel Studio ni a servidores remotos.'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0c1c13] border border-[#1b3d2b] rounded-xl flex items-start gap-3 shadow-inner">
                  <div className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40 shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      {translate('initialConsent.privacyHighlight3Title', lang) || 'Soporte Técnico Voluntario'}
                    </strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      {translate('initialConsent.privacyHighlight3', lang) || 
                       'Si encuentras un error y utilizas voluntariamente la función "Enviar reporte", se enviará mediante correo electrónico al equipo de soporte la información técnica necesaria para diagnosticar el problema.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#0c1c13]/60 border border-[#1b3d2b]/60 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
                <span>Versión de Documentos: <strong>v{LEGAL_VERSION}</strong></span>
                <span>Vigencia: <strong>{LEGAL_EFFECTIVE_DATE}</strong></span>
              </div>
            </div>
          )}

          {activeDocView === 'terms' && termsSection && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-[#1b3d2b] pb-2">
                <h3 className="text-sm font-bold text-white">{termsSection.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{termsSection.summary}</p>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {termsSection.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {termsSection.bulletPoints && (
                <div className="space-y-2 pt-2">
                  {termsSection.bulletPoints.map((bp, i) => (
                    <div key={i} className="p-2.5 bg-[#0c1c13] rounded-lg border border-[#1b3d2b]">
                      <strong className="text-white block text-xs">{bp.label}</strong>
                      <span className="text-[11px] text-slate-400">{bp.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeDocView === 'privacy' && privacySection && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-[#1b3d2b] pb-2">
                <h3 className="text-sm font-bold text-white">{privacySection.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{privacySection.summary}</p>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {privacySection.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {privacySection.bulletPoints && (
                <div className="space-y-2 pt-2">
                  {privacySection.bulletPoints.map((bp, i) => (
                    <div key={i} className="p-2.5 bg-[#0c1c13] rounded-lg border border-[#1b3d2b]">
                      <strong className="text-white block text-xs">{bp.label}</strong>
                      <span className="text-[11px] text-slate-400">{bp.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consent Checkbox & Action Button Footer */}
        <div className="px-6 py-4 border-t border-[#1b3d2b] bg-[#0c1c13] flex flex-col gap-3">
          
          {/* Mandatory Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-[#1b3d2b] bg-[#102419] text-[#C8A96A] focus:ring-1 focus:ring-[#C8A96A] cursor-pointer accent-[#C8A96A]"
                id="legal-terms-consent-checkbox"
              />
            </div>
            <span className="text-xs text-slate-300 group-hover:text-white transition leading-snug">
              {translate('initialConsent.checkboxLabel', lang) || 
               'He leído y acepto los Términos y condiciones de uso y la Política de privacidad de OnePixel Studio.'}
            </span>
          </label>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              {onDecline && (
                <button
                  type="button"
                  onClick={onDecline}
                  id="legal-decline-and-exit-btn"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-[#1b3d2b] hover:border-rose-900/50 transition cursor-pointer"
                >
                  {translate('common.exit', lang) || 'Salir'}
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                {translate('initialConsent.localOnlyNotice', lang) || 'Persistencia 100% local en tu dispositivo'}
              </span>
            </div>

            <button
              onClick={handleAcceptAndContinue}
              disabled={!agreed}
              id="legal-accept-and-continue-btn"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                agreed
                  ? 'bg-[#C8A96A] hover:bg-[#d9bb7c] text-slate-950 active:scale-95 cursor-pointer font-bold'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 opacity-60'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{translate('initialConsent.acceptButton', lang) || 'Aceptar y continuar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
