import { render, screen, act } from '@testing-library/react';
import { BranchProvider, useBranch } from '../../contexts/BranchContext';
import { expect, describe, it, beforeEach } from 'vitest';
import React from 'react';

const TestComponent = () => {
  const { 
    activeBranch, 
    setActiveBranch, 
    availableBranches, 
    setAvailableBranches,
    isSelectingBranch,
    setIsSelectingBranch
  } = useBranch();

  return (
    <div>
      <div data-testid="active-branch">{activeBranch?.name || 'none'}</div>
      <div data-testid="is-selecting">{isSelectingBranch ? 'yes' : 'no'}</div>
      <div data-testid="branches-count">{availableBranches.length}</div>
      <button onClick={() => setActiveBranch({ id: 'b1', name: 'Branch A', companyId: 'c1' })}>Select Branch A</button>
      <button onClick={() => setAvailableBranches([{ id: 'b1', name: 'Branch A', companyId: 'c1' }, { id: 'b2', name: 'Branch B', companyId: 'c1' }])}>Set Branches</button>
      <button onClick={() => setIsSelectingBranch(true)}>Start Selecting</button>
    </div>
  );
};

describe('BranchContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load initial active branch from localStorage', () => {
    localStorage.setItem('@AutoSync:activeBranch', JSON.stringify({ id: 'b2', name: 'Branch B', companyId: 'c1' }));

    render(
      <BranchProvider>
        <TestComponent />
      </BranchProvider>
    );

    expect(screen.getByTestId('active-branch')).toHaveTextContent('Branch B');
    expect(screen.getByTestId('is-selecting')).toHaveTextContent('no');
  });

  it('should change active branch and persist to localStorage', async () => {
    render(
      <BranchProvider>
        <TestComponent />
      </BranchProvider>
    );

    expect(screen.getByTestId('active-branch')).toHaveTextContent('none');
    expect(screen.getByTestId('is-selecting')).toHaveTextContent('yes');

    await act(async () => {
      screen.getByText('Select Branch A').click();
    });

    expect(screen.getByTestId('active-branch')).toHaveTextContent('Branch A');
    expect(screen.getByTestId('is-selecting')).toHaveTextContent('no');
    expect(localStorage.getItem('@AutoSync:branchId')).toBe('b1');
  });

  it('should update available branches and selecting state', async () => {
    render(
      <BranchProvider>
        <TestComponent />
      </BranchProvider>
    );

    expect(screen.getByTestId('branches-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByText('Set Branches').click();
    });

    expect(screen.getByTestId('branches-count')).toHaveTextContent('2');

    await act(async () => {
      screen.getByText('Start Selecting').click();
    });

    expect(screen.getByTestId('is-selecting')).toHaveTextContent('yes');
  });
});
