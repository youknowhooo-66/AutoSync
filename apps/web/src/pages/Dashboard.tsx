import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { MdTrendingUp, MdBuild, MdPeople, MdAttachMoney } from 'react-icons/md';
import api from '../services/api';
import { toast } from 'sonner';

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-4 flex-1 shadow-sm">
    <div style={{ 
      backgroundColor: `rgba(${color}, 0.1)`, 
      borderRadius: '12px',
      color: `rgb(${color})`,
    }} className="h-12 w-12 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex flex-col min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mt-0.5 truncate">{value}</h2>
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

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando dashboard...</div>;
  if (!stats) return <div className="p-6 text-sm text-muted-foreground">Nenhum dado disponível.</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <header className="pb-4 border-b border-border/60">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Resumo Operacional</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe o desempenho da sua oficina em tempo real.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Faturamento Mensal" 
          value={`R$ ${(stats?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<MdAttachMoney size={24} />} 
          color="16, 185, 129" 
        />
        <StatCard 
          title="Ordens de Serviço" 
          value={stats?.monthlyOS || 0} 
          icon={<MdBuild size={24} />} 
          color="56, 189, 248" 
        />
        <StatCard 
          title="Novos Clientes" 
          value={stats?.newClients || 0} 
          icon={<MdPeople size={24} />} 
          color="245, 158, 11" 
        />
        <StatCard 
          title="Taxa de Conversão" 
          value={`${(stats?.conversionRate || 0).toFixed(1)}%`} 
          icon={<MdTrendingUp size={24} />} 
          color="139, 92, 246" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card flex flex-col min-h-[400px]">
          <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Faturamento Diário</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  formatter={(val: any) => [`R$ ${(val || 0).toLocaleString('pt-BR')}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card flex flex-col min-h-[400px]">
          <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Status das OS</h3>
          <div className="flex-1 w-full flex flex-col">
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.statusDistribution || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="status" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    formatter={(val: any) => [val, 'Quantidade']}
                  />
                  <Bar dataKey="_count.id" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-3 mt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
              {(stats?.statusDistribution || []).map((item: any) => (
                <div key={item?.status || Math.random()} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground truncate">{item?.status || 'N/A'}:</span>
                  <span className="font-semibold text-foreground">{item?._count?.id || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border border-border bg-card flex flex-col min-h-[350px]">
          <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Volume de OS</h3>
          <div className="flex-1 w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  formatter={(val: any) => [val, 'Ordens de Serviço']}
                />
                <Bar dataKey="os" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card flex flex-col min-h-[350px]">
          <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">Últimas Ordens de Serviço</h3>
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-border/60">
            {stats?.recentOS?.length > 0 ? stats.recentOS.map((os: any) => (
              <div key={os?.id || Math.random()} className="flex items-center justify-between py-3 px-1 text-xs">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-foreground">OS #{os?.number || '---'} - {os?.vehicle?.model || 'Desconhecido'}</p>
                  <p className="text-muted-foreground">{os?.client?.name || 'Cliente não identificado'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-semibold ${
                  os?.status === 'FINISHED' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {os?.status === 'FINISHED' ? 'Finalizada' : (os?.status || 'Aberta')}
                </span>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma OS encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
