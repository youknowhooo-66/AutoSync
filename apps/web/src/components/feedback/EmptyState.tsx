import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
  'data-testid'?: string;
}

export function EmptyState({
  icon = <FolderOpen className="h-10 w-10 text-muted-foreground/60" />,
  title = 'Nenhum registro encontrado',
  description = 'Não há dados disponíveis para exibição no momento.',
  action,
  className,
  'data-testid': testId,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-card/50 min-h-[220px] gap-3 animate-in fade-in-50',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center p-3 rounded-full bg-surface-muted shrink-0">{icon}</div>
      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-2 text-xs font-semibold shadow-xs">
          {action.icon && <span className="mr-1.5">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}
