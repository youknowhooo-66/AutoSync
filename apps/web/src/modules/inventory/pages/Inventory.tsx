import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Upload, Save, RefreshCw, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { InventoryTable } from '../components/InventoryTable';
import { StockAlertBanner } from '../components/StockAlertBanner';
import { Button } from '@/components/ui/button';
import { FormField, Page, PageHeader } from '@/components/primitives';
import Modal from '@/components/Modal';
import type { InventoryItem } from '../types/inventory.types';
import { Input } from '@/components/ui/input';
import { extractErrorMessage } from '@/utils/errorHandler';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    internalCode: '',
    category: '',
    brand: '',
    purchasePrice: '',
    salePrice: '',
    minStock: '0',
    initialStock: '0',
    branchId: '',
    supplierId: '',
  });

  const [transferForm, setTransferForm] = useState({
    fromBranchId: '',
    toBranchId: '',
    quantity: '1',
    reason: '',
  });

  // Queries
  const { data: parts = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/parts');
      return data.map((item: any) => {
        const totalQuantity = item.stocks ? item.stocks.reduce((acc: number, s: any) => acc + s.quantity, 0) : 0;
        let status = 'OK';
        if (totalQuantity === 0) status = 'OUT_OF_STOCK';
        else if (totalQuantity <= item.minStock / 2) status = 'CRITICAL';
        else if (totalQuantity <= item.minStock) status = 'LOW';
        return { ...item, totalQuantity, status };
      });
    },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers')).data,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/inventory/parts', payload),
    onSuccess: () => {
      toast.success('Peça cadastrada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowCreateModal(false);
      setFormData({
        name: '',
        internalCode: '',
        category: '',
        brand: '',
        purchasePrice: '',
        salePrice: '',
        minStock: '0',
        initialStock: '0',
        branchId: '',
        supplierId: '',
      });
    },
    onError: (err: any) => toast.error(extractErrorMessage(err, 'Erro ao cadastrar peça.')),
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/inventory/transfer', payload),
    onSuccess: () => {
      toast.success('Transferência realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowTransferModal(false);
      setTransferItem(null);
      setTransferForm({ fromBranchId: '', toBranchId: '', quantity: '1', reason: '' });
    },
    onError: (err: any) => toast.error(extractErrorMessage(err, 'Erro ao transferir estoque.')),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      minStock: Number(formData.minStock),
      initialStock: Number(formData.initialStock),
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;
    if (!transferForm.fromBranchId || !transferForm.toBranchId) {
      toast.error('Selecione a filial de origem e destino.');
      return;
    }
    if (transferForm.fromBranchId === transferForm.toBranchId) {
      toast.error('A filial de origem e destino não podem ser as mesmas.');
      return;
    }
    const qty = Number(transferForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida maior que zero.');
      return;
    }

    transferMutation.mutate({
      partId: transferItem.id,
      fromBranchId: transferForm.fromBranchId,
      toBranchId: transferForm.toBranchId,
      quantity: qty,
      reason: transferForm.reason || 'Transferência entre filiais',
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
      toast.error(extractErrorMessage(err, 'Erro na importação.'));
    }
  };

  return (
    <Page data-testid="inventory-page">
      <PageHeader
        title="Estoque de Peças & Materiais"
        description="Controle de SKUs, movimentações, transferências entre filiais e níveis de alerta."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="text-xs">
              <Upload className="w-4 h-4 mr-1.5" /> Importar
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="shadow-xs font-semibold text-xs uppercase tracking-wider"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Peça
            </Button>
          </div>
        }
      />

      <StockAlertBanner items={parts} />

      <div className="w-full flex-1 min-h-[500px]">
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
        <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome da Peça" htmlFor="part-name" required>
            <Input
              id="part-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 text-xs"
            />
          </FormField>

          <FormField label="Código Interno" htmlFor="part-code" required>
            <Input
              id="part-code"
              required
              value={formData.internalCode}
              onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <FormField label="Categoria" htmlFor="part-category">
            <Input
              id="part-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="h-10 text-xs"
            />
          </FormField>

          <FormField label="Marca" htmlFor="part-brand">
            <Input
              id="part-brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="h-10 text-xs"
            />
          </FormField>

          <FormField label="Fornecedor" htmlFor="part-supplier">
            <select
              id="part-supplier"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione...</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Filial (Estoque Inicial)" htmlFor="part-branch">
            <select
              id="part-branch"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione...</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Preço de Compra" htmlFor="part-buy-price">
            <Input
              id="part-buy-price"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <FormField label="Preço de Venda" htmlFor="part-sell-price">
            <Input
              id="part-sell-price"
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <FormField label="Estoque Mínimo" htmlFor="part-min-stock">
            <Input
              id="part-min-stock"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <FormField label="Estoque Inicial" htmlFor="part-initial-stock">
            <Input
              id="part-initial-stock"
              type="number"
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending} className="font-semibold text-xs">
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Salvar Peça'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Transferência */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={`Transferir Estoque: ${transferItem?.name || ''}`}
        width="500px"
      >
        <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
          <FormField label="Filial de Origem *" htmlFor="transfer-origin" required>
            <select
              id="transfer-origin"
              required
              value={transferForm.fromBranchId}
              onChange={(e) => setTransferForm({ ...transferForm, fromBranchId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione a filial de origem...</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Filial de Destino *" htmlFor="transfer-target" required>
            <select
              id="transfer-target"
              required
              value={transferForm.toBranchId}
              onChange={(e) => setTransferForm({ ...transferForm, toBranchId: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Selecione a filial de destino...</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Quantidade a Transferir *" htmlFor="transfer-qty" required>
            <Input
              id="transfer-qty"
              type="number"
              min="1"
              required
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              className="h-10 text-xs font-mono"
            />
          </FormField>

          <FormField label="Motivo / Justificativa" htmlFor="transfer-reason">
            <Input
              id="transfer-reason"
              placeholder="Ex: Remanejamento para atendimento de OS prioritária"
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              className="h-10 text-xs"
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTransferModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={transferMutation.isPending} className="font-semibold text-xs">
              <RefreshCw className="w-4 h-4 mr-2" />
              {transferMutation.isPending ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Importação */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar Peças (XLSX / CSV)" width="500px">
        <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
          <FormField label="Selecione o Arquivo (.xlsx ou .csv)" htmlFor="import-file">
            <Input
              id="import-file"
              type="file"
              accept=".xlsx, .csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="h-11 text-xs pt-2"
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowImportModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!importFile} className="font-semibold text-xs">
              <Upload className="w-4 h-4 mr-2" />
              Enviar & Importar
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}
