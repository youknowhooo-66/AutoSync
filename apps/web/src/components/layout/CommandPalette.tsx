import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Wrench,
  Users,
  CarFront,
  PackageSearch,
  CircleDollarSign,
  Store,
  ShieldCheck,
  History,
  LineChart,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBranch?: () => void;
}

export function CommandPalette({ open, onOpenChange, onSelectBranch }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="AutoSync Command Palette" description="Busque por atalhos e navegação rápida">
      <CommandInput placeholder="Digite um comando ou busque uma área..." />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => navigate('/os'))}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Nova Ordem de Serviço</span>
            <CommandShortcut>⌘OS</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/clientes'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Novo Cliente</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/veiculos'))}>
            <CarFront className="mr-2 h-4 w-4" />
            <span>Novo Veículo</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/estoque'))}>
            <PackageSearch className="mr-2 h-4 w-4" />
            <span>Abrir Estoque</span>
          </CommandItem>
          {onSelectBranch && (
            <CommandItem onSelect={() => runCommand(onSelectBranch)}>
              <Store className="mr-2 h-4 w-4" />
              <span>Trocar Filial Ativa</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação do ERP">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>Dashboard Executivo</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/os'))}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Ordens de Serviço</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/clientes'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Clientes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/veiculos'))}>
            <CarFront className="mr-2 h-4 w-4" />
            <span>Veículos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/estoque'))}>
            <PackageSearch className="mr-2 h-4 w-4" />
            <span>Estoque</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/financeiro'))}>
            <CircleDollarSign className="mr-2 h-4 w-4" />
            <span>Financeiro</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/filiais'))}>
            <Store className="mr-2 h-4 w-4" />
            <span>Filiais</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/usuarios'))}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Usuários</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/auditoria'))}>
            <History className="mr-2 h-4 w-4" />
            <span>Auditoria</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/relatorios'))}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>Relatórios</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Preferências de Interface">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Modo Claro</span>
            {theme === 'light' && <CommandShortcut>Ativo</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Modo Escuro</span>
            {theme === 'dark' && <CommandShortcut>Ativo</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>Modo do Sistema</span>
            {theme === 'system' && <CommandShortcut>Ativo</CommandShortcut>}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
