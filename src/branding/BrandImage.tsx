import React from 'react';

export interface BrandImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * BrandImage - Centralized Image component for official graphic assets.
 * Enforces `referrerPolicy="no-referrer"` to guarantee reliable asset loading
 * across sandboxed, embedded iframe, and cross-origin Cloud Run environments (Google AI Studio).
 */
export const BrandImage: React.FC<BrandImageProps> = ({
  src,
  alt,
  className = '',
  style,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      style={{
        imageRendering: 'pixelated',
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
      {...props}
    />
  );
};

export default BrandImage;
