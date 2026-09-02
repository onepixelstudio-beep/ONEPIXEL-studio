/**
 * BrandTheme.ts - Official Design Tokens & Palette for OnePixel Studio
 * Pure TypeScript constants - Zero React dependencies or state.
 */

export const BRAND_COLORS = {
  // 60-30-10 Emerald & Cream System Architecture
  // 60% Dominant Base (Canvas wrapper, main viewport, header & timeline - Dark Emerald)
  bgDominant: '#0F3D34',
  abyssal: '#0F3D34',

  // 30% Secondary Surface (Toolbars, side panels, cards, dialogs & modals - Deep Forest Green)
  surfaceSecondary: '#102419',
  deep: '#102419',
  petroleum: '#102419',

  // Deep Forest Green for inputs & container fills
  gunmetal: '#102419',

  // 10% Vibrant Accents (Active tool states, selections & primary CTA - Gold/Brass)
  accentVibrant: '#C8A96A',  // Gold/Brass
  sand: '#C8A96A',           // Gold
  sage: '#C8A96A',           // Active Accent
  depth: '#C8A96A',          // Primary Accent Border

  // Neutral Accents & Text (Warm Cream & Minty Cream)
  mint: '#E6F0E9',
  monoDark: '#0F3D34',
  monoLight: '#F7F6F1',

  // Functional Borders
  border: '#102419',         // Deep Forest Green borders
  borderSubtle: '#F7F6F11A',
} as const;

export const BRAND_FONTS = {
  pixel: "'Press Start 2P', monospace",
  sans: "'Quicksand', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const BRAND_SIZES = {
  logoHeights: {
    xs: 10,  // 2x grid scale (94x10 px)
    sm: 15,  // 3x grid scale (141x15 px)
    md: 20,  // 4x grid scale (188x20 px)
    lg: 25,  // 5x grid scale (235x25 px)
    xl: 30,  // 6x grid scale (282x30 px)
  },
  iconSizes: {
    xs: 10,
    sm: 15,
    md: 20,
    lg: 25,
    xl: 30,
  },
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;
