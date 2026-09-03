import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;

// Parse incoming JSON payloads
app.use(express.json({ limit: '2mb' }));

/**
 * Official Support Email Destination
 */
const SUPPORT_DESTINATION_EMAIL = process.env.SUPPORT_EMAIL_DESTINATION || 'ONEPIXELSTUDIO.SOPORTE@gmail.com';

/**
 * Generates a clean, unique tracking ID for the issue report (e.g. OP-8A7F-2K9M)
 */
function generateTrackingId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OP-${part1}-${part2}`;
}

/**
 * Sanitizes text to prevent injection or leaking local data
 */
function sanitize(str: any): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[a-zA-Z]:\\[^ \n\r\t]+/g, '[LOCAL_PATH]')
    .replace(/\/(?:Users|home|root|var|etc)\/[^ \n\r\t]+/g, '[LOCAL_PATH]')
    .replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g, '[IMAGE_DATA_EXCLUDED]')
    .replace(/(?:Bearer|key|token|secret|password)[=:\s]+[A-Za-z0-9_\-\.]{8,}/gi, '[TOKEN_REDACTED]')
    .trim();
}

/**
 * Creates Nodemailer transporter using environment configuration.
 * Prioritizes Gmail Service transport using Google App Password (GMAIL_USER + GMAIL_APP_PASSWORD)
 */
function createEmailTransporter() {
  // 1. Prioritize Gmail configuration with App Password
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : 'ONEPIXELSTUDIO.SOPORTE@gmail.com');

  if (gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }

  // 2. Generic SMTP fallback if SMTP_HOST is explicitly provided
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }

  return null;
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'OnePixel Studio Backend',
    supportDestination: SUPPORT_DESTINATION_EMAIL
  });
});

// Support Report Submission Endpoint
app.post('/api/support/report', async (req, res) => {
  try {
    const { userFeedback, technicalDiagnostics, reportMeta } = req.body || {};

    if (!userFeedback || !userFeedback.subject || !userFeedback.description) {
      return res.status(400).json({
        success: false,
        error: 'El asunto y la descripción son obligatorios.'
      });
    }

    const trackingId = generateTrackingId();
    const subject = sanitize(userFeedback.subject);
    const description = sanitize(userFeedback.description);
    const categoryLabel = sanitize(userFeedback.categoryLabel || 'General');
    const contactEmail = userFeedback.contactEmail ? sanitize(userFeedback.contactEmail) : null;
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('es-ES', { timeZone: 'UTC' }) + ' (UTC)';

    // Format plain text email
    let plainText = `=======================================================\n`;
    plainText += `ONEPIXEL STUDIO — REPORTE DE SOPORTE TÉCNICO\n`;
    plainText += `ID DE SEGUIMIENTO: ${trackingId}\n`;
    plainText += `=======================================================\n\n`;
    plainText += `Fecha: ${nowFormatted}\n`;
    plainText += `Categoría: ${categoryLabel}\n`;
    plainText += `Asunto: ${subject}\n`;
    plainText += `Email de Contacto: ${contactEmail || 'No proporcionado'}\n\n`;
    plainText += `-------------------------------------------------------\n`;
    plainText += `DESCRIPCIÓN DEL PROBLEMA:\n`;
    plainText += `-------------------------------------------------------\n`;
    plainText += `${description}\n\n`;

    if (technicalDiagnostics) {
      plainText += `-------------------------------------------------------\n`;
      plainText += `DIAGNÓSTICO TÉCNICO ANÓNIMO:\n`;
      plainText += `-------------------------------------------------------\n`;
      plainText += `• App: OnePixel Studio v${technicalDiagnostics.appVersion || '1.4.0'}\n`;
      plainText += `• SO / Plataforma: ${technicalDiagnostics.environment?.platform || 'N/A'}\n`;
      plainText += `• Navegador: ${technicalDiagnostics.environment?.userAgent || 'N/A'}\n`;
      plainText += `• Idioma: ${technicalDiagnostics.environment?.language || 'N/A'}\n`;
      if (technicalDiagnostics.environment?.screen) {
        plainText += `• Pantalla: ${technicalDiagnostics.environment.screen.width}x${technicalDiagnostics.environment.screen.height} (DPR: ${technicalDiagnostics.environment.screen.devicePixelRatio})\n`;
      }
      plainText += `• Lienzo: ${technicalDiagnostics.canvas?.canvasDimensions || 'N/A'}\n`;
      plainText += `• Capas: ${technicalDiagnostics.canvas?.layersCount || 0}, Frames: ${technicalDiagnostics.canvas?.framesCount || 0} (${technicalDiagnostics.canvas?.fps || 8} FPS)\n`;
      plainText += `• Herramienta: ${technicalDiagnostics.editorState?.activeTool || 'N/A'}, Zoom: ${technicalDiagnostics.editorState?.zoomLevel || 100}%\n`;
      plainText += `• Historial: ${technicalDiagnostics.editorState?.undoStepsAvailable || 0} deshacer / ${technicalDiagnostics.editorState?.redoStepsAvailable || 0} rehacer\n`;
      
      if (Array.isArray(technicalDiagnostics.recentActionsSummary) && technicalDiagnostics.recentActionsSummary.length > 0) {
        plainText += `\n• Acciones recientes:\n`;
        technicalDiagnostics.recentActionsSummary.forEach((act: any) => {
          plainText += `  - [${act.category}] ${act.action}\n`;
        });
      }
    } else {
      plainText += `\n[El usuario optó por no adjuntar datos técnicos]\n`;
    }

    // Format rich HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 680px; margin: 0 auto; border: 1px solid #334155;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #34d399; margin: 0 0 6px 0; font-size: 22px;">OnePixel Studio — Reporte de Soporte</h2>
          <div style="display: inline-block; background-color: #1e293b; color: #fbbf24; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 14px; border: 1px solid #475569;">
            ID: ${trackingId}
          </div>
          <span style="color: #94a3b8; font-size: 12px; margin-left: 12px;">${nowFormatted}</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 140px; font-weight: bold;">Categoría:</td>
            <td style="padding: 6px 0; color: #e2e8f0;">${categoryLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-weight: bold;">Asunto:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: bold;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-weight: bold;">Contacto:</td>
            <td style="padding: 6px 0; color: #38bdf8;">${contactEmail ? `<a href="mailto:${contactEmail}" style="color: #38bdf8; text-decoration: none;">${contactEmail}</a>` : '<span style="color: #64748b;">No proporcionado</span>'}</td>
          </tr>
        </table>

        <div style="background-color: #1e293b; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; color: #93c5fd; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Descripción del problema</h4>
          <p style="margin: 0; color: #f1f5f9; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${description}</p>
        </div>

        ${technicalDiagnostics ? `
          <div style="background-color: #111827; border: 1px solid #374151; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: #10b981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Diagnóstico Técnico del Sistema</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #cbd5e1;">
              <div><strong>App:</strong> OnePixel Studio v${technicalDiagnostics.appVersion || '1.4.0'}</div>
              <div><strong>Plataforma:</strong> ${technicalDiagnostics.environment?.platform || 'Web'}</div>
              <div><strong>Lienzo:</strong> ${technicalDiagnostics.canvas?.canvasDimensions || 'N/A'}</div>
              <div><strong>Capas / Frames:</strong> ${technicalDiagnostics.canvas?.layersCount || 0} / ${technicalDiagnostics.canvas?.framesCount || 0} (${technicalDiagnostics.canvas?.fps || 8} FPS)</div>
              <div><strong>Herramienta:</strong> ${technicalDiagnostics.editorState?.activeTool || 'None'}</div>
              <div><strong>Zoom:</strong> ${technicalDiagnostics.editorState?.zoomLevel || 100}%</div>
              <div><strong>Historial:</strong> ${technicalDiagnostics.editorState?.undoStepsAvailable || 0} deshacer / ${technicalDiagnostics.editorState?.redoStepsAvailable || 0} rehacer</div>
              <div><strong>Pantalla:</strong> ${technicalDiagnostics.environment?.screen ? `${technicalDiagnostics.environment.screen.width}x${technicalDiagnostics.environment.screen.height}` : 'N/A'}</div>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #64748b; word-break: break-all;">
              <strong>User Agent:</strong> ${technicalDiagnostics.environment?.userAgent || 'N/A'}
            </div>
          </div>
        ` : `
          <div style="font-size: 12px; color: #64748b; font-style: italic; margin-bottom: 20px;">
            El usuario optó por no adjuntar información de diagnóstico técnico.
          </div>
        `}

        <div style="border-top: 1px solid #334155; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
          Este reporte fue generado de forma anónima y segura por el sistema integrado de soporte de OnePixel Studio.<br/>
          Destino configurado: <strong>${SUPPORT_DESTINATION_EMAIL}</strong>
        </div>
      </div>
    `;

    const transporter = createEmailTransporter();

    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_FROM || `OnePixel Studio Support <${process.env.GMAIL_USER || 'ONEPIXELSTUDIO.SOPORTE@gmail.com'}>`,
        to: SUPPORT_DESTINATION_EMAIL,
        replyTo: contactEmail || undefined,
        subject: `[OnePixel Studio] Reporte ${trackingId} — ${categoryLabel}: ${subject}`,
        text: plainText,
        html: htmlContent
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[Support] Successfully sent report ${trackingId} to ${SUPPORT_DESTINATION_EMAIL}`);
        return res.status(200).json({
          success: true,
          trackingId,
          recipient: SUPPORT_DESTINATION_EMAIL,
          message: 'Reporte entregado satisfactoriamente al equipo de soporte.'
        });
      } catch (mailError: any) {
        console.error('[Support] Nodemailer dispatch failed:', mailError);
        return res.status(500).json({
          success: false,
          trackingId,
          error: `Error de transporte SMTP: ${mailError.message || 'Fallo al entregar correo'}. Por favor use las opciones de respaldo (Mailto, Copiar o Descargar JSON).`
        });
      }
    } else {
      // SMTP is not configured in server environment variables.
      // Log diagnostics securely to server console
      console.warn(`[Support] SMTP credentials not configured in environment. Report ${trackingId} could not be dispatched automatically.`);
      
      // Return structured 503 so frontend displays the clear error message and enables the fallback choices
      return res.status(503).json({
        success: false,
        trackingId,
        error: 'El servidor de correo SMTP no está configurado en las variables de entorno del servidor. Utilice el botón "Mailto", "Copiar reporte" o "Descargar JSON" para enviarlo directamente a ONEPIXELSTUDIO.SOPORTE@gmail.com.',
        fallbackEmail: SUPPORT_DESTINATION_EMAIL
      });
    }
  } catch (error: any) {
    console.error('[Support] Unexpected error in /api/support/report:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno procesando el reporte. Utilice las opciones de respaldo.'
    });
  }
});

// ==========================================
// PWA & PWABUILDER ENDPOINTS
// ==========================================
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.join(process.cwd(), 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(process.cwd(), 'sw.js'));
});

const PWA_IMAGE_ASSETS = [
  'icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'icon apk.png',
  'screenshot-wide.png',
  'screenshot-narrow.png'
];

for (const assetName of PWA_IMAGE_ASSETS) {
  app.get([`/${assetName}`, `/${encodeURIComponent(assetName)}`], (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(process.cwd(), assetName));
  });
}

// ==========================================
// VITE / STATIC SERVING MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OnePixel Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[OnePixel Server] Support Email Target: ${SUPPORT_DESTINATION_EMAIL}`);
  });
}

startServer();
