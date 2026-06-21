import React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../modules/auth/hooks/useAuth"
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
} from "../ui/sidebar"
import { useTheme } from "next-themes"
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
  Sun,
  Moon
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Ordens de Serviço", path: "/os", icon: Wrench },
  { name: "Estoque", path: "/estoque", icon: PackageSearch },
  { name: "Clientes", path: "/clientes", icon: Users },
  { name: "Veículos", path: "/veiculos", icon: CarFront },
  { name: "Fornecedores", path: "/fornecedores", icon: Truck },
  { name: "Financeiro", path: "/financeiro", icon: CircleDollarSign },
  { name: "Filiais", path: "/filiais", icon: Store },
  { name: "Usuários", path: "/usuarios", icon: ShieldCheck },
  { name: "Auditoria", path: "/auditoria", icon: History },
  { name: "Relatórios", path: "/relatorios", icon: LineChart },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Car className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
          <span className="font-semibold tracking-tight">AutoSync</span>
          <span className="text-xs text-muted-foreground">ERP Management</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.name}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                      }
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:hidden mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <span className="font-medium text-sm">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user?.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        
        <SidebarMenu className="mb-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              tooltip="Alternar tema"
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout} 
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              tooltip="Sair do sistema"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
