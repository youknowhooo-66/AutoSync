import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { expect, describe, it, beforeEach } from 'vitest';
import React from 'react';

const TestComponent = () => {
  const { signed, user, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      <div data-testid="signed">{signed ? 'yes' : 'no'}</div>
      <div data-testid="username">{user?.name || 'none'}</div>
      <button onClick={() => signIn('token-123', { id: 'u1', name: 'Carlos', role: 'ADMIN', companyId: 'c1' })}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load initial state from localStorage', () => {
    localStorage.setItem('@AutoSync:token', 'token-abc');
    localStorage.setItem('@AutoSync:user', JSON.stringify({ id: 'u2', name: 'Pedro', role: 'ADMIN', companyId: 'c1' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('no');
    expect(screen.getByTestId('signed')).toHaveTextContent('yes');
    expect(screen.getByTestId('username')).toHaveTextContent('Pedro');
  });

  it('should sign in user and update state/localStorage', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('signed')).toHaveTextContent('no');

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    expect(screen.getByTestId('signed')).toHaveTextContent('yes');
    expect(screen.getByTestId('username')).toHaveTextContent('Carlos');
    expect(localStorage.getItem('@AutoSync:token')).toBe('token-123');
  });

  it('should sign out user and clear state/localStorage', async () => {
    localStorage.setItem('@AutoSync:token', 'token-abc');
    localStorage.setItem('@AutoSync:user', JSON.stringify({ id: 'u2', name: 'Pedro', role: 'ADMIN', companyId: 'c1' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('signed')).toHaveTextContent('yes');

    await act(async () => {
      screen.getByText('Sign Out').click();
    });

    expect(screen.getByTestId('signed')).toHaveTextContent('no');
    expect(localStorage.getItem('@AutoSync:token')).toBeNull();
  });
});
