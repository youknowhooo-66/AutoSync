import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { MdFilterList, MdPrint, MdTrendingUp, MdBuild, MdInventory } from 'react-icons/md';
import api from '../services/api';
import { toast } from 'react-toastify';

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
        revenue: dashboardRes.data.chartData,
        topParts: partsRes.data,
        topServices: servicesRes.data,
        osStatus: osStatusData,
        summary: {
          totalRevenue: dashboardRes.data.monthlyRevenue,
          totalOS: osRes.data.length,
          avgTicket: osRes.data.length > 0 ? dashboardRes.data.monthlyRevenue / osRes.data.length : 0,
          conversionRate: dashboardRes.data.conversionRate
        }
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

  if (loading && !data) return <div className="fade-in">Carregando relatórios avançados...</div>;

  return (
    <div className="fade-in reports-container" style={{ paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Relatórios Avançados</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Análise detalhada de faturamento, peças e serviços.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={branchId} 
            onChange={e => setBranchId(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="">Todas as Filiais</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdPrint size={20} /> Imprimir Relatório
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Faturamento Mensal</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginTop: '0.5rem' }}>
            R$ {data?.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Ordens de Serviço</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {data?.summary.totalOS}
          </h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Ticket Médio</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
            R$ {data?.summary.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Taxa de Conversão</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
            {data?.summary.conversionRate}%
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdTrendingUp color="var(--accent)" /> Tendência de Faturamento (7 dias)
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenue}>
                <defs>
                  <linearGradient id="colorRevRep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevRep)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdBuild color="#818cf8" /> Status das Ordens de Serviço
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.osStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.osStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top Parts Table */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdInventory color="#10b981" /> Peças Mais Utilizadas
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Peça</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd.</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Gerado</th>
                </tr>
              </thead>
              <tbody>
                {data?.topParts.map((item: any) => (
                  <tr key={item.partId} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.internalCode}</div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.totalOut}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                      R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Services Table */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdBuild color="#f59e0b" /> Serviços Mais Realizados
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Serviço</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Frequência</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {data?.topServices.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.count}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                      R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, .sidebar, nav, header { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; color: black !important; background: white !important; break-inside: avoid; }
          body { background: white !important; color: black !important; }
          h1, h2, h3, p, span, td, th { color: black !important; }
          .recharts-responsive-container { page-break-inside: avoid; height: 300px !important; }
          .reports-container { padding: 0 !important; }
          table { font-size: 10pt; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
