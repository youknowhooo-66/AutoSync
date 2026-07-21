import React from 'react';
import { cn } from '@/lib/utils';
import { pageTransitions } from '@/design/motion';

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Page({ children, className, ...props }: PageProps) {
  return (
    <div
      className={cn('flex flex-col gap-6 w-full max-w-7xl mx-auto', pageTransitions.default, className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  metadata,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {breadcrumb && <div className="text-xs text-muted-foreground mb-1">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{description}</p>
        )}
        {metadata && <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">{metadata}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6;
  children: React.ReactNode;
  className?: string;
}

export function PageGrid({ cols = 3, children, className, ...props }: PageGridProps) {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4 w-full', colStyles[cols], className)} {...props}>
      {children}
    </div>
  );
}

export function PageActions({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} {...props}>
      {children}
    </div>
  );
}
