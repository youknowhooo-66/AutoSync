import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Branches from '@/pages/Branches';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockBranches = [
  {
    id: 'b1',
    name: 'Matriz Centro',
    cnpj: '12.345.678/0001-01',
    address: 'Av. Paulista, 1000',
    phone: '(11) 3333-1111',
    email: 'matriz@autosync.com.br',
    active: true,
  },
  {
    id: 'b2',
    name: 'Filial Sul',
    cnpj: '12.345.678/0001-02',
    address: 'Av. das Nações, 500',
    phone: '(41) 3333-2222',
    email: 'sul@autosync.com.br',
    active: false,
  },
];

function renderBranchesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Branches />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Branches Module (Integrated Management)', () => {
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

  it('1. should render branches page and cards', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Gestão de Filiais & Unidades Operacionais')).toBeInTheDocument();
    });

    expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    expect(screen.getByText('Filial Sul')).toBeInTheDocument();
  });

  it('2. should filter branches by search query', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar por nome da filial, CNPJ ou cidade...');
    fireEvent.change(searchInput, { target: { value: 'Sul' } });

    expect(screen.queryByText('Matriz Centro')).not.toBeInTheDocument();
    expect(screen.getByText('Filial Sul')).toBeInTheDocument();
  });

  it('3. should open create branch modal and save new branch', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });
    (api.post as any).mockResolvedValue({
      data: {
        id: 'b3',
        name: 'Filial Norte',
        cnpj: '99.888.777/0001-03',
        address: 'Rua das Flores, 10',
        phone: '(71) 3333-3333',
        email: 'norte@autosync.com.br',
        active: true,
      },
    });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Nova Filial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova Filial'));

    await waitFor(() => {
      expect(screen.getByText('Nome da Filial *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Matriz Centro ou Filial Sul'), { target: { value: 'Filial Norte' } });
    fireEvent.change(screen.getByPlaceholderText('00.000.000/0001-00'), { target: { value: '99.888.777/0001-03' } });

    fireEvent.click(screen.getByText('Salvar Filial'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/branches', expect.objectContaining({
        name: 'Filial Norte',
        cnpj: '99.888.777/0001-03',
      }));
    });
  });

  it('4. should open edit modal with pre-filled fields', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Matriz Centro')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12.345.678/0001-01')).toBeInTheDocument();
    });
  });

  it('5. should open confirm dialog when toggling branch active status', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByText('Desativar');
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(screen.getByText('Sim, Inativar')).toBeInTheDocument();
    });
  });

  it('6. should execute toggle active status when confirmed', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });
    (api.put as any).mockResolvedValue({ data: { ...mockBranches[0], active: false } });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Desativar'));

    await waitFor(() => {
      expect(screen.getByText('Sim, Inativar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sim, Inativar'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/branches/b1', { active: false });
    });
  });

  it('7. should allow selecting branch to update active branch context', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Matriz Centro')).toBeInTheDocument();
    });

    const card = screen.getByTestId('branch-card-b1');
    const selectBtn = within(card).getByRole('button', { name: 'Selecionar' });
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(localStorage.getItem('@AutoSync:branchId')).toBe('b1');
    });
  });

  it('8. should handle error response gracefully when saving fails', async () => {
    (api.get as any).mockResolvedValue({ data: mockBranches });
    (api.post as any).mockRejectedValueOnce({
      response: { data: { message: 'CNPJ já cadastrado para outra unidade.' } },
    });

    renderBranchesPage();

    await waitFor(() => {
      expect(screen.getByText('Nova Filial')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova Filial'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Matriz Centro ou Filial Sul'), { target: { value: 'Duplicada' } });
    fireEvent.change(screen.getByPlaceholderText('00.000.000/0001-00'), { target: { value: '12.345.678/0001-01' } });

    fireEvent.click(screen.getByText('Salvar Filial'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
