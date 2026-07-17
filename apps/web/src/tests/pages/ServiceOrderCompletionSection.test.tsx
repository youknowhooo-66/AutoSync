import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceOrderCompletionSection } from '../../modules/service-orders/components/ServiceOrderCompletionSection';
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

const mockComplete = vi.fn();

let mockReadiness = {
  ready: true,
  blockers: [] as any[]
};

vi.mock('../../modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: currentUser
  })
}));

vi.mock('../../modules/service-orders/hooks/useServiceOrderCompletion', () => ({
  useServiceOrderCompletion: () => ({
    readiness: mockReadiness,
    isLoadingReadiness: false,
    complete: mockComplete,
    isCompleting: false
  })
}));

describe('ServiceOrderCompletionSection (P4.7 Frontend UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
    mockReadiness = { ready: true, blockers: [] };
  });

  it('should render success view when OS is already FINISHED', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderCompletionSection
          serviceOrderId="os-123"
          status="FINISHED"
          finishedAt="2026-07-16T12:00:00Z"
          finishedBy={{ name: 'Mecânico Chefe' }}
          completionNotes="Substituição realizada com sucesso e testada."
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Ordem de Serviço Concluída')).toBeInTheDocument();
    expect(screen.getByText('Mecânico Chefe')).toBeInTheDocument();
    expect(screen.getByText('Substituição realizada com sucesso e testada.')).toBeInTheDocument();
  });

  it('should render draft warning when OS is in OPEN status', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderCompletionSection
          serviceOrderId="os-123"
          status="OPEN"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Aguardando Execução')).toBeInTheDocument();
    expect(screen.getByText(/A OS deve ser colocada em andamento/)).toBeInTheDocument();
  });

  it('should list blockers when readiness returns ready=false', () => {
    mockReadiness = {
      ready: false,
      blockers: [
        { code: 'DIAGNOSIS_MISSING', message: 'Registre o laudo técnico.' },
        { code: 'PART_NOT_FULLY_CONSUMED', message: 'Peça pendente de baixa.' }
      ]
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderCompletionSection
          serviceOrderId="os-123"
          status="IN_PROGRESS"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Restrições Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico técnico obrigatório não registrado')).toBeInTheDocument();
    expect(screen.getByText('Baixa/consumo físico de peças incompleto')).toBeInTheDocument();
    expect(screen.getByText('Registre o laudo técnico.')).toBeInTheDocument();
    expect(screen.getByText('Peça pendente de baixa.')).toBeInTheDocument();
  });

  it('should render complete form and support submission when ready=true', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderCompletionSection
          serviceOrderId="os-123"
          status="IN_PROGRESS"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Todos os gates atendidos')).toBeInTheDocument();
    expect(screen.getByLabelText(/Parecer Técnico de Conclusão/)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Escreva um detalhamento técnico/);
    fireEvent.change(textarea, { target: { value: 'Serviço executado por completo.' } });

    const btn = screen.getByText('Encerrar Ordem de Serviço');
    fireEvent.click(btn);

    expect(mockComplete).toHaveBeenCalledWith('Serviço executado por completo.');
  });

  it('should render restriction warning and hide form if user is not manager or admin', () => {
    currentUser = {
      id: 'user-mech',
      name: 'Mecânico Zé',
      role: 'MECHANIC'
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceOrderCompletionSection
          serviceOrderId="os-123"
          status="IN_PROGRESS"
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    expect(screen.getByText(/Apenas usuários com perfil de Administrador ou Gerente/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Parecer Técnico de Conclusão/)).not.toBeInTheDocument();
  });
});
