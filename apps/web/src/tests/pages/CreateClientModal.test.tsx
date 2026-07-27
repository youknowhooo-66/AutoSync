import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { CreateClientModal } from '../../modules/clients/components/CreateClientModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock mutations
const mockCreateClient = vi.fn();
const mockUpdateClient = vi.fn();

vi.mock('../../modules/clients/hooks/useClients', () => ({
  useCreateClient: () => ({
    mutateAsync: mockCreateClient,
    isPending: false,
  }),
  useUpdateClient: () => ({
    mutateAsync: mockUpdateClient,
    isPending: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CreateClientModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<CreateClientModal isOpen={true} onClose={vi.fn()} />, { wrapper });
    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
  });

  it('prefills client details (including email) when editing', () => {
    const editingClient = {
      id: 'c-123',
      name: 'Leonardo Da Vinci',
      email: 'leo@vinci.com',
      phone: '123456789',
      document: '111.111.111-11',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <CreateClientModal isOpen={true} onClose={vi.fn()} editingClient={editingClient} />,
      { wrapper }
    );

    expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: João Silva')).toHaveValue('Leonardo Da Vinci');
    expect(screen.getByPlaceholderText('exemplo@email.com')).toHaveValue('leo@vinci.com');
    expect(screen.getByPlaceholderText('(00) 00000-0000')).toHaveValue('123456789');
    expect(screen.getByPlaceholderText('000.000.000-00')).toHaveValue('111.111.111-11');
  });

  it('allows submitting with valid fields', async () => {
    render(<CreateClientModal isOpen={true} onClose={vi.fn()} />, { wrapper });

    fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), {
      target: { value: 'Alberto Santos' },
    });
    fireEvent.change(screen.getByPlaceholderText('exemplo@email.com'), {
      target: { value: 'santos@dumont.com' },
    });

    fireEvent.click(screen.getByText('Salvar Cliente'));

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        name: 'Alberto Santos',
        email: 'santos@dumont.com',
        phone: '',
        document: '',
      });
    });
  });

  it('respects dark/light theme classes on input fields', () => {
    render(<CreateClientModal isOpen={true} onClose={vi.fn()} />, { wrapper });

    const nameInput = screen.getByPlaceholderText('Ex: João Silva');
    // Ensure semantic input classes (bg-background, text-foreground, border-input) are present
    expect(nameInput).toHaveClass('bg-background');
    expect(nameInput).toHaveClass('text-foreground');
    expect(nameInput).toHaveClass('border-input');
  });
});
