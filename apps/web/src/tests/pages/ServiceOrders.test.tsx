import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import ServiceOrders from '../../modules/service-orders/pages/ServiceOrders';
import * as hooks from '../../modules/service-orders/hooks/useServiceOrders';
import * as clientHooks from '../../modules/clients/hooks/useClients';
import * as vehicleHooks from '../../modules/vehicles/hooks/useVehicles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../modules/service-orders/hooks/useServiceOrders', () => {
  return {
    useServiceOrders: vi.fn(),
    useCreateServiceOrder: vi.fn(),
    useServiceOrder: vi.fn(),
    serviceOrderKeys: {
      all: ['service-orders'],
    }
  };
});

vi.mock('../../modules/clients/hooks/useClients', () => {
  return {
    useClients: vi.fn(),
  };
});

vi.mock('../../modules/vehicles/hooks/useVehicles', () => {
  return {
    useVehicles: vi.fn(),
  };
});

vi.mock('@/modules/auth/state/auth.store', () => {
  return {
    useAuthStore: vi.fn((selector) => {
      const state = {
        user: {
          id: 'user-1',
          name: 'Test User',
          role: 'ADMIN',
          tenantId: 'comp-1',
          branchId: 'b1',
        },
      };
      return selector(state);
    }),
  };
});

vi.mock('@tanstack/react-virtual', () => {
  return {
    useVirtualizer: vi.fn(({ count }) => ({
      getVirtualItems: () => Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 40,
        size: 40,
      })),
      getTotalSize: () => count * 40,
      scrollToIndex: vi.fn(),
    })),
  };
});

// Mock api calls for branches and users
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/branches') return Promise.resolve({ data: [{ id: 'b1', name: 'Filial Central' }] });
      if (url === '/users') return Promise.resolve({ data: [{ id: 'u1', name: 'Mecânico Teste', role: 'MECHANIC' }] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

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

describe('ServiceOrders Component', () => {
  const mockOSList = [
    {
      id: 'os1',
      number: 1001,
      status: 'OPEN',
      finalValue: 150.0,
      createdAt: new Date().toISOString(),
      client: { name: 'João Proprietário' },
      vehicle: { model: 'Corolla', plate: 'ABC1234' },
    },
  ];

  const mockClients = [
    { id: 'c1', name: 'João Proprietário' },
    { id: 'c2', name: 'Maria Souza' },
  ];

  const mockVehicles = [
    { id: 'v1', plate: 'ABC1234', model: 'Corolla', clientId: 'c1' },
    { id: 'v2', plate: 'XYZ9876', model: 'Civic', clientId: 'c2' },
  ];

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useServiceOrders).mockReturnValue({
      data: mockOSList,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useCreateServiceOrder).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    vi.mocked(hooks.useServiceOrder).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.mocked(clientHooks.useClients).mockReturnValue({
      data: mockClients,
      isLoading: false,
    } as any);

    vi.mocked(vehicleHooks.useVehicles).mockReturnValue({
      data: mockVehicles,
      isLoading: false,
    } as any);
  });

  it('should render listing of service orders', () => {
    render(<ServiceOrders />, { wrapper });

    expect(screen.getByText('João Proprietário')).toBeInTheDocument();
    expect(screen.getByText('Corolla')).toBeInTheDocument();
    expect(screen.getByText('ABC1234')).toBeInTheDocument();
  });

  it('should open modal and filter vehicles based on selected client', async () => {
    render(<ServiceOrders />, { wrapper });

    const openBtn = screen.getByText('Nova OS');
    fireEvent.click(openBtn);

    expect(screen.getByText('Nova Ordem de Serviço')).toBeInTheDocument();

    const clientSelect = screen.getByLabelText('Cliente *');
    fireEvent.change(clientSelect, { target: { value: 'c1' } });

    // Vehicle dropdown should be enabled and show vehicles for client 'c1'
    const vehicleSelect = screen.getByLabelText('Veículo *');
    expect(vehicleSelect).not.toBeDisabled();
    expect(screen.getByText('Corolla — ABC1234')).toBeInTheDocument();
    expect(screen.queryByText('Civic — XYZ9876')).not.toBeInTheDocument();
  });

  it('should clear vehicle selection and disable select if client is deselected', async () => {
    render(<ServiceOrders />, { wrapper });

    const openBtn = screen.getByText('Nova OS');
    fireEvent.click(openBtn);

    const clientSelect = screen.getByLabelText('Cliente *');
    fireEvent.change(clientSelect, { target: { value: 'c1' } });

    const vehicleSelect = screen.getByLabelText('Veículo *');
    expect(vehicleSelect).not.toBeDisabled();

    // Deselect client
    fireEvent.change(clientSelect, { target: { value: '' } });
    expect(vehicleSelect).toBeDisabled();
  });
});
