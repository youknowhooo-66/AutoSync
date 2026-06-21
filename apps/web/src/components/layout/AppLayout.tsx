import React from "react"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar"
import { Toaster } from "../ui/sonner"
import { TooltipProvider } from "../ui/tooltip"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Header / Navbar */}
            <header className="h-16 flex-shrink-0 flex items-center px-6 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
              <div className="flex items-center gap-4 w-full">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                <div className="flex-1" />
                {/* Future global search / user profile could go here */}
              </div>
            </header>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 animate-in fade-in duration-500">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}
