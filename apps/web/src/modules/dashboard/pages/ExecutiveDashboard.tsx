import React from 'react';
import { DollarSign, Clock, CheckCircle2, Package, Activity } from 'lucide-react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { MetricCard } from '../components/MetricCard';
import { HealthStatusBanner } from '../components/HealthStatusBanner';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExecutiveDashboard() {
  const { dataset, isLoading } = useDashboardMetrics();

  if (isLoading || !dataset) {
    return (
      <div className="flex flex-col gap-6 h-full p-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis, funnel, health } = dataset;

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="flex items-center gap-3 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Executiva</h1>
          <p className="text-muted-foreground mt-1">Inteligência operacional em tempo real.</p>
        </div>
      </header>

      <HealthStatusBanner health={health} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard 
          title="Receita Acumulada" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalRevenue)} 
          icon={DollarSign} 
        />
        <MetricCard 
          title="Taxa de Conversão (OS → Paga)" 
          value={`${kpis.conversionRate.toFixed(1)}%`} 
          icon={CheckCircle2} 
          subtitle="Taxa de sobrevivência do funil"
        />
        <MetricCard 
          title="Tempo Médio (Abertura → Fim)" 
          value={`${kpis.avgCompletionTimeHours.toFixed(1)}h`} 
          icon={Clock} 
          subtitle="Agilidade na execução"
        />
        <MetricCard 
          title="Movimentações de Estoque" 
          value={kpis.stockMovements} 
          icon={Package} 
          subtitle="Giro operacional bruto"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <ConversionFunnel funnel={funnel} />
        
        {/* Placeholder for OperationsPanel or InventoryPanel */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card items-center justify-center text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Analytics Avançado</h3>
          <p className="text-xs text-muted-foreground max-w-[250px]">A integração com gráficos de série temporal (Recharts) está habilitada na infraestrutura via metricsStore.</p>
        </div>
      </div>
    </div>
  );
}
