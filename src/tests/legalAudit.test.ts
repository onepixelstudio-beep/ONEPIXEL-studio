import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { 
  LEGAL_VERSION, 
  LEGAL_EFFECTIVE_DATE, 
  OFFICIAL_LEGAL_EMAIL,
  LEGAL_STORAGE_KEY,
  hasAcceptedCurrentLegalVersion,
  saveLegalConsentRecord,
  getLegalConsentRecord,
  clearLegalConsentRecord
} from '../config/LegalConfig';
import { 
  getLegalSections, 
  THIRD_PARTY_LICENSES 
} from '../data/legalContent';
import {
  sanitizeString,
  collectSanitizedTechnicalInfo,
  generatePlainTextReport,
  generateTechnicalJSON,
  OFFICIAL_SUPPORT_EMAIL
} from '../utils/supportReport';
import { LanguageCode } from '../i18n/types';

// Mock localStorage for Node test environment
let mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => {
    mockStore[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    mockStore = {};
  }
};

beforeAll(() => {
  if (typeof window === 'undefined') {
    (global as any).window = { localStorage: mockLocalStorage };
  } else {
    (window as any).localStorage = mockLocalStorage;
  }
});

describe('Audit: Legal Documentation & Content Verification', () => {
  const languages: LanguageCode[] = ['es', 'en', 'pt', 'ja', 'ru', 'zh-CN'];
  const expectedSections = [
    'terms',
    'privacy',
    'intellectual_property',
    'licenses',
    'disclaimer',
    'donations',
    'contact'
  ];

  it('Verifies that all 6 languages provide all 7 legal sections with non-empty content', () => {
    for (const lang of languages) {
      const sections = getLegalSections(lang);
      expect(sections.length).toBe(7);

      const sectionIds = sections.map(s => s.id);
      for (const expectedId of expectedSections) {
        expect(sectionIds).toContain(expectedId);
      }

      for (const sec of sections) {
        expect(sec.title).toBeTruthy();
        expect(sec.summary).toBeTruthy();
        expect(sec.paragraphs.length).toBeGreaterThan(0);
        for (const p of sec.paragraphs) {
          expect(p.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it('Verifies official email is consistent across LegalConfig and supportReport', () => {
    expect(OFFICIAL_LEGAL_EMAIL).toBe('ONEPIXELSTUDIO.SOPORTE@gmail.com');
    expect(OFFICIAL_SUPPORT_EMAIL).toBe('ONEPIXELSTUDIO.SOPORTE@gmail.com');
  });

  it('Verifies Third-Party licenses cover all core runtime and build dependencies', () => {
    const licenseNames = THIRD_PARTY_LICENSES.map(l => l.name.toLowerCase());
    const expectedDependencies = [
      'react & react-dom',
      'lucide-react',
      'motion',
      'fflate',
      'gifenc',
      'ag-psd',
      'nodemailer',
      'express',
      'dotenv',
      'tailwindcss & @tailwindcss/vite',
      'vite & @vitejs/plugin-react',
      'typescript',
      'vitest',
      'esbuild',
      'tsx'
    ];

    for (const dep of expectedDependencies) {
      expect(licenseNames).toContain(dep.toLowerCase());
    }

    for (const lic of THIRD_PARTY_LICENSES) {
      expect(lic.license).toBeTruthy();
      expect(lic.author).toBeTruthy();
      expect(lic.purpose).toBeTruthy();
      expect(lic.version).toBeTruthy();
    }
  });
});

describe('Audit: Legal Consent Local Persistence & Versioning', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('Initial state: hasAcceptedCurrentLegalVersion returns false on clean storage', () => {
    expect(hasAcceptedCurrentLegalVersion()).toBe(false);
    expect(getLegalConsentRecord()).toBeNull();
  });

  it('Saving consent writes version, timestamp, and language to localStorage', () => {
    saveLegalConsentRecord('es');
    expect(hasAcceptedCurrentLegalVersion()).toBe(true);

    const record = getLegalConsentRecord();
    expect(record).not.toBeNull();
    expect(record?.version).toBe(LEGAL_VERSION);
    expect(record?.language).toBe('es');
    expect(record?.accepted).toBe(true);
    expect(record?.acceptedAt).toBeTruthy();
  });

  it('Simulates version upgrade (e.g. 1.0 to 1.1): forces re-acceptance if stored version is outdated', () => {
    // Save outdated record with version "0.9"
    const outdatedRecord = {
      version: '0.9',
      acceptedAt: new Date().toISOString(),
      language: 'es',
      accepted: true
    };
    mockLocalStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(outdatedRecord));

    // When current LEGAL_VERSION is '1.0', outdated record is rejected
    expect(hasAcceptedCurrentLegalVersion()).toBe(false);

    // After user re-accepts under new version:
    saveLegalConsentRecord('es');
    expect(hasAcceptedCurrentLegalVersion()).toBe(true);
    expect(getLegalConsentRecord()?.version).toBe(LEGAL_VERSION);
  });

  it('Clearing legal consent resets acceptance state', () => {
    saveLegalConsentRecord('en');
    expect(hasAcceptedCurrentLegalVersion()).toBe(true);

    clearLegalConsentRecord();
    expect(hasAcceptedCurrentLegalVersion()).toBe(false);
  });
});

describe('Audit: Support Diagnostic Privacy & Data Sanitization', () => {
  it('Sanitizes sensitive file paths, tokens, base64 images from text', () => {
    const rawInput = 'Error en C:\\Users\\Administrator\\secret\\file.png con token Bearer 1234567890abcdef and image data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
    const sanitized = sanitizeString(rawInput);

    expect(sanitized).not.toContain('C:\\Users');
    expect(sanitized).not.toContain('1234567890abcdef');
    expect(sanitized).not.toContain('iVBORw0KGgo');
    expect(sanitized).toContain('[LOCAL_PATH]');
    expect(sanitized).toContain('[TOKEN_REDACTED]');
    expect(sanitized).toContain('[IMAGE_DATA_EXCLUDED]');
  });

  it('collectSanitizedTechnicalInfo produces non-sensitive metadata without pixel buffers or private files', () => {
    const dummyProject: any = {
      id: 'test-project',
      name: 'My Pixel Art',
      width: 32,
      height: 32,
      layers: [{ id: 'l1', name: 'Layer 1' }],
      frames: [{ id: 'f1', duration: 100 }],
      fps: 12,
      pixels: { 0: '#ff0000', 1: '#00ff00' } // raw pixels
    };

    const techInfo = collectSanitizedTechnicalInfo(dummyProject);

    // Canvas metadata is summarized
    expect(techInfo.canvas.canvasDimensions).toBe('32 x 32 px');
    expect(techInfo.canvas.layersCount).toBe(1);
    expect(techInfo.canvas.framesCount).toBe(1);
    expect(techInfo.canvas.fps).toBe(12);

    // CRITICAL: Ensure raw pixels or user artwork buffer are NOT present in technical report
    expect((techInfo as any).pixels).toBeUndefined();
    expect((techInfo.canvas as any).pixels).toBeUndefined();
  });

  it('generatePlainTextReport formats plain text cleanly with optional contact', () => {
    const formData = {
      issueType: 'tool_error' as const,
      subject: 'Error al usar lápiz',
      description: 'El lápiz no dibuja al hacer clic.',
      contactEmail: 'user@example.com',
      includeTechnicalInfo: false
    };

    const report = generatePlainTextReport(formData, null, 'Error de herramienta');
    expect(report).toContain('ONEPIXEL STUDIO — REPORTE DE PROBLEMA TÉCNICO');
    expect(report).toContain('Tipo de problema: Error de herramienta');
    expect(report).toContain('Asunto: Error al usar lápiz');
    expect(report).toContain('user@example.com');
    expect(report).toContain('[El usuario optó por no adjuntar datos técnicos]');
  });

  it('generateTechnicalJSON creates valid JSON structure', () => {
    const formData = {
      issueType: 'performance_issue' as const,
      subject: 'Ralentización con muchas capas',
      description: 'Con 30 capas va lento.',
      contactEmail: undefined,
      includeTechnicalInfo: true
    };

    const techInfo = collectSanitizedTechnicalInfo(null);
    const jsonString = generateTechnicalJSON(formData, techInfo, 'Rendimiento');
    const parsed = JSON.parse(jsonString);

    expect(parsed.reportMeta.appName).toBe('OnePixel Studio');
    expect(parsed.userFeedback.subject).toBe('Ralentización con muchas capas');
    expect(parsed.userFeedback.contactEmail).toBeNull();
    expect(parsed.technicalDiagnostics).not.toBeNull();
  });
});
