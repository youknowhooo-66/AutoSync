import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { usePurchaseRequests } from '../hooks/usePurchaseRequests';
import { PurchaseRequestFiltersBar } from '../components/PurchaseRequestFilters';
import { PurchaseRequestTable } from '../components/PurchaseRequestTable';
import { PurchaseRequestMobileList } from '../components/PurchaseRequestMobileList';
import { PurchaseRequestDetailSheet } from '../components/PurchaseRequestDetailSheet';
import type { PurchaseRequestStatus, PurchaseRequestPriority } from '../types/procurement.types';
import { formatCurrencyBRL } from '../utils/procurementUtils';

export const PurchaseRequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const filters = useMemo(() => {
    return {
      status: statusFilter !== 'ALL' ? (statusFilter as PurchaseRequestStatus) : undefined,
      priority: priorityFilter !== 'ALL' ? (priorityFilter as PurchaseRequestPriority) : undefined,
    };
  }, [statusFilter, priorityFilter]);

  const { data: allRequests = [], isLoading, isError } = usePurchaseRequests(filters);

  // Client-side text search filter
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return allRequests;
    const q = searchQuery.toLowerCase().trim();
    return allRequests.filter(
      (r) =>
        r.provisionalName.toLowerCase().includes(q) ||
        r.serviceOrderId.toLowerCase().includes(q) ||
        (r.part?.internalCode && r.part.internalCode.toLowerCase().includes(q))
    );
  }, [allRequests, searchQuery]);

  // Page KPI Summaries
  const metrics = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let readyForPickup = 0;
    let urgent = 0;
    let totalPurchasedValue = 0;

    allRequests.forEach((req) => {
      if (req.status === 'REQUESTED') pending++;
      if (req.status === 'IN_PROGRESS') inProgress++;
      if (req.status === 'READY_FOR_PICKUP') readyForPickup++;
      if (req.priority === 'URGENT' || req.priority === 'HIGH') urgent++;

      if (req.unitPrice && req.purchasedQuantity) {
        const p = parseFloat(req.unitPrice);
        const q = parseFloat(req.purchasedQuantity);
        if (!isNaN(p) && !isNaN(q)) {
          totalPurchasedValue += p * q;
        }
      }
    });

    return { pending, inProgress, readyForPickup, urgent, totalPurchasedValue };
  }, [allRequests]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Solicitações de Peças</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gerenciamento e acompanhamento de peças solicitadas pela oficina para compra e estoque.
        </p>
      </div>

      {/* KPI Cards (Resumo da visualização atual) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 block">Solicitações Pendentes</span>
          <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">{metrics.pending}</span>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 block">Em Andamento</span>
          <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{metrics.inProgress}</span>
        </Card>

        <Card className="p-4 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 block">Prontas p/ Retirada</span>
          <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{metrics.readyForPickup}</span>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900">
          <span className="text-xs font-medium text-rose-700 dark:text-rose-300 block">Urgentes / Alta Pri.</span>
          <span className="text-2xl font-bold text-rose-900 dark:text-rose-100">{metrics.urgent}</span>
        </Card>

        <Card className="p-4 bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900 col-span-2 md:col-span-1">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 block">Total em Compras</span>
          <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {formatCurrencyBRL(metrics.totalPurchasedValue)}
          </span>
        </Card>
      </div>

      {/* Filters Bar */}
      <PurchaseRequestFiltersBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main List & Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-lg border">
          Carregando solicitações de peças...
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-xs text-destructive bg-card rounded-lg border">
          Erro ao carregar solicitações de peças da filial ativa.
        </div>
      ) : (
        <>
          <PurchaseRequestTable
            requests={filteredRequests}
            onSelectRequest={(req) => setSelectedRequestId(req.id)}
          />
          <PurchaseRequestMobileList
            requests={filteredRequests}
            onSelectRequest={(req) => setSelectedRequestId(req.id)}
          />
        </>
      )}

      {/* Detail Sheet */}
      <PurchaseRequestDetailSheet
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
      />
    </div>
  );
};

export default PurchaseRequestsPage;
