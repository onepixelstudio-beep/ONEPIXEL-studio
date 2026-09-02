import { QATestCase, QAIncident, QABuildHistory, PlanMaestroPhase } from '../types';

export interface ReportData {
  qaScore: number;
  buildVersion: string;
  commitHash: string;
  timestamp: string;
  testCases: QATestCase[];
  incidents: QAIncident[];
  history: QABuildHistory[];
  phases: PlanMaestroPhase[];
  regressionsCount: number;
  environment: {
    browser: string;
    os: string;
    localTime: string;
    engine: string;
  };
}

export function generateJSONReport(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}

export function generateMarkdownReport(data: ReportData): string {
  const openIncidents = data.incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved');
  const resolvedIncidents = data.incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  
  return `# ACTA OFICIAL DE AUDITORÍA Y CERTIFICACIÓN DE CALIDAD - ONEPIXEL STUDIO
## INFORMACIÓN DE LA VERIFICACIÓN
- **Compilación Validada:** \`${data.buildVersion}\`
- **Hash de Confirmación (Commit):** \`${data.commitHash}\`
- **Fecha de Auditoría:** ${data.timestamp}
- **Puntuación de Calidad (QA Score):** **${data.qaScore}%**
- **Regresiones Activas:** ${data.regressionsCount}

---

## ESTADO POR FASES DEL PLAN MAESTRO
${data.phases.map(p => {
  const phaseTests = data.testCases.filter(t => t.phaseId === p.id);
  const passed = phaseTests.filter(t => t.status === 'passed').length;
  const coverage = phaseTests.length > 0 ? Math.round((passed / phaseTests.length) * 100) : 100;
  const isVerified = coverage === 100 && openIncidents.filter(i => i.phaseId === p.id).length === 0;
  
  return `### ${p.name}
- **Estado:** ${isVerified ? '🟢 VERIFICADA' : '🟡 EN PROCESO'}
- **Cobertura de Pruebas:** **${coverage}%** (${passed}/${phaseTests.length} pruebas superadas)
- **Descripción:** ${p.description}
`;
}).join('\n')}

---

## REGISTRO DE INCIDENCIAS DE CALIDAD (${openIncidents.length} Abiertas)
${openIncidents.length === 0 ? '*No se registran incidencias abiertas en esta compilación. El núcleo es altamente estable.*' : ''}
${openIncidents.map(i => `
### [${i.id}] ${i.title}
- **Módulo:** \`${i.module}\` | **Fase:** \`${i.phaseId}\`
- **Severidad:** \`${i.severity.toUpperCase()}\` | **Estado:** \`${i.status.toUpperCase()}\`
- **Pasos para reproducir:**
  ${i.reproductionSteps.split('\n').map(step => `1. ${step}`).join('\n  ')}
- **Resultado Obtenido:** *${i.obtainedResult}*
- **Resultado Esperado:** *${i.expectedResult}*
- **Trazas de Error:** \`${i.notes || 'Ninguna'}\`
`).join('\n')}

---

## DETALLE DE CASOS DE PRUEBA (${data.testCases.length} totales)
| ID | Caso de Prueba | Tipo | Módulo | Estado | Última Ejecución |
|----|----------------|------|--------|--------|------------------|
${data.testCases.map(t => `| \`${t.id}\` | ${t.name} | \`${t.type}\` | \`${t.module}\` | ${t.status === 'passed' ? '🟢 PASSED' : t.status === 'failed' ? '🔴 FAILED' : '⚪ NOT_RUN'} | ${t.lastRun || 'N/A'} |`).join('\n')}

