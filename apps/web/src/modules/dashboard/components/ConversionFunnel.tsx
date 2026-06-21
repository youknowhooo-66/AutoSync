import React from 'react';

interface Props {
  funnel: {
    created: number;
    completed: number;
    invoiced: number;
    paid: number;
  }
}

export function ConversionFunnel({ funnel }: Props) {
  const max = Math.max(funnel.created, 1); // prevent div by zero
  
  const steps = [
    { label: 'OS Criadas', value: funnel.created, color: 'bg-blue-500' },
    { label: 'Finalizadas', value: funnel.completed, color: 'bg-indigo-500' },
    { label: 'Faturadas', value: funnel.invoiced, color: 'bg-purple-500' },
    { label: 'Pagas', value: funnel.paid, color: 'bg-emerald-500' }
  ];

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funil de Operação → Receita</h3>
      
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => {
          const percentage = Math.round((step.value / max) * 100) || 0;
          return (
            <div key={i} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-muted-foreground truncate">{step.label}</div>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                <div 
                  className={`absolute top-0 left-0 h-full ${step.color} transition-all duration-1000 ease-out`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm font-bold">{step.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
