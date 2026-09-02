/**
 * OnePixel Studio - Legal Configuration & Local Consent Management
 * Centralized configuration for Terms of Service, Privacy Policy, and Local Consent state.
 * 
 * STRICT PRIVACY DIRECTIVE:
 * - All consent data is stored ONLY in browser local storage.
 * - ZERO network calls, ZERO telemetry, ZERO user profiling.
 */

import { LanguageCode } from '../i18n/types';

export const LEGAL_VERSION = '1.0';
export const LEGAL_EFFECTIVE_DATE = '2025-01-01';
export const OFFICIAL_LEGAL_EMAIL = 'ONEPIXELSTUDIO.SOPORTE@gmail.com';

export const LEGAL_STORAGE_KEY = 'onepixel_legal_consent_record';

export type LegalSectionId = 'terms' | 'privacy' | 'intellectual_property' | 'licenses' | 'disclaimer' | 'donations' | 'contact';

export interface LegalConsentRecord {
  accepted: boolean;
  version: string;
  acceptedAt: string; // ISO 8601 string
  language: LanguageCode;
}

/**
 * Retrieves the locally stored legal consent record, if any.
 */
export function getLegalConsentRecord(): LegalConsentRecord | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LEGAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.accepted === true) {
      return parsed as LegalConsentRecord;
    }
    return null;
  } catch (err) {
    console.warn('[LegalConfig] Failed to parse local legal consent record:', err);
    return null;
  }
}

/**
 * Checks whether the user has already accepted the current active version of legal documents.
 */
export function hasAcceptedCurrentLegalVersion(): boolean {
  const record = getLegalConsentRecord();
  if (!record) return false;
  return record.accepted === true && record.version === LEGAL_VERSION;
}

/**
 * Records user acceptance locally with current timestamp, active version and language.
 */
export function saveLegalConsentRecord(language: LanguageCode = 'es'): LegalConsentRecord {
  const record: LegalConsentRecord = {
    accepted: true,
    version: LEGAL_VERSION,
    acceptedAt: new Date().toISOString(),
    language
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(record));
    } catch (err) {
      console.warn('[LegalConfig] Failed to persist legal consent record:', err);
    }
  }

  return record;
}

/**
 * Clears the locally stored legal consent record. Useful for testing and consent reset.
 */
export function clearLegalConsentRecord(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LEGAL_STORAGE_KEY);
    } catch (err) {
      console.warn('[LegalConfig] Failed to clear legal consent record:', err);
    }
  }
}
