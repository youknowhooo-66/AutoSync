import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderFinanceSection } from '../../modules/service-orders/components/ServiceOrderFinanceSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const mockUser = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'ADMIN'
};

let currentUser = mockUser;

const mockGenerateReceivable = vi.fn();

let mockFinanceState = {
  status: 'NOT_GENERATED',
  finalValue: '220.00',
  totalParts: '100.00',
  totalServices: '120.00',
  discount: '0.00',
  receivable: undefined as any
};

vi.mock('../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: currentUser
  })
}));

vi.mock('../../modules/service-orders/hooks/useServiceOrderFinance', () => ({
  useServiceOrderFinance: () => ({
    financeState: mockFinanceState,
    isLoading: false,
    generateReceivable: mockGenerateReceivable,
    isGenerating: false
  })
}));

describe('ServiceOrderFinanceSection (P4.8 Frontend UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
    mockFinanceState = {
      status: 'NOT_GENERATED',
      finalValue: '220.00',
      totalParts: '100.00',
      totalServices: '120.00',
      discount: '0.00',
      receivable: undefined
    };
  });

  it('should render warning when OS is not completed (not FINISHED)', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderFinanceSection
          serviceOrderId="os-123"
          status="OPEN"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Faturamento da OS')).toBeInTheDocument();
    expect(screen.getByText(/A Ordem de Serviço deve ser finalizada/)).toBeInTheDocument();
  });

  it('should render NOT_REQUIRED state when finalValue is zero', () => {
    mockFinanceState.status = 'NOT_REQUIRED';
    mockFinanceState.finalValue = '0.00';

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderFinanceSection
          serviceOrderId="os-123"
          status="FINISHED"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Sem cobrança necessária')).toBeInTheDocument();
    expect(screen.getByText(/Esta Ordem de Serviço possui orçamento aprovado com valor líquido zerado/)).toBeInTheDocument();
  });

  it('should render GENERATED card with invoice details when receivable exists', () => {
    mockFinanceState.status = 'GENERATED';
    mockFinanceState.receivable = {
      id: 'rec-999-aaa',
      amount: '220.00',
      status: 'PENDING',
      dueDate: '2026-08-30T12:00:00.000Z',
      createdAt: '2026-07-17T00:00:00.000Z'
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderFinanceSection
          serviceOrderId="os-123"
          status="FINISHED"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Contas a Receber Gerado')).toBeInTheDocument();
    expect(screen.getByText('R$ 220,00')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('30/08/2026')).toBeInTheDocument();
    expect(screen.getByText('#REC-999-')).toBeInTheDocument();
  });

  it('should render restrict access message when user is not authorized to generate', () => {
    currentUser = {
      id: 'user-mech',
      name: 'Mecânico Zé',
      role: 'MECHANIC'
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderFinanceSection
          serviceOrderId="os-123"
          status="FINISHED"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    expect(screen.getByText(/Apenas usuários com perfil de Administrador, Gerente ou Financeiro/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Data de Vencimento')).not.toBeInTheDocument();
  });

  it('should render form and support generation when status is NOT_GENERATED and user is authorized', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderFinanceSection
          serviceOrderId="os-123"
          status="FINISHED"
          finishedAt="2026-07-16T12:00:00Z"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Pronto para faturar')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de Vencimento')).toBeInTheDocument();

    const input = screen.getByLabelText('Data de Vencimento');
    
    // Test validation: submit without date
    const btn = screen.getByText('Gerar Título a Receber');
    fireEvent.click(btn);
    expect(screen.getByText('Selecione uma data de vencimento.')).toBeInTheDocument();

    // Test validation: submit retroactive date
    fireEvent.change(input, { target: { value: '2026-07-15' } });
    fireEvent.click(btn);
    expect(screen.getByText('A data de vencimento não pode ser anterior à data de conclusão da OS.')).toBeInTheDocument();

    // Submit valid date
    fireEvent.change(input, { target: { value: '2026-08-30' } });
    fireEvent.click(btn);

    expect(mockGenerateReceivable).toHaveBeenCalledWith('2026-08-30');
  });
});
