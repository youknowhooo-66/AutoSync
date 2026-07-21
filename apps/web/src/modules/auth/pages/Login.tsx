import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CarFront, LogIn, Loader2, ShieldCheck, Wrench, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/primitives';
import { APP_INFO } from '@/config/appInfo';
import api from '@/services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, token } = response.data;

      if (!user.companyId) {
        throw new Error('Empresa do usuário não configurada no cadastro. Acesso negado.');
      }

      const session = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.companyId,
          tenant: {
            id: user.companyId,
            name: user.companyName || 'AutoSync Workspace',
            plan: 'ENTERPRISE' as const,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      };

      setSession(session);
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Email ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background selection:bg-primary/20">
      {/* Visual Side (Automotive ERP Branding) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 p-12 text-slate-50 relative overflow-hidden border-r border-border/40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-sky-500/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <CarFront className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">{APP_INFO.name}</span>
            <span className="text-xs text-slate-400 font-medium">{APP_INFO.tagline}</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Gestão Operacional de Alta Precisão</span>
          </div>

          <blockquote className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight leading-snug">
              "Gestão inteligente para oficinas modernas."
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Rastreabilidade completa de ordens de serviço, controle rigoroso de estoque e governança financeira em tempo real.
            </p>
          </blockquote>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Multi-filiais e RBAC</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-sky-400" />
              <span>Gestão Completa de OS</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          AutoSync ERP v{APP_INFO.version} • Todos os direitos reservados.
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[420px] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Acessar Conta</h1>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Insira suas credenciais corporativas para entrar no AutoSync ERP.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <FormField label="Email corporativo" htmlFor="login-email" required>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@oficina.com.br"
                className="h-11 text-xs"
              />
            </FormField>

            <FormField label="Senha de acesso" htmlFor="login-password" required>
              <Input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 text-xs"
              />
            </FormField>

            <Button type="submit" size="lg" className="w-full mt-2 h-11 text-xs font-semibold uppercase tracking-wider shadow-sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Ambiente seguro com suporte a multitenancy e controle de filiais.
          </p>
        </div>
      </div>
    </div>
  );
}
