import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Save } from 'lucide-react';
import api from '@/services/api';
import { ServiceOrderTable } from '../components/ServiceOrderTable';
import { ServiceOrderDetailSheet } from '../components/ServiceOrderDetailSheet';
import { ServiceOrderStatusBadge } from '../components/ServiceOrderStatusBadge';
import { Button } from '@/components/ui/button';
import { FormField, Page, PageHeader } from '@/components/primitives';
import Modal from '@/components/Modal';
import type { ServiceOrder } from '../types/serviceOrder.types';
import { useServiceOrders, useCreateServiceOrder } from '../hooks/useServiceOrders';
import { useClients } from '../../clients/hooks/useClients';
import { useVehicles } from '../../vehicles/hooks/useVehicles';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ServiceOrders() {
  const isMobile = useIsMobile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  // Create Form State
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch OS List via standard hook
  const { data: osList = [], isLoading } = useServiceOrders();

  // Re-use official clients & vehicles query hooks with array safety
  const { data: rawClients } = useClients(1, 100);
  const { data: rawVehicles } = useVehicles(1, 100);

  const clients = Array.isArray(rawClients) ? rawClients : (rawClients as any)?.items || [];
  const vehicles = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles as any)?.items || [];

  // Fetch branches and mechanics
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data,
  });

  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter((u: any) => ['MECHANIC', 'MANAGER', 'ADMIN'].includes(u.role));
    },
  });

  // Create OS Mutation via hook
  const createMutation = useCreateServiceOrder();

  const resetForm = () => {
    setClientId('');
    setVehicleId('');
    setMechanicId('');
    setNotes('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.branchId) setBranchId(user.branchId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Selecione um cliente.');
      return;
    }
    if (!vehicleId) {
      toast.error('Selecione um veículo.');
      return;
    }
    if (!branchId) {
      toast.error('Selecione a filial.');
      return;
    }

    createMutation.mutate(
      {
        clientId,
        vehicleId,
        branchId,
        mechanicId: mechanicId || null,
        notes,
      },
      {
        onSuccess: () => {
          toast.success('Ordem de Serviço criada com sucesso!');
          setShowCreateModal(false);
          resetForm();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Erro ao criar OS.');
        },
      }
    );
  };

  const handleClientChange = (val: string) => {
    setClientId(val);
    setVehicleId(''); // Clear vehicle selection when client changes
  };

  const filteredVehicles = vehicles.filter((v: any) => v.clientId === clientId);

  return (
    <Page data-testid="service-orders-page">
      <PageHeader
        title="Ordens de Serviço"
        description="Gerencie fluxos, status, serviços, diagnósticos e integrações operacionais em tempo real."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova OS
          </Button>
        }
      />

      <div className="w-full flex-1 min-h-[500px]">
        {isMobile ? (
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Carregando ordens de serviço...</div>
            ) : osList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Nenhuma ordem de serviço registrada.</div>
            ) : (
              osList.map((os) => {
                const formattedVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(os.finalValue || 0));
                return (
                  <button
                    type="button"
                    key={os.id}
                    onClick={() => setSelectedOS(os)}
                    aria-label={`Ver detalhes da Ordem de Serviço #${os.number}`}
                    className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-3 text-left w-full cursor-pointer hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono font-semibold text-sm">
                        <span className="text-primary">#</span>
                        <span className="text-foreground">{String(os.number).padStart(4, '0')}</span>
                      </div>
                      <ServiceOrderStatusBadge status={os.status} />
                    </div>

                    <div className="flex flex-col gap-1 text-xs">
                      <div className="font-semibold text-foreground truncate">{os.client?.name || 'Sem Cliente'}</div>
                      <div className="text-muted-foreground truncate">{os.vehicle?.model ? `${os.vehicle.model} • ${os.vehicle.plate}` : 'Sem Veículo'}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground font-mono">
                        {os.createdAt ? new Date(os.createdAt).toLocaleDateString('pt-BR') : '---'}
                      </span>
                      <span className="font-bold text-foreground text-sm">{formattedVal}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <ServiceOrderTable
            data={osList}
            isLoading={isLoading}
            onRowClick={(os) => setSelectedOS(os)}
            onEdit={(os) => setSelectedOS(os)}
          />
        )}
      </div>

      <ServiceOrderDetailSheet os={selectedOS} onClose={() => setSelectedOS(null)} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nova Ordem de Serviço" width="600px">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <FormField label="Cliente" htmlFor="client-select" required>
            <select
              id="client-select"
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Veículo" htmlFor="vehicle-select" required>
            <select
              id="vehicle-select"
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!clientId}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
            >
              <option value="">
                {clientId ? 'Selecione um veículo...' : 'Selecione o cliente primeiro'}
              </option>
              {filteredVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.model} — {v.plate}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Filial" htmlFor="branch-select" required>
            <select
              id="branch-select"
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione a filial...</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Mecânico Responsável" htmlFor="mechanic-select">
            <select
              id="mechanic-select"
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Sem mecânico designado</option>
              {mechanics.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Observações / Problema" htmlFor="notes-textarea">
            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Relato do cliente, sintomas relatados..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending} className="font-semibold text-xs">
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Abrir OS'}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}
