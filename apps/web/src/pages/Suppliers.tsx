import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { MdAdd, MdSearch, MdEdit, MdLocalShipping } from 'react-icons/md';

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  parts: { id: string; name: string }[];
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch { toast.error('Erro ao buscar fornecedores.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, { name, cnpj, phone, address, email });
        toast.success('Fornecedor atualizado!');
      } else {
        await api.post('/suppliers', { name, cnpj, phone, address, email });
        toast.success('Fornecedor cadastrado!');
      }
      setShowModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar fornecedor.');
    }
  };

  const handleEdit = (s: Supplier) => {
    setEditingId(s.id); setName(s.name); setCnpj(s.cnpj || '');
    setPhone(s.phone || ''); setAddress(s.address || ''); setEmail(s.email || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setCnpj(''); setPhone(''); setAddress(''); setEmail('');
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj?.includes(search)
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Fornecedores</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus fornecedores de peças e insumos.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <MdAdd size={20} /> Novo Fornecedor
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-base pl-12" placeholder="Pesquisar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Fornecedor</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>CNPJ</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Contato</th>
              <th style={{ textAlign: 'center', padding: '1rem' }}>Peças Vinculadas</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr key={supplier.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      backgroundColor: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)'
                    }}>
                      <MdLocalShipping size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                      {supplier.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{supplier.email}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{supplier.cnpj || '—'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{supplier.phone || '—'}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                    backgroundColor: 'rgba(56,189,248,0.1)', color: 'var(--accent)'
                  }}>
                    {supplier.parts?.length || 0} Peças
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(supplier)} className="btn-primary" style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}>
                    <MdEdit size={14} className="mr-1" /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome *</span>
            <input className="input-base" placeholder="Razão Social" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>CNPJ</span>
            <input className="input-base" placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
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
              <input className="input-base" type="email" placeholder="contato@fornecedor.com" value={email} onChange={e => setEmail(e.target.value)} />
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

export default Suppliers;
