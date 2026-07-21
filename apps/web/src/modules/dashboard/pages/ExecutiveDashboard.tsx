import React from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Package,
  Activity,
  Plus,
  Users,
  Wrench,
  PackageSearch,
  AlertTriangle,
  Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { HealthStatusBanner } from '../components/HealthStatusBanner';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { useBranch } from '@/contexts/BranchContext';
import {
  Page,
  PageHeader,
  PageGrid,
  PageSection,
  MetricCard,
  ChartCard,
  ActionCard,
} from '@/components/primitives';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { activeBranch } = useBranch();
  const { dataset, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !dataset) {
    return (
      <Page>
        <ErrorState
          title="Falha ao carregar indicadores operacionais"
          description="Não foi possível conectar ao servidor para buscar os dados em tempo real."
          onRetry={() => window.location.reload()}
        />
      </Page>
    );
  }

  const { kpis, funnel, health } = dataset;

  const formattedRevenue = typeof kpis.totalRevenue === 'number'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalRevenue)
    : 'R$ 0,00';

  return (
    <Page>
      {/* Header: Context & Active Branch */}
      <PageHeader
        title="Centro Operacional & Executivo"
        description="Monitoramento integrado de ordens de serviço, produtividade da oficina e indicadores operacionais em tempo real."
        metadata={
          activeBranch ? (
            <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1 text-xs border-primary/30 bg-primary/5 text-primary">
              <Store className="h-3.5 w-3.5" />
              <span>Filial Ativa: <strong>{activeBranch.name}</strong></span>
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate('/os')} className="text-xs font-semibold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" /> Nova Ordem de Serviço
            </Button>
          </div>
        }
      />

      {/* Health / System Status Banner */}
      <HealthStatusBanner health={health} />

      {/* Operational KPIs */}
      <PageSection title="Indicadores Principais (KPIs)">
        <PageGrid cols={4}>
          <MetricCard
            title="Receita Acumulada"
            value={formattedRevenue}
            subtext="Faturamento confirmado"
            icon={<DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            variant="success"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${(kpis.conversionRate || 0).toFixed(1)}%`}
            subtext="OS iniciadas → Pagas"
            trend={kpis.conversionRate > 50 ? 'up' : 'neutral'}
            icon={<CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
            variant="primary"
          />
          <MetricCard
            title="Tempo Médio de Execução"
            value={`${(kpis.avgCompletionTimeHours || 0).toFixed(1)}h`}
            subtext="Tempo total até conclusão"
            icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            variant="warning"
          />
          <MetricCard
            title="Movimentações de Estoque"
            value={kpis.stockMovements || 0}
            subtext="Giro de peças e materiais"
            icon={<Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          />
        </PageGrid>
      </PageSection>

      {/* Conversion Funnel & Operational Overview */}
      <PageSection title="Funil Operacional & Ações Rápida">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConversionFunnel funnel={funnel} />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações Rápidas</h3>
            <ActionCard
              title="Nova Ordem de Serviço"
              description="Abrir novo atendimento para cliente"
              icon={<Wrench className="h-5 w-5" />}
              onClick={() => navigate('/os')}
            />
            <ActionCard
              title="Cadastrar Cliente"
              description="Registrar novo proprietário"
              icon={<Users className="h-5 w-5" />}
              onClick={() => navigate('/clientes')}
            />
            <ActionCard
              title="Consultar Estoque"
              description="Verificar disponibilidade de peças"
              icon={<PackageSearch className="h-5 w-5" />}
              onClick={() => navigate('/estoque')}
            />
          </div>
        </div>
      </PageSection>

      {/* Additional Analytical Panels */}
      <PageGrid cols={2}>
        <ChartCard title="Alertas Operacionais em Tempo Real" description="Pendências que requerem atenção da equipe">
          <div className="flex flex-col gap-3 py-2">
            {funnel.created - funnel.completed > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-3 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Ordens de Serviço em Aberto</span>
                  <span>Existem {funnel.created - funnel.completed} ordens aguardando finalização ou faturamento.</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Nenhum gargalo crítico detectado no fluxo operacional.</span>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Mapa de Desempenho da Oficina" description="Telemetria e produtividade por elevador">
          <div className="flex flex-col items-center justify-center min-h-[160px] p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-surface-muted/40">
            <Activity className="h-8 w-8 mb-2 opacity-40" />
            <span className="font-semibold text-foreground">Telemetria de Oficina</span>
            <span>Métrica de ocupação física por elevador aguardando módulo IoT.</span>
          </div>
        </ChartCard>
      </PageGrid>
    </Page>
  );
}
