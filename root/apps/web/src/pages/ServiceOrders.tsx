import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdVisibility, MdBuild, MdPrint } from 'react-icons/md';
import Modal from '../components/Modal';
import api from '../services/api';

interface OS {
  id: string;
  number: number;
  status: string;
  finalValue: number;
  createdAt: string;
  notes?: string;
  client: { name: string };
  vehicle: { model: string; plate: string };
  mechanic?: { name: string };
}

interface Client { id: string; name: string; }
interface Vehicle { id: string; model: string; plate: string; clientId: string; }
interface Branch { id: string; name: string; }
interface User { id: string; name: string; role: string; }
interface Part { id: string; name: string; internalCode: string; salePrice: number; }
interface OSDetail { 
  id: string; 
  number: number; 
  status: string; 
  finalValue: number; 
  notes?: string; 
  client: { name: string; document: string }; 
  vehicle: { model: string; plate: string }; 
  parts: { part: Part; quantity: number; unitPrice: number }[]; 
  services: { name: string; price: number }[]; 
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  OPEN:           { bg: 'rgba(56,189,248,0.1)',   color: '#38bdf8', label: 'Aberta' },
  IN_PROGRESS:    { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b', label: 'Em Andamento' },
  AWAITING_PARTS: { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6', label: 'Aguardando Peças' },
  FINISHED:       { bg: 'rgba(16,185,129,0.1)',   color: '#10b981', label: 'Finalizada' },
  CANCELLED:      { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444', label: 'Cancelada' },
};

const ServiceOrders: React.FC = () => {
  const [osList, setOsList] = useState<OS[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OS | null>(null);
  const [osDetail, setOsDetail] = useState<OSDetail | null>(null);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemPartId, setItemPartId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');

  // Form
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchOS();
    fetchClients();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (clientId) fetchVehiclesByClient(clientId);
    else setVehicles([]);
  }, [clientId]);

  const fetchOS = async () => {
    try {
      const res = await api.get('/os');
      setOsList(res.data);
    } catch { toast.error('Erro ao buscar ordens de serviço.'); }
    finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try { const res = await api.get('/clients'); setClients(res.data); } catch {}
  };

  const fetchVehiclesByClient = async (cId: string) => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.filter((v: Vehicle) => v.clientId === cId));
    } catch {}
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.branchId) setBranchId(user.branchId);
    } catch {}
  };

  const fetchMechanics = async () => {
    try {
      const res = await api.get('/users');
      setMechanics(res.data.filter((u: User) => u.role === 'MECHANIC' || u.role === 'MANAGER' || u.role === 'ADMIN'));
    } catch {}
  };

  const handleOpenCreateModal = () => {
    setClientId(''); setVehicleId(''); setMechanicId(''); setNotes('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.branchId) setBranchId(user.branchId);
    fetchMechanics();
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/os', {
        clientId,
        vehicleId,
        branchId,
        mechanicId: mechanicId || null,
        notes,
      });
      toast.success('Ordem de Serviço aberta com sucesso!');
      setShowModal(false);
      fetchOS();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao abrir OS.');
    }
  };

  const handleUpdateStatus = async (osId: string, status: string) => {
    try {
      await api.patch(`/os/${osId}/status`, { status });
      toast.success(status === 'FINISHED' ? 'OS finalizada! Registro financeiro criado.' : 'Status atualizado!');
      fetchOS();
      setShowDetailModal(false);
    } catch { toast.error('Erro ao atualizar status.'); }
  };

  const openDetail = async (os: OS) => {
    setSelectedOS(os);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/os/${os.id}`);
      setOsDetail(res.data);
    } catch { toast.error('Erro ao carregar detalhes.'); }
  };

  const fetchAllParts = async () => {
    try { const res = await api.get('/inventory/parts'); setAllParts(res.data); } catch {}
  };

  const handleAddPart = async () => {
    if (!osDetail || !itemPartId) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.post(`/os/${osDetail.id}/items`, { parts: [{ partId: itemPartId, quantity: Number(itemQty), unitPrice: Number(itemPrice) }], services: [], userId: user.id });
      toast.success('Peça adicionada!');
      const res = await api.get(`/os/${osDetail.id}`);
      setOsDetail(res.data);
      fetchOS();
      setItemPartId(''); setItemQty('1'); setItemPrice('');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao adicionar peça.'); }
  };

  const handleAddService = async () => {
    if (!osDetail || !svcName) return;
    try {
      await api.post(`/os/${osDetail.id}/items`, { parts: [], services: [{ name: svcName, price: Number(svcPrice) }] });
      toast.success('Serviço adicionado!');
      const res = await api.get(`/os/${osDetail.id}`);
      setOsDetail(res.data);
      fetchOS();
      setSvcName(''); setSvcPrice('');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao adicionar serviço.'); }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedOS) return;
    try {
      const response = await api.get(`/os/${selectedOS.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OS_${selectedOS.number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Erro ao baixar PDF.');
    }
  };

  const filteredOS = osList.filter(os =>
    String(os.number).includes(search) ||
    os.client.name.toLowerCase().includes(search.toLowerCase()) ||
    os.vehicle.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Ordens de Serviço</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Acompanhe e gerencie os serviços da oficina.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <MdAdd size={20} /> Nova OS
        </button>
      </header>

      <div className="card no-print" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar por número, cliente ou placa..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '40px' }} />
        </div>
      </div>

      <div className="card no-print" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Nº / Data</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Veículo</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Total</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</td></tr>
            ) : filteredOS.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma OS encontrada.</td></tr>
            ) : filteredOS.map((os) => {
              const statusStyle = STATUS_MAP[os.status] || STATUS_MAP.OPEN;
              return (
                <tr key={os.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700 }}>#{os.number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(os.createdAt).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{os.client.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.875rem' }}>{os.vehicle.model}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{os.vehicle.plate}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                    R$ {Number(os.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => openDetail(os)}
                      style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      <MdVisibility size={16} /> Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail / Status Modal */}
      {selectedOS && (
        <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setOsDetail(null); }} title={`OS #${selectedOS.number}`} width="700px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-print">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '0.5rem' }}>
              <button onClick={handleDownloadPDF} className="btn-primary" style={{ backgroundColor: '#475569', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                <MdPrint size={18} /> Baixar PDF
              </button>
              <button onClick={handlePrint} className="btn-primary" style={{ backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                <MdPrint size={18} /> Imprimir Rápido
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Cliente</p>
                <p style={{ fontWeight: 600 }}>{selectedOS.client.name}</p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Veículo</p>
                <p style={{ fontWeight: 600 }}>{selectedOS.vehicle.model} — {selectedOS.vehicle.plate}</p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</p>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: STATUS_MAP[selectedOS.status]?.bg, color: STATUS_MAP[selectedOS.status]?.color }}>
                  {STATUS_MAP[selectedOS.status]?.label}
                </span>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total</p>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>R$ {Number(osDetail?.finalValue ?? selectedOS.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Items display... */}
            <div style={{ borderRadius: '0.5rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔩 Peças</p>
                {selectedOS.status !== 'FINISHED' && selectedOS.status !== 'CANCELLED' && (
                  <button onClick={() => { fetchAllParts(); setShowAddItemModal(true); }} style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>+ Adicionar</button>
                )}
              </div>
              {osDetail?.parts?.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span>{p.part.name} <span style={{ color: 'var(--text-muted)' }}>x{p.quantity}</span></span>
                  <span style={{ fontWeight: 600 }}>R$ {(Number(p.unitPrice) * p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: '0.5rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>🔧 Serviços</p>
                {selectedOS.status !== 'FINISHED' && selectedOS.status !== 'CANCELLED' && (
                  <button onClick={() => setShowAddItemModal(true)} style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>+ Adicionar</button>
                )}
              </div>
              {osDetail?.services?.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Atualizar Status</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <button key={key} onClick={() => handleUpdateStatus(selectedOS.id, key)} disabled={selectedOS.status === key}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: selectedOS.status === key ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.8rem', backgroundColor: selectedOS.status === key ? val.bg : 'rgba(255,255,255,0.05)', color: selectedOS.status === key ? val.color : 'var(--text-secondary)', opacity: selectedOS.status === key ? 1 : 0.7 }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create OS Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Ordem de Serviço" width="600px">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cliente *</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Veículo *</label>
            <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!clientId}>
              <option value="">{clientId ? 'Selecione um veículo' : 'Selecione o cliente primeiro'}</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filial *</label>
            <select required value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">Selecione a filial</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Mecânico Responsável</label>
            <select value={mechanicId} onChange={e => setMechanicId(e.target.value)}>
              <option value="">Sem mecânico designado</option>
              {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Observações</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Problema relatado pelo cliente..." rows={3} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'white', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Abrir OS</button>
          </div>
        </form>
      </Modal>

      {/* Add Items Modal */}
      <Modal isOpen={showAddItemModal} onClose={() => setShowAddItemModal(false)} title="Adicionar Itens à OS" width="600px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Adicionar Peça</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <select value={itemPartId} onChange={e => { setItemPartId(e.target.value); const p = allParts.find(x => x.id === e.target.value); if (p) setItemPrice(String(p.salePrice)); }} style={{ width: '100%' }}>
                  <option value="">Selecione a peça</option>
                  {allParts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.internalCode})</option>)}
                </select>
              </div>
              <div style={{ flex: 0.5 }}><input type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="Qtd" style={{ width: '100%' }} /></div>
              <div style={{ flex: 0.7 }}><input type="number" step="0.01" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Preço" style={{ width: '100%' }} /></div>
              <button onClick={handleAddPart} className="btn-primary" style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>+</button>
            </div>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Adicionar Serviço</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}><input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="Nome do serviço" style={{ width: '100%' }} /></div>
              <div style={{ flex: 1 }}><input type="number" step="0.01" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="Valor R$" style={{ width: '100%' }} /></div>
              <button onClick={handleAddService} className="btn-primary" style={{ padding: '0.75rem 1rem' }}>+</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Print Layout */}
      {osDetail && (
        <div id="print-area" className="print-only" style={{ display: 'none', padding: '2rem', color: 'black', backgroundColor: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '24px', margin: 0 }}>AutoSync ERP — Ordem de Serviço</h1>
            <p style={{ margin: '5px 0' }}>Comprovante de Serviço Automotivo</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Dados do Cliente</h3>
              <p><strong>Nome:</strong> {osDetail.client.name}</p>
              <p><strong>Documento:</strong> {osDetail.client.document}</p>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Dados do Veículo</h3>
              <p><strong>Modelo:</strong> {osDetail.vehicle.model}</p>
              <p><strong>Placa:</strong> {osDetail.vehicle.plate}</p>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Itens e Serviços</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Descrição</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Qtd</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>V. Unit</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {osDetail.parts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.part.name}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>{p.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>R$ {Number(p.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>R$ {(Number(p.unitPrice) * p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {osDetail.services.map((s, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{s.name} (Serviço)</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>1</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>VALOR TOTAL:</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #ddd' }}>R$ {Number(osDetail.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Responsável</div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Cliente</div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrders;
