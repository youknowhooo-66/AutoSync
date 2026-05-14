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
  Bell
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardLayout() {
  const { signOut, user } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Veículos', href: '/vehicles', icon: Car },
    { name: 'Ordens de Serviço', href: '/service-orders', icon: ClipboardList },
    { name: 'Estoque', href: '/inventory', icon: Package },
    { name: 'Financeiro', href: '/financial', icon: DollarSign },
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

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={signOut}
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
          <button className="lg:hidden text-slate-600">
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
                <span className="text-xs text-slate-500 uppercase">{user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
