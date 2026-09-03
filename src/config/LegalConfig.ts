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
export const TERMS_ACCEPTED_FLAG = 'onepixel_terms_accepted';
export const INSTALLATION_CONSENT_FLAG = 'onepixel_installed_consent';

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
 * Checks whether the user has already accepted the terms and conditions during installation.
 * Once accepted, this returns true permanently unless the application is completely uninstalled/wiped.
 */
export function hasAcceptedCurrentLegalVersion(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const record = getLegalConsentRecord();
    if (record) {
      return record.accepted === true && record.version === LEGAL_VERSION;
    }

    // Direct persistent installation flag check
    if (window.localStorage.getItem(TERMS_ACCEPTED_FLAG) === 'true') {
      return true;
    }
    if (window.localStorage.getItem(INSTALLATION_CONSENT_FLAG) === 'true') {
      return true;
    }
  } catch (err) {
    console.warn('[LegalConfig] Error checking consent status:', err);
  }

  return false;
}

/**
 * Records user acceptance locally with current timestamp, active version and language.
 * Persists persistent installation flags to guarantee the screen never reappears on normal startups.
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
      window.localStorage.setItem(TERMS_ACCEPTED_FLAG, 'true');
      window.localStorage.setItem(INSTALLATION_CONSENT_FLAG, 'true');
    } catch (err) {
      console.warn('[LegalConfig] Failed to persist legal consent record:', err);
    }
  }

  return record;
}

/**
 * Clears the locally stored legal consent record. Useful for testing and full uninstallation reset.
 */
export function clearLegalConsentRecord(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LEGAL_STORAGE_KEY);
      window.localStorage.removeItem(TERMS_ACCEPTED_FLAG);
      window.localStorage.removeItem(INSTALLATION_CONSENT_FLAG);
    } catch (err) {
      console.warn('[LegalConfig] Failed to clear legal consent record:', err);
    }
  }
}
