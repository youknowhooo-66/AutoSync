import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Plus, Upload, Save, X, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { InventoryTable } from '../components/InventoryTable';
import { StockAlertBanner } from '../components/StockAlertBanner';
import { Button } from '@/components/ui/button';
import Modal from '@/components/Modal';
import type { InventoryItem } from '../types/inventory.types';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', internalCode: '', category: '', brand: '',
    purchasePrice: '', salePrice: '', minStock: '0', initialStock: '0',
    branchId: '', supplierId: ''
  });

  const [transferForm, setTransferForm] = useState({
    fromBranchId: '', toBranchId: '', quantity: '1', reason: ''
  });

  // Queries
  const { data: parts = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/parts');
      return data.map((item: any) => {
        const totalQuantity = item.stocks.reduce((acc: number, s: any) => acc + s.quantity, 0);
        let status = 'OK';
        if (totalQuantity === 0) status = 'OUT_OF_STOCK';
        else if (totalQuantity <= item.minStock / 2) status = 'CRITICAL';
        else if (totalQuantity <= item.minStock) status = 'LOW';
        return { ...item, totalQuantity, status };
      });
    }
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers')).data
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/inventory/parts', payload),
    onSuccess: () => {
      toast.success('Peça cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowCreateModal(false);
      setFormData({ name: '', internalCode: '', category: '', brand: '', purchasePrice: '', salePrice: '', minStock: '0', initialStock: '0', branchId: '', supplierId: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao cadastrar peça.')
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/inventory/transfer', payload),
    onSuccess: () => {
      toast.success('Transferência realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowTransferModal(false);
      setTransferItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao transferir estoque.')
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      minStock: Number(formData.minStock),
      initialStock: Number(formData.initialStock)
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;
    transferMutation.mutate({
      partId: transferItem.id,
      ...transferForm,
      quantity: Number(transferForm.quantity)
    });
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return toast.error('Selecione um arquivo.');
    const data = new FormData();
    data.append('file', importFile);
    try {
      await api.post('/inventory/parts/import', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Importação concluída!');
      setShowImportModal(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro na importação.');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full max-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Estoque</h1>
              <p className="text-muted-foreground mt-1">Controle de SKUs, movimentações e níveis de alerta.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="lg" className="shadow-sm">
            <Plus className="mr-2 h-5 w-5" /> Nova Peça
          </Button>
        </div>
      </header>

      <StockAlertBanner items={parts} />

      <div className="flex-1 min-h-[500px]">
        <InventoryTable 
          data={parts} 
          isLoading={isLoading}
          onTransfer={(item) => {
            setTransferItem(item);
            setShowTransferModal(true);
          }}
        />
      </div>

      {/* Modal Nova Peça */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Cadastrar Nova Peça" width="800px">
        <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nome da Peça *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Código Interno *</label>
            <input required value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Categoria</label>
            <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Marca</label>
            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Fornecedor</label>
            <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Filial (Estoque Inicial)</label>
            <select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Preço de Compra</label>
            <input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Preço de Venda</label>
            <input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Estoque Mínimo</label>
            <input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Estoque Inicial</label>
            <input type="number" value={formData.initialStock} onChange={e => setFormData({...formData, initialStock: e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Salvar Peça'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Transferência */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title={`Transferir: ${transferItem?.name}`} width="500px">
        <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Origem (Filial) *</label>
            <select required value={transferForm.fromBranchId} onChange={e => setTransferForm({ ...transferForm, fromBranchId: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Destino (Filial) *</label>
            <select required value={transferForm.toBranchId} onChange={e => setTransferForm({ ...transferForm, toBranchId: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Quantidade *</label>
            <input type="number" min="1" required value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {transferMutation.isPending ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Importação */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar XLSX/CSV" width="500px">
        <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Arquivo</label>
            <input type="file" accept=".xlsx, .csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="border border-input rounded-md p-2" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowImportModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={!importFile}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
