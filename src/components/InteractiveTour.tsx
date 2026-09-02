import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle, 
  Keyboard, 
  Compass, 
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { getTourSteps, TourStep } from '../data/helpContent';
import { LanguageCode } from '../i18n/types';
import { translate } from '../i18n';

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onOpenManual?: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  language = 'es',
  onOpenManual
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const steps: TourStep[] = getTourSteps(language);
  const currentStep = steps[currentStepIndex] || steps[0];
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close and completely reset state
  const handleClose = useCallback(() => {
    setCurrentStepIndex(0);
    setTargetRect(null);
    onClose();
  }, [onClose]);

  // Always reset tour to step 0 and clear cached rect whenever isOpen changes to true
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setTargetRect(null);
    }
  }, [isOpen]);

  // Update target element bounding rectangle
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;
    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      // Ensure the element is somewhat visible
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        return;
      }
    }
    setTargetRect(null);
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      const handleResize = () => updateTargetRect();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, handleClose]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  // Determine popup card position relative to target or center screen
  let cardStyle: React.CSSProperties = {};
  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;

    const cardWidth = Math.min(460, window.innerWidth - 32);
    
    // Position below if space permits, else above or centered
    if (spaceBelow > 320) {
      cardStyle = {
        top: `${Math.min(targetRect.bottom + 16, window.innerHeight - 340)}px`,
        left: `${Math.max(16, Math.min(targetRect.left, window.innerWidth - cardWidth - 16))}px`,
        width: `${cardWidth}px`
      };
    } else if (spaceAbove > 320) {
      cardStyle = {
        bottom: `${Math.max(16, window.innerHeight - targetRect.top + 16)}px`,
        left: `${Math.max(16, Math.min(targetRect.left, window.innerWidth - cardWidth - 16))}px`,
        width: `${cardWidth}px`
      };
    } else if (spaceRight > cardWidth + 24) {
      cardStyle = {
        top: `${Math.max(16, Math.min(targetRect.top, window.innerHeight - 340))}px`,
        left: `${targetRect.right + 16}px`,
        width: `${cardWidth}px`
      };
    } else if (spaceLeft > cardWidth + 24) {
      cardStyle = {
        top: `${Math.max(16, Math.min(targetRect.top, window.innerHeight - 340))}px`,
        right: `${window.innerWidth - targetRect.left + 16}px`,
        width: `${cardWidth}px`
      };
    } else {
      // Centered fallback
      cardStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${cardWidth}px`
      };
    }
  } else {
    // Default center screen
    cardStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${Math.min(460, window.innerWidth - 32)}px`
    };
  }

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[99999] pointer-events-auto select-none font-sans"
      id="interactive-tour-overlay"
    >
      {/* Background backdrop with cutout highlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 12, 10, 0.78)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Glowing spotlight border around the target */}
      {targetRect && (
        <div
          className="absolute border-2 border-[#C8A96A] rounded-xl pointer-events-none transition-all duration-300 shadow-[0_0_24px_rgba(200,169,106,0.35)] animate-pulse"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        />
      )}

      {/* Tour Dialogue Card */}
      <div 
        className="absolute bg-[#102419] border border-[#C8A96A]/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 md:p-6 text-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
        style={cardStyle}
      >
        {/* Header with Icon, Badge & Exit */}
        <div className="flex items-center justify-between gap-3 border-b border-[#0F3D34] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D34] border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shadow-inner shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C8A96A] block">
                {currentStep.badge}
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0F3D34] rounded-lg transition"
            title="Salir del recorrido (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description & Key Features */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-slate-200">
            {currentStep.description}
          </p>

          {currentStep.features && currentStep.features.length > 0 && (
            <div className="bg-[#0F3D34]/60 border border-[#0F3D34] rounded-xl p-3 space-y-2">
              {currentStep.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-[#C8A96A] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          {currentStep.shortcutTip && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-[#08120d] px-3 py-1.5 rounded-lg border border-[#0F3D34]">
              <Keyboard className="w-3.5 h-3.5 text-[#C8A96A]" />
              <span>{currentStep.shortcutTip}</span>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#0F3D34] gap-2 mt-1">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentStepIndex 
                    ? 'w-6 bg-[#C8A96A]' 
                    : idx < currentStepIndex
                    ? 'w-2 bg-[#0F3D34]'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-[#0F3D34] hover:border-[#C8A96A]/40 bg-[#0F3D34]/50 hover:bg-[#0F3D34] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={() => {
                  handleClose();
                  if (onOpenManual) onOpenManual();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#C8A96A] hover:bg-[#b59659] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Finalizar y Abrir Manual</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-[#C8A96A] hover:bg-[#b59659] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
