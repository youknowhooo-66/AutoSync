import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import { APP_INFO } from '@/config/appInfo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wrench,
  PackageSearch,
  Users,
  CarFront,
  Truck,
  CircleDollarSign,
  Store,
  ShieldCheck,
  History,
  LineChart,
  LogOut,
  Car,
  Building2,
} from 'lucide-react';

interface MenuDomainGroup {
  label: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const menuGroups: MenuDomainGroup[] = [
  {
    label: 'Visão Geral',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operação',
    items: [
      { name: 'Ordens de Serviço', path: '/os', icon: Wrench },
      { name: 'Clientes', path: '/clientes', icon: Users },
      { name: 'Veículos', path: '/veiculos', icon: CarFront },
    ],
  },
  {
    label: 'Suprimentos',
    items: [
      { name: 'Estoque', path: '/estoque', icon: PackageSearch },
      { name: 'Fornecedores', path: '/fornecedores', icon: Truck },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Financeiro', path: '/financeiro', icon: CircleDollarSign },
      { name: 'Relatórios', path: '/relatorios', icon: LineChart },
    ],
  },
  {
    label: 'Administração',
    items: [
      { name: 'Filiais', path: '/filiais', icon: Store },
      { name: 'Usuários', path: '/usuarios', icon: ShieldCheck },
      { name: 'Auditoria', path: '/auditoria', icon: History },
    ],
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { activeBranch } = useBranch();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Header: Logo & Active Workspace Info */}
      <SidebarHeader className="p-4 flex flex-col gap-3 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-base tracking-tight text-sidebar-foreground">{APP_INFO.name}</span>
            <span className="text-[11px] text-sidebar-foreground/60">{APP_INFO.tagline}</span>
          </div>
        </div>

        {/* Company & Active Branch Indicator */}
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/40 group-data-[collapsible=icon]:hidden text-xs">
          <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground truncate">
            <Building2 className="h-3.5 w-3.5 text-sidebar-primary shrink-0" />
            <span className="truncate">{user?.tenant?.name || 'AutoSync Enterprise'}</span>
          </div>
          {activeBranch && (
            <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70 truncate pl-5">
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate">{activeBranch.name}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Menu Grouped by Domains */}
      <SidebarContent className="px-2 py-3">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild tooltip={item.name}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary font-semibold border-l-2 border-sidebar-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: User & App Version */}
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between gap-2 overflow-hidden group-data-[collapsible=icon]:hidden mb-2 px-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-semibold text-xs border border-sidebar-border">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name}</span>
              <span className="truncate text-[10px] text-sidebar-foreground/60">{user?.role}</span>
            </div>
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-danger hover:bg-danger/10 hover:text-danger text-xs font-medium"
              tooltip="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="text-[10px] text-sidebar-foreground/40 text-center pt-2 group-data-[collapsible=icon]:hidden">
          v{APP_INFO.version}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
