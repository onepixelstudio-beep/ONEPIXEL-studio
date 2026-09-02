import React, { useState, useEffect } from 'react';
import { Heart, ExternalLink, Copy, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import { DONATION_URL } from '../config/DonationConfig';
import { LanguageCode } from '../i18n';
import { translate } from '../i18n';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  language = 'es',
  showToast
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = (key: string, fallback: string) => {
    return translate(key, language) || fallback;
  };

  const handleOpenPayPal = () => {
    try {
      if (typeof window !== 'undefined') {
        window.open(DONATION_URL, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn('[DonationModal] Could not open PayPal URL:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(DONATION_URL);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = DONATION_URL;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      const msg = t('donationModal.linkCopied', '¡Enlace de donación copiado al portapapeles!');
      showToast?.(msg, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('[DonationModal] Error copying link:', err);
    }
  };

  return (
    <div 
      id="donation-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      <div 
        id="donation-modal-container"
        className="w-full max-w-lg bg-[#111e17] border border-[#1b3d2b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1b3d2b] flex items-center justify-between bg-[#0b1610]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Heart className="w-5 h-5 fill-rose-500/30" />
            </div>
            <div>
              <h2 id="donation-modal-title" className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                {t('donationModal.title', 'Apoyar OnePixel Studio')}
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#0079C1]/20 text-[#0079C1] border border-[#0079C1]/40 rounded-md">
                  PayPal
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t('donationModal.subtitle', 'Impulsa el desarrollo de herramientas libres y profesionales para pixel art')}
              </p>
            </div>
          </div>
          <button
            id="donation-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#152e20] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('donationModal.close', 'Cerrar')}
            aria-label={t('donationModal.close', 'Cerrar')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Main Statement */}
          <div className="p-4 rounded-xl bg-[#0b1610] border border-[#1b3d2b] text-zinc-300 leading-relaxed text-xs sm:text-sm">
            <p>
              {t('donationModal.description', 'OnePixel Studio es un proyecto 100% gratuito y sin anuncios creado con pasión para artistas independientes y desarrolladores de videojuegos.')}
            </p>
          </div>

          {/* Why Donate Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {t('donationModal.whyDonateTitle', '¿Por qué apoyar el proyecto?')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('donationModal.whyDonateText', 'Tus aportes ayudan a mantener la infraestructura, desarrollar nuevas herramientas de animación y exportación, y garantizar que la plataforma siga siendo accesible para toda la comunidad.')}
            </p>
          </div>

          {/* Destination Link Box */}
          <div className="p-3.5 rounded-xl bg-[#08100b] border border-[#1b3d2b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">Cuenta oficial de PayPal</span>
              <a 
                href={DONATION_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline truncate block select-all"
              >
                {DONATION_URL}
              </a>
            </div>
            <button
              id="donation-modal-copy-btn"
              onClick={handleCopyLink}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#152e20] hover:bg-[#1c3d2a] text-zinc-200 border border-[#1b3d2b] flex items-center justify-center gap-1.5 shrink-0 transition-colors min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('donationModal.copyDonationLink', 'Copiar enlace de donación')}</span>
                </>
              )}
            </button>
          </div>

          {/* Security & Privacy guarantee */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t('donationModal.secureNotice', 'Las donaciones se procesan de forma 100% segura directamente en la plataforma oficial de PayPal.')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1b3d2b] bg-[#0b1610] flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            id="donation-modal-cancel-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#152e20] rounded-xl transition-colors order-2 sm:order-1 min-h-[44px] flex items-center justify-center"
          >
            {t('donationModal.close', 'Cerrar')}
          </button>
          <a
            id="donation-modal-proceed-btn"
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenPayPal}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#0070BA] hover:bg-[#005ea6] active:bg-[#004c87] rounded-xl shadow-lg shadow-[#0070BA]/20 flex items-center justify-center gap-2 transition-all order-1 sm:order-2 min-h-[44px]"
          >
            <span>{t('donationModal.donateWithPayPal', 'Donar con PayPal')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
