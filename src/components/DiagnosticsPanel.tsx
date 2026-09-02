import React, { useState, useEffect } from 'react';
import { 
  X, Cpu, Activity, Download, AlertTriangle, CheckCircle, 
  RefreshCw, Terminal, Eye, Palette, Layers, HelpCircle
} from 'lucide-react';
import { telemetry } from '../utils/telemetry';
import { PixelProject } from '../types';
import { translate, LanguageCode } from '../i18n';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language?: LanguageCode;
  project: PixelProject | null;
  undoStackLength: number;
  redoStackLength: number;
  activeTool: string;
  selectedFrameId: string;
  selectedLayerId: string;
  onSimulateCrash: () => void;
}

export default function DiagnosticsPanel({
  isOpen,
  onClose,
  language = 'es',
  project,
  undoStackLength,
  redoStackLength,
  activeTool,
  selectedFrameId,
  selectedLayerId,
  onSimulateCrash
}: DiagnosticsPanelProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'audit' | 'invariants' | 'memory'>('metrics');
  const [invariantsStatus, setInvariantsStatus] = useState<{ name: string; status: 'ok' | 'failed'; desc: string }[]>([]);

  const zoom = (telemetry.getLastKnownState() || {}).zoomLevel || 100;

  // Update metrics and logs on open or periodically
  useEffect(() => {
    if (!isOpen) return;

    const updateData = () => {
      setMetrics(telemetry.getMetricsSummary());
      setAuditLogs([...telemetry.getAuditTrail()].reverse().slice(0, 50));
      
      // Calculate active invariants
      if (project) {
        const checks: { name: string; status: 'ok' | 'failed'; desc: string }[] = [
          { 
            name: translate('diagnostics.invDimensions', language), 
            status: (project.width > 0 && project.height > 0) ? 'ok' : 'failed',
            desc: translate('diagnostics.invDimensionsDesc', language, { width: project.width, height: project.height })
          },
          { 
            name: translate('diagnostics.invLayers', language), 
            status: (Array.isArray(project.layers) && project.layers.length > 0) ? 'ok' : 'failed',
            desc: translate('diagnostics.invLayersDesc', language, { count: project.layers.length })
          },
          { 
            name: translate('diagnostics.invFrames', language), 
            status: (Array.isArray(project.frames) && project.frames.length > 0) ? 'ok' : 'failed',
            desc: translate('diagnostics.invFramesDesc', language, { count: project.frames.length })
          },
          { 
            name: translate('diagnostics.invActiveLayer', language), 
            status: (!selectedLayerId || project.layers.some(l => l.id === selectedLayerId)) ? 'ok' : 'failed',
            desc: translate('diagnostics.invActiveLayerDesc', language, { id: selectedLayerId || 'None' })
          },
          { 
            name: translate('diagnostics.invActiveFrame', language), 
            status: (!selectedFrameId || project.frames.some(f => f.id === selectedFrameId)) ? 'ok' : 'failed',
            desc: translate('diagnostics.invActiveFrameDesc', language, { id: selectedFrameId || 'None' })
          }
        ];
        setInvariantsStatus(checks);
      }
    };

    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [isOpen, project, selectedLayerId, selectedFrameId, undoStackLength, redoStackLength, language]);

  if (!isOpen) return null;

  const handleExportFullReport = () => {
    try {
      const stateInfo = telemetry.getLastKnownState() || {};
      const auditTrail = telemetry.getAuditTrail();
      const metricsSummary = telemetry.getMetricsSummary();

      const report = {
        appName: "OnePixel Studio",
        appVersion: "1.4.0-diagnostics",
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        screen: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        } : null,
        reportType: "MANUAL_DIAGNOSTICS_REPORT",
        metrics: metricsSummary,
        lastKnownState: {
          ...stateInfo,
          undoStackSize: undoStackLength,
          redoStackSize: redoStackLength,
          viewport: {
            zoomLevel: zoom,
            activeTool,
            selectedFrameId,
            selectedLayerId
          }
        },
        auditTrail: auditTrail.slice(-100)
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `diagnostics-report-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      telemetry.logAction('DIAGNOSTICS_DOWNLOAD', 'User manually exported complete diagnostics report');
    } catch (e) {
      console.error('Failed to manually download diagnostics report:', e);
    }
  };

  // Helper to calculate estimated memory of the active project in bytes
  const estimateProjectMemory = () => {
    if (!project || !project.pixels) return 0;
    let size = 0;
    try {
      const str = JSON.stringify(project.pixels);
      size = str.length * 2; // UTF-16 characters use 2 bytes
    } catch (e) {}
    return size;
  };

  const projectMemoryBytes = estimateProjectMemory();
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" id="diagnostics-panel-container">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0F3D34]/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-[#102419] border-2 border-emerald-500/30 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans" id="diagnostics-modal">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#102419]/40 flex justify-between items-center bg-[#17182e] shrink-0">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm tracking-tight text-emerald-100 uppercase">{translate('diagnostics.title', language)}</h3>
              <p className="text-[10px] text-slate-400">{translate('diagnostics.subtitle', language)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#25263f] text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Row */}
        <div className="px-6 bg-[#102419] border-b border-[#102419]/20 flex gap-2 overflow-x-auto shrink-0 py-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'metrics' ? 'bg-emerald-600 text-white' : 'hover:bg-[#181930] text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="w-3.5 h-3.5" /> {translate('diagnostics.tabMetrics', language)}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'audit' ? 'bg-emerald-600 text-white' : 'hover:bg-[#181930] text-slate-400 hover:text-slate-200'}`}
          >
            <Terminal className="w-3.5 h-3.5" /> {translate('diagnostics.tabAudit', language)}
          </button>
          <button
            onClick={() => setActiveTab('invariants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'invariants' ? 'bg-emerald-600 text-white' : 'hover:bg-[#181930] text-slate-400 hover:text-slate-200'}`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> {translate('diagnostics.tabInvariants', language)}
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'memory' ? 'bg-emerald-600 text-white' : 'hover:bg-[#181930] text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-3.5 h-3.5" /> {translate('diagnostics.tabMemory', language)}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar bg-[#0f1020]/40">
          
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#16172d] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{translate('diagnostics.canvasRender', language)}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-100">
                      {metrics?.canvasRender?.avgMs || 0}<span className="text-xs text-slate-400">ms</span>
                    </span>
                    <span className="text-xs text-slate-400">avg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {translate('diagnostics.canvasRenderMax', language, { max: metrics?.canvasRender?.maxMs || 0, count: metrics?.canvasRender?.count || 0 })}
                  </div>
                </div>

                <div className="bg-[#16172d] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{translate('diagnostics.brushStrokeDuration', language)}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-100">
                      {metrics?.brushStroke?.avgMs || 0}<span className="text-xs text-slate-400">ms</span>
                    </span>
                    <span className="text-xs text-slate-400">avg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {translate('diagnostics.brushStrokeMax', language, { max: metrics?.brushStroke?.maxMs || 0, count: metrics?.brushStroke?.count || 0 })}
                  </div>
                </div>

                <div className="bg-[#16172d] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{translate('diagnostics.reactRenders', language)}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-emerald-400">
                      {metrics?.reactRendersCount || 0}
                    </span>
                    <span className="text-xs text-slate-400">{translate('diagnostics.cycles', language)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {translate('diagnostics.reactRendersDesc', language)}
                  </div>
                </div>
              </div>

              {/* Viewport and layout status indicators */}
              <div className="bg-[#0F3D34] rounded-xl p-5 border border-slate-800/60">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">{translate('diagnostics.viewportVariables', language)}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-[#121327] p-3 rounded border border-slate-800/40">
                    <span className="text-slate-500 block mb-1">{translate('diagnostics.currentCanvas', language)}</span>
                    <span className="text-slate-200 block font-semibold">{project ? `${project.width}x${project.height}` : 'None'}</span>
                  </div>
                  <div className="bg-[#121327] p-3 rounded border border-slate-800/40">
                    <span className="text-slate-500 block mb-1">{translate('diagnostics.activeTool', language)}</span>
                    <span className="text-slate-200 block font-semibold capitalize">{translate(`toolbar.${activeTool}` as any, language) || activeTool || 'None'}</span>
                  </div>
                  <div className="bg-[#121327] p-3 rounded border border-slate-800/40">
                    <span className="text-slate-500 block mb-1">{translate('diagnostics.canvasZoom', language)}</span>
                    <span className="text-slate-200 block font-semibold">{Math.round(zoom)}%</span>
                  </div>
                  <div className="bg-[#121327] p-3 rounded border border-slate-800/40">
                    <span className="text-slate-500 block mb-1">{translate('diagnostics.undoRedoBuffer', language)}</span>
                    <span className="text-slate-200 block font-semibold">{translate('diagnostics.statesCount', language, { undo: undoStackLength, redo: redoStackLength })}</span>
                  </div>
                </div>
              </div>

              {/* Performance files / import export telemetry */}
              <div className="bg-[#0F3D34] rounded-xl p-5 border border-slate-800/60 space-y-3">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{translate('diagnostics.importExportTimes', language)}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-2 font-semibold">{translate('diagnostics.exportTimes', language)}</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {metrics?.exports && Object.entries(metrics.exports).map(([format, val]) => (
                        <div key={format} className="flex justify-between bg-[#121327] px-3 py-1.5 rounded border border-slate-900">
                          <span className="text-slate-400">{format}</span>
                          <span className="text-slate-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-2 font-semibold">{translate('diagnostics.importTimes', language)}</span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {metrics?.imports && Object.entries(metrics.imports).map(([format, val]) => (
                        <div key={format} className="flex justify-between bg-[#121327] px-3 py-1.5 rounded border border-slate-900">
                          <span className="text-slate-400">{format}</span>
                          <span className="text-slate-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{translate('diagnostics.auditTitle', language)}</h4>
                  <p className="text-[10px] text-slate-500">{translate('diagnostics.auditDesc', language)}</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setAuditLogs([...telemetry.getAuditTrail()].reverse().slice(0, 50))}
                    className="p-1 px-2.5 bg-[#1a1b32] hover:bg-[#252648] text-slate-300 rounded border border-[#102419] font-sans text-[10px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-sky-400" /> {translate('diagnostics.refreshList', language)}
                  </button>
                </div>
              </div>

              <div className="bg-[#05060b] rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-y-auto max-h-[50vh] space-y-1.5 leading-tight shadow-inner">
                {auditLogs.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">{translate('diagnostics.noAuditedActions', language)}</div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div key={index} className="text-slate-300 border-b border-slate-900/50 pb-1.5 last:border-0 hover:bg-slate-950/40 px-1 py-1 rounded transition flex items-start gap-2">
                      <span className="text-slate-500 select-none shrink-0">[{log.timestamp.split('T')[1].slice(0, -1)}]</span>
                      <span className="text-emerald-400 select-none shrink-0 font-bold">[{log.category}]</span>
                      <div className="flex-1">
                        <span className="text-amber-200 font-semibold">{log.action}</span>
                        {log.details && (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5 bg-[#102419] p-1.5 rounded border border-slate-900/60 max-w-full overflow-x-auto whitespace-pre-wrap select-all">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVARIANTS STATUS */}
          {activeTab === 'invariants' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{translate('diagnostics.invariantsTitle', language)}</h4>
                <p className="text-[10px] text-slate-500">{translate('diagnostics.invariantsDesc', language)}</p>
              </div>

              <div className="space-y-3">
                {invariantsStatus.map((item, index) => (
                  <div key={index} className="bg-[#121327] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.status === 'ok' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                        )}
                        <span className={`text-xs font-bold ${item.status === 'ok' ? 'text-slate-200' : 'text-red-300'}`}>
                          {item.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal pl-6">{item.desc}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.status === 'ok' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'}`}>
                      {item.status === 'ok' ? translate('diagnostics.statusPassed', language) : translate('diagnostics.statusFailed', language)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-300 mt-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block mb-0.5">{translate('diagnostics.stabilityNote', language)}</span>
                  {translate('diagnostics.stabilityNoteDesc', language)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEMORY LOG */}
          {activeTab === 'memory' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{translate('diagnostics.memoryTitle', language)}</h4>
                <p className="text-[10px] text-slate-500">{translate('diagnostics.memoryDesc', language)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-[#121327] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{translate('diagnostics.activeCanvasMemory', language)}</span>
                    <span className="text-2xl font-bold text-slate-100">{formatBytes(projectMemoryBytes)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 font-sans leading-relaxed">
                    {translate('diagnostics.canvasMemoryDesc', language)}
                  </p>
                </div>

                <div className="bg-[#121327] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{translate('diagnostics.bufferHistory', language)}</span>
                    <span className="text-2xl font-bold text-slate-100">
                      {undoStackLength + redoStackLength} <span className="text-xs text-slate-400">{translate('diagnostics.statesCount', language, { undo: undoStackLength, redo: redoStackLength })}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 font-sans leading-relaxed">
                    {translate('diagnostics.bufferHistoryDesc', language, { undo: undoStackLength, redo: redoStackLength })}
                  </p>
                </div>
              </div>

              <div className="bg-[#0F3D34] rounded-xl p-5 border border-slate-800/60">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">{translate('diagnostics.frameResourceMapping', language)}</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar font-mono text-[11px] leading-relaxed">
                  {project?.frames && project.frames.map((f, index) => {
                    let frameBytes = 0;
                    if (project.pixels && project.pixels[f.id]) {
                      frameBytes = JSON.stringify(project.pixels[f.id]).length * 2;
                    }
                    return (
                      <div key={f.id} className="flex justify-between items-center bg-[#121327] px-3.5 py-2 rounded border border-slate-900 hover:bg-[#181932]">
                        <span className="text-slate-400">{translate('diagnostics.frameLabel', language, { index: index + 1, name: f.name || `ID ${f.id.slice(0, 5)}...` })}</span>
                        <div className="flex gap-3 text-slate-300">
                          <span>{translate('diagnostics.layersCount', language, { count: project?.layers?.length || 0 })}</span>
                          <span className="text-sky-400 font-bold">{formatBytes(frameBytes)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#102419]/40 bg-[#17182e] flex flex-wrap gap-3 justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleExportFullReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> {translate('diagnostics.exportFullReport', language)}
            </button>

            <button
              id="simulate-crash-btn"
              onClick={onSimulateCrash}
              className="px-4 py-2 bg-red-600/90 hover:bg-red-500 hover:text-white text-red-100 font-bold rounded-lg text-xs transition flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
              title={translate('diagnostics.simulateCrashTooltip', language)}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> {translate('diagnostics.simulateCrash', language)}
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#25263e] hover:bg-[#303254] text-slate-300 font-bold rounded-lg text-xs transition cursor-pointer"
          >
            {translate('diagnostics.closeDiagnostics', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
