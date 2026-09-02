import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { BRAND_COLORS } from './BrandTheme';

export interface SplashProps {
  onComplete?: () => void;
  className?: string;
  duration?: number;
}

export const Splash: React.FC<SplashProps> = ({
  onComplete,
  className = '',
  duration = 1200,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-[#0F3D34] flex flex-col items-center justify-center p-4 select-none cursor-pointer ${className}`}
      onClick={() => onComplete && onComplete()}
      role="region"
      aria-label="Pantalla de inicio OnePixel Studio"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Background Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.4, 0.2], scale: [0.8, 1.2, 1] }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute w-48 h-48 rounded-full bg-[#102419]/30 blur-2xl pointer-events-none"
        />

        {/* Brand Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center justify-center relative z-10 mb-2 max-w-full px-4"
        >
          <Logo height={30} />
        </motion.div>

        {/* Minimal Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-32 h-0.5 bg-[#102419] rounded-full overflow-hidden mt-6 relative z-10"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: (duration - 300) / 1000, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#102419] via-[#C8A96A] to-[#C8A96A]"
          />
        </motion.div>

        <span className="text-[10px] font-mono text-[#C8A96A]/70 mt-2 tracking-widest uppercase relative z-10">
          Cargando Entorno...
        </span>
      </div>
    </div>
  );
};

export default Splash;
