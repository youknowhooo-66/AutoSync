import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend }: Props) {
  return (
    <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className={`text-xs font-medium flex items-center gap-1 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          <span>{trend.isPositive ? '↗' : '↘'}</span>
          <span>{Math.abs(trend.value)}% desde o último período</span>
        </div>
      )}
    </div>
  );
}
