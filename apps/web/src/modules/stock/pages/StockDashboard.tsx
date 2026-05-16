import React from 'react';
import { Package, AlertOctagon, TrendingDown, Layers, Search, History } from 'lucide-react';
import { useStockSummary, useStockMovements } from '../hooks/useStock';
import { Link } from 'react-router-dom';

export default function StockDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useStockSummary();
  const { data: movements, isLoading: isMovementsLoading } = useStockMovements(1, 5);

  const stats = [
    { label: 'Itens em Estoque', value: summary?.totalItems || 0, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Estoque Baixo', value: summary?.lowStockItems || 0, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Esgotados', value: summary?.outOfStockItems || 0, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Valor do Inventário', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary?.totalValue || 0), icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Painel de Inventário</h1>
        <p className="text-slate-500 text-lg">Visão geral do estoque de peças e insumos.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Movements */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="text-indigo-600" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Movimentações Recentes</h3>
            </div>
            <Link to="/stock/movements" className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">
              Ver tudo
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {movements?.data.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    m.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 
                    m.type === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.type === 'IN' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{m.part.name}</p>
                    <p className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{m.quantity} unid.</p>
                  <p className="text-xs text-slate-500 uppercase">{m.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Low Stock */}
        <div className="space-y-8">
          <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <h3 className="text-xl font-bold mb-2">Ações Rápidas</h3>
            <p className="text-indigo-100 mb-6">Agilize a gestão do seu almoxarifado.</p>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/stock/parts" className="bg-white/10 hover:bg-white/20 p-4 rounded-xl border border-white/20 transition-all flex flex-col items-center text-center">
                <Search size={24} className="mb-2" />
                <span className="text-sm font-semibold">Consultar Peça</span>
              </Link>
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl border border-white/20 transition-all flex flex-col items-center text-center">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-semibold">Entrada Manual</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Alertas de Reposição</h3>
            <div className="space-y-4">
              {/* This would be populated by a specific low stock query */}
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="text-amber-600" size={20} />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Pastilha de Freio ABC</p>
                    <p className="text-xs text-amber-700 font-medium">Abaixo do mínimo (2/10)</p>
                  </div>
                </div>
                <button className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
                  Repor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
