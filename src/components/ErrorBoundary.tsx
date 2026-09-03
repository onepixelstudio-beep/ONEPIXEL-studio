import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetry } from '../utils/telemetry';
import { translate } from '../i18n';
import { LocalPersistence } from '../utils/persistence/LocalPersistence';

export type ErrorSeverity = 'Warning' | 'Recoverable' | 'Serious' | 'Critical';

export function classifyError(
  error: Error | null | string,
  details?: {
    isReactComponentError?: boolean;
    isGlobalEvent?: boolean;
    isUnhandledRejection?: boolean;
    filename?: string;
    lineno?: number;
    colno?: number;
  }
): ErrorSeverity {
  const msg = typeof error === 'string' ? error : (error?.message || '');
  const stack = typeof error === 'object' && error ? error?.stack || '' : '';

  // 1. Explicitly benign/known non-fatal messages -> Warning
  if (
    msg.includes('ResizeObserver loop completed with undelivered notifications') ||
    msg.includes('ResizeObserver loop limit exceeded') ||
    msg.includes('WebSocket closed without opened') ||
    msg.includes('failed to connect to websocket') ||
    msg.includes('[vite] failed to connect') ||
    (msg.includes('Script error.') && (!stack || stack.trim() === ''))
  ) {
    return 'Warning';
  }

  // 2. Known network / fetch / transient async errors -> Recoverable
  if (
    msg.includes('NetworkError') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Load failed') ||
    msg.includes('The fetching process was aborted') ||
    msg.includes('AbortError') ||
    msg.includes('QuotaExceededError')
  ) {
    return 'Recoverable';
  }

  // 3. Unhandled React component tree exception -> Critical
  if (details?.isReactComponentError) {
    return 'Critical';
  }

  // 4. Global unhandled runtime errors / promise rejections -> Serious
  if (details?.isGlobalEvent || details?.isUnhandledRejection) {
    return 'Serious';
  }

  return 'Serious';
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  severity: ErrorSeverity;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    severity: 'Critical'
  };

  private globalErrorListener: ((ev: ErrorEvent) => void) | null = null;
  private globalRejectionListener: ((ev: PromiseRejectionEvent) => void) | null = null;

  public static getDerivedStateFromError(error: Error): State {
    const severity = classifyError(error, { isReactComponentError: true });
    if (severity === 'Warning') {
      return { hasError: false, error: null, errorInfo: null, severity: 'Warning' };
    }
    return { hasError: true, error, errorInfo: null, severity };
  }

  private generateReport(error: Error | null, errorInfo: ErrorInfo | null, severity: ErrorSeverity = 'Critical') {
    const lastKnownState = telemetry.getLastKnownState() || {};
    const auditTrail = telemetry.getAuditTrail();
    
    return {
      appName: "OnePixel Studio",
      appVersion: "1.4.0-diagnostics",
      timestamp: new Date().toISOString(),
      severity,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screen: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      } : null,
      error: {
        name: error?.name || 'UnknownError',
        message: error?.message || 'No error message available',
        stack: error?.stack || 'No JS stack trace available',
        componentStack: errorInfo?.componentStack || 'No component stack trace available',
        details: (error as any)?.details || null
      },
      lastKnownState,
      auditTrail: auditTrail.slice(-100) // Last 100 actions of the Audit Trail
    };
  }

  private saveReportLocally(error: Error | null, errorInfo: ErrorInfo | null, severity: ErrorSeverity = 'Critical', isFatal: boolean = true) {
    try {
      const report = this.generateReport(error, errorInfo, severity);
      if (isFatal) {
        localStorage.setItem('pixel_art_crash_report', JSON.stringify(report, null, 2));
        (window as any).lastCrashReport = report;
      }
      (window as any).lastDiagnosticsReport = report;
      console.log(`[DIAGNOSTICS REPORT - Severity: ${severity}, Fatal: ${isFatal}]`, report);
    } catch (e) {
      console.error('Failed to auto-save crash report to localStorage:', e);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const severity = classifyError(error, { isReactComponentError: true });

    if (severity === 'Warning') {
      console.warn('[REACT EXCEPTION IGNORED AS BENIGN WARNING]', error.message);
      telemetry.logAction('WARNING_REACT', error.message, {
        name: error.name,
        severity: 'Warning'
      });
      this.setState({ hasError: false, error: null, errorInfo: null, severity: 'Warning' });
      return;
    }

    console.error(`--- UNCAUGHT REACT EXCEPTION [Severity: ${severity}] ---`);
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Add crash log entry
    telemetry.logAction(`CRASH_REACT_${severity.toUpperCase()}`, error.message, {
      name: error.name,
      severity,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Mark unexpected closure / crash in localStorage for recovery
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('onepixel_crash_detected', 'true');
        window.localStorage.setItem('onepixel_clean_exit', 'false');
      }
    } catch (storageErr) {
      console.warn('Failed to record crash state in localStorage:', storageErr);
    }

    this.setState({ errorInfo, severity }, () => {
      this.saveReportLocally(error, errorInfo, severity, true);
    });
  }

  public componentDidMount() {
    this.globalErrorListener = (event: ErrorEvent) => {
      const err = event.error || new Error(event.message || 'Error global sin detalles');
      const severity = classifyError(err, {
        isGlobalEvent: true,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });

      if (severity === 'Warning') {
        console.warn('[GLOBAL ONERROR FILTERED AS WARNING]', err.message || event.message);
        telemetry.logAction('GLOBAL_ERROR_WARNING', err.message || event.message, {
          severity: 'Warning',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        return;
      }

      console.error(`[GLOBAL ONERROR LOGGED - Severity: ${severity}]`, err.message);
      telemetry.logAction(`GLOBAL_ERROR_${severity.toUpperCase()}`, err.message, {
        severity,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: err.stack
      });

      // Global events strictly registered & telemetered WITHOUT setting hasError: true
      this.saveReportLocally(err, null, severity, false);
    };

    this.globalRejectionListener = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason || 'Rechazo de promesa no controlado'));
      const severity = classifyError(err, { isGlobalEvent: true, isUnhandledRejection: true });

      if (severity === 'Warning') {
        console.warn('[UNHANDLED REJECTION FILTERED AS WARNING]', err.message);
        telemetry.logAction('UNHANDLED_REJECTION_WARNING', err.message, { severity: 'Warning' });
        return;
      }

      console.error(`[UNHANDLED REJECTION LOGGED - Severity: ${severity}]`, err.message);
      telemetry.logAction(`UNHANDLED_REJECTION_${severity.toUpperCase()}`, err.message, {
        severity,
        stack: err.stack
      });

      // Unhandled rejections strictly registered & telemetered WITHOUT setting hasError: true
      this.saveReportLocally(err, null, severity, false);
    };

    window.addEventListener('error', this.globalErrorListener);
    window.addEventListener('unhandledrejection', this.globalRejectionListener);
  }

  public componentWillUnmount() {
    if (this.globalErrorListener) {
      window.removeEventListener('error', this.globalErrorListener);
    }
    if (this.globalRejectionListener) {
      window.removeEventListener('unhandledrejection', this.globalRejectionListener);
    }
  }

  private handleReset = () => {
    try {
      // Preserve legal consent records, installation flags, and user preferences
      const legalRecord = localStorage.getItem('onepixel_legal_consent_record');
      const termsAccepted = localStorage.getItem('onepixel_terms_accepted');
      const installedConsent = localStorage.getItem('onepixel_installed_consent');
      const prefs = localStorage.getItem('pixel_art_preferences');

      localStorage.clear();

      if (legalRecord) localStorage.setItem('onepixel_legal_consent_record', legalRecord);
      if (termsAccepted) localStorage.setItem('onepixel_terms_accepted', termsAccepted);
      if (installedConsent) localStorage.setItem('onepixel_installed_consent', installedConsent);
      if (prefs) localStorage.setItem('pixel_art_preferences', prefs);
    } catch (e) {
      console.warn('Error in ErrorBoundary handleReset:', e);
    }
    window.location.reload();
  };

  private handleDownloadReport = () => {
    try {
      const report = this.generateReport(this.state.error, this.state.errorInfo, this.state.severity);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `crash-report-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      telemetry.logAction('DIAGNOSTICS_DOWNLOAD', 'User downloaded diagnostics JSON');
    } catch (e) {
      console.error('Failed to trigger report download:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      let auditTrail: any[] = [];
      let stateInfo: any = {
        projectId: '',
        projectName: 'Ninguno',
        canvasWidth: 0,
        canvasHeight: 0,
        activeTool: 'Ninguna',
        activeTabId: 'Ninguna',
        layersCount: 0,
        framesCount: 0,
        zoomLevel: 100,
        panX: 0,
        panY: 0,
        undoStackSize: 0,
        redoStackSize: 0,
        activeFrameId: '',
        activeFrameIndex: -1,
        activeLayerId: '',
        activeLayerIndex: -1,
        selectionActive: false,
        selectionPixelsCount: 0,
        completeProjectState: null,
        completeTabsState: null,
        activeBuffers: []
      };

      try {
        if (telemetry) {
          const trail = telemetry.getAuditTrail();
          if (Array.isArray(trail)) {
            auditTrail = trail.slice(-100);
          }
          const info = telemetry.getLastKnownState();
          if (info) {
            stateInfo = { ...stateInfo, ...info };
          }
        }
      } catch (telemetryErr) {
        console.error('ErrorBoundary: Failed to read telemetry safely', telemetryErr);
      }

      const lang = LocalPersistence.getItem<any>('pixel_art_preferences')?.language || 'es';

      return (
        <div className="min-h-screen bg-[#102419] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-4xl w-full bg-[#15162a] border border-red-500/40 rounded-xl p-8 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 text-red-400">
              <svg className="w-8 h-8 shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{translate('diagnostics.errorBoundaryTitle', lang) || 'Excepción Crítica Detectada — Modo Diagnóstico Activo'}</h1>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                    this.state.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
                    this.state.severity === 'Serious' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                    this.state.severity === 'Recoverable' ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/50'
                  }`}>
                    {this.state.severity}
                  </span>
                </div>
                <p className="text-xs text-red-400/80 mt-0.5">{translate('diagnostics.errorBoundarySubtitle', lang) || 'El sistema se ha suspendido de forma segura para evitar corrupción de datos.'}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {translate('diagnostics.errorBoundaryDesc', lang) || 'El renderizado de la interfaz se interrumpió. El sistema de diagnóstico ha capturado los datos de ejecución en tiempo real.'}
            </p>

            {/* Grid of Last Known State (Requirement 1) */}
            <div className="mb-6 bg-[#0F3D34] rounded-lg p-5 border border-slate-800/80">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">{translate('diagnostics.editorEvidenceTitle', lang) || 'Último Estado Registrado del Editor (Evidencia)'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('headerMenu.project', lang) || 'Proyecto'}</span>
                  <span className="font-semibold text-slate-200 truncate block" title={stateInfo.projectName || translate('common.none', lang)}>
                    {stateInfo.projectName || translate('common.none', lang)}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.canvasDimensions', lang) || 'Dimensiones Lienzo'}</span>
                  <span className="font-semibold text-slate-200">
                    {stateInfo.canvasWidth > 0 ? `${stateInfo.canvasWidth}x${stateInfo.canvasHeight}` : translate('common.none', lang)}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.activeTool', lang) || 'Herramienta Activa'}</span>
                  <span className="font-semibold text-slate-200 capitalize">{stateInfo.activeTool || translate('common.none', lang)}</span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.zoomLevel', lang) || 'Nivel de Zoom'}</span>
                  <span className="font-semibold text-slate-200">{Math.round(stateInfo.zoomLevel || 100)}%</span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('timeline.layers', lang) || 'Capas'} / {translate('timeline.frames', lang) || 'Fotogramas'}</span>
                  <span className="font-semibold text-slate-200">{stateInfo.layersCount || 0} / {stateInfo.framesCount || 0}</span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.tabId', lang) || 'ID de Pestaña'}</span>
                  <span className="font-semibold text-slate-200 truncate block" title={stateInfo.activeTabId || translate('common.none', lang)}>
                    {stateInfo.activeTabId || translate('common.none', lang)}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.cameraPan', lang) || 'Cámara Pan'}</span>
                  <span className="font-semibold text-slate-200">X: {Math.round(stateInfo.panX || 0)}, Y: {Math.round(stateInfo.panY || 0)}</span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{translate('diagnostics.browser', lang) || 'Navegador'}</span>
                  <span className="font-semibold text-slate-200 truncate block" title={typeof navigator !== 'undefined' ? navigator.userAgent : translate('common.unknown', lang)}>
                    {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : translate('common.unknown', lang)}
                  </span>
                </div>
                {/* Priority 2 Extended Diagnostic Indicators */}
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Capa Activa</span>
                  <span className="font-semibold text-slate-200 truncate block" title={stateInfo.activeLayerId || 'Ninguna'}>
                    {stateInfo.activeLayerId ? `${stateInfo.activeLayerId} (Ind: ${stateInfo.activeLayerIndex ?? -1})` : 'Ninguna'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Frame Activo</span>
                  <span className="font-semibold text-slate-200 truncate block" title={stateInfo.activeFrameId || 'Ninguno'}>
                    {stateInfo.activeFrameId ? `${stateInfo.activeFrameId} (Ind: ${stateInfo.activeFrameIndex ?? -1})` : 'Ninguno'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Historial Deshacer</span>
                  <span className="font-semibold text-slate-200">
                    Undo: {stateInfo.undoStackSize || 0} / Redo: {stateInfo.redoStackSize || 0}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Estado Selección</span>
                  <span className="font-semibold text-slate-200">
                    {stateInfo.selectionActive ? `Activa (${stateInfo.selectionPixelsCount || 0} px)` : 'Inactiva'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Pestañas Abiertas</span>
                  <span className="font-semibold text-slate-200">
                    {stateInfo.completeTabsState ? `${stateInfo.completeTabsState.length} Activas` : 'No definido'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60">
                  <span className="text-slate-400 block mb-1">Memoria Estimada</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {stateInfo.estimatedMemoryMetrics?.historyMemory ? `${stateInfo.estimatedMemoryMetrics.historyMemory.approximateKB || 0} KB` : '0 KB'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60 col-span-2">
                  <span className="text-slate-400 block mb-1">Buffers de Canvas Activos</span>
                  <span className="font-semibold text-sky-400 truncate block text-[11px] font-mono" title={stateInfo.activeBuffers?.join(', ') || 'Ninguno'}>
                    {stateInfo.activeBuffers && stateInfo.activeBuffers.length > 0 ? stateInfo.activeBuffers.join(' | ') : 'Ninguno'}
                  </span>
                </div>
                <div className="bg-[#121326] p-2.5 rounded border border-slate-800/60 col-span-2 md:col-span-4">
                  <span className="text-slate-400 block mb-1">Última Acción Ejecutada</span>
                  <span className="font-semibold text-amber-400 truncate block" title={stateInfo.lastActionExecuted || 'Ninguna'}>
                    {stateInfo.lastActionExecuted || 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error logs, stack trace, and audit logs */}
            <div className="bg-[#102419] rounded-lg p-5 border border-slate-800 font-mono text-xs overflow-auto max-h-[400px] space-y-4 mb-6 select-all">
              <div>
                <span className="text-red-400 font-bold">[Nombre del Error]:</span>{' '}
                <span className="text-slate-200 font-semibold">{this.state.error?.name || 'Error'}</span>
              </div>
              
              <div>
                <span className="text-red-400 font-bold">[Mensaje]:</span>{' '}
                <span className="text-slate-200">{this.state.error?.message || 'Sin mensaje de error'}</span>
              </div>

              {this.state.error?.stack && (
                <div>
                  <span className="text-amber-400 font-bold">[Pila de llamadas JS (Stack Trace)]:</span>
                  <pre className="mt-1 text-slate-400 whitespace-pre overflow-x-auto leading-relaxed tab-size-4 max-h-40 overflow-y-auto bg-[#0F3D34] p-3 rounded border border-slate-900">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              {this.state.errorInfo?.componentStack && (
                <div>
                  <span className="text-[#C8A96A] font-bold">[Pila de componentes React (Component Stack)]:</span>
                  <pre className="mt-1 text-slate-400 whitespace-pre overflow-x-auto leading-relaxed max-h-40 overflow-y-auto bg-[#0F3D34] p-3 rounded border border-slate-900">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {auditTrail.length > 0 && (
                <div>
                  <span className="text-emerald-400 font-bold">[Historial de Acciones Recientes (Audit Trail - Últimas {auditTrail.length})]:</span>
                  <div className="mt-2 space-y-1 bg-[#102419] rounded p-3 border border-slate-900/60 font-mono text-[11px] leading-tight max-h-48 overflow-y-auto">
                    {auditTrail.map((log, index) => (
                      <div key={index} className="text-slate-300 border-b border-slate-900/40 pb-1 last:border-0 hover:bg-slate-950/30">
                        <span className="text-slate-500">[{log.timestamp ? log.timestamp.split('T')[1].slice(0, -1) : '00:00:00'}]</span>{' '}
                        <span className="text-sky-400">[{log.category || 'INFO'}]</span>{' '}
                        <span className="text-amber-300">{log.action || 'Unknown'}</span>
                        {log.details && (
                          <span className="text-slate-400 ml-1 font-sans text-[10px]">
                            {(() => {
                              try {
                                return JSON.stringify(log.details);
                              } catch (_) {
                                return '[Objeto Complejo]';
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                id="download-crash-report-btn"
                onClick={this.handleDownloadReport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Informe de Diagnóstico (crash-report.json)
              </button>
              
              <button
                id="reset-state-btn"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
              >
                Limpiar Memoria Local y Recargar
              </button>
              
              <button
                id="reload-btn"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#1b1d39] hover:bg-[#25284e] active:bg-[#121325] text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                Intentar Solo Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
