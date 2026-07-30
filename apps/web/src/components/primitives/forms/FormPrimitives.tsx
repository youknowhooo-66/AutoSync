import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className, ...props }: FormSectionProps) {
  return (
    <div className={cn('flex flex-col gap-4 p-5 rounded-xl border border-border bg-card/40', className)} {...props}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function FormGrid({ cols = 2, children, className, ...props }: FormGridProps) {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 w-full', colStyles[cols], className)} {...props}>
      {children}
    </div>
  );
}

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  helperText,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
          {label}{required ? ' *' : ''}
        </Label>
      )}
      {children}
      {error ? (
        <span className="text-xs text-danger font-medium animate-in fade-in-50">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      ) : null}
    </div>
  );
}

export function FormActions({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-border/40', className)} {...props}>
      {children}
    </div>
  );
}
