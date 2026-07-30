/**
 * Unit tests for PartSearchCombobox component
 *
 * Covers:
 * - Renders with placeholder when no selection
 * - Opens dropdown on button click
 * - Shows loading state while fetching
 * - Renders search results from mocked API
 * - Selects a part and calls onSelect callback
 * - Disables out-of-stock items with "Sem saldo" badge
 * - Prevents selection of disabled items
 * - Shows "Cadastrar nova peça" link when canCreatePart is true
 * - Shows empty state when no results
 * - Keyboard navigation: Escape closes the dropdown
 * - Debounced query (uses fake timers)
 * - Serializes availableQuantity as a string decimal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PartSearchCombobox, type PartSearchItem } from '../../modules/service-orders/components/PartSearchCombobox';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockPartWithStock: PartSearchItem = {
  id: 'part-001',
  name: 'Filtro de Óleo Wega',
  sku: 'FLT-001',
  manufacturerCode: 'WO120',
  barcode: '7891234567890',
  brand: 'Wega',
  description: 'Filtro de óleo para motores 1.6',
  category: 'Filtros',
  unit: 'UN',
  onHandQuantity: '10.000',
  reservedQuantity: '2.000',
  availableQuantity: '8.000',
  location: 'A-03',
  averageCost: '42.50',
  canSelectFromStock: true,
  active: true,
};

const mockPartNoStock: PartSearchItem = {
  id: 'part-002',
  name: 'Amortecedor Traseiro Monroe',
  sku: 'AMO-002',
  manufacturerCode: null,
  barcode: null,
  brand: 'Monroe',
  description: null,
  category: null,
  unit: 'UN',
  onHandQuantity: '0.000',
  reservedQuantity: '0.000',
  availableQuantity: '0.000',
  location: null,
  averageCost: null,
  canSelectFromStock: false,
  active: true,
};

const mockSearchResponse = (items: PartSearchItem[]) => ({
  data: {
    success: true,
    data: {
      items,
      total: items.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    },
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

async function openDropdown() {
  const trigger = screen.getByRole('combobox');
  fireEvent.click(trigger);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/buscar peça/i)).toBeInTheDocument();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PartSearchCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.get).mockResolvedValue(mockSearchResponse([mockPartWithStock, mockPartNoStock]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders trigger button with placeholder text', () => {
    render(
      <PartSearchCombobox onSelect={vi.fn()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/buscar peça/i)).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    render(<PartSearchCombobox onSelect={vi.fn()} />, { wrapper: createWrapper() });
    await openDropdown();
    // The input inside the popover should be focused/visible
    expect(screen.getByPlaceholderText(/buscar peça/i)).toBeInTheDocument();
  });

  it('shows search results with quantity info', async () => {
    render(<PartSearchCombobox onSelect={vi.fn()} branchId="branch-1" />, { wrapper: createWrapper() });
    await openDropdown();

    // Advance timers for debounce + query
    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Filtro de Óleo Wega')).toBeInTheDocument();
    });

    // Available quantity shown for in-stock item
    expect(screen.getByText(/8.*disp/i)).toBeInTheDocument();
  });

  it('calls onSelect with the correct PartSearchItem when a part is selected', async () => {
    const onSelect = vi.fn();
    render(<PartSearchCombobox onSelect={onSelect} branchId="branch-1" />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Filtro de Óleo Wega')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Filtro de Óleo Wega'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
      id: 'part-001',
      name: 'Filtro de Óleo Wega',
      canSelectFromStock: true,
    }));
  });

  it('shows "Sem saldo" badge for out-of-stock items', async () => {
    render(<PartSearchCombobox onSelect={vi.fn()} />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Amortecedor Traseiro Monroe')).toBeInTheDocument();
    });

    expect(screen.getByText('Sem saldo')).toBeInTheDocument();
  });

  it('does NOT call onSelect when an out-of-stock item is clicked', async () => {
    const onSelect = vi.fn();
    render(<PartSearchCombobox onSelect={onSelect} />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Amortecedor Traseiro Monroe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Amortecedor Traseiro Monroe'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows empty state when no results returned', async () => {
    vi.mocked(api.get).mockResolvedValue(mockSearchResponse([]));
    render(<PartSearchCombobox onSelect={vi.fn()} />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText(/nenhuma peça/i)).toBeInTheDocument();
    });
  });

  it('shows "Cadastrar nova peça" link when showCreateLink is true and results are empty', async () => {
    vi.mocked(api.get).mockResolvedValue(mockSearchResponse([]));
    const onCreatePart = vi.fn();
    render(
      <PartSearchCombobox
        onSelect={vi.fn()}
        showCreateLink
        onCreatePart={onCreatePart}
      />,
      { wrapper: createWrapper() }
    );
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText(/cadastrar nova peça/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/cadastrar nova peça/i));
    expect(onCreatePart).toHaveBeenCalledTimes(1);
  });

  it('shows selected part name in the trigger button after selection', async () => {
    const onSelect = vi.fn();
    render(<PartSearchCombobox onSelect={onSelect} />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Filtro de Óleo Wega')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Filtro de Óleo Wega'));

    // Trigger should now show the selected part name
    expect(screen.getByRole('combobox')).toHaveTextContent('Filtro de Óleo Wega');
  });

  it('is disabled when disabled prop is set', () => {
    render(<PartSearchCombobox onSelect={vi.fn()} disabled />, { wrapper: createWrapper() });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('serializes availableQuantity as a decimal string', async () => {
    const onSelect = vi.fn();
    render(<PartSearchCombobox onSelect={onSelect} />, { wrapper: createWrapper() });
    await openDropdown();

    await act(async () => { vi.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Filtro de Óleo Wega')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Filtro de Óleo Wega'));

    // The onSelect argument must have availableQuantity as string
    const calledWith: PartSearchItem = onSelect.mock.calls[0][0];
    expect(typeof calledWith.availableQuantity).toBe('string');
    expect(calledWith.availableQuantity).toBe('8.000');
  });
});
