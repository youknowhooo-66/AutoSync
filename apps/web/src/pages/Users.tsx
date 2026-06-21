import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { MdAdd, MdSearch, MdEdit, MdPersonAdd, MdToggleOn, MdToggleOff, MdAdminPanelSettings } from 'react-icons/md';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  branch: { id: string; name: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrador', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MANAGER: { label: 'Gerente', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  STOCKIST: { label: 'Estoquista', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MECHANIC: { label: 'Mecânico', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  FINANCIAL: { label: 'Financeiro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ATTENDANT: { label: 'Atendente', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ATTENDANT');
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Erro ao buscar usuários.'); }
    finally { setLoading(false); }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { name, email, role, branchId: branchId || null });
        toast.success('Usuário atualizado!');
      } else {
        await api.post('/users', { name, email, password, role, branchId: branchId || null });
        toast.success('Usuário cadastrado!');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário.');
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id); setName(u.name); setEmail(u.email);
    setRole(u.role); setBranchId(u.branch?.id || ''); setPassword('');
    setShowModal(true);
  };

  const handleToggle = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { active: !u.active });
      toast.success(u.active ? 'Usuário desativado.' : 'Usuário ativado.');
      fetchUsers();
    } catch { toast.error('Erro ao atualizar usuário.'); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setEmail(''); setPassword(''); setRole('ATTENDANT'); setBranchId('');
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Usuários</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie os usuários e permissões do sistema.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <MdPersonAdd size={18} /> Novo Usuário
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-base pl-12" placeholder="Pesquisar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Usuário</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Cargo</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Filial</th>
              <th style={{ textAlign: 'center', padding: '1rem' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.ATTENDANT;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', opacity: user.active ? 1 : 0.5 }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${roleInfo.bg}, rgba(56,189,248,0.1))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: roleInfo.color, fontWeight: 700, fontSize: '0.875rem'
                      }}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name || 'Sem Nome'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: roleInfo.bg, color: roleInfo.color
                    }}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {user.branch?.name || '—'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: user.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: user.active ? '#10b981' : '#ef4444'
                    }}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEdit(user)} 
                        style={{ 
                          background: 'var(--muted)', 
                          border: 'none', 
                          color: 'var(--foreground)', 
                          cursor: 'pointer', 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          fontWeight: 600, 
                          fontSize: '0.75rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        className="hover:bg-accent"
                      >
                        <MdEdit size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => handleToggle(user)} 
                        style={{ 
                          background: 'transparent', 
                          border: '1px solid var(--border)', 
                          color: user.active ? '#ef4444' : '#10b981', 
                          cursor: 'pointer', 
                          padding: '8px 12px', 
                          borderRadius: '8px', 
                          fontWeight: 600, 
                          fontSize: '0.75rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        className="hover:bg-accent/10"
                      >
                        {user.active ? <MdToggleOff size={16} /> : <MdToggleOn size={16} />}
                        {user.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome Completo *</span>
            <input className="input-base" placeholder="João da Silva" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>E-mail *</span>
            <input className="input-base" type="email" placeholder="joao@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          {!editingId && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Senha *</span>
              <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cargo *</span>
              <select className="input-base" value={role} onChange={e => setRole(e.target.value)} required>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="STOCKIST">Estoquista</option>
                <option value="MECHANIC">Mecânico</option>
                <option value="FINANCIAL">Financeiro</option>
                <option value="ATTENDANT">Atendente</option>
              </select>
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filial</span>
              <select className="input-base" value={branchId} onChange={e => setBranchId(e.target.value)}>
                <option value="">Sem filial</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
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

export default Users;
