import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import VehicleList from '../../modules/vehicles/pages/VehicleList';
import * as hooks from '../../modules/vehicles/hooks/useVehicles';
import * as clientHooks from '../../modules/clients/hooks/useClients';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../modules/vehicles/hooks/useVehicles', () => {
  return {
    useVehicles: vi.fn(),
    useDeleteVehicle: vi.fn(),
    useCreateVehicle: vi.fn(),
    useUpdateVehicle: vi.fn(),
  };
});

vi.mock('../../modules/clients/hooks/useClients', () => {
  return {
    useClients: vi.fn(),
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

describe('VehicleList Component', () => {
  const mockVehicles = [
    {
      id: 'v1',
      plate: 'ABC1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'Preto',
      clientId: 'c1',
      client: {
        name: 'João Silva',
        email: 'joao@example.com',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'v2',
      plate: 'XYZ9876',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Cinza',
      clientId: 'c2',
      client: {
        name: 'Maria Souza',
        email: 'maria@example.com',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useVehicles).mockReturnValue({
      data: mockVehicles,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useDeleteVehicle).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    vi.mocked(hooks.useCreateVehicle).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(hooks.useUpdateVehicle).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(clientHooks.useClients).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
  });

  it('should render the list of vehicles correctly', () => {
    render(<VehicleList />, { wrapper });

    expect(screen.getByText('ABC1234')).toBeInTheDocument();
    expect(screen.getByText('XYZ9876')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Civic')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('should render loading state when fetching data', () => {
    vi.mocked(hooks.useVehicles).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<VehicleList />, { wrapper });

    expect(screen.queryByText('ABC1234')).not.toBeInTheDocument();
  });

  it('should show empty message when there are no vehicles', () => {
    vi.mocked(hooks.useVehicles).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<VehicleList />, { wrapper });

    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
  });

  it('should call delete vehicle mutation on confirm', () => {
    window.confirm = vi.fn().mockReturnValue(true);

    render(<VehicleList />, { wrapper });

    const deleteButtons = screen.getAllByTitle('Excluir');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledWith('v1');
  });
});
