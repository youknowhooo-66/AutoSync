import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdDirectionsCar, MdEdit } from 'react-icons/md';
import Modal from '../components/Modal';
import api from '../services/api';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  chassis: string;
  mileage: number;
  engine: string;
  clientId: string;
  client: { name: string };
}

interface Client {
  id: string;
  name: string;
}

const emptyForm = { plate: '', model: '', brand: '', year: '', chassis: '', mileage: '', engine: '', clientId: '' };

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch { toast.error('Erro ao buscar veículos.'); }
    finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch { console.error('Erro ao buscar clientes'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        year: Number(formData.year),
        mileage: Number(formData.mileage) || 0,
      };
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        toast.success('Veículo atualizado com sucesso!');
      } else {
        await api.post('/vehicles', payload);
        toast.success('Veículo cadastrado com sucesso!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar veículo.');
    }
  };

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormData({
      plate: v.plate,
      model: v.model,
      brand: v.brand,
      year: String(v.year),
      chassis: v.chassis || '',
      mileage: String(v.mileage || ''),
      engine: v.engine || '',
      clientId: v.clientId,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const filteredVehicles = vehicles.filter(v =>
    v.model.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.client.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Veículos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cadastro e gerenciamento de veículos da frota.</p>
        </div>
        <button className="btn-primary" onClick={handleNew}>
          <MdAdd size={20} /> Novo Veículo
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar por modelo, placa ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '40px' }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Veículo</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Placa</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Ano</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Proprietário</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</td></tr>
            ) : filteredVehicles.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum veículo encontrado.</td></tr>
            ) : filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <MdDirectionsCar size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{vehicle.model}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicle.brand}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ backgroundColor: '#1e293b', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.875rem', color: 'white', letterSpacing: '1px' }}>
                    {vehicle.plate.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{vehicle.year}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{vehicle.client.name}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(vehicle)} style={{ background: 'rgba(56,189,248,0.1)', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                    <MdEdit size={16} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Veículo' : 'Novo Veículo'} width="700px">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Proprietário *</label>
            <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Placa *</label>
            <input required placeholder="ABC-1234" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ano *</label>
            <input type="number" required placeholder="2024" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Marca *</label>
            <input required placeholder="Toyota, Honda..." value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Modelo *</label>
            <input required placeholder="Corolla, Civic..." value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quilometragem</label>
            <input type="number" placeholder="KM atual" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Motorização</label>
            <input placeholder="Ex: 1.0, 2.0 Turbo" value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chassi</label>
            <input placeholder="Número do Chassi" value={formData.chassis} onChange={e => setFormData({ ...formData, chassis: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-primary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
