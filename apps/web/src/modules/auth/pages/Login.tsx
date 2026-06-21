import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CarFront, LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/services/api' // For real login, we use API. For mock, we simulate

export default function Login() {
  const [email, setEmail] = useState('admin@autosync.com')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Fazendo a chamada REAL para a API rodando no Docker
      const response = await api.post('/auth/login', {
        email,
        password
      })
      
      const { user, token } = response.data

      // Adaptando o payload do backend (que usa companyId) para o formato SaaS multi-tenant que montamos
      const session = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.companyId || 'tn_default', // companyId is treated as tenantId
          tenant: {
            id: user.companyId || 'tn_default',
            name: 'AutoSync Workspace',
            plan: 'ENTERPRISE' as const,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          isActive: true,
          createdAt: new Date().toISOString()
        }
      }

      setSession(session)
      toast.success('Login realizado com sucesso!')
      
      navigate(from, { replace: true })
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Email ou senha inválidos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Side (macOS / Premium feel) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 text-zinc-50 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <CarFront className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">AutoSync ERP</span>
        </div>
        
        <div className="relative z-10">
          <blockquote className="space-y-4">
            <p className="text-3xl font-medium tracking-tight leading-tight max-w-lg">
              "A plataforma definitiva para gerenciar a operação e as finanças da sua oficina mecânica em escala."
            </p>
            <footer className="text-zinc-400 text-sm font-medium">AutoSync Team</footer>
          </blockquote>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-muted-foreground text-sm">
              Insira suas credenciais para acessar sua empresa.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Email de acesso</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br" 
                className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">Esqueceu a senha?</a>
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
              />
            </div>

            <Button type="submit" size="lg" className="w-full mt-2 h-11 text-sm shadow-sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ao entrar, você concorda com nossos <a href="#" className="underline hover:text-foreground">Termos de Serviço</a> e <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
