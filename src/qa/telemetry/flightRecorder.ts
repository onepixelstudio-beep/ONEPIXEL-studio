/**
 * Low-Impact QA Flight Recorder & Audit Logger.
 * Strictly adheres to 0 resource consumption when deactivated.
 */

export interface TelemetryData {
  canvasRenderTimesMs: number[];
  brushStrokeTimesMs: number[];
  historyMemoryBytes: number;
  exportTimesMs: { [key: string]: number[] };
  importTimesMs: { [key: string]: number[] };
  reactRenderCount: number;
  animationPlaybackMemoryUsageBytes: number[];
}

export class FlightRecorder {
  private data: TelemetryData = {
    canvasRenderTimesMs: [],
    brushStrokeTimesMs: [],
    historyMemoryBytes: 0,
    exportTimesMs: { PNG: [], GIF: [], APNG: [], SpriteSheet: [] },
    importTimesMs: { PNG: [], PSD: [], ORA: [], ASEPRITE: [] },
    reactRenderCount: 0,
    animationPlaybackMemoryUsageBytes: []
  };

  private lastKnownState: any = {
    status: 'Initializing',
    hasProject: false,
    projectId: null,
    projectName: null,
    canvasWidth: 0,
    canvasHeight: 0,
    activeTool: '',
    activeTabId: '',
    layersCount: 0,
    framesCount: 0,
    zoomLevel: 100,
    panX: 0,
    panY: 0,
    undoStackSize: 0,
    redoStackSize: 0,
    activeFrameIndex: -1,
    activeLayerIndex: -1,
    lastActionExecuted: 'None',
    selectionActive: false,
    selectionPixelsCount: 0,
    completeProjectState: null,
    completeTabsState: null,
    completeSelectionState: null,
    estimatedMemoryMetrics: null,
    activeBuffers: []
  };

