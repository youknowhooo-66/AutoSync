import React, { useState } from 'react'
import { Printer, PackageSearch, PenTool, Plus, X, CheckCircle2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATUS_CONFIG, ServiceOrderStatusBadge } from './ServiceOrderStatusBadge'
import { ServiceOrderTimeline } from './ServiceOrderTimeline'
import type { ServiceOrder, ServiceOrderStatus } from '../types/serviceOrder.types'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { toast } from 'sonner'
import { RoleGuard } from '@/modules/auth/components/RoleGuard'
import { DiagnosisSection } from './DiagnosisSection'
import { ServiceOrderItemsSection } from './ServiceOrderItemsSection'
import { ServiceOrderApprovalSection } from './ServiceOrderApprovalSection'
import { ServiceOrderExecutionSection } from './ServiceOrderExecutionSection'
import { ServiceOrderStockConsumptionSection } from './ServiceOrderStockConsumptionSection'
import { ServiceOrderCompletionSection } from './ServiceOrderCompletionSection'
import { ServiceOrderFinanceSection } from './ServiceOrderFinanceSection'

interface Props {
  os: ServiceOrder | null
  onClose: () => void
}

export function ServiceOrderDetailSheet({ os, onClose }: Props) {
  const queryClient = useQueryClient()
  const [showAddPart, setShowAddPart] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  
  // Add part state
  const [itemPartId, setItemPartId] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  
  // Add service state
  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')

  const { data: osDetail, isLoading } = useQuery({
    queryKey: ['os-detail', os?.id],
    queryFn: async () => (await api.get(`/os/${os?.id}`)).data,
    enabled: !!os?.id,
  })

  const { data: parts = [] } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/inventory/parts')).data,
    enabled: showAddPart,
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceOrderStatus }) => api.patch(`/os/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Status atualizado para ${STATUS_CONFIG[variables.status]?.label}`)
      queryClient.invalidateQueries({ queryKey: ['os-list'] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', variables.id] })
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const addItemMutation = useMutation({
    mutationFn: async (payload: any) => api.post(`/os/${os?.id}/items`, payload),
    onSuccess: () => {
      toast.success('Item adicionado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['os-list'] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', os?.id] })
      setShowAddPart(false)
      setShowAddService(false)
      setItemPartId(''); setItemQty('1'); setItemPrice(''); setSvcName(''); setSvcPrice('')
    },
    onError: () => toast.error('Erro ao adicionar item.'),
  })

  const handleDownloadPDF = async () => {
    if (!os) return
    try {
      const response = await api.get(`/os/${os.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `OS_${os.number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Erro ao baixar PDF.')
    }
  }

  const handleAddPart = () => {
    if (!itemPartId) return
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    addItemMutation.mutate({
      parts: [{ partId: itemPartId, quantity: Number(itemQty), unitPrice: Number(itemPrice) }],
      services: [],
      userId: user.id
    })
  }

  const handleAddService = () => {
    if (!svcName) return
    addItemMutation.mutate({
      parts: [],
      services: [{ name: svcName, price: Number(svcPrice) }]
    })
  }

  if (!os) return null

  // Mock timeline events for now, since the API might not return them exactly
  const mockTimeline = [
    { id: '1', osId: os.id, type: 'STATUS_CHANGE' as const, description: 'OS Aberta', createdAt: os.createdAt, createdBy: { name: 'Sistema' } }
  ]

  return (
    <Sheet open={!!os} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[600px] sm:max-w-2xl sm:w-full overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl p-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl border-b border-border/50 p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                OS #{String(os.number).padStart(4, '0')}
                <ServiceOrderStatusBadge status={os.status} />
              </SheetTitle>
              <SheetDescription className="mt-1">
                Abertura: {new Date(os.createdAt).toLocaleDateString('pt-BR')}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Printer className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {(Object.keys(STATUS_CONFIG) as ServiceOrderStatus[]).map((key) => {
              const config = STATUS_CONFIG[key]
              const isActive = os.status === key
              return (
                <RoleGuard key={key} action="os.change_status" fallback={isActive ? (
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className={`h-7 px-3 text-xs rounded-full transition-all duration-200 ${config.className.replace('hover:', '')}`}
                  >
                    {config.icon}
                    {config.label}
                  </Button>
                ) : null}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    disabled={isActive || updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ id: os.id, status: key })}
                    className={`h-7 px-3 text-xs rounded-full transition-all duration-200 ${
                      isActive ? config.className.replace('hover:', '') : 'hover:bg-muted opacity-60 hover:opacity-100'
                    }`}
                  >
                    {config.icon}
                    {config.label}
                  </Button>
                </RoleGuard>
              )
            })}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-8 animate-in fade-in duration-300">
          {isLoading || !osDetail ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando detalhes...</div>
          ) : (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
                  <span className="font-semibold">{osDetail.client.name}</span>
                  <span className="text-sm text-muted-foreground">{osDetail.client.document}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/50 bg-background/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Veículo</span>
                  <span className="font-semibold">{osDetail.vehicle.model}</span>
                  <span className="text-sm text-muted-foreground font-mono">{osDetail.vehicle.plate}</span>
                </div>
              </div>

              {/* Diagnosis Section */}
              <DiagnosisSection
                serviceOrderId={osDetail.id}
                notes={osDetail.notes}
                status={osDetail.status}
              />

              <ServiceOrderItemsSection serviceOrder={osDetail} />

              <ServiceOrderApprovalSection serviceOrder={osDetail} />

              <ServiceOrderExecutionSection serviceOrderId={osDetail.id} />

              <ServiceOrderStockConsumptionSection serviceOrderId={osDetail.id} />

              <ServiceOrderCompletionSection
                serviceOrderId={osDetail.id}
                status={osDetail.status}
                finishedAt={osDetail.finishedAt}
                finishedBy={osDetail.finishedBy}
                completionNotes={osDetail.completionNotes}
              />

              <ServiceOrderFinanceSection
                serviceOrderId={osDetail.id}
                status={osDetail.status}
                finishedAt={osDetail.finishedAt}
              />

              {/* Total Summary */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                <span className="font-medium uppercase tracking-wider text-sm">Valor Total Estimado</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {Number(osDetail.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Timeline */}
              <div className="mt-4 border-t border-border/50 pt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Linha do Tempo (Histórico)</h3>
                <ServiceOrderTimeline events={mockTimeline} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