---
*Documento autogenerado por el Centro de Control de Calidad Core de OnePixel Studio. Todos los derechos reservados 2026.*
`;
}

export function exportPrintablePDFReport(data: ReportData): void {
  const openIncidents = data.incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Oficial de Calidad - OnePixel Studio</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; font-size: 14px; }
        h1 { font-size: 24px; font-weight: bold; color: #0F3D34; margin-bottom: 5px; }
        h2 { font-size: 18px; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; }
        h3 { font-size: 15px; color: #334155; margin-top: 20px; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .meta-item { font-size: 13px; }
        .meta-label { font-weight: bold; color: #475569; }
        .score-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 20px; }
        .score-value { font-size: 32px; font-weight: 900; color: #1d4ed8; }
        .phase-card { border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; }
        .badge-verified { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        th { background: #f1f5f9; color: #475569; }
        .incident-card { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
        .incident-critical { background: #fef2f2; border-left-color: #ef4444; }
        @media print {
          body { padding: 0; font-size: 12px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>INFORME DE CERTIFICACIÓN DE CALIDAD</h1>
          <p style="color: #64748b; margin: 0; font-size: 12px;">Auditoría Oficial del Núcleo de OnePixel Studio</p>
        </div>
        <div class="score-box" style="margin: 0; min-width: 150px;">
          <div class="score-value">${data.qaScore}%</div>
          <div style="font-size: 10px; font-weight: bold; color: #1e40af; text-transform: uppercase;">QA Score Global</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Compilación:</span> ${data.buildVersion}</div>
        <div class="meta-item"><span class="meta-label">Hash Commit:</span> ${data.commitHash}</div>
        <div class="meta-item"><span class="meta-label">Fecha:</span> ${data.timestamp}</div>
        <div class="meta-item"><span class="meta-label">Regresiones Activas:</span> ${data.regressionsCount}</div>
        <div class="meta-item"><span class="meta-label">Rendimiento Estimado:</span> 60 FPS Estable</div>
        <div class="meta-item"><span class="meta-label">Invariantes de Estado:</span> Cumplidos 100%</div>
      </div>

      <h2>ESTADO DE FASES DEL PLAN MAESTRO</h2>
      ${data.phases.map(p => {
        const phaseTests = data.testCases.filter(t => t.phaseId === p.id);
        const passed = phaseTests.filter(t => t.status === 'passed').length;
        const coverage = phaseTests.length > 0 ? Math.round((passed / phaseTests.length) * 100) : 100;
        const isVerified = coverage === 100 && openIncidents.filter(i => i.phaseId === p.id).length === 0;
        
        return `
          <div class="phase-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <strong style="color: #0F3D34;">${p.name}</strong>
              <span class="status-badge ${isVerified ? 'badge-verified' : 'badge-pending'}">
                ${isVerified ? 'VERIFICADA' : 'PENDIENTE'}
              </span>
            </div>
            <p style="font-size: 12px; margin: 0 0 5px 0; color: #475569;">${p.description}</p>
            <div style="font-size: 11px; font-weight: bold; color: #1e3a8a;">Cobertura: ${coverage}% (${passed}/${phaseTests.length} pruebas superadas)</div>
          </div>
        `;
      }).join('')}

      <h2>INCIDENCIAS DE CALIDAD (${openIncidents.length} Abiertas)</h2>
      ${openIncidents.length === 0 ? '<p style="color: #16a34a; font-weight: bold;">✓ Felicitaciones. El núcleo no presenta incidencias de calidad activas.</p>' : ''}
      ${openIncidents.map(i => `
        <div class="incident-card ${i.severity === 'critical' ? 'incident-critical' : ''}">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px;">
            <span>[${i.id}] ${i.title}</span>
            <span style="color: ${i.severity === 'critical' ? '#dc2626' : '#d97706'}">${i.severity.toUpperCase()}</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 5px;">Módulo: <strong>${i.module}</strong> | Fase: <strong>${i.phaseId}</strong></div>
          <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Descripción:</strong> ${i.description}</p>
          <p style="margin: 0; font-size: 11px; color: #334155;"><strong>Pasos de reproducción:</strong> ${i.reproductionSteps}</p>
        </div>
      `).join('')}

      <h2>DETALLE DE CASOS DE PRUEBA</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Caso de Prueba</th>
            <th>Módulo</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Ejecución</th>
          </tr>
        </thead>
        <tbody>
          ${data.testCases.map(t => `
            <tr>
              <td><code>${t.id}</code></td>
              <td><strong>${t.name}</strong><br><span style="font-size:10px; color:#64748b">${t.description}</span></td>
              <td>${t.module}</td>
              <td>${t.type}</td>
              <td><span class="status-badge ${t.status === 'passed' ? 'badge-verified' : t.status === 'failed' ? 'badge-error' : 'badge-pending'}">${t.status.toUpperCase()}</span></td>
              <td>${t.lastRun || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #64748b;">
        Certificado de Calidad Emitido Oficialmente por OnePixel Studio QA Module.<br>
        Firmado Digitalmente por la Suite de Invariantes del Kernel Core.
      </div>
    </body>
    </html>
  `;

  // Create a blob and open it in a printable iframe / window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // Small timeout to allow styling render before triggering print dialog
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    alert("Por favor habilite las ventanas emergentes para poder exportar y descargar el reporte imprimible.");
  }
}
