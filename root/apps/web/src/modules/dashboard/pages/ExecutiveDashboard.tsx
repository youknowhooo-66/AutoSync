import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ClipboardList, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Store
} from 'lucide-react';
import api from '../../../services/api';
import { useBranch } from '../../../contexts/BranchContext';

export default function ExecutiveDashboard() {
  const { activeBranch } = useBranch();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await api.get('/dashboard/metrics', {
          params: { branchId: activeBranch?.id }
        });
        setMetrics(response.data.data);
      } catch (error) {
        console.error('Failed to load metrics', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Polling every 1 min
    return () => clearInterval(interval);
  }, [activeBranch]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  const kpis = [
    { 
      title: 'Faturamento Total', 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.revenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      title: 'Ordens de Serviço', 
      value: metrics.os.total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: '+5',
      trendUp: true
    },
    { 
      title: 'Estoque Crítico', 
      value: metrics.stockAlerts.length,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      trend: 'Atenção',
      trendUp: false
    },
    { 
      title: 'Ticket Médio', 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.revenue / (metrics.os.total || 1)),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      trend: '-2%',
      trendUp: false
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
          <p className="text-slate-500">Visão geral da operação em {activeBranch?.name || 'todas as filiais'}.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Live Metrics</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={kpi.color} size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${kpi.trendUp ? 'text-emerald-600' : 'text-slate-400'}`}>
                {kpi.trend} {kpi.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{kpi.title}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Branch Comparison */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Store size={20} className="text-indigo-600" /> Comparativo de Filiais
            </h3>
            <button className="text-indigo-600 text-sm font-bold">Ver Detalhes</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Filial</th>
                  <th className="px-6 py-4">OS Totais</th>
                  <th className="px-6 py-4">Faturamento</th>
                  <th className="px-6 py-4">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.branchComparison.map((branch: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{branch.name}</td>
                    <td className="px-6 py-4 text-slate-600">{branch.osCount}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(branch.revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${Math.min((branch.revenue / (metrics.revenue || 1)) * 100, 100)}%` }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Package size={20} className="text-amber-600" /> Alertas de Estoque
            </h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-auto">
            {metrics.stockAlerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{alert.part}</p>
                  <p className="text-xs text-slate-400">{alert.branch}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{alert.quantity} un</p>
                  <p className="text-xs text-slate-400">Crítico</p>
                </div>
              </div>
            ))}
            {metrics.stockAlerts.length === 0 && (
              <div className="text-center py-8 opacity-50">
                <Package size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Estoque saudável</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
            <button className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
              Gerar Relatório de Reposição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
