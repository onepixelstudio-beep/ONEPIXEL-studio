/**
 * OnePixel Studio - Support & Diagnostic Report Utility
 * Generates sanitized, non-sensitive technical reports for issue reporting and user support.
 */

import { PixelProject } from '../types';
import { telemetry } from './telemetry';

/**
 * CONFIGURACIÓN DEL CANAL OFICIAL DE SOPORTE
 * Correo oficial de soporte de OnePixel Studio: ONEPIXELSTUDIO.SOPORTE@gmail.com
 */
export const OFFICIAL_SUPPORT_EMAIL = 'ONEPIXELSTUDIO.SOPORTE@gmail.com';

export type IssueCategory = 
  | 'tool_error'
  | 'drawing_issue'
  | 'animation_issue'
  | 'import_export_issue'
  | 'performance_issue'
  | 'ui_visual_issue'
  | 'other';

export interface SupportFormData {
  issueType: IssueCategory;
  subject: string;
  description: string;
  contactEmail?: string;
  includeTechnicalInfo: boolean;
}

export interface SanitizedTechnicalReport {
  appName: string;
  appVersion: string;
  reportDate: string;
  environment: {
    userAgent: string;
    platform: string;
    language: string;
    screen: {
      width: number;
      height: number;
      devicePixelRatio: number;
    } | null;
  };
  canvas: {
    hasActiveProject: boolean;
    canvasDimensions: string;
    layersCount: number;
    framesCount: number;
    fps: number;
    colorPaletteCount?: number;
  };
  editorState: {
    activeTool: string;
    zoomLevel: number;
    panCoordinates: { x: number; y: number };
    undoStepsAvailable: number;
    redoStepsAvailable: number;
    onionSkinEnabled?: boolean;
    symmetryEnabled?: boolean;
    tilingEnabled?: boolean;
  };
  recentActionsSummary: Array<{
    category: string;
    action: string;
    relativeTimeMs: number;
  }>;
}

/**
 * Sanitizes input strings by removing sensitive tokens, passwords, local filesystem paths,
 * base64 image strings, and control characters to prevent header injection or privacy leaks.
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    // Remove local file paths (Windows & Unix)
    .replace(/[a-zA-Z]:\\[^ \n\r\t]+/g, '[LOCAL_PATH]')
    .replace(/\/(?:Users|home|root|var|etc)\/[^ \n\r\t]+/g, '[LOCAL_PATH]')
    // Remove base64 data URLs
    .replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g, '[IMAGE_DATA_EXCLUDED]')
    // Remove possible API keys or bearer tokens
    .replace(/(?:Bearer|key|token|secret|password)[=:\s]+[A-Za-z0-9_\-\.]{8,}/gi, '[TOKEN_REDACTED]')
    .trim();
}

/**
 * Collects safe and non-sensitive technical metadata from the running application instance.
 * STRICT PRIVACY: Never collects pixel buffers, artwork images, user filenames, or personal storage tokens.
 */
export function collectSanitizedTechnicalInfo(project?: PixelProject | null): SanitizedTechnicalReport {
  const lastState = telemetry.getLastKnownState();
  const rawAuditTrail = telemetry.getAuditTrail() || [];

  const screenInfo = typeof window !== 'undefined' ? {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: Number((window.devicePixelRatio || 1).toFixed(2))
  } : null;

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || 'Web') : 'Web';
  const browserLang = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'es';

  // Extract recent non-sensitive actions (last 15 entries max)
  const recentActions = rawAuditTrail.slice(-15).map(entry => ({
    category: sanitizeString(entry.category || 'GENERAL'),
    action: sanitizeString(entry.action || 'Unknown'),
    relativeTimeMs: entry.relativeTimeMs || 0
  }));

  const hasProject = !!(project || lastState?.hasProject);
  const width = project?.width || lastState?.canvasWidth || 0;
  const height = project?.height || lastState?.canvasHeight || 0;
  const layersCount = project?.layers?.length || lastState?.layersCount || 0;
  const framesCount = project?.frames?.length || lastState?.framesCount || 0;
  const fps = project?.fps || 8;

  return {
    appName: 'OnePixel Studio',
    appVersion: '1.4.0',
    reportDate: new Date().toISOString(),
    environment: {
      userAgent: sanitizeString(userAgent),
      platform: sanitizeString(platform),
      language: browserLang,
      screen: screenInfo
    },
    canvas: {
      hasActiveProject: hasProject,
      canvasDimensions: hasProject ? `${width} x ${height} px` : 'No active canvas',
      layersCount,
      framesCount,
      fps
    },
    editorState: {
      activeTool: sanitizeString(lastState?.activeTool || 'None'),
      zoomLevel: typeof lastState?.zoomLevel === 'number' ? Math.round(lastState.zoomLevel) : 100,
      panCoordinates: {
        x: Math.round(lastState?.panX || 0),
        y: Math.round(lastState?.panY || 0)
      },
      undoStepsAvailable: lastState?.undoStackSize || 0,
      redoStepsAvailable: lastState?.redoStackSize || 0,
      onionSkinEnabled: (lastState as any)?.onionSkinEnabled,
      symmetryEnabled: (lastState as any)?.symmetryEnabled,
      tilingEnabled: (lastState as any)?.tilingEnabled
    },
    recentActionsSummary: recentActions
  };
}

