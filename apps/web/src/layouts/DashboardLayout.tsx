import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  ClipboardList, 
  Package, 
  DollarSign, 
  LogOut, 
  Menu,
  Settings,
  Bell,
  Store,
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '../modules/auth/hooks/useAuth';
import { useBranch } from '../contexts/BranchContext';

export function DashboardLayout() {
  const { logout, user } = useAuth();
  const { activeBranch, setIsSelectingBranch } = useBranch();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Veículos', href: '/vehicles', icon: Car },
    { name: 'Ordens de Serviço', href: '/service-orders', icon: ClipboardList },
    { name: 'Estoque', href: '/inventory', icon: Package },
    { name: 'Financeiro', href: '/financial', icon: DollarSign },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Car className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-900">AutoSync</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {user?.role === 'ADMIN' && (
          <div className="px-4 mb-4">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/admin') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Shield size={20} />
              <span className="font-medium">Administração</span>
            </Link>
          </div>
        )}

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600">
              <Menu size={24} />
            </button>
            <button 
              onClick={() => setIsSelectingBranch(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all text-sm font-bold group"
            >
              <Store size={16} className="text-indigo-600" />
              <span>{activeBranch?.name}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
                <span className="text-xs text-slate-500 uppercase">{user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-indigo-700">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
