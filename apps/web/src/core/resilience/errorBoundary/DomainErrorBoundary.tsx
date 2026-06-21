import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { AuditLog } from '@/core/audit/auditLog';
import { useAuthStore } from '@/modules/auth/state/auth.store';

interface Props {
  moduleName: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DomainErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const user = useAuthStore.getState().user;
    
    // Log domain-specific error
    AuditLog.create({
      tenantId: user?.tenantId || 'UNKNOWN',
      userId: user?.id || 'UNKNOWN',
      action: 'DOMAIN_RENDER_ERROR',
      module: this.props.moduleName,
      after: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }

  private resetBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-amber-500/20 bg-amber-500/5 rounded-xl h-full min-h-[200px]">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-medium text-amber-600 dark:text-amber-500">Falha no Módulo: {this.props.moduleName}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[300px] text-center mb-4">
            Não foi possível carregar esta seção. Outras partes do sistema continuam operando normalmente.
          </p>
          <button
            onClick={this.resetBoundary}
            className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-500 hover:underline"
          >
            <RefreshCcw className="w-3 h-3" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
