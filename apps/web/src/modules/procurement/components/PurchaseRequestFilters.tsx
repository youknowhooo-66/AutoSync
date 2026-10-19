import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PurchaseRequestFiltersBar: React.FC<Props> = ({
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full bg-card p-3 rounded-lg border">
      <div className="w-full sm:w-64">
        <Input
          placeholder="Buscar por peça ou OS..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      <div className="w-full sm:w-44">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="REQUESTED">Solicitada</SelectItem>
            <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
            <SelectItem value="READY_FOR_PICKUP">Pronta para retirada</SelectItem>
            <SelectItem value="INSTALLED">Instalada</SelectItem>
            <SelectItem value="CANCELED">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-44">
        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Todas as Prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as Prioridades</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="LOW">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
