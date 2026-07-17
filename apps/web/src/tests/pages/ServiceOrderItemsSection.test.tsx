import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderItemsSection } from '../../modules/service-orders/components/ServiceOrderItemsSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { vi } from 'vitest';

// Mock dependencies
vi.mock('../../modules/auth/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderComponent = (serviceOrder: any) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ServiceOrderItemsSection serviceOrder={serviceOrder} />
    </QueryClientProvider>
  );
};

describe('ServiceOrderItemsSection', () => {
  const mockOS = {
    id: 'os-1',
    status: 'OPEN',
    parts: [
      { id: 'p1', part: { name: 'Filtro de Óleo' }, quantity: 1, unitPrice: '25.00' }
    ],
    services: [
      { id: 's1', name: 'Troca de Óleo', price: '50.00' }
    ],
    totalParts: '25.00',
    totalServices: '50.00',
    discount: '0',
    finalValue: '75.00'
  };

  it('renders items and services correctly', () => {
    renderComponent(mockOS);

    expect(screen.getByText('Itens e Serviços')).toBeInTheDocument();
    expect(screen.getByText('Filtro de Óleo')).toBeInTheDocument();
    expect(screen.getByText('Troca de Óleo')).toBeInTheDocument();
    expect(screen.getByText('R$ 75.00')).toBeInTheDocument();
  });

  it('hides add button if OS is FINISHED', () => {
    renderComponent({ ...mockOS, status: 'FINISHED' });
    expect(screen.queryByText('Adicionar')).not.toBeInTheDocument();
  });

  it('opens add form when add button is clicked', async () => {
    renderComponent(mockOS);
    const btn = screen.getByText('Adicionar');
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(screen.getByText('Adicionar Item ou Serviço')).toBeInTheDocument();
    });
  });
});
