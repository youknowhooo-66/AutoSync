import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CarFront, Plus } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { VehicleTable } from '../components/data-table/presets/VehicleTable';
import type { Vehicle } from '../components/data-table/presets/VehicleTable';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
}

const emptyForm = { plate: '', model: '', brand: '', year: '', chassis: '', mileage: '', engine: '', clientId: '' };

const Vehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data;
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return api.put(`/vehicles/${editingId}`, payload);
      }
      return api.post('/vehicles', payload);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar veículo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/vehicles/${id}`);
    },
    onSuccess: () => {
      toast.success('Veículo excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir veículo.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      year: Number(formData.year),
      mileage: Number(formData.mileage) || 0,
    };
    saveMutation.mutate(payload);
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

  const handleDelete = (v: Vehicle) => {
    if (confirm(`Tem certeza que deseja excluir o veículo ${v.model}?`)) {
      deleteMutation.mutate(v.id);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6 h-full max-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CarFront className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Veículos</h1>
              <p className="text-muted-foreground mt-1">Gerencie a frota e os veículos dos clientes.</p>
            </div>
          </div>
        </div>
        <Button onClick={handleNew} size="lg" className="shadow-sm">
          <Plus className="mr-2 h-5 w-5" /> Novo Veículo
        </Button>
      </header>

      <div className="flex-1 min-h-[500px]">
        <VehicleTable 
          data={vehicles} 
          isLoading={isLoading} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Veículo' : 'Novo Veículo'} width="700px">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 col-span-2">
            <label className="text-sm font-medium text-foreground">Proprietário *</label>
            <select 
              required 
              value={formData.clientId} 
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Placa *</label>
            <input 
              required 
              placeholder="ABC-1234" 
              value={formData.plate} 
              onChange={e => setFormData({ ...formData, plate: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Ano *</label>
            <input 
              type="number" 
              required 
              placeholder="2024" 
              value={formData.year} 
              onChange={e => setFormData({ ...formData, year: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Marca *</label>
            <input 
              required 
              placeholder="Toyota, Honda..." 
              value={formData.brand} 
              onChange={e => setFormData({ ...formData, brand: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Modelo *</label>
            <input 
              required 
              placeholder="Corolla, Civic..." 
              value={formData.model} 
              onChange={e => setFormData({ ...formData, model: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Quilometragem</label>
            <input 
              type="number" 
              placeholder="KM atual" 
              value={formData.mileage} 
              onChange={e => setFormData({ ...formData, mileage: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Motorização</label>
            <input 
              placeholder="Ex: 1.0, 2.0 Turbo" 
              value={formData.engine} 
              onChange={e => setFormData({ ...formData, engine: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex flex-col gap-2 col-span-2">
            <label className="text-sm font-medium text-foreground">Chassi</label>
            <input 
              placeholder="Número do Chassi" 
              value={formData.chassis} 
              onChange={e => setFormData({ ...formData, chassis: e.target.value })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="col-span-2 flex gap-4 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
