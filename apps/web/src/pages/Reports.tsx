import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Printer, TrendingUp, Wrench, Package, DollarSign } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Page, PageHeader, PageGrid, MetricCard, ChartCard } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#fb923c', '#fbbf24'];

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
    fetchReportData();
  }, [branchId]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch {}
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const dashboardRes = await api.get(`/dashboard${branchId ? `?branchId=${branchId}` : ''}`);
      const partsRes = await api.get('/inventory/top-parts');
      const servicesRes = await api.get('/os/top-services');
      const osRes = await api.get(`/os${branchId ? `?branchId=${branchId}` : ''}`);

      const osByStatus = osRes.data.reduce((acc: any, os: any) => {
        acc[os.status] = (acc[os.status] || 0) + 1;
        return acc;
      }, {});

      const osStatusData = Object.entries(osByStatus).map(([name, value]) => ({ name, value }));

      setData({
        revenue: dashboardRes.data.chartData || [],
        topParts: partsRes.data || [],
        topServices: servicesRes.data || [],
        osStatus: osStatusData || [],
        summary: {
          totalRevenue: dashboardRes.data.monthlyRevenue || 0,
          totalOS: osRes.data.length || 0,
          avgTicket: osRes.data.length > 0 ? (dashboardRes.data.monthlyRevenue || 0) / osRes.data.length : 0,
          conversionRate: dashboardRes.data.conversionRate || 0,
        },
      });
    } catch {
      toast.error('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) return <PageSkeleton />;

  return (
    <Page className="reports-container">
      <PageHeader
        title="Relatórios & Business Intelligence"
        description="Análise detalhada de faturamento, métricas operacionais, peças e serviços mais demandados."
        actions={
          <div className="flex items-center gap-2 no-print">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-medium focus:ring-1 focus:ring-primary outline-none min-w-[180px]"
            >
              <option value="">Todas as Filiais</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handlePrint} className="text-xs font-semibold">
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir Relatório
            </Button>
          </div>
        }
      />

      {/* Summary Metrics */}
      <PageGrid cols={4}>
        <MetricCard
          title="Faturamento Mensal"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.summary.totalRevenue || 0)}
          variant="success"
          icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          title="Ordens de Serviço"
          value={data?.summary.totalOS || 0}
          variant="primary"
          icon={<Wrench className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
        />
        <MetricCard
          title="Ticket Médio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.summary.avgTicket || 0)}
          variant="warning"
          icon={<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${(data?.summary.conversionRate || 0).toFixed(1)}%`}
          icon={<Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
        />
      </PageGrid>

      {/* Charts Section */}
      <PageGrid cols={2}>
        <ChartCard title="Tendência de Faturamento" description="Evolução financeira nos últimos 7 dias">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.revenue}>
              <defs>
                <linearGradient id="colorRevRep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevRep)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status das Ordens de Serviço" description="Distribuição por fase operacional">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data?.osStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data?.osStatus?.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </PageGrid>

      {/* Top Parts and Top Services Tables */}
      <PageGrid cols={2}>
        <ChartCard title="Peças Mais Utilizadas" description="Ranking por volume de saída e receita">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted text-muted-foreground uppercase font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Peça</th>
                  <th className="p-3 text-center">Qtd.</th>
                  <th className="p-3 text-right">Total Gerado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data?.topParts?.map((item: any) => (
                  <tr key={item.partId} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3 font-medium text-foreground">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.internalCode}</div>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">{item.totalOut}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalRevenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Serviços Mais Realizados" description="Frequência e receita por tipo de serviço">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-muted text-muted-foreground uppercase font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Serviço</th>
                  <th className="p-3 text-center">Qtd.</th>
                  <th className="p-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data?.topServices?.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3 font-medium text-foreground">{item.name}</td>
                    <td className="p-3 text-center font-mono font-semibold">{item.count}</td>
                    <td className="p-3 text-right font-semibold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalRevenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </PageGrid>
    </Page>
  );
};

export default Reports;
