import React from 'react';
import { useBranch } from '../contexts/BranchContext';
import { Layout, Store, ChevronRight } from 'lucide-react';

export default function BranchSelection() {
  const { availableBranches, setActiveBranch } = useBranch();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Bem-vindo ao AutoSync</h1>
        <p className="text-slate-500 text-lg">Para começar, selecione a filial em que você irá operar hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {availableBranches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setActiveBranch(branch)}
            className="group bg-white p-8 rounded-3xl border-2 border-transparent hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Store size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{branch.name}</h3>
                <p className="text-slate-400">Clique para acessar esta filial</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" size={24} />
          </button>
        ))}

        {availableBranches.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <Layout size={48} className="mx-auto text-slate-300 mb-6" />
            <p className="text-slate-500">Nenhuma filial encontrada para sua empresa.</p>
            <p className="text-sm text-slate-400 mt-2">Contate o administrador do sistema.</p>
          </div>
        )}
      </div>

      <div className="mt-12 text-slate-400 text-sm">
        Logado como <strong>Administrador</strong> • AutoSync ERP v1.0
      </div>
    </div>
  );
}
