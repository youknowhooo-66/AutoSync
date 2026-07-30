import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import ClientList from '../../modules/clients/pages/ClientList';
import * as hooks from '../../modules/clients/hooks/useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../modules/clients/hooks/useClients', () => {
  return {
    useClients: vi.fn(),
    useDeleteClient: vi.fn(),
    useCreateClient: vi.fn(),
    useUpdateClient: vi.fn(),
  };
});

// Mock toast from sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('ClientList Component', () => {
  const mockClients = [
    {
      id: 'c1',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      document: '12345678901',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c2',
      name: 'Maria Souza',
      email: 'maria@example.com',
      phone: '11888888888',
      document: '98765432100',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useClients).mockReturnValue({
      data: mockClients,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useDeleteClient).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    vi.mocked(hooks.useCreateClient).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(hooks.useUpdateClient).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it('should render the list of clients correctly', () => {
    render(<ClientList />, { wrapper });

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
    expect(screen.getByText('98765432100')).toBeInTheDocument();
  });

  it('should render loading state when fetching data', () => {
    vi.mocked(hooks.useClients).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<ClientList />, { wrapper });

    // DataTable shows skeleton/spinner when loading (class animate-spin)
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
  });

  it('should show empty message when there are no clients', () => {
    vi.mocked(hooks.useClients).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<ClientList />, { wrapper });

    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
  });

  it('should call delete client mutation on confirm', () => {
    window.confirm = vi.fn().mockReturnValue(true);

    render(<ClientList />, { wrapper });

    const deleteButtons = screen.getAllByTitle('Excluir');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledWith('c1');
  });
});
