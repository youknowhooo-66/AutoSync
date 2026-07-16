import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderExecutionSection } from '../../modules/service-orders/components/ServiceOrderExecutionSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import { approvalService } from '../../modules/service-orders/services/approvalService';

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
    executionStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockTechniciansList = [
  { id: 'tech-1', name: 'John Mechanic', email: 'john@autosync.com', role: 'MECHANIC', active: true }
];

const mockAssign = vi.fn();
const mockStart = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockComplete = vi.fn();

vi.mock('../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

vi.mock('../../modules/service-orders/hooks/useServiceOrderExecution', () => ({
  useServiceOrderExecution: () => ({
    execution: mockExecutionList,
    isLoading: false,
    assign: mockAssign,
    start: mockStart,
    pause: mockPause,
    resume: mockResume,
    complete: mockComplete
  })
}));

vi.mock('../../modules/service-orders/hooks/useTechnicians', () => ({
  useTechnicians: () => ({
    data: mockTechniciansList,
    isLoading: false
  })
}));

vi.mock('../../modules/service-orders/services/approvalService', () => ({
  approvalService: {
    getByServiceOrder: vi.fn()
  }
}));

describe('ServiceOrderExecutionSection (P4.5 Frontend UI)', () => {
  it('should render blocked warning when budget is not approved', async () => {
    // Override mock response for this test
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
        <ServiceOrderExecutionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Execução Bloqueada')).toBeInTheDocument();
    });
  });

  it('should render list of services and status badges when budget is approved', async () => {
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
        <ServiceOrderExecutionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('should allow assigning technician when role is ADMIN/MANAGER and status is PENDING', async () => {
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
        <ServiceOrderExecutionSection serviceOrderId="os-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Selecionar Técnico')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'tech-1' } });

    const assignBtn = screen.getByText('Atribuir');
    fireEvent.click(assignBtn);

    expect(mockAssign).toHaveBeenCalledWith({
      serviceId: 'svc-1',
      technicianId: 'tech-1'
    });
  });
});
