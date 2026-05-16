import React from 'react';
import { Activity, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import type { HealthEvaluation } from '../utils/healthEvaluator';

export function HealthStatusBanner({ health }: { health: HealthEvaluation }) {
  
  const config = {
    HEALTHY: {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-500',
      label: 'Saudável'
    },
    DEGRADED: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-500',
      label: 'Degradado'
    },
    CRITICAL: {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-500',
      label: 'Crítico'
    }
  };

  const curr = config[health.status] || config.HEALTHY;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border ${curr.bg} mb-8 animate-in slide-in-from-top-4`}>
      <div className="flex items-center gap-3">
        {curr.icon}
        <div className="flex flex-col">
          <span className={`text-sm font-bold tracking-wider uppercase ${curr.text}`}>Status da Operação: {curr.label}</span>
          <span className="text-xs text-muted-foreground">Score: {health.score}/100</span>
        </div>
      </div>
      
      {health.warnings.length > 0 && (
        <div className="sm:ml-auto flex flex-col gap-1 border-l border-amber-500/20 pl-4">
          {health.warnings.map((w, i) => (
            <span key={i} className="text-xs text-amber-500/80 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3" /> {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
