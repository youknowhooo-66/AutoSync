import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderApprovalSection } from '../../modules/service-orders/components/ServiceOrderApprovalSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock permissions
vi.mock('../../modules/auth/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: (action: string) => true
  })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const serviceOrderMock = {
  id: 'os-123',
  status: 'OPEN',
  totalParts: '100.00',
  totalServices: '150.00',
  discount: '10.00',
  finalValue: '240.00'
};

// Mock approval hook response
const mockApproval = {
  id: 'approval-123',
  serviceOrderId: 'os-123',
  companyId: 'company-123',
  branchId: 'branch-123',
  version: 1,
  status: 'PENDING',
  snapshotVersion: 1,
  snapshot: {
    parts: [{ id: 'part-1', description: 'Spark Plug', quantity: '2', unitPrice: '50.00', total: '100.00' }],
    services: [{ id: 'svc-1', description: 'Tuneup', quantity: '1', unitPrice: '150.00', total: '150.00' }],
    totals: { totalParts: '100.00', totalServices: '150.00', discount: '10.00', finalValue: '240.00' }
  },
  totalParts: '100.00',
  totalServices: '150.00',
  discount: '10.00',
  finalValue: '240.00',
  requestedAt: new Date().toISOString(),
  requestedById: 'user-123'
};

const mockGetApproval = vi.fn();
const mockRequestApproval = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockInvalidate = vi.fn();

vi.mock('../../modules/service-orders/hooks/useServiceOrderApproval', () => ({
  useServiceOrderApproval: () => ({
    data: mockGetApproval(),
    isLoading: false
  }),
  useRequestApproval: () => ({
    mutate: mockRequestApproval,
    isPending: false
  }),
  useApproveServiceOrder: () => ({
    mutate: mockApprove,
    isPending: false
  }),
  useRejectServiceOrder: () => ({
    mutate: mockReject,
    isPending: false
  }),
  useInvalidateApproval: () => ({
    mutate: mockInvalidate,
    isPending: false
  })
}));

describe('ServiceOrderApprovalSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render prepare state when no approval exists', () => {
    mockGetApproval.mockReturnValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderApprovalSection serviceOrder={serviceOrderMock} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Orçamento em Preparação')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Aprovação do Orçamento')).toBeInTheDocument();
  });

  it('should trigger request approval when button is clicked', () => {
    mockGetApproval.mockReturnValue(null);

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderApprovalSection serviceOrder={serviceOrderMock} />
      </QueryClientProvider>
    );

    const button = screen.getByText('Solicitar Aprovação do Orçamento');
    fireEvent.click(button);

    expect(mockRequestApproval).toHaveBeenCalledWith(serviceOrderMock.id);
  });

  it('should render PENDING state with action buttons', () => {
    mockGetApproval.mockReturnValue(mockApproval);

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderApprovalSection serviceOrder={serviceOrderMock} />
      </QueryClientProvider>
    );

    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('Aprovar Orçamento')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar Orçamento')).toBeInTheDocument();
  });

  it('should call approve budget when approved is clicked', () => {
    mockGetApproval.mockReturnValue(mockApproval);

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderApprovalSection serviceOrder={serviceOrderMock} />
      </QueryClientProvider>
    );

    const approveButton = screen.getByText('Aprovar Orçamento');
    fireEvent.click(approveButton);

    expect(mockApprove).toHaveBeenCalledWith({
      serviceOrderId: serviceOrderMock.id,
      approvalId: mockApproval.id
    });
  });

  it('should show reason input and trigger reject when rejected is submitted', async () => {
    mockGetApproval.mockReturnValue(mockApproval);

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderApprovalSection serviceOrder={serviceOrderMock} />
      </QueryClientProvider>
    );

    const rejectButton = screen.getByText('Rejeitar Orçamento');
    fireEvent.click(rejectButton);

    const input = screen.getByPlaceholderText(/Ex: Cliente achou/);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Reason is too high cost' } });
    
    const submitBtn = screen.getByText('Confirmar Rejeição');
    fireEvent.click(submitBtn);

    expect(mockReject).toHaveBeenCalledWith({
      serviceOrderId: serviceOrderMock.id,
      approvalId: mockApproval.id,
      reason: 'Reason is too high cost'
    }, expect.any(Object));
  });
});
