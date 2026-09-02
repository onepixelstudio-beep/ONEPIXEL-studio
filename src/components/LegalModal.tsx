import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Sparkles, 
  Code, 
  AlertCircle, 
  Heart, 
  Mail, 
  X, 
  Search, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Scale
} from 'lucide-react';
import { getLegalSections, THIRD_PARTY_LICENSES, LegalSection, ThirdPartyLicense } from '../data/legalContent';
import { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE, OFFICIAL_LEGAL_EMAIL } from '../config/LegalConfig';
import { translate, LanguageCode } from '../i18n';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  initialTab?: 'terms' | 'privacy' | 'intellectual_property' | 'licenses' | 'disclaimer' | 'donations' | 'contact';
  onOpenDonate?: () => void;
  onOpenSupport?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  language = 'es',
  initialTab = 'terms',
  onOpenDonate,
  onOpenSupport,
  showToast
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState('');

  const sections: LegalSection[] = useMemo(() => {
    return getLegalSections(language);
  }, [language]);

  // Set initial tab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveSectionId(initialTab);
      setSearchQuery('');
      setLicenseSearch('');
      setCopiedSection(false);
    }
  }, [isOpen, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeSection = useMemo(() => {
    return sections.find(s => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  const filteredLicenses: ThirdPartyLicense[] = useMemo(() => {
    if (!licenseSearch.trim()) return THIRD_PARTY_LICENSES;
    const q = licenseSearch.toLowerCase();
    return THIRD_PARTY_LICENSES.filter(
      l => l.name.toLowerCase().includes(q) ||
           l.license.toLowerCase().includes(q) ||
           l.author.toLowerCase().includes(q) ||
           l.purpose.toLowerCase().includes(q)
    );
  }, [licenseSearch]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      s => s.title.toLowerCase().includes(q) ||
           s.summary.toLowerCase().includes(q) ||
           s.category.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const handleCopySectionText = () => {
    if (!activeSection) return;
    const parts = [
      activeSection.title,
      `Versión ${LEGAL_VERSION} - Fecha: ${LEGAL_EFFECTIVE_DATE}`,
      '',
      activeSection.summary,
      '',
      ...activeSection.paragraphs,
      ''
    ];

    if (activeSection.bulletPoints) {
      activeSection.bulletPoints.forEach(bp => {
        parts.push(`• ${bp.label}: ${bp.text}`);
      });
    }

    if (activeSection.id === 'licenses') {
      parts.push('\nLicencias de Terceros y Código Abierto:');
      THIRD_PARTY_LICENSES.forEach(lic => {
        parts.push(`- ${lic.name} (v${lic.version}) [Licencia: ${lic.license}] - Autor: ${lic.author}`);
      });
    }

    navigator.clipboard.writeText(parts.join('\n')).then(() => {
      setCopiedSection(true);
      showToast?.(translate('common.success', language) || 'Copiado al portapapeles', 'success');
      setTimeout(() => setCopiedSection(false), 2000);
    }).catch(() => {
      showToast?.('Error al copiar texto', 'error');
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      id="legal-center-modal"
    >
      <div 
        className="bg-[#102419] border border-[#1b3d2b] rounded-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b3d2b] bg-[#0c1c13]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#102419] border border-[#C8A96A]/30 rounded-xl text-[#C8A96A] shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legal-modal-title" className="text-base font-bold text-white tracking-wide">
                  {translate('legalModal.title', language) || 'Información Legal y Términos'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b3d2b] text-[#C8A96A] border border-[#C8A96A]/20">
                  v{LEGAL_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {translate('legalModal.subtitle', language) || 'Términos de servicio, política de privacidad, licencias y compromisos del software'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySectionText}
              className="px-3 py-1.5 bg-[#102419] hover:bg-[#152e20] border border-[#1b3d2b] rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition active:scale-95"
              title="Copiar texto de la sección activa"
            >
              {copiedSection ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copiedSection ? (translate('legalModal.copied', language) || 'Copiado') : (translate('legalModal.copyText', language) || 'Copiar sección')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-72 bg-[#0c1c13]/50 border-r border-[#1b3d2b] flex flex-col shrink-0">
            {/* Search Filter */}
            <div className="p-3 border-b border-[#1b3d2b]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translate('legalModal.searchPlaceholder', language) || 'Buscar en documentos...'}
                  className="w-full bg-[#102419] border border-[#1b3d2b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A96A]/50 transition"
                />
              </div>
            </div>

            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSections.map((sec) => {
                const isSelected = sec.id === activeSectionId;
                const getIcon = () => {
                  switch (sec.id) {
                    case 'terms': return <FileText className="w-4 h-4 text-[#C8A96A]" />;
                    case 'privacy': return <Lock className="w-4 h-4 text-emerald-400" />;
                    case 'intellectual_property': return <Sparkles className="w-4 h-4 text-amber-400" />;
                    case 'licenses': return <Code className="w-4 h-4 text-sky-400" />;
                    case 'disclaimer': return <AlertCircle className="w-4 h-4 text-rose-400" />;
                    case 'donations': return <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />;
                    case 'contact': return <Mail className="w-4 h-4 text-indigo-400" />;
                    default: return <FileText className="w-4 h-4 text-slate-400" />;
                  }
                };

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between gap-2.5 ${
                      isSelected 
                        ? 'bg-[#1b3d2b] text-white font-semibold border border-[#C8A96A]/40 shadow-sm' 
                        : 'text-slate-300 hover:bg-[#102419] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{getIcon()}</span>
                      <span className="truncate">{sec.title}</span>
                    </div>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Footer Summary Notice */}
            <div className="p-3 border-t border-[#1b3d2b] bg-[#0c1c13] text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>OnePixel Studio Local-First</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Tus archivos y proyectos permanecen 100% en tu dispositivo. No recopilamos obras ni datos privados.
              </p>
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-200">
            {activeSection && (
              <div className="max-w-3xl space-y-6 animate-in fade-in duration-150">
                
                {/* Section Header */}
                <div className="border-b border-[#1b3d2b] pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C8A96A] bg-[#102419] border border-[#1b3d2b] px-2 py-0.5 rounded-md">
                      {activeSection.category}
                    </span>
                    {activeSection.badge && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                        {activeSection.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {activeSection.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed italic">
                    {activeSection.summary}
                  </p>
                </div>

                {/* Paragraphs */}
                <div className="space-y-3.5 text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
                  {activeSection.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Bullet Points */}
                {activeSection.bulletPoints && activeSection.bulletPoints.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {activeSection.bulletPoints.map((bp, idx) => (
                      <div 
                        key={idx}
                        className="bg-[#0c1c13] border border-[#1b3d2b] rounded-xl p-3.5 text-xs flex gap-3 items-start shadow-inner"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-white block mb-0.5">{bp.label}</strong>
                          <span className="text-slate-300 leading-relaxed">{bp.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subsections */}
                {activeSection.subsections && (
                  <div className="space-y-4 pt-2">
                    {activeSection.subsections.map((sub, idx) => (
                      <div key={idx} className="bg-[#102419]/70 border border-[#1b3d2b] rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-[#C8A96A] uppercase tracking-wider">{sub.title}</h4>
                        {sub.content.map((txt, cIdx) => (
                          <p key={cIdx} className="text-xs text-slate-300 leading-relaxed">{txt}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Open Source Licenses Table (Only for 'licenses' section) */}
                {activeSection.id === 'licenses' && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Bibliotecas y Componentes Open Source ({THIRD_PARTY_LICENSES.length})
                      </h4>
                      <input 
                        type="text"
                        value={licenseSearch}
                        onChange={(e) => setLicenseSearch(e.target.value)}
                        placeholder="Filtrar bibliotecas..."
                        className="bg-[#0c1c13] border border-[#1b3d2b] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A96A]/50 w-48"
                      />
                    </div>

                    <div className="border border-[#1b3d2b] rounded-xl overflow-hidden bg-[#0c1c13]">
                      <div className="divide-y divide-[#1b3d2b] max-h-96 overflow-y-auto">
                        {filteredLicenses.map((lic, idx) => (
                          <div key={idx} className="p-3.5 hover:bg-[#102419] transition text-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">{lic.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{lic.version}</span>
                              </div>
                              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1b3d2b] text-[#C8A96A] border border-[#C8A96A]/20">
                                {lic.license}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{lic.purpose}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span>Autor / Mantenedor: {lic.author}</span>
                              {lic.url && (
                                <a 
                                  href={lic.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#C8A96A] hover:underline flex items-center gap-1"
                                >
                                  <span>Sitio oficial</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick actions for Contact & Donations */}
                {activeSection.id === 'contact' && (
                  <div className="bg-[#0c1c13] border border-indigo-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-bold text-indigo-300">¿Deseas enviar un reporte de error técnico?</span>
                      <p className="text-[11px] text-slate-400">Puedes usar la herramienta integrada para recopilar información de diagnóstico segura.</p>
                    </div>
                    <button
                      onClick={() => { onClose(); onOpenSupport?.(); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Abrir formulario de reporte</span>
                    </button>
                  </div>
                )}

                {activeSection.id === 'donations' && (
                  <div className="bg-[#0c1c13] border border-rose-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-bold text-rose-300">Apoya el desarrollo de OnePixel Studio</span>
                      <p className="text-[11px] text-slate-400">Las aportaciones voluntarias nos ayudan a seguir mejorando las herramientas sin publicidad.</p>
                    </div>
                    <button
                      onClick={() => { onClose(); onOpenDonate?.(); }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 active:scale-95 shadow-sm"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>Realizar donación vía PayPal</span>
                    </button>
                  </div>
                )}

                {/* Document Metadata Footer */}
                <div className="pt-6 border-t border-[#1b3d2b] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                  <span>Versión Oficial: v{LEGAL_VERSION}</span>
                  <span>Fecha de Entrada en Vigor: {LEGAL_EFFECTIVE_DATE}</span>
                  <span>Contacto: {OFFICIAL_LEGAL_EMAIL}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1b3d2b] bg-[#0c1c13] flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {translate('legalModal.versionLabel', language) || 'Documentación Legal Oficial de OnePixel Studio'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#102419] hover:bg-[#152e20] border border-[#1b3d2b] rounded-xl text-xs font-bold text-white transition active:scale-95"
          >
            {translate('common.close', language) || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