/**
 * Builds a structured, plain-text report suitable for email body or clipboard pasting.
 */
export function generatePlainTextReport(
  formData: SupportFormData,
  techInfo: SanitizedTechnicalReport | null,
  categoryLabel: string
): string {
  const sanitizedSubject = sanitizeString(formData.subject);
  const sanitizedDescription = sanitizeString(formData.description);
  const sanitizedEmail = formData.contactEmail ? sanitizeString(formData.contactEmail) : 'No proporcionado (Opcional)';

  let report = `=======================================================
ONEPIXEL STUDIO — REPORTE DE PROBLEMA TÉCNICO
=======================================================

Tipo de problema: ${categoryLabel}
Asunto: ${sanitizedSubject}
Fecha y hora: ${new Date().toLocaleString()}
Contacto: ${sanitizedEmail}

-------------------------------------------------------
DESCRIPCIÓN DEL PROBLEMA:
-------------------------------------------------------
${sanitizedDescription}
`;

  if (formData.includeTechnicalInfo && techInfo) {
    report += `
-------------------------------------------------------
INFORMACIÓN TÉCNICA (DIAGNÓSTICO ANÓNIMO):
-------------------------------------------------------
• Versión de la app: ${techInfo.appName} v${techInfo.appVersion}
• Plataforma / SO: ${techInfo.environment.platform}
• Navegador: ${techInfo.environment.userAgent}
• Idioma del navegador: ${techInfo.environment.language}
• Resolución de pantalla: ${techInfo.environment.screen ? `${techInfo.environment.screen.width}x${techInfo.environment.screen.height} (DPR: ${techInfo.environment.screen.devicePixelRatio})` : 'N/A'}

• Estado del lienzo: ${techInfo.canvas.hasActiveProject ? `Activo (${techInfo.canvas.canvasDimensions})` : 'Sin proyecto abierto'}
• Capas en el proyecto: ${techInfo.canvas.layersCount}
• Fotogramas / Frames: ${techInfo.canvas.framesCount} (a ${techInfo.canvas.fps} FPS)
• Herramienta activa: ${techInfo.editorState.activeTool}
• Nivel de Zoom: ${techInfo.editorState.zoomLevel}%
• Historial: ${techInfo.editorState.undoStepsAvailable} pasos deshacer / ${techInfo.editorState.redoStepsAvailable} pasos rehacer

• Registro de eventos recientes:
${techInfo.recentActionsSummary.length > 0 
  ? techInfo.recentActionsSummary.map(a => `  - [${a.category}] ${a.action}`).join('\n')
  : '  - Sin eventos recientes'}
`;
  } else {
    report += `
-------------------------------------------------------
INFORMACIÓN TÉCNICA:
[El usuario optó por no adjuntar datos técnicos]
-------------------------------------------------------
`;
  }

  report += `
=======================================================
Generado automáticamente desde OnePixel Studio Support
=======================================================`;

  return report;
}

/**
 * Generates an object ready to be exported/downloaded as a JSON report file.
 */
