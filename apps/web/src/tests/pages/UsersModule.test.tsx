import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Users from '@/pages/Users';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockUsers = [
  {
    id: 'u1',
    name: 'Ricardo Oliveira',
    email: 'admin@autosync.com.br',
    role: 'ADMIN',
    active: true,
    branch: { id: 'b1', name: 'Matriz Centro' },
  },
  {
    id: 'u2',
    name: 'Ana Silva',
    email: 'ana@autosync.com.br',
    role: 'FINANCIAL',
    active: true,
    branch: { id: 'b1', name: 'Matriz Centro' },
  },
  {
    id: 'u3',
    name: 'Carlos Mecânico',
    email: 'carlos@autosync.com.br',
    role: 'MECHANIC',
    active: false,
    branch: { id: 'b2', name: 'Filial Sul' },
  },
];

const mockBranches = [
  { id: 'b1', name: 'Matriz Centro' },
  { id: 'b2', name: 'Filial Sul' },
];

function renderUsersPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Users & RBAC Module (Integrated Management)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Ricardo Oliveira',
        email: 'admin@autosync.com.br',
        role: 'ADMIN',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should render users list and role badges', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Usuários & Governança RBAC')).toBeInTheDocument();
    });

    expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    expect(screen.getAllByText('Administrador')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Financeiro')[0]).toBeInTheDocument();
  });

  it('2. should filter users by text search', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar por nome ou e-mail...');
    fireEvent.change(searchInput, { target: { value: 'ana@' } });

    expect(screen.queryByText('Ricardo Oliveira')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });

  it('3. should filter users by role dropdown', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const roleSelect = screen.getByLabelText('Filtrar por Papel');
    fireEvent.change(roleSelect, { target: { value: 'MECHANIC' } });

    expect(screen.queryByText('Ricardo Oliveira')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos Mecânico')).toBeInTheDocument();
  });

  it('4. should open create user modal and submit new user', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });
    (api.post as any).mockResolvedValueOnce({
      data: {
        id: 'u4',
        name: 'Pedro Estoque',
        email: 'pedro@autosync.com.br',
        role: 'STOCKIST',
        active: true,
      },
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Usuário'));

    await waitFor(() => {
      expect(screen.getByText('Nome Completo *')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Pedro Estoque' } });
    fireEvent.change(screen.getByPlaceholderText('joao@autosync.com.br'), { target: { value: 'pedro@autosync.com.br' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByLabelText('Cargo / Papel (RBAC) *'), { target: { value: 'STOCKIST' } });

    fireEvent.click(screen.getByText('Salvar Usuário'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({
        name: 'Pedro Estoque',
        email: 'pedro@autosync.com.br',
        role: 'STOCKIST',
      }));
    });
  });

  it('5. should open edit modal and exclude password on update', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });
    (api.put as any).mockResolvedValueOnce({ data: { ...mockUsers[1], name: 'Ana Silva Santos' } });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[1]); // Edit Ana Silva

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ana Silva')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument(); // Password field omitted in edit
    });

    fireEvent.change(screen.getByDisplayValue('Ana Silva'), { target: { value: 'Ana Silva Santos' } });
    fireEvent.click(screen.getByText('Salvar Usuário'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/users/u2', expect.objectContaining({
        name: 'Ana Silva Santos',
        email: 'ana@autosync.com.br',
        role: 'FINANCIAL',
      }));
    });
  });

  it('6. should open permissions inspection modal upon clicking Permissões', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const permButtons = screen.getAllByText('Permissões');
    fireEvent.click(permButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Capacidades & Permissões Efetivas')).toBeInTheDocument();
      expect(screen.getByText('invoice.receive_payment')).toBeInTheDocument();
    });
  });

  it('7. should open confirmation dialog for user deactivation', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const deactButtons = screen.getAllByText('Desativar');
    fireEvent.click(deactButtons[1]); // Deactivate Ana Silva

    await waitFor(() => {
      expect(screen.getByText('Sim, Desativar')).toBeInTheDocument();
    });
  });

  it('8. should execute deactivation when confirmed', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });
    (api.put as any).mockResolvedValueOnce({ data: { ...mockUsers[1], active: false } });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const deactButtons = screen.getAllByText('Desativar');
    fireEvent.click(deactButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Sim, Desativar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sim, Desativar'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/users/u2', { active: false });
    });
  });

  it('9. should display self-deactivation warning when logged user deactivates own account', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Oliveira')).toBeInTheDocument();
    });

    const deactButtons = screen.getAllByText('Desativar');
    fireEvent.click(deactButtons[0]); // Deactivate own account (Ricardo Oliveira)

    await waitFor(() => {
      expect(screen.getByText(/Você está prestes a desativar sua própria conta/i)).toBeInTheDocument();
    });
  });

  it('10. should disable management actions when user role has insufficient permissions', async () => {
    useAuthStore.setState({
      user: {
        id: 'u3',
        name: 'Carlos Mecânico',
        email: 'carlos@autosync.com.br',
        role: 'MECHANIC',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });

    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      return Promise.resolve({ data: mockUsers });
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    });

    const newUserBtn = screen.getByText('Novo Usuário');
    expect(newUserBtn).toBeDisabled();
  });
});
