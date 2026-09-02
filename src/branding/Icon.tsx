import React from 'react';
import { getBrandAssetPath, BrandAssetKey, OFFICIAL_ICON_BASE64 } from './BrandAssets';
import { BrandImage } from './BrandImage';

export interface IconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'scale'> {
  scale?: number;
  className?: string;
  variant?: 'color' | 'negative' | 'white' | 'dark' | string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({
  scale = 3,
  className = '',
  variant = 'color',
  style,
  size,
  ...props
}) => {
  let integerScale = Math.max(1, Math.round(typeof scale === 'number' ? scale : 3));
  if (size) {
    const rawSize = typeof size === 'number' ? size : parseFloat(String(size)) || 15;
    integerScale = Math.max(1, Math.round(rawSize / 5));
  }
  const pxSize = `${integerScale * 5}px`;

  const keyMap: Record<string, BrandAssetKey> = {
    color: 'isotypeColor',
    negative: 'isotypeNegative',
    white: 'isotypeWhite',
    dark: 'isotype',
  };
  const assetKey = keyMap[variant] || 'isotypeColor';
  const iconSrc = getBrandAssetPath(assetKey) || OFFICIAL_ICON_BASE64;

  return (
    <BrandImage
      src={iconSrc}
      alt="OnePixel Icon"
      draggable={false}
      className={`shrink-0 select-none pointer-events-none ${className || ''}`}
      style={{
        height: pxSize,
        width: pxSize,
        imageRendering: 'pixelated',
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
};

export default Icon;

