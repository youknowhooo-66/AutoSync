import React from 'react'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-6 p-8 rounded-2xl border border-border bg-card shadow-lg animate-in zoom-in-95 duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground text-sm">
            Você não tem as permissões necessárias para acessar este recurso ou realizar esta ação.
          </p>
        </div>

        <div className="flex gap-3 mt-4 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button variant="default" className="flex-1" onClick={() => logout()}>
            Trocar de Conta
          </Button>
        </div>
      </div>
    </div>
  )
}
