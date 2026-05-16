import React from 'react'

interface Props {
  subtotal: number
  discount: number
  taxes: number
  totalAmount: number
  amountPaid: number
}

export function InvoiceBreakdown({ subtotal, discount, taxes, totalAmount, amountPaid }: Props) {
  const balanceDue = totalAmount - amountPaid

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-background/50 text-sm">
      <div className="flex justify-between items-center text-muted-foreground">
        <span>Subtotal</span>
        <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between items-center text-emerald-500">
          <span>Descontos</span>
          <span className="font-medium">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
        </div>
      )}

      {taxes > 0 && (
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Impostos</span>
          <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxes)}</span>
        </div>
      )}

      <div className="border-t border-border/50 my-1"></div>

      <div className="flex justify-between items-center font-bold text-base">
        <span>Total da Fatura</span>
        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
      </div>

      <div className="flex justify-between items-center text-muted-foreground">
        <span>Total Pago</span>
        <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountPaid)}</span>
      </div>

      <div className="border-t border-border/50 my-1"></div>

      <div className="flex justify-between items-center font-bold text-lg text-primary">
        <span>Saldo Devedor</span>
        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceDue)}</span>
      </div>
    </div>
  )
}
