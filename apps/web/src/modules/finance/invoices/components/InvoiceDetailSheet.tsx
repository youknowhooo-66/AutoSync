import React, { useState } from 'react'
import { Printer, CreditCard, Send, Plus, X, CheckCircle2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { INVOICE_STATUS_CONFIG, InvoiceStatusBadge } from './InvoiceStatusBadge'
import { InvoiceBreakdown } from './InvoiceBreakdown'
import type { Invoice, InvoiceStatus } from '../types/invoice.types'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { toast } from 'sonner'

interface Props {
  invoice: Invoice | null
  onClose: () => void
}

export function InvoiceDetailSheet({ invoice, onClose }: Props) {
  const queryClient = useQueryClient()
  const [showAddPayment, setShowAddPayment] = useState(false)
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')

  const { data: invoiceDetail, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoice?.id],
    queryFn: async () => (await api.get(`/finance/invoices/${invoice?.id}`)).data,
    enabled: !!invoice?.id,
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => api.patch(`/finance/invoices/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Status atualizado para ${INVOICE_STATUS_CONFIG[variables.status]?.label}`)
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', variables.id] })
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const addPaymentMutation = useMutation({
    mutationFn: async (payload: any) => api.post(`/finance/invoices/${invoice?.id}/payments`, payload),
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoice?.id] })
      setShowAddPayment(false)
      setPaymentAmount('')
    },
    onError: () => toast.error('Erro ao registrar pagamento.'),
  })

  const handleDownloadPDF = async () => {
    if (!invoice) return
    try {
      const response = await api.get(`/finance/invoices/${invoice.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Fatura_${invoice.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Erro ao baixar PDF.')
    }
  }

  const handleAddPayment = () => {
    if (!paymentAmount) return
    addPaymentMutation.mutate({
      amount: Number(paymentAmount),
      method: paymentMethod,
    })
  }

  if (!invoice) return null

  const data = invoiceDetail || invoice

  return (
    <Sheet open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[600px] sm:max-w-2xl sm:w-full overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl p-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-border/50 p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                {data.invoiceNumber}
                <InvoiceStatusBadge status={data.status} />
              </SheetTitle>
              <SheetDescription className="mt-1">
                Emissão: {new Date(data.createdAt).toLocaleDateString('pt-BR')}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Printer className="w-4 h-4 mr-2" />
                Recibo
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {(Object.keys(INVOICE_STATUS_CONFIG) as InvoiceStatus[]).map((key) => {
              const config = INVOICE_STATUS_CONFIG[key]
              const isActive = data.status === key
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  disabled={isActive || updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ id: data.id, status: key })}
                  className={`h-7 px-3 text-xs rounded-full transition-all duration-200 ${
                    isActive ? config.className.replace('hover:', '') : 'hover:bg-muted opacity-60 hover:opacity-100'
                  }`}
                >
                  {config.icon}
                  {config.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-8 animate-in fade-in duration-300">
          {isLoading && !invoiceDetail ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando detalhes...</div>
          ) : (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
                  <span className="font-semibold">{data.client.name}</span>
                  <span className="text-sm text-muted-foreground">{data.client.email || data.client.document}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Veículo (OS)</span>
                  <span className="font-semibold">{data.vehicle.model} - {data.vehicle.plate}</span>
                  <span className="text-sm text-muted-foreground font-mono">Ref OS: {data.serviceOrderId}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Resumo Financeiro
                </h3>
                <InvoiceBreakdown 
                  subtotal={data.subtotal}
                  discount={data.discount}
                  taxes={data.taxes}
                  totalAmount={data.totalAmount}
                  amountPaid={data.amountPaid}
                />
              </div>

              {/* Payments */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-muted-foreground" />
                    Pagamentos
                  </h3>
                  {data.status !== 'PAID' && data.status !== 'CANCELED' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setShowAddPayment(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Registrar Pagamento
                    </Button>
                  )}
                </div>

                {showAddPayment && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2">
                    <select 
                      value={paymentMethod} 
                      onChange={e => setPaymentMethod(e.target.value)} 
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CARD">Cartão (Crédito/Débito)</option>
                      <option value="CASH">Dinheiro</option>
                      <option value="TRANSFER">Transferência</option>
                    </select>
                    <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Valor R$" className="w-32 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                    <Button size="sm" className="h-8" onClick={handleAddPayment} disabled={addPaymentMutation.isPending}><CheckCircle2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => setShowAddPayment(false)}><X className="w-4 h-4" /></Button>
                  </div>
                )}

                <div className="border border-border/50 rounded-xl overflow-hidden bg-background">
                  {!invoiceDetail?.payments || invoiceDetail.payments.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">Nenhum pagamento registrado.</div>
                  ) : (
                    <div className="flex flex-col">
                      {invoiceDetail.payments.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 text-sm border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-medium">{p.method}</span>
                            <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                          <span className="font-semibold text-emerald-500">+ R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
