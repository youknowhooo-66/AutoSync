import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export { Card };

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtext,
  trend,
  trendValue,
  icon,
  variant = 'default',
  className,
  onClick,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card text-card-foreground border-border',
    primary: 'bg-primary/5 text-primary border-primary/20',
    warning: 'bg-warning/5 text-warning border-warning/20',
    danger: 'bg-danger/5 text-danger border-danger/20',
    success: 'bg-success/5 text-success border-success/20',
  };

  return (
    <Card
      className={cn(
        'p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:shadow-md border',
        onClick && 'cursor-pointer hover:border-primary/50',
        variantStyles[variant],
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && (
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface-muted text-foreground shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              trend === 'up' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              trend === 'neutral' && 'bg-muted text-muted-foreground'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {trend === 'neutral' && <Minus className="h-3.5 w-3.5" />}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>

      {subtext && <p className="text-xs text-muted-foreground line-clamp-1">{subtext}</p>}
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, action, children, className }: ChartCardProps) {
  return (
    <Card className={cn('p-5 flex flex-col gap-4 border border-border bg-card', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full flex-1 min-h-[220px]">{children}</div>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export function ActionCard({ title, description, icon, onClick, className }: ActionCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 flex items-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group border border-border bg-card',
        className
      )}
    >
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
      </div>
    </Card>
  );
}
