import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Suppliers from '@/pages/Suppliers';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockSuppliers = [
  {
    id: 's1',
    name: 'Distribuidora de Peças SP',
    cnpj: '12345678000199',
    phone: '1133334444',
    address: 'Av. Brasil, 100',
    email: 'vendas@pecassp.com.br',
    parts: [{ id: 'p1', name: 'Filtro de Óleo' }],
  },
  {
    id: 's2',
    name: 'AutoPeças Sul Ltda',
    cnpj: '98765432000111',
    phone: '4133332222',
    address: 'Rua das Flores, 50',
    email: 'contato@autopecessul.com.br',
    parts: [],
  },
];

function renderSuppliersPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Suppliers />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Suppliers Module (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Admin Test',
        email: 'admin@autosync.com.br',
        role: 'ADMIN',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should render suppliers page and list items', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Gestão de Fornecedores & Insumos')).toBeInTheDocument();
    });

    expect(screen.getByText('Distribuidora de Peças SP')).toBeInTheDocument();
    expect(screen.getByText('AutoPeças Sul Ltda')).toBeInTheDocument();
  });

  it('2. should format CNPJ and Phone correctly', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('12.345.678/0001-99')).toBeInTheDocument();
      expect(screen.getByText('(11) 3333-4444')).toBeInTheDocument();
    });
  });

  it('3. should filter suppliers list by text search', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Distribuidora de Peças SP')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar fornecedor por nome, CNPJ ou e-mail...');
    fireEvent.change(searchInput, { target: { value: 'Sul' } });

    expect(screen.queryByText('Distribuidora de Peças SP')).not.toBeInTheDocument();
    expect(screen.getByText('AutoPeças Sul Ltda')).toBeInTheDocument();
  });

  it('4. should open create supplier modal and submit new record', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });
    (api.post as any).mockResolvedValue({
      data: {
        id: 's3',
        name: 'Fornecedor Novo',
        cnpj: '11.111.111/0001-11',
        phone: '11999998888',
        email: 'novo@fornecedor.com',
      },
    });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Fornecedor'));

    await waitFor(() => {
      expect(screen.getByText('Razão Social / Nome Fantasia *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Distribuidora de Peças Brasil Ltda'), {
      target: { value: 'Fornecedor Novo' },
    });
    fireEvent.change(screen.getByPlaceholderText('00.000.000/0001-00'), {
      target: { value: '11.111.111/0001-11' },
    });

    fireEvent.click(screen.getByText('Salvar Fornecedor'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/suppliers', expect.objectContaining({
        name: 'Fornecedor Novo',
        cnpj: '11.111.111/0001-11',
      }));
    });
  });

  it('5. should open edit modal with pre-filled fields and submit updates', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });
    (api.put as any).mockResolvedValue({
      data: { ...mockSuppliers[0], name: 'Distribuidora SP Editada' },
    });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Distribuidora de Peças SP')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Distribuidora de Peças SP')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Distribuidora de Peças SP'), {
      target: { value: 'Distribuidora SP Editada' },
    });

    fireEvent.click(screen.getByText('Salvar Fornecedor'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/suppliers/s1', expect.objectContaining({
        name: 'Distribuidora SP Editada',
      }));
    });
  });

  it('6. should handle duplicate CNPJ error response', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });
    (api.post as any).mockRejectedValueOnce({
      response: { data: { message: 'CNPJ já cadastrado.' } },
    });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Fornecedor'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Distribuidora de Peças Brasil Ltda'), {
      target: { value: 'Duplicado' },
    });

    fireEvent.click(screen.getByText('Salvar Fornecedor'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('7. should disable creation and edit actions for restricted roles', async () => {
    useAuthStore.setState({
      user: {
        id: 'u2',
        name: 'Carlos Mecânico',
        email: 'carlos@autosync.com.br',
        role: 'MECHANIC',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });

    (api.get as any).mockResolvedValue({ data: mockSuppliers });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument();
    });

    const newBtn = screen.getByText('Novo Fornecedor');
    expect(newBtn).toBeDisabled();
  });

  it('8. should render empty state when search produces no matches', async () => {
    (api.get as any).mockResolvedValue({ data: mockSuppliers });

    renderSuppliersPage();

    await waitFor(() => {
      expect(screen.getByText('Distribuidora de Peças SP')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar fornecedor por nome, CNPJ ou e-mail...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.queryByText('Distribuidora de Peças SP')).not.toBeInTheDocument();
    expect(screen.queryByText('AutoPeças Sul Ltda')).not.toBeInTheDocument();
  });
});
