import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Audit from '@/pages/Audit';
import { AuditDiff, sanitizeDeep } from '@/components/audit/AuditDiff';
import api from '@/services/api';
import { BranchProvider } from '@/contexts/BranchContext';
import { useAuthStore } from '@/modules/auth/state/auth.store';

vi.mock('@/services/api');

const mockAuditLogs = [
  {
    id: 'log-1',
    action: 'CREATE',
    resource: 'SUPPLIER',
    resourceId: 's1',
    oldValue: null,
    newValue: { name: 'Fornecedor A', cnpj: '12345678000100', password: 'secretPassword123' },
    ip: '192.168.1.1',
    createdAt: '2026-08-01T10:00:00.000Z',
    user: { id: 'u1', name: 'Ana Admin', email: 'ana@autosync.com' },
  },
  {
    id: 'log-2',
    action: 'UPDATE',
    resource: 'OS',
    resourceId: 'os-100',
    oldValue: { status: 'DIAGNOSIS', total: 300 },
    newValue: { status: 'IN_EXECUTION', total: 450 },
    ip: '192.168.1.2',
    createdAt: '2026-08-02T14:30:00.000Z',
    user: { id: 'u2', name: 'Carlos Mecânico', email: 'carlos@autosync.com' },
  },
];

function renderAuditPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <Audit />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Audit & AuditDiff Module (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Ana Admin',
        email: 'ana@autosync.com',
        role: 'ADMIN',
        companyId: 'c1',
      },
      token: 'fake-jwt-token',
    });
  });

  it('1. should recursively mask sensitive keys in sanitizeDeep', () => {
    const raw = {
      name: 'João',
      password: 'mySecretPassword',
      token: 'bearerXYZ',
      apiKey: 'key123',
      nested: { secret: 'topsecret' },
    };

    const sanitized = sanitizeDeep(raw);
    expect(sanitized.name).toBe('João');
    expect(sanitized.password).toBe('••••••••');
    expect(sanitized.token).toBe('••••••••');
    expect(sanitized.apiKey).toBe('••••••••');
    expect(sanitized.nested.secret).toBe('••••••••');
  });

  it('2. should render AuditDiff with added, removed, and changed fields', () => {
    const before = { status: 'OPEN', price: 100, oldField: 'removeMe' };
    const after = { status: 'CLOSED', price: 100, newField: 'addMe' };

    render(<AuditDiff before={before} after={after} />);

    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('price')).toBeInTheDocument();
    expect(screen.getAllByText('Alterado')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Removido')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Adicionado')[0]).toBeInTheDocument();
  });

  it('3. should toggle technical JSON view in AuditDiff', () => {
    const before = { val: 1 };
    const after = { val: 2 };

    render(<AuditDiff before={before} after={after} />);

    const toggleBtn = screen.getByText('Visualização Técnica (JSON Sanitizado)');
    expect(screen.queryByText(/"val": 2/)).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/"val": 2/)).toBeInTheDocument();
  });

  it('4. should render audit logs list in Audit page', async () => {
    (api.get as any).mockResolvedValue({ data: mockAuditLogs });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Auditoria, Governança & Logs de Auditoria')).toBeInTheDocument();
    });

    expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mecânico')).toBeInTheDocument();
    expect(screen.getByText('SUPPLIER')).toBeInTheDocument();
  });

  it('5. should filter audit logs by search term', async () => {
    (api.get as any).mockResolvedValue({ data: mockAuditLogs });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar por ator, ação ou domínio...');
    fireEvent.change(searchInput, { target: { value: 'Carlos' } });

    expect(screen.queryByText('Ana Admin')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos Mecânico')).toBeInTheDocument();
  });

  it('6. should filter audit logs by entity dropdown', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('resource=OS')) {
        return Promise.resolve({ data: [mockAuditLogs[1]] });
      }
      return Promise.resolve({ data: mockAuditLogs });
    });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    });

    const resourceSelect = screen.getByLabelText('Filtrar por Entidade');
    fireEvent.change(resourceSelect, { target: { value: 'OS' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('resource=OS'));
    });
  });

  it('7. should open inspection modal upon clicking Inspecionar Diff button', async () => {
    (api.get as any).mockResolvedValue({ data: mockAuditLogs });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText('Inspecionar Diff');
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Detalhamento & Diff de Auditoria')).toBeInTheDocument();
      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('••••••••')).toBeInTheDocument(); // Sensitive key masked
    });
  });

  it('8. should render empty state when search produces no results', async () => {
    (api.get as any).mockResolvedValue({ data: mockAuditLogs });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar por ator, ação ou domínio...');
    fireEvent.change(searchInput, { target: { value: 'NenhumResultado' } });

    expect(screen.queryByText('Ana Admin')).not.toBeInTheDocument();
  });

  it('9. should handle API error gracefully', async () => {
    (api.get as any).mockRejectedValueOnce({
      response: { data: { message: 'Erro de conexão com o log de auditoria.' } },
    });

    renderAuditPage();

    await waitFor(() => {
      expect(screen.getByText('Erro de conexão com o log de auditoria.')).toBeInTheDocument();
    });
  });

  it('10. should handle JSON string payloads safely in AuditDiff', () => {
    const beforeStr = JSON.stringify({ item: 'A', secret: 'abc' });
    const afterStr = JSON.stringify({ item: 'B', secret: 'xyz' });

    render(<AuditDiff before={beforeStr} after={afterStr} />);

    expect(screen.getByText('item')).toBeInTheDocument();
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(screen.getAllByText('••••••••')[0]).toBeInTheDocument();
  });
});
