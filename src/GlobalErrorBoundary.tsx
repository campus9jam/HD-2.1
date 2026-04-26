import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logToSystem, LogLevel } from './services/LoggerService';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logToSystem(LogLevel.CRITICAL, `Application Crash: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 text-text font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#161618] border border-text/5 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight mb-3">System Breakdown Detected</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              A critical failure has occurred in the House of Daraja interface. 
              The sovereign error log has been updated for immediate review.
            </p>
            <div className="bg-black/40 rounded-xl p-4 text-left font-mono text-[10px] text-red-400/80 mb-8 overflow-auto max-h-32 border border-red-500/10">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-text text-navy rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-text/80 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Reset Interface
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
