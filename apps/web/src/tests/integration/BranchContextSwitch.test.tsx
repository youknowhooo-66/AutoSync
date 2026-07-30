import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Branches from '@/pages/Branches';
import Financial from '@/pages/Financial';
import api from '@/services/api';
import { BranchProvider, useBranch } from '@/contexts/BranchContext';

vi.mock('@/services/api');

const mockBranchA = {
  id: 'b1',
  name: 'Matriz Centro',
  cnpj: '12.345.678/0001-01',
  companyId: 'c1',
  active: true,
};

const mockBranchB = {
  id: 'b2',
  name: 'Filial Sul',
  cnpj: '12.345.678/0001-02',
  companyId: 'c1',
  active: true,
};

function TestBranchSwitcherComponent() {
  const { activeBranch, setActiveBranch } = useBranch();
  return (
    <div>
      <span data-testid="active-branch-display">{activeBranch?.name || 'Nenhuma'}</span>
      <button data-testid="switch-to-b2" onClick={() => setActiveBranch(mockBranchB)}>
        Trocar para Filial Sul
      </button>
    </div>
  );
}

function renderIntegratedEnvironment() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        <MemoryRouter>
          <TestBranchSwitcherComponent />
          <Financial />
        </MemoryRouter>
      </BranchProvider>
    </QueryClientProvider>
  );
}

describe('Multi-Branch Context Switching & Cache Isolation (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'u1',
        name: 'Admin Test',
        role: 'ADMIN',
        companyId: 'c1',
      })
    );
  });

  it('1. should persist branch selection to localStorage on active branch change', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    renderIntegratedEnvironment();

    const switchBtn = screen.getByTestId('switch-to-b2');
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByTestId('active-branch-display')).toHaveTextContent('Filial Sul');
    });

    expect(localStorage.getItem('@AutoSync:branchId')).toBe('b2');
    expect(localStorage.getItem('@AutoSync:activeBranch')).toContain('Filial Sul');
  });

  it('2. should trigger custom window event autosync:branch-changed on branch switch', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    const listener = vi.fn();
    window.addEventListener('autosync:branch-changed', listener);

    renderIntegratedEnvironment();

    fireEvent.click(screen.getByTestId('switch-to-b2'));

    await waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    window.removeEventListener('autosync:branch-changed', listener);
  });

  it('3. should pass target branchId in API queries when active branch changes', async () => {
    (api.get as any).mockResolvedValue({ data: [] });

    renderIntegratedEnvironment();

    fireEvent.click(screen.getByTestId('switch-to-b2'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('branchId=b2'));
    });
  });

  it('4. should restore saved active branch from localStorage on initial boot', async () => {
    localStorage.setItem('@AutoSync:activeBranch', JSON.stringify(mockBranchA));
    localStorage.setItem('@AutoSync:branchId', 'b1');
    (api.get as any).mockResolvedValue({ data: [] });

    renderIntegratedEnvironment();

    await waitFor(() => {
      expect(screen.getByTestId('active-branch-display')).toHaveTextContent('Matriz Centro');
    });
  });
});
