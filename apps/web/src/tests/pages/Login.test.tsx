import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
  api: {
    post: vi.fn(),
  }
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-icons
vi.mock('react-icons/md', () => ({
  MdEmail: () => <span>EmailIcon</span>,
  MdLock: () => <span>LockIcon</span>,
  MdLogin: () => <span>LoginIcon</span>,
}));

describe('Login Page', () => {
  const signInMock = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      signed: false,
      loading: false,
      signIn: signInMock,
      signOut: vi.fn(),
    });
  });

  it('should render form inputs and submit button', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('should handle successful login submit', async () => {
    const mockSession = {
      token: 'jwt-token-123',
      user: { id: 'u1', name: 'Carlos', role: 'ADMIN', companyId: 'c1' },
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockSession });

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/sessions', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(signInMock).toHaveBeenCalledWith(mockSession.token, mockSession.user);
      expect(toast.success).toHaveBeenCalledWith('Bem-vindo ao AutoSync!');
    });
  });

  it('should show toast error message on login failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Credenciais inválidas.',
        },
      },
    });

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Credenciais inválidas.');
    });
  });
});
