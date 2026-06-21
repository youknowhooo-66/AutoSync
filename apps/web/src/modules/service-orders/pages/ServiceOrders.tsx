import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wrench, Plus, Save } from 'lucide-react';
import api from '@/services/api';
import { ServiceOrderTable } from '../components/ServiceOrderTable';
import { ServiceOrderDetailSheet } from '../components/ServiceOrderDetailSheet';
import { Button } from '@/components/ui/button';
import Modal from '@/components/Modal';
import type { ServiceOrder } from '../types/serviceOrder.types';

export default function ServiceOrders() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  
  // Create Form State
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch OS List
  const { data: osList = [], isLoading } = useQuery<ServiceOrder[]>({
    queryKey: ['os-list'],
    queryFn: async () => {
      const { data } = await api.get('/os');
      return data;
    },
  });

  // Fetch Aux Data
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: async () => (await api.get('/clients')).data });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: async () => (await api.get('/vehicles')).data });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: async () => (await api.get('/branches')).data });
  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter((u: any) => ['MECHANIC', 'MANAGER', 'ADMIN'].includes(u.role));
    },
  });

  // Create OS Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/os', payload),
    onSuccess: () => {
      toast.success('Ordem de Serviço criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao criar OS.'),
  });

  const resetForm = () => {
    setClientId(''); setVehicleId(''); setMechanicId(''); setNotes('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.branchId) setBranchId(user.branchId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      clientId,
      vehicleId,
      branchId,
      mechanicId: mechanicId || null,
      notes,
    });
  };

  const filteredVehicles = vehicles.filter((v: any) => v.clientId === clientId);

  return (
    <div className="flex flex-col gap-6 h-full max-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Ordens de Serviço</h1>
              <p className="text-muted-foreground mt-1">Gerencie fluxos, status, serviços e integrações de estoque.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateModal(true); }} size="lg" className="shadow-sm">
          <Plus className="mr-2 h-5 w-5" /> Nova OS
        </Button>
      </header>

      <div className="flex-1 min-h-[500px]">
        <ServiceOrderTable 
          data={osList} 
          isLoading={isLoading} 
          onRowClick={(os) => setSelectedOS(os)}
          onEdit={(os) => setSelectedOS(os)}
        />
      </div>

      <ServiceOrderDetailSheet 
        os={selectedOS} 
        onClose={() => setSelectedOS(null)} 
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nova Ordem de Serviço" width="600px">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Cliente *</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione um cliente...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Veículo *</label>
            <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!clientId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">{clientId ? 'Selecione um veículo...' : 'Selecione o cliente primeiro'}</option>
              {filteredVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Filial *</label>
            <select required value={branchId} onChange={e => setBranchId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione a filial...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Mecânico Responsável</label>
            <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Sem mecânico designado</option>
              {mechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Observações / Problema</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Relato do cliente, sintomas..." 
              rows={3} 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Abrir OS'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
