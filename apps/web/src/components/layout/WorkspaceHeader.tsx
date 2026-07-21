import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import { useTheme } from 'next-themes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search,
  Store,
  Bell,
  Sun,
  Moon,
  Laptop,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Check,
} from 'lucide-react';

interface WorkspaceHeaderProps {
  onOpenCommandPalette: () => void;
}

const routeTitles: Record<string, { title: string; category: string }> = {
  '/': { title: 'Dashboard Executivo', category: 'Visão Geral' },
  '/os': { title: 'Ordens de Serviço', category: 'Operação' },
  '/clientes': { title: 'Clientes', category: 'Operação' },
  '/veiculos': { title: 'Veículos', category: 'Operação' },
  '/estoque': { title: 'Estoque de Peças', category: 'Suprimentos' },
  '/fornecedores': { title: 'Fornecedores', category: 'Suprimentos' },
  '/financeiro': { title: 'Financeiro', category: 'Gestão' },
  '/relatorios': { title: 'Relatórios', category: 'Gestão' },
  '/filiais': { title: 'Filiais', category: 'Administração' },
  '/usuarios': { title: 'Usuários', category: 'Administração' },
  '/auditoria': { title: 'Auditoria & Logs', category: 'Administração' },
};

export function WorkspaceHeader({ onOpenCommandPalette }: WorkspaceHeaderProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeBranch, setActiveBranch, availableBranches } = useBranch();
  const { theme, setTheme } = useTheme();

  const currentRoute = routeTitles[location.pathname] || {
    title: 'Painel',
    category: 'AutoSync',
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-20 transition-all">
      {/* Left: Sidebar Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger aria-label="Alternar menu lateral" className="text-muted-foreground hover:text-foreground transition-colors shrink-0" />

        <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

        {/* Breadcrumb Navigation */}
        <div className="hidden sm:flex flex-col min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors truncate">
              {currentRoute.category}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground truncate">{currentRoute.title}</span>
          </nav>
        </div>
      </div>

      {/* Right: Quick Search, Branch Selector, Notifications, Theme, User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-surface-muted hover:bg-surface-muted/80 rounded-lg border border-border/60 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar ou comandos...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Buscar comandos"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Branch Selector Dropdown */}
        {availableBranches && availableBranches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 gap-2 text-xs font-semibold border-border bg-card hover:bg-surface-muted max-w-[150px] sm:max-w-[200px]"
              >
                <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{activeBranch?.name || 'Selecione a filial'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Filiais Disponíveis
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => setActiveBranch(branch)}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="truncate">{branch.name}</span>
                  {activeBranch?.id === branch.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              aria-label="Central de notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
              <Badge variant="secondary" className="text-[10px]">ERP Operacional</Badge>
            </div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="p-2.5 rounded-lg bg-surface-muted/60 border border-border/40">
                <span className="font-semibold text-foreground block">Sistema Operacional Online</span>
                <span className="text-[11px]">Todas as integrações da filial estão operando normalmente.</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Alternar tema">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')} className="text-xs cursor-pointer">
              <Sun className="h-3.5 w-3.5 mr-2" /> Modo Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="text-xs cursor-pointer">
              <Moon className="h-3.5 w-3.5 mr-2" /> Modo Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="text-xs cursor-pointer">
              <Laptop className="h-3.5 w-3.5 mr-2" /> Modo do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-primary/10 text-primary font-semibold text-xs border border-primary/20" aria-label="Menu do usuário">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold leading-none text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <Badge variant="outline" className="w-fit mt-1 text-[10px] font-semibold border-primary/30 text-primary">
                  {user?.role || 'USUÁRIO'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-danger focus:bg-danger/10 focus:text-danger cursor-pointer">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
