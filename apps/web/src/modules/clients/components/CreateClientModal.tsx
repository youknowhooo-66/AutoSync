import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreateClient, useUpdateClient } from '../hooks/useClients';
import type { Client } from '../types';
import { toast } from 'sonner';

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').or(z.literal('')),
  phone: z.string().optional().nullable().transform(v => v || ''),
  document: z.string().optional().nullable().transform(v => v || ''),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient?: Client | null;
}

export function CreateClientModal({ isOpen, onClose, editingClient }: CreateClientModalProps) {
  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient();
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient();

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editingClient?.name || '',
        email: editingClient?.email || '',
        phone: editingClient?.phone || '',
        document: editingClient?.document || '',
      });
    }
  }, [isOpen, editingClient, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient({ id: editingClient.id, payload: data });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient(data);
        toast.success('Cliente cadastrado com sucesso!');
      }
      reset();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Nome Completo</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Ex: João Silva"
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">E-mail</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="exemplo@email.com"
            />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Telefone</label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Documento (CPF/CNPJ)</label>
              <input
                {...register('document')}
                className="w-full px-4 py-2 bg-background text-foreground placeholder:text-muted-foreground rounded-lg border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
