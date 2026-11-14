'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TeamErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface TeamErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TeamErrorBoundary extends Component<TeamErrorBoundaryProps, TeamErrorBoundaryState> {
  public state: TeamErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): TeamErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[TeamErrorBoundary] Caught team component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-40 p-3 rounded-xl bg-white/95 backdrop-blur-md border border-amber-300 shadow-xl text-xs font-mono text-amber-900 flex items-center space-x-2.5 max-w-sm select-none"
        >
          <div className="p-1 rounded bg-amber-100 text-amber-700 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-amber-950">Team mode unavailable</div>
            <div className="text-[11px] text-amber-800">Play solo mode is active.</div>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="text-[10px] font-bold text-amber-700 hover:text-amber-950 uppercase px-2 py-1 rounded bg-amber-100/70 hover:bg-amber-100 transition-colors"
          >
            DISMISS
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

