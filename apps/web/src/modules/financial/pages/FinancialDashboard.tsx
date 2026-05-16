import React from 'react';
import { KPIStats } from '../components/KPIStats';
import { RevenueChart } from '../components/RevenueChart';
import { useFinancialDashboard } from '../hooks/useFinancial';
import { Calendar, Filter, Download } from 'lucide-react';

export default function FinancialDashboard() {
  const { data, isLoading } = useFinancialDashboard('30d');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inteligência Financeira</h1>
          <p className="text-slate-500 text-lg">Acompanhe a saúde financeira da sua oficina em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Calendar size={18} /> Últimos 30 dias
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStats 
          label="Receita Bruta" 
          value={formatCurrency(data?.summary.totalRevenue || 0)} 
          trend={12.5} 
          icon="revenue" 
        />
        <KPIStats 
          label="Lucro Líquido" 
          value={formatCurrency(data?.summary.netProfit || 0)} 
          trend={8.2} 
          icon="profit" 
        />
        <KPIStats 
          label="Ordens de Serviço" 
          value={String(data?.summary.totalServiceOrders || 0)} 
          trend={5.4} 
          icon="orders" 
        />
        <KPIStats 
          label="Margem Média" 
          value={`${data?.summary.profitMargin || 0}%`} 
          trend={-1.2} 
          icon="margin" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <RevenueChart data={data?.revenueByDate || []} />
        </div>

        {/* Top Clients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Principais Clientes</h3>
            <p className="text-slate-500 text-sm">Por volume de faturamento</p>
          </div>
          <div className="flex-1 space-y-6">
            {data?.topClients.map((client, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">{client.orders} Ordens de Serviço</p>
                  </div>
                </div>
                <p className="font-bold text-slate-900">{formatCurrency(client.revenue)}</p>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            Ver Relatório Completo
          </button>
        </div>
      </div>
    </div>
  );
}
