import React, { useState } from 'react';
import { Bell, Check, Package, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/modules/procurement/hooks/useNotifications';
import { useBranch } from '@/contexts/BranchContext';
import type { NotificationItem } from '@/modules/procurement/types/procurement.types';

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { activeBranch, setActiveBranch, availableBranches } = useBranch();
  const { data, isLoading, markReadMutation, markAllReadMutation } = useNotifications();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.readAt) {
        await markReadMutation.mutateAsync(notif.id);
      }

      // Check if notification belongs to a different branch
      if (notif.branchId && activeBranch && notif.branchId !== activeBranch.id) {
        const targetBranch = availableBranches.find((b) => b.id === notif.branchId);
        if (targetBranch) {
          const confirmSwitch = window.confirm(
            `Esta notificação pertence à filial "${targetBranch.name}". Deseja alternar para esta filial para visualizar?`
          );
          if (confirmSwitch) {
            setActiveBranch(targetBranch);
          } else {
            return;
          }
        }
      }

      setOpen(false);

      if (notif.entityType === 'ServiceOrder') {
        navigate(`/service-orders?id=${notif.entityId}`);
      } else {
        navigate('/financeiro/solicitacoes-de-pecas');
      }
    } catch {
      toast.error('Erro ao abrir notificação.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch {
      toast.error('Erro ao marcar notificações como lidas.');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 overflow-hidden shadow-lg border">
        <div className="flex items-center justify-between p-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-foreground">Central de Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                {unreadCount} não lida(s)
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-primary hover:text-primary/80"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar lidas
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação encontrada.</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 text-xs flex gap-3 items-start cursor-pointer transition-colors ${
                  notif.readAt ? 'bg-background hover:bg-muted/30 text-muted-foreground' : 'bg-primary/5 hover:bg-primary/10 text-foreground font-medium'
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-full bg-muted text-foreground shrink-0">
                  {notif.entityType === 'ServiceOrder' ? (
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-purple-500" />
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs">{notif.title}</span>
                    {!notif.readAt && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {notif.message && <p className="text-[11px] text-muted-foreground line-clamp-2">{notif.message}</p>}
                  <span className="text-[10px] text-muted-foreground/70 block pt-0.5">
                    {new Date(notif.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
