import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { WorkspaceHeader } from './WorkspaceHeader';
import { CommandPalette } from './CommandPalette';
import { SidebarProvider } from '../ui/sidebar';
import { Toaster } from '../ui/sonner';
import { TooltipProvider } from '../ui/tooltip';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
          <AppSidebar />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <WorkspaceHeader onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>

          {/* Global Overlays */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
          />

          <Toaster position="top-right" />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
