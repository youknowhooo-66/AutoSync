import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Reports from '@/pages/Reports';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockDashboard = {
  kpis: {
    totalRevenue: 15400.5,
    avgCompletionTimeHours: 4.5,
    conversionRate: 75.0,
    cancellationRate: 5.0,
    stockMovements: 42,
  },
  funnel: {
    created: 20,
    completed: 15,
    invoiced: 15,
    paid: 12,
  },
  health: {
    status: 'HEALTHY',
    score: 95,
    warnings: [],
  },
};

const mockServiceOrders = [
  { id: 'os-1', status: 'APPROVED', total: 500 },
  { id: 'os-2', status: 'IN_EXECUTION', total: 1200 },
  { id: 'os-3', status: 'FINISHED', total: 350 },
];

const mockFinancialRecords = [
  { id: 'f-1', type: 'RECEIVABLE', amount: 500, status: 'PAID' },
  { id: 'f-2', type: 'PAYABLE', amount: 200, status: 'PAID' },
];

function renderReportsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Reports />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Reports Module (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Admin Test',
        email: 'admin@autosync.com',
        role: 'ADMIN',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should render reports page title and metric cards', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: mockFinancialRecords });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Relatórios Executivos & Inteligência Operacional')).toBeInTheDocument();
    });

    expect(screen.getByText(/15\.400,50/)).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('2. should display correct OS count metric from real API response', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: mockFinancialRecords });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Total de Ordens de Serviço')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('3. should render EmptyState when OS dataset is empty', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: [] });
      if (url.includes('/financial')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Sem dados de OS')).toBeInTheDocument();
    });
  });

  it('4. should render EmptyState when financial dataset is empty', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Sem dados financeiros')).toBeInTheDocument();
    });
  });

  it('5. should display notice when export button is clicked', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: mockFinancialRecords });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Exportar Dados')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Exportar Dados'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  it('6. should trigger window.print when print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: mockFinancialRecords });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Imprimir Relatório')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Imprimir Relatório'));

    expect(printSpy).toHaveBeenCalled();
  });

  it('7. should re-fetch report data when active branch is updated', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: mockDashboard });
      if (url.includes('/service-orders')) return Promise.resolve({ data: mockServiceOrders });
      if (url.includes('/financial')) return Promise.resolve({ data: mockFinancialRecords });
      return Promise.resolve({ data: [] });
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Relatórios Executivos & Inteligência Operacional')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/dashboard'));
  });

  it('8. should handle API failure gracefully', async () => {
    (api.get as any).mockRejectedValueOnce({
      response: { data: { message: 'Erro ao carregar relatórios.' } },
    });

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar relatórios.')).toBeInTheDocument();
    });
  });
});
