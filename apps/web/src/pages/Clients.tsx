import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdEdit, MdPerson } from 'react-icons/md';
import Modal from '../components/Modal';
import api from '../services/api';

interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  whatsapp: string;
  address: string;
  email: string;
}

const emptyForm = { name: '', document: '', phone: '', whatsapp: '', address: '', email: '' };

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch { toast.error('Erro ao buscar clientes.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clients', formData);
        toast.success('Cliente cadastrado com sucesso!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente.');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      document: client.document,
      phone: client.phone || '',
      whatsapp: client.whatsapp || '',
      address: client.address || '',
      email: client.email || '',
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document.includes(search)
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie a base de clientes da sua oficina.</p>
        </div>
        <button className="btn-primary" onClick={handleNew}>
          <MdAdd size={18} /> Novo Cliente
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-base pl-12" type="text" placeholder="Pesquisar por nome ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Documento</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Contato</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum cliente encontrado.</td></tr>
            ) : filteredClients.map((client) => (
              <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)' }}>
                      <MdPerson size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{client.document}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{client.phone || client.whatsapp || '—'}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleEdit(client)} 
                      style={{ 
                        background: 'transparent', 
                        border: '1px solid var(--border)', 
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
                      className="hover:bg-muted"
                    >
                      <MdEdit size={14} /> Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Cliente' : 'Novo Cliente'} width="600px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome Completo *</label>
            <input className="input-base" required placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>CPF ou CNPJ *</label>
            <input className="input-base" required placeholder="000.000.000-00" value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Telefone</label>
              <input className="input-base" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>WhatsApp</label>
              <input className="input-base" placeholder="(00) 00000-0000" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Endereço</label>
            <input className="input-base" placeholder="Rua, número, bairro, cidade" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>E-mail</label>
            <input className="input-base" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;
