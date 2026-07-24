import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { ServiceOrderDetailSheet } from '../../modules/service-orders/components/ServiceOrderDetailSheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock permissions & auth
vi.mock('../../modules/auth/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: (action: string) => true
  })
}));

vi.mock('../../modules/auth/components/RoleGuard', () => ({
  RoleGuard: ({ children }: any) => <>{children}</>
}));

// Mock child components to keep unit testing focused
vi.mock('./DiagnosisSection', () => ({
  DiagnosisSection: () => <div data-testid="diagnosis-section" />
}));
vi.mock('./ServiceOrderItemsSection', () => ({
  ServiceOrderItemsSection: () => <div data-testid="items-section" />
}));
vi.mock('./ServiceOrderApprovalSection', () => ({
  ServiceOrderApprovalSection: () => <div data-testid="approval-section" />
}));
vi.mock('./ServiceOrderExecutionSection', () => ({
  ServiceOrderExecutionSection: () => <div data-testid="execution-section" />
}));
vi.mock('./ServiceOrderStockConsumptionSection', () => ({
  ServiceOrderStockConsumptionSection: () => <div data-testid="stock-section" />
}));
vi.mock('./ServiceOrderCompletionSection', () => ({
  ServiceOrderCompletionSection: () => <div data-testid="completion-section" />
}));
vi.mock('./ServiceOrderFinanceSection', () => ({
  ServiceOrderFinanceSection: () => <div data-testid="finance-section" />
}));

const mockGetById = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock('../../modules/service-orders/hooks/useServiceOrders', () => ({
  useServiceOrder: () => ({
    data: mockGetById(),
    isLoading: false,
  }),
  serviceOrderKeys: {
    all: ['service-orders'],
  }
}));

// Mock api calls
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn((url: string, payload: any) => {
      mockUpdateStatus(url, payload);
      return Promise.resolve({ data: { success: true } });
    }),
  },
  api: {
    get: vi.fn(),
    patch: vi.fn((url: string, payload: any) => {
      mockUpdateStatus(url, payload);
      return Promise.resolve({ data: { success: true } });
    }),
  }
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ServiceOrderDetailSheet Component', () => {
  const mockOS = {
    id: 'os-789',
    number: 1024,
    status: 'OPEN' as const,
    finalValue: 500,
    createdAt: new Date().toISOString(),
    client: { name: 'Artur Pendragon', document: '111.111.111-11' },
    vehicle: { model: 'Excalibur Sedan', plate: 'KING-123' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockReturnValue(mockOS);
  });

  it('renders only the canonical statuses in progress bar without duplicate buttons', () => {
    render(<ServiceOrderDetailSheet os={mockOS} onClose={vi.fn()} />, { wrapper });

    // Buttons in status bar should display: Aberta, Em Execução, Aguardando Peças, Finalizada, Cancelada
    // Verify each displays exactly once in the document
    const statusButtons = screen.getAllByRole('button');
    const labels = statusButtons.map(btn => btn.textContent?.trim());
    
    // Filtering labels that match our canonical set
    const canonicalLabels = labels.filter(label => 
      ['Aberta', 'Em Execução', 'Aguardando Peças', 'Finalizada', 'Cancelada'].includes(label || '')
    );

    // Let's assert count of unique labels matches the canonical count
    const uniqueLabels = Array.from(new Set(canonicalLabels));
    expect(uniqueLabels.length).toBe(5);
    
    // Assert no duplicate button instances for finalizada or cancelada
    const finalizadaButtons = screen.getAllByText('Finalizada');
    expect(finalizadaButtons.length).toBe(1);

    const canceladaButtons = screen.getAllByText('Cancelada');
    expect(canceladaButtons.length).toBe(1);
  });

  it('disables Finalizada status quick transition button', () => {
    render(<ServiceOrderDetailSheet os={mockOS} onClose={vi.fn()} />, { wrapper });

    const finalizadaBtn = screen.getByRole('button', { name: /Finalizada/ });
    expect(finalizadaBtn).toBeDisabled();
  });

  it('triggers update status mutation when a valid status button is clicked', async () => {
    render(<ServiceOrderDetailSheet os={mockOS} onClose={vi.fn()} />, { wrapper });

    const progressBtn = screen.getByRole('button', { name: /Em Execução/ });
    fireEvent.click(progressBtn);

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith('/os/os-789/status', { status: 'IN_PROGRESS' });
    });
  });
});
