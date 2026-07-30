import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Inventory from '@/modules/inventory/pages/Inventory';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

vi.mock('@tanstack/react-virtual', () => {
  return {
    useVirtualizer: vi.fn(({ count }) => ({
      getVirtualItems: () =>
        Array.from({ length: count }, (_, i) => ({
          index: i,
          start: i * 40,
          size: 40,
        })),
      getTotalSize: () => count * 40,
      scrollToIndex: vi.fn(),
    })),
  };
});

const mockParts = [
  {
    id: 'p1',
    name: 'Pastilha de Freio Dianteira',
    internalCode: 'PST-001',
    category: 'Freios',
    brand: 'Fras-le',
    minStock: 5,
    salePrice: 120.0,
    purchasePrice: 65.0,
    stocks: [
      { branchId: 'b1', quantity: 20, branch: { name: 'Matriz Centro' } },
      { branchId: 'b2', quantity: 2, branch: { name: 'Filial Zona Sul' } },
    ],
  },
  {
    id: 'p2',
    name: 'Filtro de Óleo Sintético',
    internalCode: 'FLT-002',
    category: 'Filtros',
    brand: 'Tecfil',
    minStock: 10,
    salePrice: 45.0,
    purchasePrice: 20.0,
    stocks: [{ branchId: 'b1', quantity: 0, branch: { name: 'Matriz Centro' } }],
  },
];

const mockBranches = [
  { id: 'b1', name: 'Matriz Centro' },
  { id: 'b2', name: 'Filial Zona Sul' },
];

function renderInventoryPage() {
  localStorage.setItem('activeBranch', JSON.stringify(mockBranches[0]));
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Inventory />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Inventory Secondary Workflows (Phase 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Admin Test',
        email: 'admin@autosync.com',
        role: 'ADMIN',
        companyId: 'c1',
        tenantId: 't1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should render Inventory page title and alert banners', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/suppliers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockParts });
    });

    renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByTestId('inventory-page')).toBeInTheDocument();
    });

    expect(screen.getByText('Estoque de Peças & Materiais')).toBeInTheDocument();
  });

  it('2. should open create part modal and create new SKU', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/suppliers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockParts });
    });
    (api.post as any).mockResolvedValue({
      data: { id: 'p3', name: 'Vela de Ignição', internalCode: 'VEL-003' },
    });

    renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Nova Peça')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova Peça'));

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Nova Peça')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nome da Peça/), { target: { value: 'Vela de Ignição' } });
    fireEvent.change(screen.getByLabelText(/Código Interno/), { target: { value: 'VEL-003' } });

    fireEvent.click(screen.getByText('Salvar Peça'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/inventory/parts', expect.objectContaining({
        name: 'Vela de Ignição',
        internalCode: 'VEL-003',
      }));
    });
  });

  it('3. should open transfer modal and submit stock transfer between branches', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/suppliers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockParts });
    });
    (api.post as any).mockResolvedValue({
      data: { message: 'Transferência realizada com sucesso.' },
    });

    renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByTestId('inventory-page')).toBeInTheDocument();
      expect(screen.getByText('Pastilha de Freio Dianteira')).toBeInTheDocument();
    });

    const transferButtons = screen.getAllByText('Transferir');
    fireEvent.click(transferButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Filial de Origem/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Filial de Origem/), { target: { value: 'b1' } });
    fireEvent.change(screen.getByLabelText(/Filial de Destino/), { target: { value: 'b2' } });
    fireEvent.change(screen.getByLabelText(/Quantidade a Transferir/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Motivo \/ Justificativa/), { target: { value: 'Remanejamento urgente' } });

    fireEvent.click(screen.getByText('Confirmar Transferência'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/inventory/transfer', expect.objectContaining({
        partId: 'p1',
        fromBranchId: 'b1',
        toBranchId: 'b2',
        quantity: 5,
        reason: 'Remanejamento urgente',
      }));
    });
  });

  it('4. should open import modal and upload file', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/suppliers')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockParts });
    });
    (api.post as any).mockResolvedValue({
      data: { message: 'Peças importadas com sucesso!', importedCount: 10 },
    });

    renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Importar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Importar'));

    await waitFor(() => {
      expect(screen.getByText('Importar Peças (XLSX / CSV)')).toBeInTheDocument();
    });

    const file = new File(['dummy content'], 'parts.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileInput = screen.getByLabelText(/Selecione o Arquivo/);

    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Enviar & Importar'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/inventory/parts/import', expect.any(FormData), expect.anything());
    });
  });
});
