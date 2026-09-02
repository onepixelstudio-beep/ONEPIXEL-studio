import { describe, it, expect } from 'vitest';
import { es } from '../es';
import { en } from '../en';
import { pt } from '../pt';

describe('i18n structural consistency', () => {
  const getDeepKeys = (obj: any, prefix = ''): string[] => {
    let keys: string[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys = keys.concat(getDeepKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }
    return keys.sort();
  };

  it('should have identical translation keys across all languages', () => {
    const esKeys = getDeepKeys(es);
    const enKeys = getDeepKeys(en);
    const ptKeys = getDeepKeys(pt);

    // Compare Spanish vs English
    expect(esKeys).toEqual(enKeys);

    // Compare Spanish vs Portuguese
    expect(esKeys).toEqual(ptKeys);
  });
});
