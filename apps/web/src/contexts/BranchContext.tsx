import React, { createContext, useContext, useState, useEffect } from 'react';

interface Branch {
  id: string;
  name: string;
  companyId: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

interface BranchContextData {
  activeBranch: Branch | null;
  setActiveBranch(branch: Branch): void;
  availableBranches: Branch[];
  setAvailableBranches(branches: Branch[]): void;
  isSelectingBranch: boolean;
  setIsSelectingBranch(selecting: boolean): void;
}

const BranchContext = createContext<BranchContextData | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isSelectingBranch, setIsSelectingBranch] = useState(true);

  useEffect(() => {
    const storagedBranch = localStorage.getItem('@AutoSync:activeBranch');
    if (storagedBranch) {
      try {
        const parsed = JSON.parse(storagedBranch);
        setActiveBranchState(parsed);
        setIsSelectingBranch(false);
      } catch {}
    }
  }, []);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem('@AutoSync:activeBranch', JSON.stringify(branch));
    localStorage.setItem('@AutoSync:branchId', branch.id);
    setIsSelectingBranch(false);

    // Notify listeners & trigger custom window event for multi-branch sync
    window.dispatchEvent(new CustomEvent('autosync:branch-changed', { detail: branch }));
  };

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        setActiveBranch,
        availableBranches,
        setAvailableBranches,
        isSelectingBranch,
        setIsSelectingBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = (): BranchContextData => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
