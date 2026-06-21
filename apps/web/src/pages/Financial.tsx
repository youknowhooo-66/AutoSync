import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import {
  MdAdd, MdSearch, MdAttachMoney, MdTrendingUp, MdTrendingDown,
  MdCheckCircle, MdSchedule, MdCancel
} from 'react-icons/md';

interface FinancialRecord {
  id: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

const Financial: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formType, setFormType] = useState<'PAYABLE' | 'RECEIVABLE'>('PAYABLE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => { fetchRecords(); }, [filterType, filterStatus]);

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      const response = await api.get(`/financial?${params}`);
      setRecords(response.data);
    } catch { toast.error('Erro ao buscar registros financeiros.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.post('/financial', {
        branchId: user.branchId,
        type: formType,
        category,
        description,
        amount: parseFloat(amount),
        dueDate,
      });
      toast.success('Registro financeiro criado com sucesso!');
      setShowModal(false);
      resetForm();
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar registro.');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.patch(`/financial/${id}/pay`, { paymentDate: new Date().toISOString() });
      toast.success('Pagamento registrado!');
      fetchRecords();
    } catch { toast.error('Erro ao registrar pagamento.'); }
  };

  const resetForm = () => {
    setFormType('PAYABLE'); setCategory(''); setDescription(''); setAmount(''); setDueDate('');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Pendente', icon: <MdSchedule size={14} /> };
      case 'PAID': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Pago', icon: <MdCheckCircle size={14} /> };
      case 'CANCELLED': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelado', icon: <MdCancel size={14} /> };
      default: return { bg: 'rgba(255,255,255,0.1)', color: '#fff', label: status, icon: null };
    }
  };

  const totalReceivable = records.filter(r => r.type === 'RECEIVABLE' && r.status === 'PENDING').reduce((a, r) => a + Number(r.amount), 0);
  const totalPayable = records.filter(r => r.type === 'PAYABLE' && r.status === 'PENDING').reduce((a, r) => a + Number(r.amount), 0);
  const totalPaid = records.filter(r => r.status === 'PAID').reduce((a, r) => a + (r.type === 'RECEIVABLE' ? Number(r.amount) : -Number(r.amount)), 0);

  const filtered = records.filter(r =>
    (r.category?.toLowerCase().includes(search.toLowerCase()) ||
     r.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Financeiro</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Controle de contas a pagar e receber.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd size={18} /> Novo Registro
        </button>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MdTrendingUp size={24} color="var(--success)" />
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>A Receber</p>
              <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--success)' }}>
                R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MdTrendingDown size={24} color="var(--danger)" />
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>A Pagar</p>
              <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--danger)' }}>
                R$ {totalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MdAttachMoney size={24} color="var(--accent)" />
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Saldo Líquido</p>
              <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: totalPaid >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Pesquisar por categoria ou descrição..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '40px' }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: '160px' }}>
            <option value="">Todos os tipos</option>
            <option value="PAYABLE">A Pagar</option>
            <option value="RECEIVABLE">A Receber</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '160px' }}>
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Categoria</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Descrição</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Valor</th>
              <th style={{ textAlign: 'center', padding: '1rem' }}>Vencimento</th>
              <th style={{ textAlign: 'center', padding: '1rem' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rec) => {
              const st = getStatusInfo(rec.status);
              return (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: rec.type === 'RECEIVABLE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: rec.type === 'RECEIVABLE' ? '#10b981' : '#ef4444'
                    }}>
                      {rec.type === 'RECEIVABLE' ? 'Receber' : 'Pagar'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{rec.category}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{rec.description || '—'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                    R$ {Number(rec.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {new Date(rec.dueDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: st.bg, color: st.color,
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {st.icon} {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {rec.status === 'PENDING' && (
                      <button
                        onClick={() => handlePay(rec.id)}
                        style={{
                          background: 'rgba(16,185,129,0.1)', border: 'none', color: '#10b981',
                          cursor: 'pointer', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem'
                        }}
                      >
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Registro Financeiro">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tipo</span>
              <select value={formType} onChange={e => setFormType(e.target.value as any)} required>
                <option value="PAYABLE">A Pagar</option>
                <option value="RECEIVABLE">A Receber</option>
              </select>
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Categoria</span>
              <input placeholder="Ex: Peças, Aluguel..." value={category} onChange={e => setCategory(e.target.value)} required />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descrição</span>
            <input placeholder="Detalhes do registro" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor (R$)</span>
              <input type="number" step="0.01" min="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Vencimento</span>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Financial;
