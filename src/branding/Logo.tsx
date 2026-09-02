import React, { useState, useEffect } from 'react';
import { BrandImage } from './BrandImage';
import { getBrandAssetPath, BrandAssetKey, OFFICIAL_ICON_BASE64, OFFICIAL_LOGO_BASE64 } from './BrandAssets';

interface LogoProps {
  height?: number;
  scale?: number;
  theme?: 'color' | 'main' | 'dark' | 'light' | 'white' | 'negative' | 'splash' | 'welcome';
  className?: string;
  isotypeOnly?: boolean;
}

export const OnePixelLogo: React.FC<LogoProps> = ({ 
  height = 20, 
  scale,
  theme = 'color',
  className = '',
  isotypeOnly = false
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleBrandingChange = () => setTick(t => t + 1);
    window.addEventListener('onepixel_branding_updated', handleBrandingChange);
    return () => window.removeEventListener('onepixel_branding_updated', handleBrandingChange);
  }, []);

  // Compute integer scale based on 5px base asset height
  let integerScale = 4; // Default 20px (4x)
  if (typeof scale === 'number' && scale > 0) {
    integerScale = Math.max(1, Math.round(scale));
  } else if (typeof height === 'number' && height > 0) {
    integerScale = Math.max(1, Math.round(height / 5));
  }

  const pixelHeight = integerScale * 5;
  const iconWidth = integerScale * 5;
  const logoWidth = integerScale * 41;

  // Resolve Icon Asset Key
  let isotypeKey: BrandAssetKey = 'isotypeColor';
  if (theme === 'negative') isotypeKey = 'isotypeNegative';
  else if (theme === 'white' || theme === 'light') isotypeKey = 'isotypeWhite';

  // Resolve Logo Asset Key
  let logoKey: BrandAssetKey = 'logoMain';
  if (theme === 'dark') logoKey = 'logoDark';
  else if (theme === 'white' || theme === 'light') logoKey = 'logoLight';
  else if (theme === 'negative') logoKey = 'logoNegative';
  else if (theme === 'splash') logoKey = 'splashLogo';
  else if (theme === 'welcome') logoKey = 'welcomeLogo';

  const iconPath = getBrandAssetPath(isotypeKey) || OFFICIAL_ICON_BASE64;
  const logoPath = getBrandAssetPath(logoKey) || OFFICIAL_LOGO_BASE64;

  if (isotypeOnly) {
    return (
      <BrandImage
        src={iconPath}
        alt="OnePixel Icon"
        style={{
          height: `${pixelHeight}px`,
          width: `${iconWidth}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          imageRendering: 'pixelated'
        }}
        className={className}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center shrink-0 select-none pointer-events-none ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px', // Exact 5 pixel gap as required by official guidelines
        flexShrink: 0,
      }}
    >
      {/* [ICONO] */}
      <BrandImage
        src={iconPath}
        alt="OnePixel Icon"
        style={{
          height: `${pixelHeight}px`,
          width: `${iconWidth}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          imageRendering: 'pixelated'
        }}
      />
      {/* [LOGOTIPO] */}
      <BrandImage
        src={logoPath}
        alt="OnePixel Studio"
        style={{
          height: `${pixelHeight}px`,
          width: `${logoWidth}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};

export const Logo = OnePixelLogo;
export default OnePixelLogo;


