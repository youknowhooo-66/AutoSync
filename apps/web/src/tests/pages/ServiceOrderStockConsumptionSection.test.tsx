import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderStockConsumptionSection } from '../../modules/service-orders/components/ServiceOrderStockConsumptionSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { approvalService } from '../../modules/service-orders/services/approvalService';

import * as useExecutionModule from '../../modules/service-orders/hooks/useServiceOrderExecution';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const mockUser = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'ADMIN'
};

const mockExecutionList = [
  {
    id: 'svc-1',
    serviceOrderId: 'os-123',
    name: 'Oil Change',
    price: '80.00',
    executionStatus: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let currentExecutionMock = mockExecutionList;

const mockPartsConsumption = [
  {
    partId: 'ospart-1',
    realPartId: 'part-123',
    name: 'Air Filter',
    sku: 'FIL-123',
    plannedQuantity: 4,
    consumedQuantity: 1,
    remainingQuantity: 3,
    availableStock: 10,
    movements: []
  }
];

const mockConsume = vi.fn();

vi.mock('../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

vi.mock('../../modules/service-orders/hooks/useServiceOrderStockConsumption', () => ({
  useServiceOrderStockConsumption: () => ({
    partsConsumption: mockPartsConsumption,
    isLoading: false,
    consume: mockConsume,
    isConsuming: false
  })
}));

vi.mock('../../modules/service-orders/hooks/useServiceOrderExecution', () => ({
  useServiceOrderExecution: () => ({
    execution: currentExecutionMock,
    isLoading: false
  })
}));

vi.mock('../../modules/service-orders/services/approvalService', () => ({
  approvalService: {
    getByServiceOrder: vi.fn()
  }
}));

describe('ServiceOrderStockConsumptionSection (P4.6 Frontend UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render blocked warning when budget is not approved', async () => {
    vi.mocked(approvalService.getByServiceOrder).mockResolvedValueOnce({
      id: 'app-1',
      serviceOrderId: 'os-123',
      companyId: 'company-123',
      branchId: 'branch-123',
      version: 1,
      status: 'PENDING',
      snapshot: {},
      totalParts: '0',
      totalServices: '0',
      discount: '0',
      finalValue: '0',
      requestedAt: '',
      requestedById: ''
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderStockConsumptionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Consumo de Estoque Bloqueado')).toBeInTheDocument();
    });
  });

  it('should render warning when execution is not active', async () => {
    vi.mocked(approvalService.getByServiceOrder).mockResolvedValueOnce({
      id: 'app-1',
      serviceOrderId: 'os-123',
      companyId: 'company-123',
      branchId: 'branch-123',
      version: 1,
      status: 'APPROVED',
      snapshot: {},
      totalParts: '0',
      totalServices: '0',
      discount: '0',
      finalValue: '0',
      requestedAt: '',
      requestedById: ''
    });

    // Mock execution list empty or only PENDING
    currentExecutionMock = [{ id: 'svc-1', executionStatus: 'PENDING' } as any];

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderStockConsumptionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Aguardando Execução Técnica')).toBeInTheDocument();
    });

    // Reset to default
    currentExecutionMock = mockExecutionList;
  });

  it('should render parts list and support consumption confirm', async () => {
    vi.mocked(approvalService.getByServiceOrder).mockResolvedValueOnce({
      id: 'app-1',
      serviceOrderId: 'os-123',
      companyId: 'company-123',
      branchId: 'branch-123',
      version: 1,
      status: 'APPROVED',
      snapshot: {},
      totalParts: '0',
      totalServices: '0',
      discount: '0',
      finalValue: '0',
      requestedAt: '',
      requestedById: ''
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderStockConsumptionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Air Filter')).toBeInTheDocument();
      expect(screen.getByText('SKU: FIL-123')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Qtd');
    fireEvent.change(input, { target: { value: '2' } });

    const confirmBtn = screen.getByText('Confirmar Saída');
    fireEvent.click(confirmBtn);

    expect(mockConsume).toHaveBeenCalledWith(expect.objectContaining({
      partId: 'ospart-1',
      quantity: 2,
      idempotencyKey: expect.any(String)
    }));
  });
});