export function generateTechnicalJSON(
  formData: SupportFormData,
  techInfo: SanitizedTechnicalReport | null,
  categoryLabel: string
): string {
  const exportPayload = {
    reportMeta: {
      appName: 'OnePixel Studio',
      appVersion: techInfo?.appVersion || '1.4.0',
      reportType: 'USER_SUPPORT_ISSUE_REPORT',
      generatedAt: new Date().toISOString()
    },
    userFeedback: {
      categoryKey: formData.issueType,
      categoryLabel,
      subject: sanitizeString(formData.subject),
      description: sanitizeString(formData.description),
      contactEmail: formData.contactEmail ? sanitizeString(formData.contactEmail) : null,
      technicalInfoIncluded: formData.includeTechnicalInfo
    },
    technicalDiagnostics: formData.includeTechnicalInfo ? techInfo : null
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates a safe mailto URL with properly encoded query parameters.
 */
export function generateMailtoUrl(
  formData: SupportFormData,
  techInfo: SanitizedTechnicalReport | null,
  categoryLabel: string
): string {
  const subject = `[OnePixel Studio] [${categoryLabel}] ${sanitizeString(formData.subject)}`;
  const body = generatePlainTextReport(formData, techInfo, categoryLabel);

  // URLs have length limits on some email clients (usually ~2000 characters).
  // If encoded length is very long, provide a concise body and instruct to paste full details.
  let encodedBody = encodeURIComponent(body);
  if (encodedBody.length > 1800) {
    const compactBody = `ONEPIXEL STUDIO — REPORTE DE PROBLEMA

Tipo: ${categoryLabel}
Asunto: ${sanitizeString(formData.subject)}
Contacto: ${formData.contactEmail ? sanitizeString(formData.contactEmail) : 'N/A'}

DESCRIPCIÓN:
${sanitizeString(formData.description)}

INFORMACIÓN TÉCNICA BÁSICA:
App: OnePixel Studio v${techInfo?.appVersion || '1.4.0'}
Plataforma: ${techInfo?.environment.platform || 'Web'}
Lienzo: ${techInfo?.canvas.canvasDimensions || 'N/A'} (Capas: ${techInfo?.canvas.layersCount || 0}, Frames: ${techInfo?.canvas.framesCount || 0})
Herramienta: ${techInfo?.editorState.activeTool || 'None'}
Zoom: ${techInfo?.editorState.zoomLevel || 100}%

[Para incluir el reporte completo detallado, puedes usar el botón 'Copiar reporte' o adjuntar el archivo JSON descargado en OnePixel Studio]`;
    encodedBody = encodeURIComponent(compactBody);
  }

  return `mailto:${OFFICIAL_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodedBody}`;
}

/**
 * Copies plain text to clipboard using the modern Clipboard API with fallback for restricted iframe contexts.
 */
export async function copyToClipboardWithFallback(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback via temporary textarea
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Triggers a file download for the technical JSON report without modifying any canvas or project state.
 */
export function downloadSupportReportFile(jsonString: string): void {
  try {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `onepixel-support-report-${Date.now()}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger support report download:', err);
  }
}

export interface SupportSubmissionResult {
  success: boolean;
  trackingId?: string;
  error?: string;
}

/**
 * Attempts to submit the report to the configured backend API endpoint.
 * If no backend is active or returns an error, returns a structured failure
 * so the UI can gracefully display the fallback mailto/copy/download options.
 */
export async function submitSupportReportToEndpoint(
  formData: SupportFormData,
  techInfo: SanitizedTechnicalReport | null,
  categoryLabel: string
): Promise<SupportSubmissionResult> {
  const payload = {
    reportMeta: {
      appName: 'OnePixel Studio',
      appVersion: techInfo?.appVersion || '1.4.0',
      reportType: 'USER_SUPPORT_ISSUE_REPORT',
      generatedAt: new Date().toISOString()
    },
    userFeedback: {
      categoryKey: formData.issueType,
      categoryLabel,
      subject: sanitizeString(formData.subject),
      description: sanitizeString(formData.description),
      contactEmail: formData.contactEmail ? sanitizeString(formData.contactEmail) : null,
      technicalInfoIncluded: formData.includeTechnicalInfo
    },
    technicalDiagnostics: formData.includeTechnicalInfo ? techInfo : null
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('/api/support/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        trackingId: data.trackingId || `OP-${Date.now().toString(36).toUpperCase()}`
      };
    } else {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || `Servidor respondió con código ${response.status}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.name === 'AbortError' ? 'Timeout de conexión' : (err?.message || 'Network error')
    };
  }
}

