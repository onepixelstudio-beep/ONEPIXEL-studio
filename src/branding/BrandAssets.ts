/**
 * BrandAssets.ts - Official Graphic Assets for OnePixel Studio
 * Single Source of Truth for branding resources.
 * Supports custom official logo overrides via localStorage or file uploads,
 * as well as complete Branding Config Export and Import (JSON).
 */

export const OFFICIAL_ICON_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAJElEQVQYV2P8////fwY0wAgTPD2HDyxlmvKJAb8gsglwlciCABuUGfLIVCtFAAAAAElFTkSuQmCC';

export const OFFICIAL_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAFCAYAAADYDsW7AAAAaUlEQVQ4T62SUQoAIQhEm/sf2jCaRQaNjO1HMh31JczMAGDsw7tb+mg97sXf1Y/xXvsryofYpAZ7QjWUDhkHzDRV55S/miQhtR2SpyLVcJV+SjJSXHj3t96Q1EIZod9Idnayav6GzMvOT3knuALg4DlMAAAAAElFTkSuQmCC';

export const BRAND_ASSET_PATHS = {
  // 1. Logo Principal (Fuente de verdad oficial)
  logoMain: OFFICIAL_LOGO_BASE64,
  logoColor: OFFICIAL_LOGO_BASE64,
  
  // 2. Logo Tema Oscuro
  logoDark: OFFICIAL_LOGO_BASE64,
  
  // 3. Logo Tema Claro
  logoLight: OFFICIAL_LOGO_BASE64,
  logoWhite: OFFICIAL_LOGO_BASE64,
  logoNegative: OFFICIAL_LOGO_BASE64,
  
  // 4. Isotipo / Icono
  isotype: OFFICIAL_ICON_BASE64,
  isotypeColor: OFFICIAL_ICON_BASE64,
  isotypeWhite: OFFICIAL_ICON_BASE64,
  isotypeNegative: OFFICIAL_ICON_BASE64,
  
  // 5. Splash Logo
  splashLogo: OFFICIAL_LOGO_BASE64,
  
  // 6. Pantalla de Bienvenida Logo
  welcomeLogo: OFFICIAL_LOGO_BASE64,

  // 7. Favicon / Icono App
  favicon: OFFICIAL_ICON_BASE64,
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSET_PATHS;

/**
 * Resolves a brand asset path, respecting user-configured custom official logos in localStorage
 */
export function getBrandAssetPath(key: BrandAssetKey): string {
  if (typeof window !== 'undefined') {
    // Check key-specific override first
    const specific = localStorage.getItem(`onepixel_brand_${key}`);
    if (specific) return specific;

    // Isotype fallback
    if (key.startsWith('isotype')) {
      const customIsotype = localStorage.getItem('onepixel_custom_isotype');
      if (customIsotype) return customIsotype;
    }
    
    // Main logo fallback
    const customLogo = localStorage.getItem('onepixel_custom_logo');
    if (customLogo) return customLogo;
  }
  return BRAND_ASSET_PATHS[key] || BRAND_ASSET_PATHS.logoMain;
}

/**
 * Save custom branding asset Data URI or URL for a specific key or main logo
 */
export function setCustomBrandAsset(key: string, dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  const storageKey = key === 'logoMain' ? 'onepixel_custom_logo' : key === 'isotype' ? 'onepixel_custom_isotype' : `onepixel_brand_${key}`;
  if (dataUrl) {
    localStorage.setItem(storageKey, dataUrl);
    if (key === 'favicon') {
      updateFaviconInDOM(dataUrl);
    }
  } else {
    localStorage.removeItem(storageKey);
    if (key === 'favicon') {
      updateFaviconInDOM(BRAND_ASSET_PATHS.favicon);
    }
  }
  window.dispatchEvent(new Event('onepixel_branding_updated'));
}

export function setCustomBrandLogo(logoDataUrl: string | null) {
  setCustomBrandAsset('logoMain', logoDataUrl);
}

export function setCustomBrandIsotype(isotypeDataUrl: string | null) {
  setCustomBrandAsset('isotype', isotypeDataUrl);
}

/**
 * Dynamically updates <link rel="icon"> in DOM
 */
export function updateFaviconInDOM(href: string) {
  if (typeof document === 'undefined') return;
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = href;
}

export interface BrandingConfigPackage {
  version: string;
  timestamp: string;
  assets: Record<string, string>;
}

/**
 * Export all branding customizations to a downloadable JSON file string
 */
export function exportBrandingConfig(): string {
  if (typeof window === 'undefined') return '';
  const assets: Record<string, string> = {};
  
  const keys = ['logoMain', 'logoDark', 'logoLight', 'isotype', 'splashLogo', 'welcomeLogo', 'favicon'];
  for (const k of keys) {
    const val = getBrandAssetPath(k as BrandAssetKey);
    if (val && val.startsWith('data:')) {
      assets[k] = val;
    }
  }

  const pkg: BrandingConfigPackage = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    assets
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Import branding configuration package from JSON string
 */
export function importBrandingConfig(jsonString: string): boolean {
  try {
    const pkg: BrandingConfigPackage = JSON.parse(jsonString);
    if (!pkg.assets || typeof pkg.assets !== 'object') return false;

    Object.entries(pkg.assets).forEach(([key, val]) => {
      if (typeof val === 'string') {
        setCustomBrandAsset(key, val);
      }
    });

    window.dispatchEvent(new Event('onepixel_branding_updated'));
    return true;
  } catch (err) {
    console.error('Failed to import branding config:', err);
    return false;
  }
}

/**
 * Reset all branding overrides back to default official assets
 */
export function resetAllBrandingAssets() {
  if (typeof window === 'undefined') return;
  const keys = ['onepixel_custom_logo', 'onepixel_custom_isotype'];
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('onepixel_brand_') || keys.includes(k)) {
      localStorage.removeItem(k);
    }
  });
  updateFaviconInDOM(BRAND_ASSET_PATHS.favicon);
  window.dispatchEvent(new Event('onepixel_branding_updated'));
}







