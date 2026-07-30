import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import api from '@/services/api';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceDetailSheet } from '../components/InvoiceDetailSheet';
import type { Invoice } from '../types/invoice.types';

export default function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch Invoices List
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const { data } = await api.get('/finance/invoices');
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6 h-full max-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Faturamento</h1>
              <p className="text-muted-foreground mt-1">Gerencie faturas, pagamentos parciais e recebimentos.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-[500px]">
        <InvoiceTable 
          data={invoices} 
          isLoading={isLoading} 
          onRowClick={(inv) => setSelectedInvoice(inv)}
        />
      </div>

      <InvoiceDetailSheet 
        invoice={selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
      />
    </div>
  );
}
