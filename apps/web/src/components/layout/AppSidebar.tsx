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
  SidebarSeparator,
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
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center flex flex-col gap-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
            <Car className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden truncate">
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">{APP_INFO.name}</span>
            <span className="text-[10px] text-muted-foreground truncate">{APP_INFO.tagline}</span>
          </div>
        </div>

        {/* Company & Active Branch Indicator */}
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-muted/60 border border-border/40 group-data-[collapsible=icon]:hidden text-xs w-full">
          <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground truncate">
            <Building2 className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{user?.tenant?.name || 'AutoSync Enterprise'}</span>
          </div>
          {activeBranch && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate pl-5">
              <Store className="size-3 shrink-0" />
              <span className="truncate">{activeBranch.name}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Menu Grouped by Domains */}
      <SidebarContent className="px-2 py-2 group-data-[collapsible=icon]:px-1">
        {menuGroups.map((group, index) => (
          <React.Fragment key={group.label}>
            {index > 0 && (
              <SidebarSeparator className="my-1.5 mx-auto w-6 bg-sidebar-border group-data-[collapsible=icon]:block hidden sm:block" />
            )}
            <SidebarGroup className="py-1 px-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
              <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.path} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        className="h-10 w-full justify-start gap-2.5 px-3 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                      >
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-lg w-full transition-all ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                            }`
                          }
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md">
                            <item.icon className="size-5 shrink-0" />
                          </span>
                          <span className="group-data-[collapsible=icon]:hidden truncate">{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      {/* Footer: User & App Version */}
      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center justify-between gap-2 overflow-hidden group-data-[collapsible=icon]:hidden mb-1 px-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-semibold text-xs border border-sidebar-border">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name}</span>
              <span className="truncate text-[10px] text-muted-foreground">{user?.role}</span>
            </div>
          </div>
        </div>

        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              onClick={logout}
              className="h-10 w-full justify-start gap-2.5 px-3 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 text-sidebar-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
              tooltip="Sair do sistema"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md">
                <LogOut className="size-5 shrink-0 text-danger" />
              </span>
              <span className="group-data-[collapsible=icon]:hidden font-medium text-xs">Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="text-[10px] text-muted-foreground/50 text-center pt-1 group-data-[collapsible=icon]:hidden">
          v{APP_INFO.version}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
