import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { MdAdd, MdSearch, MdStore, MdEdit, MdToggleOn, MdToggleOff } from 'react-icons/md';

interface Branch {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
}

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch { toast.error('Erro ao buscar filiais.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, { name, cnpj, address, phone, email });
        toast.success('Filial atualizada com sucesso!');
      } else {
        await api.post('/branches', { name, cnpj, address, phone, email });
        toast.success('Filial cadastrada com sucesso!');
      }
      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar filial.');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setCnpj(branch.cnpj);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setEmail(branch.email || '');
    setShowModal(true);
  };

  const handleToggle = async (branch: Branch) => {
    try {
      await api.put(`/branches/${branch.id}`, { active: !branch.active });
      toast.success(branch.active ? 'Filial desativada.' : 'Filial ativada.');
      fetchBranches();
    } catch { toast.error('Erro ao atualizar filial.'); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setCnpj(''); setAddress(''); setPhone(''); setEmail('');
  };

  const filtered = branches.filter(b =>
    (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    b.cnpj?.includes(search)
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Filiais</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie as unidades da sua rede de oficinas.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <MdAdd size={18} /> Nova Filial
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-base pl-12" placeholder="Pesquisar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Branch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((branch) => (
          <div key={branch.id} className="card" style={{ position: 'relative', borderLeft: `4px solid ${branch.active ? 'var(--accent)' : 'var(--text-muted)'}`, opacity: branch.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  backgroundColor: branch.active ? 'var(--primary)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  boxShadow: branch.active ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none'
                }}>
                  <MdStore size={22} />
                </div>
                <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                  <h3 style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.name || 'Sem Nome'}>{branch.name || 'Sem Nome'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.cnpj}>{branch.cnpj}</div>
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                backgroundColor: branch.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: branch.active ? '#10b981' : '#ef4444'
              }}>
                {branch.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', width: '100%', overflow: 'hidden' }}>
              {branch.address && <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.address}>📍 {branch.address}</p>}
              {branch.phone && <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.phone}>📞 {branch.phone}</p>}
              {branch.email && <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.email}>✉️ {branch.email}</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
              <button 
                onClick={() => handleEdit(branch)} 
                style={{ 
                  flex: 1, 
                  background: 'var(--muted)', 
                  border: 'none', 
                  color: 'var(--foreground)', 
                  cursor: 'pointer', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  transition: 'background 0.2s',
                  height: '40px'
                }}
                className="hover:bg-accent"
              >
                <MdEdit size={16} /> Editar
              </button>
              <button 
                onClick={() => handleToggle(branch)} 
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: '1px solid var(--border)', 
                  color: branch.active ? '#ef4444' : '#10b981', 
                  cursor: 'pointer', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  transition: 'all 0.2s',
                  height: '40px'
                }}
                className="hover:bg-accent/10"
              >
                {branch.active ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
                {branch.active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Filial' : 'Nova Filial'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome da Filial *</span>
            <input className="input-base" placeholder="Ex: Matriz Centro" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>CNPJ *</span>
            <input className="input-base" placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Endereço</span>
            <input className="input-base" placeholder="Rua, número, bairro, cidade" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Telefone</span>
              <input className="input-base" placeholder="(00) 0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>E-mail</span>
              <input className="input-base" type="email" placeholder="email@filial.com" value={email} onChange={e => setEmail(e.target.value)} />
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

export default Branches;