  private auditLogs: {
    timestamp: string;
    relativeTimeMs: number;
    category: string;
    action: string;
    details?: any;
  }[] = [];
  private startTime = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).performanceMetrics = this;
      (window as any).getTelemetryAuditTrail = () => this.getAuditTrail();
      (window as any).getTelemetryLastKnownState = () => this.getLastKnownState();
      (window as any).checkTelemetryInvariant = (cond: boolean, msg: string, details?: any) => this.checkInvariant(cond, msg, details);
    }
  }

  // Check if QA Mode is active in the window context
  private isActive(): boolean {
    if (typeof window !== 'undefined') {
      return !!(window as any).__qaModeEnabled__;
    }
    return false;
  }

  public updateLastKnownState(state: Partial<typeof this.lastKnownState>) {
    if (!this.isActive()) return;
    this.lastKnownState = { ...this.lastKnownState, ...state };
  }

  public getLastKnownState() {
    if (!this.isActive()) {
      return {
        status: 'Suspended',
        hasProject: false,
        projectId: null,
        projectName: null,
        canvasWidth: 0,
        canvasHeight: 0,
        activeTool: '',
        activeTabId: '',
        layersCount: 0,
        framesCount: 0,
        zoomLevel: 100,
        panX: 0,
        panY: 0,
        undoStackSize: 0,
        redoStackSize: 0,
        activeFrameIndex: -1,
        activeLayerIndex: -1,
        lastActionExecuted: 'None',
        selectionActive: false,
        selectionPixelsCount: 0,
        completeProjectState: null,
        completeTabsState: null,
        completeSelectionState: null,
        estimatedMemoryMetrics: null,
        activeBuffers: []
      };
    }

    const state = { ...this.lastKnownState };
    if (!state.projectId) {
      state.status = 'WaitingProject';
      state.hasProject = false;
    } else {
      state.status = 'Ready';
      state.hasProject = true;
    }
    return state;
  }

  public checkInvariant(condition: boolean, message: string, details?: any) {
    if (!condition) {
      const errorMsg = `[INVARIANT VIOLATION]: ${message}`;
      console.error(`%c${errorMsg}`, 'color: #ff3333; font-weight: bold; font-size: 13px;', details);
      
      this.logAction('INVARIANT_VIOLATION', message, {
        ...details,
        lastKnownState: this.getLastKnownState()
      });
      
      const error = new Error(errorMsg);
      error.name = 'InvariantViolationError';
      (error as any).details = details;
      (error as any).lastKnownState = this.getLastKnownState();
      throw error;
    }
  }

  public logAction(category: string, action: string, details?: any) {
    if (!this.isActive()) return; // ZERO memory overhead when inactive
    
    const entry = {
      timestamp: new Date().toISOString(),
      relativeTimeMs: Date.now() - this.startTime,
      category,
      action,
      details
    };
    
    this.auditLogs.push(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.shift();
    }
    this.updateLastKnownState({ lastActionExecuted: `[${category}] ${action}` });
    
    // Print to developer tools in real-time
    console.log(`%c[AUDIT] [${category}] ${action}`, 'color: #3b82f6; font-weight: bold;', details || '');
  }

  public getAuditTrail() {
    if (!this.isActive()) return [];
    return this.auditLogs;
  }

  public recordCanvasRender(timeMs: number) {
    if (!this.isActive()) return;
    this.data.canvasRenderTimesMs.push(timeMs);
    if (this.data.canvasRenderTimesMs.length > 100) this.data.canvasRenderTimesMs.shift();
  }

  public recordBrushStroke(timeMs: number) {
    if (!this.isActive()) return;
    this.data.brushStrokeTimesMs.push(timeMs);
    if (this.data.brushStrokeTimesMs.length > 100) this.data.brushStrokeTimesMs.shift();
  }

  public updateHistoryMemory(bytes: number) {
    if (!this.isActive()) return;
    this.data.historyMemoryBytes = bytes;
  }

  public recordExport(format: string, timeMs: number) {
    if (!this.isActive()) return;
    if (!this.data.exportTimesMs[format]) {
      this.data.exportTimesMs[format] = [];
    }
    this.data.exportTimesMs[format].push(timeMs);
  }

  public recordImport(format: string, timeMs: number) {
    if (!this.isActive()) return;
    if (!this.data.importTimesMs[format]) {
      this.data.importTimesMs[format] = [];
    }
    this.data.importTimesMs[format].push(timeMs);
  }

  public incrementReactRender() {
    if (!this.isActive()) return;
    this.data.reactRenderCount++;
  }

  public recordAnimationMemory(bytes: number) {
    if (!this.isActive()) return;
    this.data.animationPlaybackMemoryUsageBytes.push(bytes);
    if (this.data.animationPlaybackMemoryUsageBytes.length > 100) {
      this.data.animationPlaybackMemoryUsageBytes.shift();
    }
  }

  public getMetricsSummary() {
    if (!this.isActive()) {
      return {
        canvasRender: { count: 0, avgMs: 0, maxMs: 0 },
        brushStroke: { count: 0, avgMs: 0, maxMs: 0 },
        historyMemory: { approximateBytes: 0, approximateKB: 0 },
        exports: {},
        imports: {},
        reactRendersCount: 0,
        animationMemory: { count: 0, avgBytes: 0, maxBytes: 0 }
      };
    }

    const average = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
    const max = (arr: number[]) => arr.length ? Math.max(...arr) : 0;

    const exportsSum: { [key: string]: string } = {};
    Object.keys(this.data.exportTimesMs).forEach(fmt => {
      const arr = this.data.exportTimesMs[fmt];
      exportsSum[fmt] = arr.length ? `${average(arr)}ms (avg) / ${max(arr)}ms (max)` : 'No data';
    });

    const importsSum: { [key: string]: string } = {};
    Object.keys(this.data.importTimesMs).forEach(fmt => {
      const arr = this.data.importTimesMs[fmt];
      importsSum[fmt] = arr.length ? `${average(arr)}ms (avg) / ${max(arr)}ms (max)` : 'No data';
    });

    return {
      canvasRender: {
        count: this.data.canvasRenderTimesMs.length,
        avgMs: average(this.data.canvasRenderTimesMs),
        maxMs: max(this.data.canvasRenderTimesMs)
      },
      brushStroke: {
        count: this.data.brushStrokeTimesMs.length,
        avgMs: average(this.data.brushStrokeTimesMs),
        maxMs: max(this.data.brushStrokeTimesMs)
      },
      historyMemory: {
        approximateBytes: this.data.historyMemoryBytes,
        approximateKB: parseFloat((this.data.historyMemoryBytes / 1024).toFixed(2))
      },
      exports: exportsSum,
      imports: importsSum,
      reactRendersCount: this.data.reactRenderCount,
      animationMemory: {
        count: this.data.animationPlaybackMemoryUsageBytes.length,
        avgBytes: average(this.data.animationPlaybackMemoryUsageBytes),
        maxBytes: max(this.data.animationPlaybackMemoryUsageBytes)
      }
    };
  }

  public printSummary() {
    if (!this.isActive()) return;
    console.group('📊 OnePixel Studio Performance Audit Summary');
    console.table(this.getMetricsSummary());
    console.groupEnd();
  }

  public reportFatalError(error: unknown, context?: string) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (context) {
      (err as any).details = { ...((err as any).details || {}), context };
    }
    console.error(`[EXPLICIT EXCEPTION REPORTED: ${context || 'General'}]`, err);
    
    // Save last crash event in localStorage for executive dashboard
    if (typeof window !== 'undefined') {
      localStorage.setItem('onepixel_qa_last_crash', JSON.stringify({
        message: err.message,
        context: context || 'General',
        timestamp: new Date().toISOString(),
        stack: err.stack
      }));
    }

    if (!this.isActive()) {
      // Just throw error event so boundary acts
      const errorEvent = new ErrorEvent('error', {
        error: err,
        message: err.message,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(errorEvent);
      return;
    }

    this.logAction('CRASH_EXPLICIT_REPORT', err.message, {
      context,
      stack: err.stack,
      details: (err as any).details
    });

    const errorEvent = new ErrorEvent('error', {
      error: err,
      message: err.message,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(errorEvent);
  }
}

export const flightRecorder = new FlightRecorder();
