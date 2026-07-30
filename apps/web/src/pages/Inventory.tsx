import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdWarning, MdEdit, MdSwapHoriz, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import api from '../services/api';

interface Part {
  id: string;
  name: string;
  internalCode: string;
  manufacturerCode?: string;
  category: string;
  brand: string;
  description?: string;
  salePrice: number;
  purchasePrice: number;
  minStock: number;
  location?: string;
  supplierId?: string;
  stocks: { 
    quantity: number; 
    branchId: string; 
    branch: { name: string } 
  }[];
}

interface Supplier {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

const Inventory: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [transferPart, setTransferPart] = useState<Part | null>(null);
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);

  // Create form states
  const [formData, setFormData] = useState({
    name: '', internalCode: '', manufacturerCode: '', category: '',
    brand: '', supplierId: '', purchasePrice: '', salePrice: '',
    minStock: '0', initialStock: '0', branchId: '', location: ''
  });
  // Edit form states
  const [editForm, setEditForm] = useState({
    name: '', internalCode: '', manufacturerCode: '', category: '', brand: '',
    description: '', supplierId: '', purchasePrice: '', salePrice: '',
    minStock: '0', location: ''
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromBranchId: '', toBranchId: '', quantity: '1', reason: ''
  });

  useEffect(() => {
    fetchParts();
    fetchSuppliers();
    fetchBranches();
  }, []);

  const fetchParts = async () => {
    try {
      const response = await api.get('/inventory/parts');
      setParts(response.data);
    } catch (error) {
      toast.error('Erro ao buscar estoque.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Erro ao buscar fornecedores');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Erro ao buscar filiais');
    }
  };

  const handleDelete = async () => {
    if (!deletingPart) return;
    try {
      await api.delete(`/inventory/parts/${deletingPart.id}`);
      toast.success('Peça excluída com sucesso!');
      setShowDeleteModal(false);
      setDeletingPart(null);
      fetchParts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir peça.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/parts', {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        minStock: Number(formData.minStock),
        initialStock: Number(formData.initialStock)
      });
      toast.success('Peça cadastrada com sucesso!');
      setShowModal(false);
      fetchParts();
      setFormData({
        name: '', internalCode: '', manufacturerCode: '', category: '',
        brand: '', supplierId: '', purchasePrice: '', salePrice: '',
        minStock: '0', initialStock: '0', branchId: '', location: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar peça.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) { toast.error('Selecione um arquivo para importar.'); return; }
    const data = new FormData();
    data.append('file', importFile);
    try {
      const response = await api.post('/inventory/parts/import', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(response.data.message || 'Importação concluída!');
      setShowImportModal(false);
      setImportFile(null);
      fetchParts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao importar peças.');
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setEditForm({
      name: part.name,
      internalCode: part.internalCode,
      manufacturerCode: part.manufacturerCode || '',
      category: part.category || '',
      brand: part.brand || '',
      description: part.description || '',
      supplierId: part.supplierId || '',
      purchasePrice: String(part.purchasePrice),
      salePrice: String(part.salePrice),
      minStock: String(part.minStock),
      location: part.location || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;
    try {
      await api.put(`/inventory/parts/${editingPart.id}`, editForm);
      toast.success('Peça atualizada com sucesso!');
      setShowEditModal(false);
      setEditingPart(null);
      fetchParts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar peça.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPart) return;
    try {
      await api.post('/inventory/transfer', {
        partId: transferPart.id,
        ...transferForm,
        quantity: Number(transferForm.quantity)
      });
      toast.success('Transferência realizada!');
      setShowTransferModal(false);
      fetchParts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao transferir.');
    }
  };

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.internalCode.includes(search)
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Estoque</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Controle de peças e insumos da oficina.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }} onClick={() => setShowImportModal(true)}>
            Importar XLSX
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <MdAdd size={18} /> Nova Peça
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total de Itens</p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{parts.length}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estoque Crítico</p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
            {parts.filter(p => (p.stocks[0]?.quantity || 0) <= p.minStock).length}
          </h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Peça / Código</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Categoria</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Preço Venda</th>
              <th style={{ textAlign: 'center', padding: '1rem' }}>Estoque</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const currentStock = part.stocks[0]?.quantity || 0;
              const isLow = currentStock <= part.minStock;
              
              return (
                <tr key={part.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{part.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{part.internalCode}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{part.category}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>R$ {Number(part.salePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: isLow ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isLow ? 'var(--danger)' : 'var(--success)',
                      fontWeight: 700
                    }}>
                      {isLow && <MdWarning size={14} />}
                      {currentStock}
                    </div>
                  </td>
                   <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                     <button 
                       onClick={() => { setTransferPart(part); setShowTransferModal(true); }}
                       style={{ background: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}
                       title="Transferir entre filiais"
                     >
                       <MdSwapHoriz size={16} /> Transferir
                     </button>
                     <button onClick={() => handleEdit(part)} style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                       <MdEdit size={16} /> Editar
                     </button>
                     <button 
                       onClick={() => { setDeletingPart(part); setShowDeleteModal(true); }}
                       style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}
                     >
                       <MdDelete size={16} /> Excluir
                     </button>
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmar Exclusão" width="450px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <MdWarning size={32} />
          </div>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Tem certeza que deseja excluir?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Esta ação irá remover permanentemente a peça <strong>{deletingPart?.name}</strong> ({deletingPart?.internalCode}) e todos os seus registros de estoque.
            </p>
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
              Nota: O sistema impedirá a exclusão se a peça já tiver sido utilizada em OS ou possuir histórico de movimentação.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger)' }} onClick={handleDelete}>
              Sim, Excluir
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Cadastrar Nova Peça" width="800px">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome da Peça *</label>
            <input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Código Interno *</label>
            <input 
              required 
              value={formData.internalCode} 
              onChange={e => setFormData({...formData, internalCode: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Código Fabricante</label>
            <input 
              value={formData.manufacturerCode} 
              onChange={e => setFormData({...formData, manufacturerCode: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Categoria</label>
            <input 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Marca</label>
            <input 
              value={formData.brand} 
              onChange={e => setFormData({...formData, brand: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fornecedor</label>
            <select 
              value={formData.supplierId} 
              onChange={e => setFormData({...formData, supplierId: e.target.value})}
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preço Compra (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={formData.purchasePrice} 
              onChange={e => setFormData({...formData, purchasePrice: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preço Venda (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={formData.salePrice} 
              onChange={e => setFormData({...formData, salePrice: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estoque Mínimo</label>
            <input 
              type="number" 
              value={formData.minStock} 
              onChange={e => setFormData({...formData, minStock: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estoque Inicial</label>
            <input 
              type="number" 
              value={formData.initialStock} 
              onChange={e => setFormData({...formData, initialStock: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filial (para estoque inicial)</label>
            <select 
              value={formData.branchId} 
              onChange={e => setFormData({...formData, branchId: e.target.value})}
            >
              <option value="">Selecione uma filial</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Localização</label>
            <input 
              placeholder="Ex: Prateleira A1" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
            />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)' }} onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              Cadastrar Peça
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar Peças (XLSX/CSV)" width="600px">
        <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Selecione um arquivo .xlsx ou .csv para importar peças. Certifique-se de que as colunas 
            "Nome da Peça" e "Código Interno" estejam presentes.
          </p>
          <input 
            type="file" 
            accept=".xlsx, .csv" 
            onChange={handleFileChange} 
            style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)' }} onClick={() => setShowImportModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={!importFile}>
              Importar
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Part Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar: ${editingPart?.name}`} width="700px">
        <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome da Peça *</label>
            <input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cód. Interno *</label>
            <input required value={editForm.internalCode} onChange={e => setEditForm({ ...editForm, internalCode: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cód. Fabricante</label>
            <input value={editForm.manufacturerCode} onChange={e => setEditForm({ ...editForm, manufacturerCode: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Categoria</label>
            <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Marca</label>
            <input value={editForm.brand} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preço Compra (R$)</label>
            <input type="number" step="0.01" value={editForm.purchasePrice} onChange={e => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Preço Venda (R$)</label>
            <input type="number" step="0.01" value={editForm.salePrice} onChange={e => setEditForm({ ...editForm, salePrice: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Estoque Mínimo</label>
            <input type="number" value={editForm.minStock} onChange={e => setEditForm({ ...editForm, minStock: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Localização</label>
            <input placeholder="Ex: Prateleira A1" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fornecedor</label>
            <select value={editForm.supplierId} onChange={e => setEditForm({ ...editForm, supplierId: e.target.value })}>
              <option value="">Sem fornecedor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descrição</label>
            <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--accent)', fontWeight: 700 }}>Saldos por Filial</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {editingPart?.stocks.map(s => (
                <div key={s.branchId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.85rem' }}>{s?.branch?.name || 'Filial Desconhecida'}</span>
                  <span style={{ fontWeight: 700, color: s.quantity <= (editingPart?.minStock || 0) ? 'var(--danger)' : 'var(--success)' }}>
                    {s.quantity} un
                  </span>
                </div>
              ))}
              {(!editingPart?.stocks || editingPart?.stocks.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum estoque registrado.</p>
              )}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar Alterações</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title={`Transferir: ${transferPart?.name}`} width="500px">
        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Origem (Filial) *</label>
            <select required value={transferForm.fromBranchId} onChange={e => setTransferForm({ ...transferForm, fromBranchId: e.target.value })}>
              <option value="">Selecione a origem</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Destino (Filial) *</label>
            <select required value={transferForm.toBranchId} onChange={e => setTransferForm({ ...transferForm, toBranchId: e.target.value })}>
              <option value="">Selecione o destino</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantidade *</label>
            <input type="number" min="1" required value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Motivo / Observação</label>
            <textarea rows={2} value={transferForm.reason} onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Ex: Reposição de estoque urgente" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'white' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowTransferModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Confirmar Transferência</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
