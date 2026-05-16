import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AuditLog } from '@/core/audit/auditLog';

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
    console.error('Uncaught error:', error, errorInfo);
    
    // Log fatal error to audit system
    AuditLog.create({
      tenantId: 'SYSTEM', // Hard fatal crash
      userId: 'SYSTEM',
      action: 'SYSTEM_FATAL_ERROR',
      module: 'core',
      eventType: undefined,
      after: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full flex flex-col items-center text-center gap-6 p-8 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Falha Crítica do Sistema</h1>
              <p className="text-muted-foreground text-sm">
                Ocorreu um erro inesperado que comprometeu a interface. A equipe técnica já foi notificada através dos logs de auditoria.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
