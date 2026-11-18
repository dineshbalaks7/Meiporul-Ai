import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EBE1] text-[#9E4A25] flex items-center justify-center mb-4 border border-[#EADBCE] shadow-subtle">
            <AlertCircle className="w-6 h-6 stroke-[2]" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1C1917]">
            Something went wrong
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-[#78716C] max-w-sm leading-relaxed">
            The application encountered a runtime issue during a live module update. Refreshing the session will restore normal operation.
          </p>

          {this.state.error?.message && (
            <div className="mt-4 p-3 rounded-xl bg-[#F7F4EE] border border-[#E8E2D7] text-xs font-mono text-[#78716C] max-w-md truncate">
              {this.state.error.message}
            </div>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            className="group mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#9E4A25] hover:bg-[#883E1D] text-white shadow-subtle transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 icon-hover-spin-back" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
