import { es } from './es';
import { en } from './en';
import { pt } from './pt';
import { zhCN } from './zh-CN';
import { ru } from './ru';
import { ja } from './ja';
import { LanguageCode, TranslationSchema } from './types';

export const translations: Record<LanguageCode, TranslationSchema> = {
  es,
  en,
  pt,
  'zh-CN': zhCN,
  ru,
  ja,
};

// Known alias re-mappings to prevent broken keys from showing up in UI
const KEY_ALIASES: Record<string, string> = {
  'header.saveAndClose': 'common.saveAndClose',
  'header.save_and_close': 'common.saveAndClose',
  'header.save': 'common.save',
  'header.close': 'common.close',
  'p.perfect': 'toolbar.pixelPerfect',
  'p.perfecto': 'toolbar.pixelPerfect',
  'pixel_perfect': 'toolbar.pixelPerfect',
  'p_perfect': 'toolbar.pixelPerfect',
  'common.add': 'common.add',
  'common.addButton': 'common.add',
};

/**
 * Universal translation resolver with dot notation, exact alias routing,
 * base-language fallback and parameter interpolation.
 */
export function translate(
  keyPath: string,
  lang: LanguageCode = 'es',
  params?: Record<string, string | number>
): string {
  if (!keyPath) return '';

  const targetLang = translations[lang] ? lang : 'es';
  const selectedLang = translations[targetLang] || translations.es;
  const fallbackLang = translations.es;

  // 1. Check explicit direct aliases
  const effectiveKey = KEY_ALIASES[keyPath] || keyPath;

  function resolvePath(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;

    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (!current || typeof current !== 'object') return undefined;

      if (current[part] !== undefined && typeof current[part] !== 'object') {
        return String(current[part]);
      }
      if (current[part] !== undefined) {
        current = current[part];
        continue;
      }

      return undefined;
    }

    return typeof current === 'string' ? current : undefined;
  }

  // 2. Resolve in selected language
  let text = resolvePath(selectedLang, effectiveKey);

  // 3. Fallback to default Spanish dictionary if not found in selected language
  if (text === undefined && selectedLang !== fallbackLang) {
    text = resolvePath(fallbackLang, effectiveKey);
  }

  // 4. If key does not exist anywhere, return keyPath strictly without semantic guessing
  if (text === undefined) {
    return keyPath;
  }

  // Parameter substitution {param}
  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }

  return text;
}

export * from './types';
