import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Falha no carregamento',
  description = 'Ocorreu um erro ao buscar os dados. Por favor, tente novamente.',
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-danger/20 bg-danger/5 min-h-[220px] gap-3 animate-in fade-in-50',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center p-3 rounded-full bg-danger/10 text-danger shrink-0">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-sm font-semibold tracking-tight text-danger">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs font-semibold border-danger/30 hover:bg-danger/10 text-danger">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
