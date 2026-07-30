import React from 'react';
import { 
  FileText, 
  DollarSign, 
  Package, 
  Download, 
  FileSpreadsheet, 
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { generatePDF } from '../utils/pdfExport';
import { useServiceOrders } from '../../serviceOrders/hooks/useServiceOrders';
import { useStock } from '../../stock/hooks/useStock';
import { useFinancialDashboard } from '../../financial/hooks/useFinancial';

export default function ReportsDashboard() {
  const { data: serviceOrders } = useServiceOrders(1, 100);
  const { data: stock } = useStock(1, 100);
  const { data: financial } = useFinancialDashboard();

  const handleExportServiceOrders = (format: 'pdf' | 'csv') => {
    const data = serviceOrders?.data || [];
    if (format === 'csv') {
      const exportData = data.map(os => ({
        Numero: os.number,
        Status: os.status,
        Cliente: os.client.name,
        Veiculo: os.vehicle.plate,
        Total: os.finalValue,
        Data: new Date(os.createdAt).toLocaleDateString('pt-BR')
      }));
      exportToCSV(exportData, 'relatorio-os');
    } else {
      const headers = ['Nº OS', 'Status', 'Cliente', 'Veículo', 'Total', 'Data'];
      const rows = data.map(os => [
        os.number,
        os.status,
        os.client.name,
        os.vehicle.plate,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.finalValue),
        new Date(os.createdAt).toLocaleDateString('pt-BR')
      ]);
      generatePDF({
        title: 'Relatório de Ordens de Serviço',
        subtitle: `Total de ${data.length} ordens encontradas no período.`,
        headers,
        data: rows,
        filename: 'relatorio-os'
      });
    }
  };

  const handleExportStock = (format: 'pdf' | 'csv') => {
    const data = stock?.data || [];
    if (format === 'csv') {
      const exportData = data.map(item => ({
        Peca: item.part.name,
        SKU: item.part.sku,
        Quantidade: item.quantity,
        Minimo: item.minimumStock,
        Preco: item.part.price
      }));
      exportToCSV(exportData, 'inventario-estoque');
    } else {
      const headers = ['Peça', 'SKU', 'Qtd', 'Mínimo', 'Preço Unit.'];
      const rows = data.map(item => [
        item.part.name,
        item.part.sku,
        item.quantity,
        item.minimumStock,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.part.price)
      ]);
      generatePDF({
        title: 'Relatório de Inventário',
        subtitle: `Snapshot do estoque atual - ${data.length} itens registrados.`,
        headers,
        data: rows,
        filename: 'inventario-estoque'
      });
    }
  };

  const reportCards = [
    {
      title: 'Ordens de Serviço',
      description: 'Resumo completo de todos os serviços realizados e em andamento.',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onExport: handleExportServiceOrders
    },
    {
      title: 'Inventário de Peças',
      description: 'Posição atual do estoque, valores e alertas de reposição.',
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onExport: handleExportStock
    },
    {
      title: 'Faturamento & Lucro',
      description: 'Análise financeira detalhada, impostos e margens por período.',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onExport: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      title: 'Auditoria de Ações',
      description: 'Histórico de modificações e rastreabilidade de operadores.',
      icon: Clock,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      onExport: () => alert('Funcionalidade em desenvolvimento')
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Relatórios e Exportação</h1>
        <p className="text-slate-500 text-lg">Gere documentos oficiais e exporte dados para análise externa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-indigo-200 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
                <card.icon size={28} className={card.color} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => card.onExport('pdf')}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Exportar PDF"
                >
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => card.onExport('csv')}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Exportar CSV"
                >
                  <FileSpreadsheet size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-slate-500">{card.description}</p>
            </div>

            <button className="mt-8 flex items-center justify-between text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
              Personalizar Filtros <ChevronRight size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Recent Activity / Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6">Insights Automáticos</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold">Crescimento de 15%</p>
                <p className="text-sm text-slate-400">Seu faturamento este mês superou a média do trimestre anterior.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="font-semibold">Alerta de Estoque</p>
                <p className="text-sm text-slate-400">8 itens atingiram o estoque crítico. Gere um relatório de reposição.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Downloads Recentes</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-600 font-medium">relatorio_os_maio.pdf</span>
                </div>
                <span className="text-xs text-slate-400">Há 2h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
