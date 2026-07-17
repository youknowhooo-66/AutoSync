import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreateVehicle, useUpdateVehicle } from '../hooks/useVehicles';
import { useClients } from '../../clients/hooks/useClients';
import type { Vehicle } from '../types';
import { toast } from 'sonner';

const vehicleSchema = z.object({
  plate: z.string().min(7, 'Placa deve ter no mínimo 7 caracteres'),
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional().nullable().transform(v => v || ''),
  clientId: z.string().uuid('Selecione um cliente'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVehicle?: Vehicle | null;
}

export function CreateVehicleModal({ isOpen, onClose, editingVehicle }: CreateVehicleModalProps) {
  const { mutateAsync: createVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutateAsync: updateVehicle, isPending: isUpdating } = useUpdateVehicle();
  const { data: clientsData } = useClients(1, 100); // Fetch first 100 clients for select

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        plate: editingVehicle?.plate || '',
        brand: editingVehicle?.brand || '',
        model: editingVehicle?.model || '',
        year: editingVehicle?.year || new Date().getFullYear(),
        color: editingVehicle?.color || '',
        clientId: editingVehicle?.clientId || '',
      });
    }
  }, [isOpen, editingVehicle, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (editingVehicle) {
        await updateVehicle({ id: editingVehicle.id, payload: data });
        toast.success('Veículo atualizado com sucesso!');
      } else {
        await createVehicle(data);
        toast.success('Veículo cadastrado com sucesso!');
      }
      reset();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao salvar veículo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Placa</label>
              <input
                {...register('plate')}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase font-mono transition-all"
                placeholder="ABC1234"
              />
              {errors.plate && <p className="text-xs text-red-500 font-medium">{errors.plate.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Ano</label>
              <input
                {...register('year')}
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="2024"
              />
              {errors.year && <p className="text-xs text-red-500 font-medium">{errors.year.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Marca</label>
              <input
                {...register('brand')}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ex: Toyota"
              />
              {errors.brand && <p className="text-xs text-red-500 font-medium">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Modelo</label>
              <input
                {...register('model')}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ex: Corolla"
              />
              {errors.model && <p className="text-xs text-red-500 font-medium">{errors.model.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Cor</label>
            <input
              {...register('color')}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ex: Preto"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Proprietário (Cliente)</label>
            <select
              {...register('clientId')}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition-all"
            >
              <option value="">Selecione um cliente...</option>
              {clientsData?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-red-500 font-medium">{errors.clientId.message}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
