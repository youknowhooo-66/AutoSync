import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { DiagnosisSection } from '../../modules/service-orders/components/DiagnosisSection';
import { useRegisterDiagnosis } from '../../modules/service-orders/hooks/useDiagnosis';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../modules/service-orders/hooks/useDiagnosis', () => ({
  useRegisterDiagnosis: vi.fn(),
}));

vi.mock('@/modules/auth/components/RoleGuard', () => ({
  RoleGuard: ({ children }: any) => <div data-testid="role-guard">{children}</div>,
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
    {children}
  </QueryClientProvider>
);

describe('DiagnosisSection Component', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegisterDiagnosis).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it('should render empty diagnosis message if none exists', () => {
    render(<DiagnosisSection serviceOrderId="os-1" notes="Customer notes: engine noise." status="OPEN" />, { wrapper });

    expect(screen.getByText('Observações de Abertura (Reclamação do Cliente)')).toBeInTheDocument();
    expect(screen.getByText('Customer notes: engine noise.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum diagnóstico técnico registrado ainda.')).toBeInTheDocument();
  });

  it('should render technical diagnosis text if it exists', () => {
    const notesWithDiag = "Customer notes: engine noise.\n\n[DIAGNÓSTICO TÉCNICO]\nSpark plugs need replacement.";
    render(<DiagnosisSection serviceOrderId="os-1" notes={notesWithDiag} status="OPEN" />, { wrapper });

    expect(screen.getByText('Customer notes: engine noise.')).toBeInTheDocument();
    expect(screen.getByText('Spark plugs need replacement.')).toBeInTheDocument();
  });

  it('should open edit form, validate, and trigger mutate on save', async () => {
    render(<DiagnosisSection serviceOrderId="os-1" notes={null} status="OPEN" />, { wrapper });

    const registerBtn = screen.getByText('Registrar');
    fireEvent.click(registerBtn);

    const textarea = screen.getByPlaceholderText('Descreva a avaliação técnica detalhada do veículo...');
    expect(textarea).toBeInTheDocument();

    // Try submitting short value -> validation fails
    fireEvent.change(textarea, { target: { value: 'Bad' } });
    const saveBtn = screen.getByText('Salvar Diagnóstico');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('O diagnóstico deve ter pelo menos 5 caracteres')).toBeInTheDocument();
    });

    // Correct value -> succeeds
    fireEvent.change(textarea, { target: { value: 'Spark plugs need replacement.' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('Spark plugs need replacement.', expect.any(Object));
    });
  });

  it('should disable editing if status is finished or cancelled', () => {
    render(<DiagnosisSection serviceOrderId="os-1" notes={null} status="FINISHED" />, { wrapper });

    expect(screen.queryByText('Registrar')).not.toBeInTheDocument();
  });
});
