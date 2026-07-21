import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Printer, TrendingUp, Wrench, Package, DollarSign, RefreshCw, Download, AlertCircle, FileText } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Page, PageHeader, PageGrid, MetricCard, ChartCard } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { useBranch } from '../contexts/BranchContext';
import { formatCurrencyBRL } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  DIAGNOSIS: 'Em Diagnóstico',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  APPROVED: 'Aprovado',
  IN_EXECUTION: 'Em Execução',
  FINISHED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export interface ReportData {
  stats: {
    kpis: {
      totalRevenue: number;
      avgCompletionTimeHours: number;
      conversionRate: number;
      cancellationRate: number;
      stockMovements: number;
    };
    funnel: {
      created: number;
      completed: number;
      invoiced: number;
      paid: number;
    };
  };
  osStatusDistribution: { name: string; value: number }[];
  financialTypeDistribution: { name: string; value: number }[];
  totalOSCount: number;
}

const Reports: React.FC = () => {
  const { activeBranch } = useBranch();

  // Query: Consolidate Report Data from Real Endpoints
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ReportData>({
    queryKey: ['reports', activeBranch?.id],
    queryFn: async () => {
      const branchParam = activeBranch?.id ? `?branchId=${activeBranch.id}` : '';
      
      const [dashRes, osRes, finRes] = await Promise.all([
        api.get(`/dashboard${branchParam}`),
        api.get(`/service-orders${branchParam}`),
        api.get(`/financial${branchParam}`),
      ]);

      const serviceOrders: any[] = osRes.data || [];
      const financialRecords: any[] = finRes.data || [];

      // Calculate OS Status Distribution from real OS data
      const osCounts: Record<string, number> = {};
      serviceOrders.forEach((os) => {
        const label = STATUS_LABELS[os.status] || os.status || 'Outro';
        osCounts[label] = (osCounts[label] || 0) + 1;
      });

      const osStatusDistribution = Object.entries(osCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Calculate Financial Type Distribution from real financial data
      const finCounts: Record<string, number> = {
        'A Receber': 0,
        'A Pagar': 0,
      };
      financialRecords.forEach((f) => {
        if (f.type === 'RECEIVABLE') finCounts['A Receber'] += Number(f.amount || 0);
        if (f.type === 'PAYABLE') finCounts['A Pagar'] += Number(f.amount || 0);
      });

      const financialTypeDistribution = [
        { name: 'Entradas (A Receber)', value: finCounts['A Receber'] },
        { name: 'Saídas (A Pagar)', value: finCounts['A Pagar'] },
      ].filter((item) => item.value > 0);

      return {
        stats: dashRes.data,
        osStatusDistribution,
        financialTypeDistribution,
        totalOSCount: serviceOrders.length,
      };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.info('Exportação oficial de relatórios em CSV/PDF requer ativação do endpoint de exportação no backend.', {
      duration: 4000,
    });
  };

  if (isLoading) return <PageSkeleton />;

  const kpis = data?.stats?.kpis || {
    totalRevenue: 0,
    avgCompletionTimeHours: 0,
    conversionRate: 0,
    cancellationRate: 0,
    stockMovements: 0,
  };

  const funnel = data?.stats?.funnel || { created: 0, completed: 0, invoiced: 0, paid: 0 };

  return (
    <Page data-testid="reports-page" className="reports-container">
      <PageHeader
        title="Relatórios Executivos & Inteligência Operacional"
        description="Métricas consolidadas de faturamento, eficiência operacional e distribuição de Ordens de Serviço."
        actions={
          <div className="flex items-center gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs" title="Atualizar dados">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar Dados
            </Button>
            <Button size="sm" onClick={handlePrint} className="text-xs font-semibold">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir Relatório
            </Button>
          </div>
        }
      />

      {isError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{extractErrorMessage(error)}</span>
        </div>
      )}

      {/* Metric Cards */}
      <PageGrid cols={4}>
        <MetricCard
          title="Faturamento Consolidado"
          value={formatCurrencyBRL(kpis.totalRevenue)}
          variant="success"
          icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          title="Total de Ordens de Serviço"
          value={data?.totalOSCount || 0}
          variant="primary"
          icon={<Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
        />
        <MetricCard
          title="Taxa de Conversão OS -> Pago"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          variant="warning"
          icon={<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
        />
        <MetricCard
          title="Movimentações de Estoque"
          value={kpis.stockMovements}
          icon={<Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
        />
      </PageGrid>

      {/* Charts Section */}
      <PageGrid cols={2}>
        {/* OS Status Distribution Chart */}
        <ChartCard
          title="Distribuição por Status de OS"
          description={`Fonte: GET /api/service-orders | Filial: ${activeBranch?.name || 'Global'}`}
        >
          {data?.osStatusDistribution && data.osStatusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.osStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.osStatusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground/60" />}
              title="Sem dados de OS"
              description="Nenhuma Ordem de Serviço encontrada para o escopo desta filial."
            />
          )}
        </ChartCard>

        {/* Funnel Bar Chart */}
        <ChartCard
          title="Funil Operacional & Financeiro"
          description={`Fonte: GET /api/dashboard | Filial: ${activeBranch?.name || 'Global'}`}
        >
          {funnel.created > 0 || funnel.completed > 0 || funnel.paid > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { etapa: 'Criadas', qtd: funnel.created },
                  { etapa: 'Concluídas', qtd: funnel.completed },
                  { etapa: 'Faturadas', qtd: funnel.invoiced },
                  { etapa: 'Pagas', qtd: funnel.paid },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="etapa" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="qtd" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground/60" />}
              title="Sem histórico no funil"
              description="Cadastre Ordens de Serviço e lançamentos financeiros para visualizar o funil."
            />
          )}
        </ChartCard>
      </PageGrid>

      {/* Financial Volume Chart */}
      <ChartCard
        title="Volume Financeiro por Natureza (Entradas vs Saídas)"
        description={`Fonte: GET /api/financial | Filial: ${activeBranch?.name || 'Global'}`}
      >
        {data?.financialTypeDistribution && data.financialTypeDistribution.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center justify-around gap-4 p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.financialTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrencyBRL(value)}`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrencyBRL(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={<DollarSign className="h-8 w-8 text-muted-foreground/60" />}
            title="Sem dados financeiros"
            description="Nenhum lançamento financeiro registrado nesta unidade."
          />
        )}
      </ChartCard>
    </Page>
  );
};

export default Reports;
