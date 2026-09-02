import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { telemetry } from '../../utils/telemetry';

export interface ErrorBoundaryProps {
  children: ReactNode;
  subsystem?: string;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const subsystem = this.props.subsystem || 'UnspecifiedSubsystem';
    console.error(`[Resilience Boundary] Exception isolated in subsystem: ${subsystem}`, error, errorInfo);

    try {
      telemetry.logAction('SUBSYSTEM_CRASH', `Isolated crash in ${subsystem}`, {
        subsystem,
        errorMessage: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      });
    } catch (e) {
      // Ignore telemetry errors
    }

    this.setState({ errorInfo });
  }

  private handleReset = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.error('Error executing reset callback:', e);
      }
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error || new Error('Component Error'), this.handleReset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const subsystem = this.props.subsystem || 'Módulo del Editor';
      const errorMessage = this.state.error?.message || 'Se produjo una excepción inesperada en este componente.';

      return (
        <div 
          className="w-full h-full min-h-[120px] bg-[#091E19] border border-[#0F3D34] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #091E19 0%, #0F3D34 100%)' }}
        >
          <div className="flex items-center gap-2 mb-2 text-[#C8A96A]">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              Aislamiento de Componente ({subsystem})
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-md mb-3 font-sans line-clamp-2">
            {errorMessage}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F3D34] hover:bg-[#102419] border border-[#C8A96A]/60 text-xs font-semibold text-amber-200 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reiniciar Módulo
            </button>
            <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Entorno Seguro Ativo
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Subsystem-specific boundary helper components
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary subsystem="AppRoot">{children}</ErrorBoundary>
);

export const HeaderBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary subsystem="Header">{children}</ErrorBoundary>
);

export const SidebarBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary subsystem="Sidebar">{children}</ErrorBoundary>
);

export const CanvasBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary subsystem="Canvas">{children}</ErrorBoundary>
);

export const TimelineBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary subsystem="Timeline">{children}</ErrorBoundary>
);

export default ErrorBoundary;
