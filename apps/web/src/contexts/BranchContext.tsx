import React, { createContext, useContext, useState, useEffect } from 'react';

interface Branch {
  id: string;
  name: string;
  companyId: string;
}

interface BranchContextData {
  activeBranch: Branch | null;
  setActiveBranch(branch: Branch): void;
  availableBranches: Branch[];
  setAvailableBranches(branches: Branch[]): void;
  isSelectingBranch: boolean;
  setIsSelectingBranch(selecting: boolean): void;
}

const BranchContext = createContext<BranchContextData>({} as BranchContextData);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isSelectingBranch, setIsSelectingBranch] = useState(true);

  useEffect(() => {
    const storagedBranch = localStorage.getItem('@AutoSync:activeBranch');
    if (storagedBranch) {
      setActiveBranchState(JSON.parse(storagedBranch));
      setIsSelectingBranch(false);
    }
  }, []);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem('@AutoSync:activeBranch', JSON.stringify(branch));
    localStorage.setItem('@AutoSync:branchId', branch.id);
    setIsSelectingBranch(false);
  };

  return (
    <BranchContext.Provider value={{ 
      activeBranch, 
      setActiveBranch, 
      availableBranches, 
      setAvailableBranches,
      isSelectingBranch,
      setIsSelectingBranch
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
