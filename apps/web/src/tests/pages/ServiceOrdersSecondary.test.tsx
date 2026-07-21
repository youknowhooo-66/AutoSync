import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ServiceOrders from '@/modules/service-orders/pages/ServiceOrders';
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

const mockOSList = [
  {
    id: 'os-1',
    number: 1001,
    code: 'OS-1001',
    status: 'DIAGNOSIS',
    notes: 'Ruído no motor ao acelerar',
    client: { id: 'c1', name: 'João Silva' },
    vehicle: { id: 'v1', model: 'Civic', plate: 'ABC-1234' },
    branch: { id: 'b1', name: 'Matriz Centro' },
    mechanic: { id: 'u2', name: 'Carlos Mecânico' },
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'os-2',
    number: 1002,
    code: 'OS-1002',
    status: 'IN_PROGRESS',
    notes: 'Revisão dos 50k km',
    client: { id: 'c2', name: 'Maria Souza' },
    vehicle: { id: 'v2', model: 'Corolla', plate: 'XYZ-9876' },
    branch: { id: 'b1', name: 'Matriz Centro' },
    createdAt: '2026-08-02T11:00:00.000Z',
  },
];

const mockClients = [{ id: 'c1', name: 'João Silva' }];
const mockVehicles = [{ id: 'v1', model: 'Civic', plate: 'ABC-1234', clientId: 'c1' }];
const mockBranches = [{ id: 'b1', name: 'Matriz Centro' }];

function renderServiceOrdersPage() {
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
          <ServiceOrders />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Service Orders Secondary Workflows (Phase 4)', () => {
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

  it('1. should render Service Orders page and OS table', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByTestId('service-orders-page')).toBeInTheDocument();
      expect(screen.getByText('1001')).toBeInTheDocument();
      expect(screen.getByText('1002')).toBeInTheDocument();
    });
  });

  it('2. should filter vehicles when client is selected in Nova OS modal', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Nova OS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova OS'));

    await waitFor(() => {
      expect(screen.getByText('Selecione um cliente...')).toBeInTheDocument();
    });

    const clientSelect = screen.getByLabelText('Cliente *');
    fireEvent.change(clientSelect, { target: { value: 'c1' } });

    await waitFor(() => {
      expect(screen.getByText('Civic — ABC-1234')).toBeInTheDocument();
    });
  });

  it('3. should clear vehicle selection when client selection is cleared', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Nova OS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova OS'));

    const clientSelect = screen.getByLabelText('Cliente *');
    fireEvent.change(clientSelect, { target: { value: 'c1' } });
    fireEvent.change(clientSelect, { target: { value: '' } });

    expect(screen.getByText('Selecione o cliente primeiro')).toBeInTheDocument();
  });

  it('4. should submit new OS successfully and call POST /os', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });
    (api.post as any).mockResolvedValue({
      data: {
        id: 'os-3',
        number: 1003,
        status: 'DRAFT',
      },
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Nova OS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova OS'));

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByLabelText('Veículo *'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Filial *'), { target: { value: 'b1' } });

    fireEvent.click(screen.getByText('Abrir OS'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/os', expect.objectContaining({
        clientId: 'c1',
        vehicleId: 'v1',
        branchId: 'b1',
      }));
    });
  });

  it('5. should open detail sheet when clicking on an OS row', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      if (url.includes('/os/os-1')) return Promise.resolve({ data: mockOSList[0] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1001'));

    await waitFor(() => {
      expect(screen.getByText(/OS #1001/)).toBeInTheDocument();
    });
  });

  it('6. should handle create OS API error response gracefully', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });
    (api.post as any).mockRejectedValueOnce({
      response: { data: { message: 'Veículo já possui OS aberta.' } },
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Nova OS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova OS'));

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByLabelText('Veículo *'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Filial *'), { target: { value: 'b1' } });

    fireEvent.click(screen.getByText('Abrir OS'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('7. should query OS list from API endpoint', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByTestId('service-orders-page')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/os');
  });

  it('8. should render status badges for diagnosis and in_progress status', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
    });

    expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('Em Execução')).toBeInTheDocument();
  });

  it('9. should prevent submission when required fields are missing', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ data: { items: mockClients } });
      if (url.includes('/vehicles')) return Promise.resolve({ data: { items: mockVehicles } });
      if (url.includes('/branches')) return Promise.resolve({ data: mockBranches });
      if (url.includes('/users')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockOSList });
    });

    renderServiceOrdersPage();

    await waitFor(() => {
      expect(screen.getByText('Nova OS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nova OS'));

    const submitBtn = screen.getByText('Abrir OS');
    fireEvent.click(submitBtn);

    expect(api.post).not.toHaveBeenCalled();
  });
});
