import React, { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary wrapper specifically for lazy-loaded routes
 * Catches import errors and component rendering errors
 * Prevents entire app from crashing due to failed chunk loading
 */
export class LazyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[LazyErrorBoundary] Failed to load route:", error, info);
    this.props.onError?.(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center rounded-3xl glass-card p-6 shadow-elevated">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="font-bold text-lg mb-1">Failed to load page</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message ?? "Unable to load this page. Please try refreshing."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-gradient-cta text-white font-semibold text-sm shadow-glow"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default LazyErrorBoundary;
