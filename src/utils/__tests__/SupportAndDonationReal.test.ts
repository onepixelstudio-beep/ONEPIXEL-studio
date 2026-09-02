import { describe, it, expect, vi } from 'vitest';
import { 
  OFFICIAL_SUPPORT_EMAIL, 
  collectSanitizedTechnicalInfo, 
  generatePlainTextReport, 
  generateTechnicalJSON, 
  generateMailtoUrl,
  submitSupportReportToEndpoint,
  SupportFormData
} from '../supportReport';
import { DONATION_URL, DONATION_CONFIG } from '../../config/DonationConfig';
import { PixelProject } from '../../types';

describe('Sistemas Finales: Soporte Oficial & Donaciones PayPal', () => {
  describe('1. Verificación del Canal Oficial de Soporte', () => {
    it('debe tener como correo oficial de soporte ONEPIXELSTUDIO.SOPORTE@gmail.com', () => {
      expect(OFFICIAL_SUPPORT_EMAIL).toBe('ONEPIXELSTUDIO.SOPORTE@gmail.com');
    });

    it('debe generar diagnósticos técnicos sanitizados sin exponer datos sensibles', () => {
      const mockProject: PixelProject = {
        id: 'test-project-1',
        name: 'Project Secret C:\\Users\\User\\Art\\secret.png',
        width: 32,
        height: 32,
        layers: [
          { id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 100 }
        ],
        frames: [
          { id: 'frame-1', name: 'Frame 1', durationMs: 125 }
        ],
        pixels: {
          'frame-1': {
            'layer-1': new Array(32 * 32).fill('')
          }
        },
        fps: 8,
        tags: [],
        lastSaved: Date.now()
      };

      const techInfo = collectSanitizedTechnicalInfo(mockProject);
      expect(techInfo).toBeDefined();
      expect(techInfo.appName).toBe('OnePixel Studio');
      expect(techInfo.canvas.canvasDimensions).toBe('32 x 32 px');
      expect(techInfo.canvas.layersCount).toBe(1);
      expect(techInfo.canvas.framesCount).toBe(1);
      expect(techInfo.canvas.fps).toBe(8);

      // Verificamos que NO se exporten arrays de píxeles ni contenido binario
      expect((techInfo as any).pixels).toBeUndefined();
      expect((techInfo as any).rawImage).toBeUndefined();
    });

    it('debe generar un correo mailto dirigido exactamente a ONEPIXELSTUDIO.SOPORTE@gmail.com', () => {
      const formData: SupportFormData = {
        issueType: 'animation_issue',
        subject: 'Fallo al exportar spritesheet',
        description: 'Al exportar un proyecto de 8 fotogramas se trunca el último frame.',
        contactEmail: 'artista@pixel.art',
        includeTechnicalInfo: true
      };

      const techInfo = collectSanitizedTechnicalInfo(null);
      const mailtoUrl = generateMailtoUrl(formData, techInfo, 'Problema de animación');

      expect(mailtoUrl).toContain('mailto:ONEPIXELSTUDIO.SOPORTE@gmail.com');
      expect(mailtoUrl).toContain(encodeURIComponent('Fallo al exportar spritesheet'));
      expect(mailtoUrl).toContain(encodeURIComponent('ONEPIXEL STUDIO — REPORTE DE PROBLEMA'));
    });

    it('debe generar informe estructurado JSON con metadatos completos y sanitizados', () => {
      const formData: SupportFormData = {
        issueType: 'tool_error',
        subject: 'Error con la herramienta cubo en C:\\User\\test.png y token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        description: 'Descripción detallada del error',
        contactEmail: 'dev@test.com',
        includeTechnicalInfo: true
      };

      const techInfo = collectSanitizedTechnicalInfo(null);
      const jsonString = generateTechnicalJSON(formData, techInfo, 'Error de herramienta');
      const parsed = JSON.parse(jsonString);

      expect(parsed.reportMeta.appName).toBe('OnePixel Studio');
      expect(parsed.userFeedback.subject).not.toContain('C:\\User');
      expect(parsed.userFeedback.subject).toContain('[LOCAL_PATH]');
      expect(parsed.userFeedback.subject).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(parsed.userFeedback.contactEmail).toBe('dev@test.com');
      expect(parsed.technicalDiagnostics).toBeDefined();
    });

    it('debe procesar respuestas del endpoint /api/support/report y capturar trackingId', async () => {
      const formData: SupportFormData = {
        issueType: 'drawing_issue',
        subject: 'Pincel no dibuja con simetría',
        description: 'Al activar la simetría vertical no se reflejan los trazos.',
        includeTechnicalInfo: false
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          trackingId: 'OP-TEST-7788',
          recipient: 'ONEPIXELSTUDIO.SOPORTE@gmail.com'
        })
      });
      globalThis.fetch = fetchMock;

      const result = await submitSupportReportToEndpoint(formData, null, 'Problema de dibujo');
      expect(result.success).toBe(true);
      expect(result.trackingId).toBe('OP-TEST-7788');
      expect(fetchMock).toHaveBeenCalledWith('/api/support/report', expect.anything());
    });

    it('debe capturar mensaje de error devuelto por el servidor cuando falla el envío', async () => {
      const formData: SupportFormData = {
        issueType: 'performance_issue',
        subject: 'Caída de FPS en lienzo grande',
        description: 'En 512x512 baja a 15 fps.',
        includeTechnicalInfo: false
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: 'El servicio de correo no cuenta con credenciales configuradas'
        })
      });
      globalThis.fetch = fetchMock;

      const result = await submitSupportReportToEndpoint(formData, null, 'Rendimiento');
      expect(result.success).toBe(false);
      expect(result.error).toContain('credenciales');
    });
  });

  describe('2. Verificación del Sistema de Donaciones PayPal', () => {
    it('debe tener como URL oficial única https://paypal.me/DONACIONONEPIXEL', () => {
      expect(DONATION_URL).toBe('https://paypal.me/DONACIONONEPIXEL');
    });

    it('debe sincronizar DONATION_CONFIG con la URL oficial de PayPal', () => {
      expect(DONATION_CONFIG.activeDestination.url).toBe('https://paypal.me/DONACIONONEPIXEL');
      expect(DONATION_CONFIG.activeDestination.gateway).toBe('paypal');
      expect(DONATION_CONFIG.allowRealRedirect).toBe(true);
    });
  });
});
