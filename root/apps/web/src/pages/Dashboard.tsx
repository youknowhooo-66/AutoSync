import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { MdTrendingUp, MdBuild, MdPeople, MdAttachMoney } from 'react-icons/md';
import api from '../services/api';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
    <div style={{ 
      backgroundColor: `rgba(${color}, 0.1)`, 
      padding: '1rem', 
      borderRadius: '12px',
      color: `rgb(${color})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</h2>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="fade-in">Carregando dashboard...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Resumo Operacional</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Acompanhe o desempenho da sua oficina em tempo real.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard 
          title="Faturamento Mensal" 
          value={`R$ ${stats?.monthlyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<MdAttachMoney size={28} />} 
          color="16, 185, 129" 
        />
        <StatCard 
          title="Ordens de Serviço" 
          value={stats?.monthlyOS} 
          icon={<MdBuild size={28} />} 
          color="56, 189, 248" 
        />
        <StatCard 
          title="Novos Clientes" 
          value={stats?.newClients} 
          icon={<MdPeople size={28} />} 
          color="245, 158, 11" 
        />
        <StatCard 
          title="Taxa de Conversão" 
          value={`${stats?.conversionRate}%`} 
          icon={<MdTrendingUp size={28} />} 
          color="139, 92, 246" 
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Faturamento Diário</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ color: '#38bdf8' }}
                  formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Status das OS</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.statusDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={11} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    formatter={(val: any) => [val, 'Quantidade']}
                  />
                  <Bar dataKey="_count.id" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {stats?.statusDistribution?.map((item: any) => (
                <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.status}:</span>
                  <span style={{ fontWeight: 600 }}>{item._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ marginBottom: '1.5rem' }}>Volume de OS</h3>
           <div style={{ flex: 1, minHeight: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats?.chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                 <YAxis stroke="#64748b" fontSize={12} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                   formatter={(val: any) => [val, 'Ordens de Serviço']}
                 />
                 <Bar dataKey="os" fill="#818cf8" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ height: '350px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>Últimas Ordens de Serviço</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {stats?.recentOS?.length > 0 ? stats.recentOS.map((os: any) => (
              <div key={os.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '0.875rem 1rem', 
                borderBottom: '1px solid var(--border)',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>OS #{os.number} - {os.vehicle?.model}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{os.client?.name}</p>
                </div>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  backgroundColor: os.status === 'FINISHED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)', 
                  color: os.status === 'FINISHED' ? '#10b981' : '#38bdf8' 
                }}>
                  {os.status === 'FINISHED' ? 'Finalizada' : os.status}
                </span>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Nenhuma OS encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
