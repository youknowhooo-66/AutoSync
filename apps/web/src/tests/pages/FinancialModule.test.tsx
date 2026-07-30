import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Financial from '@/pages/Financial';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockRecords = [
  {
    id: 'fin-1',
    type: 'RECEIVABLE',
    category: 'Serviços',
    description: 'OS #1001 - Troca de Óleo',
    amount: 350.5,
    dueDate: '2026-08-15T00:00:00.000Z',
    paymentDate: null,
    status: 'PENDING',
  },
  {
    id: 'fin-2',
    type: 'PAYABLE',
    category: 'Aluguel',
    description: 'Aluguel Unidade Centro',
    amount: 2500.0,
    dueDate: '2026-08-10T00:00:00.000Z',
    paymentDate: '2026-08-05T00:00:00.000Z',
    status: 'PAID',
  },
];

function renderFinancialPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Financial />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Financial Module (Integrated Management)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Admin Test',
        email: 'admin@autosync.com.br',
        role: 'ADMIN',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should render loading state and then financial records table', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText('Financeiro & Conciliação Operacional')).toBeInTheDocument();
    });

    expect(screen.getByText('OS #1001 - Troca de Óleo')).toBeInTheDocument();
    expect(screen.getByText('Aluguel Unidade Centro')).toBeInTheDocument();
  });

  it('2. should format monetary values correctly in BRL', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getAllByText((content) => content.includes('350,50'))[0]).toBeInTheDocument();
      expect(screen.getAllByText((content) => content.includes('2.500,00'))[0]).toBeInTheDocument();
    });
  });

  it('3. should filter records by search text', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText('OS #1001 - Troca de Óleo')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por categoria, descrição ou ID...');
    fireEvent.change(searchInput, { target: { value: 'Aluguel' } });

    expect(screen.queryByText('OS #1001 - Troca de Óleo')).not.toBeInTheDocument();
    expect(screen.getByText('Aluguel Unidade Centro')).toBeInTheDocument();
  });

  it('4. should filter records by type dropdown', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('type=RECEIVABLE')) {
        return Promise.resolve({ data: [mockRecords[0]] });
      }
      return Promise.resolve({ data: mockRecords });
    });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText('OS #1001 - Troca de Óleo')).toBeInTheDocument();
    });

    const typeSelect = screen.getByLabelText('Filtrar por Tipo');
    fireEvent.change(typeSelect, { target: { value: 'RECEIVABLE' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('type=RECEIVABLE'));
    });
  });

  it('5. should open detail modal upon clicking Detalhar button', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText('OS #1001 - Troca de Óleo')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByText(/Detalhar/i);
    fireEvent.click(detailButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Detalhamento do Lançamento Financeiro')).toBeInTheDocument();
      expect(screen.getByText('fin-1')).toBeInTheDocument();
    });
  });

  it('6. should open confirmation dialog for payment download (Baixar)', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText(/Baixar/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Baixar/i));

    await waitFor(() => {
      expect(screen.getAllByText('Confirmar Baixa de Pagamento')[0]).toBeInTheDocument();
    });
  });

  it('7. should process payment download when confirmed', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });
    (api.patch as any).mockResolvedValue({ data: { ...mockRecords[0], status: 'PAID' } });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText(/Baixar/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Baixar/i));

    await waitFor(() => {
      expect(screen.getAllByText('Confirmar Baixa de Pagamento')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirmar Baixa'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/financial/fin-1/pay', expect.any(Object));
    });
  });

  it('8. should render create financial record modal and handle submission', async () => {
    (api.get as any).mockResolvedValue({ data: mockRecords });
    (api.post as any).mockResolvedValue({
      data: {
        id: 'fin-3',
        type: 'PAYABLE',
        category: 'Peças',
        description: 'Compra de Pastilhas',
        amount: 500,
        dueDate: '2026-09-01',
        status: 'PENDING',
      },
    });

    renderFinancialPage();

    await waitFor(() => {
      expect(screen.getByText('Novo Lançamento')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Lançamento'));

    await waitFor(() => {
      expect(screen.getByText('Novo Lançamento Financeiro')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Peças, Aluguel, Serviços...'), { target: { value: 'Peças' } });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Data de Vencimento *'), { target: { value: '2026-09-01' } });

    fireEvent.click(screen.getByText('Salvar Lançamento'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/financial', expect.objectContaining({
        type: 'PAYABLE',
        category: 'Peças',
        amount: 500,
        dueDate: '2026-09-01',
      }));
    });
  });
});
