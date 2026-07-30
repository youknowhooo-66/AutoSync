import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wrench, Plus, Save, X, Printer, PackageSearch, PenTool, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { ServiceOrderTable, STATUS_CONFIG } from '../components/data-table/presets/ServiceOrderTable';
import type { OS } from '../components/data-table/presets/ServiceOrderTable';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge';
import Modal from '../components/Modal';

const ServiceOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OS | null>(null);
  
  // Create Form State
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [notes, setNotes] = useState('');

  // Add Item State
  const [showAddItem, setShowAddItem] = useState<'part' | 'service' | null>(null);
  const [itemPartId, setItemPartId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');

  // Fetch OS List
  const { data: osList = [], isLoading } = useQuery<OS[]>({
    queryKey: ['os-list'],
    queryFn: async () => {
      const { data } = await api.get('/os');
      return data;
    },
  });

  // Fetch Clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/clients')).data,
  });

  // Fetch Vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data,
  });

  // Fetch Branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data,
  });

  // Fetch Mechanics
  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter((u: any) => ['MECHANIC', 'MANAGER', 'ADMIN'].includes(u.role));
    },
  });

  // Fetch Parts for Add Item
  const { data: parts = [] } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/inventory/parts')).data,
    enabled: showAddItem === 'part',
  });

  // Fetch OS Details
  const { data: osDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['os-detail', selectedOS?.id],
    queryFn: async () => (await api.get(`/os/${selectedOS?.id}`)).data,
    enabled: !!selectedOS?.id,
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

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/os/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Status atualizado para ${STATUS_CONFIG[variables.status]?.label}`);
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
      queryClient.invalidateQueries({ queryKey: ['os-detail', variables.id] });
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: async (payload: any) => api.post(`/os/${selectedOS?.id}/items`, payload),
    onSuccess: () => {
      toast.success('Item adicionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['os-list'] });
      queryClient.invalidateQueries({ queryKey: ['os-detail', selectedOS?.id] });
      setShowAddItem(null);
      setItemPartId(''); setItemQty('1'); setItemPrice(''); setSvcName(''); setSvcPrice('');
    },
    onError: () => toast.error('Erro ao adicionar item.'),
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

  const handleAddPart = () => {
    if (!itemPartId) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    addItemMutation.mutate({
      parts: [{ partId: itemPartId, quantity: Number(itemQty), unitPrice: Number(itemPrice) }],
      services: [],
      userId: user.id
    });
  };

  const handleAddService = () => {
    if (!svcName) return;
    addItemMutation.mutate({
      parts: [],
      services: [{ name: svcName, price: Number(svcPrice) }]
    });
  };

  const filteredVehicles = vehicles.filter((v: any) => v.clientId === clientId);

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
              <p className="text-muted-foreground mt-1">Gerencie os serviços, status e faturamento.</p>
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
        />
      </div>

      {/* Sheet para Detalhes da OS (Raycast/Linear Style) */}
      <Sheet open={!!selectedOS} onOpenChange={(open) => !open && setSelectedOS(null)}>
        <SheetContent side="right" className="w-[500px] sm:max-w-2xl sm:w-full overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl p-0 flex flex-col">
          {selectedOS && (
            <>
              <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-border/50 p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                      OS #{String(selectedOS.number).padStart(4, '0')}
                      {STATUS_CONFIG[selectedOS.status] && (
                        <Badge variant="outline" className={`flex items-center px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[selectedOS.status].className}`}>
                          {STATUS_CONFIG[selectedOS.status].icon}
                          {STATUS_CONFIG[selectedOS.status].label}
                        </Badge>
                      )}
                    </SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-2">
                      Abertura: {new Date(selectedOS.createdAt).toLocaleDateString('pt-BR')}
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Printer className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const isActive = selectedOS.status === key;
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        disabled={isActive || updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: selectedOS.id, status: key })}
                        className={`h-7 px-3 text-xs rounded-full transition-all duration-200 ${
                          isActive ? config.className.replace('hover:', '') : 'hover:bg-muted opacity-60 hover:opacity-100'
                        }`}
                      >
                        {config.icon}
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-8 animate-in fade-in duration-300">
                {isLoadingDetail || !osDetail ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando detalhes...</div>
                ) : (
                  <>
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
                        <span className="font-semibold">{osDetail.client.name}</span>
                        <span className="text-sm text-muted-foreground">{osDetail.client.document}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Veículo</span>
                        <span className="font-semibold">{osDetail.vehicle.model}</span>
                        <span className="text-sm text-muted-foreground font-mono">{osDetail.vehicle.plate}</span>
                      </div>
                    </div>

                    {/* Parts Section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                          <PackageSearch className="w-4 h-4 text-muted-foreground" />
                          Peças
                        </h3>
                        {selectedOS.status !== 'FINISHED' && selectedOS.status !== 'CANCELLED' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setShowAddItem('part')}>
                            <Plus className="w-3 h-3 mr-1" /> Adicionar
                          </Button>
                        )}
                      </div>
                      
                      {showAddItem === 'part' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2">
                          <select 
                            value={itemPartId} 
                            onChange={e => { 
                              setItemPartId(e.target.value); 
                              const p = parts.find((x: any) => x.id === e.target.value); 
                              if (p) setItemPrice(String(p.salePrice)); 
                            }} 
                            className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="">Selecione...</option>
                            {parts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="Qtd" className="w-16 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                          <input type="number" step="0.01" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="R$" className="w-24 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                          <Button size="sm" className="h-8" onClick={handleAddPart} disabled={addItemMutation.isPending}><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => setShowAddItem(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      )}

                      <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
                        {osDetail.parts.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Nenhuma peça adicionada.</div>
                        ) : (
                          <div className="flex flex-col">
                            {osDetail.parts.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center p-3 text-sm border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{p.part.name}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">x{p.quantity}</Badge>
                                </div>
                                <span className="font-semibold">R$ {(p.unitPrice * p.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services Section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-muted-foreground" />
                          Serviços
                        </h3>
                        {selectedOS.status !== 'FINISHED' && selectedOS.status !== 'CANCELLED' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setShowAddItem('service')}>
                            <Plus className="w-3 h-3 mr-1" /> Adicionar
                          </Button>
                        )}
                      </div>

                      {showAddItem === 'service' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2">
                          <input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="Descrição do serviço..." className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                          <input type="number" step="0.01" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="R$" className="w-28 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                          <Button size="sm" className="h-8" onClick={handleAddService} disabled={addItemMutation.isPending}><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => setShowAddItem(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      )}

                      <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
                        {osDetail.services.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Nenhum serviço adicionado.</div>
                        ) : (
                          <div className="flex flex-col">
                            {osDetail.services.map((s: any, i: number) => (
                              <div key={i} className="flex justify-between items-center p-3 text-sm border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                                <span className="font-medium">{s.name}</span>
                                <span className="font-semibold">R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Summary */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 mt-auto">
                      <span className="font-medium uppercase tracking-wider text-sm">Valor Total Estimado</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {Number(osDetail.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create OS Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nova Ordem de Serviço" width="600px">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Cliente *</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">Selecione um cliente...</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Veículo *</label>
            <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!clientId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">{clientId ? 'Selecione um veículo...' : 'Selecione o cliente primeiro'}</option>
              {filteredVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Filial *</label>
            <select required value={branchId} onChange={e => setBranchId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">Selecione a filial...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Mecânico Responsável</label>
            <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
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
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
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
};

export default ServiceOrders;
