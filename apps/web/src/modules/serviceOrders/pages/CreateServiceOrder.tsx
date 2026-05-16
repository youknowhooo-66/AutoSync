import React, { useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowRight, ArrowLeft, Save, Car, User, Settings, Package } from 'lucide-react';
import { useClients } from '../../clients/hooks/useClients';
import { useVehicles } from '../../vehicles/hooks/useVehicles';
import { useStock } from '../../stock/hooks/useStock';
import { useCreateServiceOrder } from '../hooks/useServiceOrders';
import { useNavigate } from 'react-router-dom';

const osSchema = z.object({
  clientId: z.string().uuid('Selecione um cliente'),
  vehicleId: z.string().uuid('Selecione um veículo'),
  notes: z.string().optional(),
  services: z.array(z.object({
    name: z.string().min(1, 'Nome do serviço é obrigatório'),
    price: z.coerce.number().min(0),
  })).min(1, 'Adicione pelo menos um serviço'),
  parts: z.array(z.object({
    partId: z.string().uuid('Selecione uma peça'),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
  })).optional(),
});

type OSFormData = z.infer<typeof osSchema>;

export default function CreateServiceOrder() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const { mutateAsync: createOS, isPending } = useCreateServiceOrder();

  // Data Fetching
  const { data: clientsData } = useClients(1, 100);
  const { data: stockData } = useStock(1, 100);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OSFormData>({
    resolver: zodResolver(osSchema),
    defaultValues: {
      services: [{ name: '', price: 0 }],
      parts: [],
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: 'services',
  });

  const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({
    control,
    name: 'parts',
  });

  // Watch for totals
  const watchedServices = useWatch({ control, name: 'services' });
  const watchedParts = useWatch({ control, name: 'parts' });
  const selectedClientId = watch('clientId');

  // Filter vehicles by selected client
  const { data: vehiclesData } = useVehicles(1, 50, selectedClientId);

  const totals = useMemo(() => {
    const servicesTotal = watchedServices?.reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
    const partsTotal = watchedParts?.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)), 0) || 0;
    return {
      services: servicesTotal,
      parts: partsTotal,
      final: servicesTotal + partsTotal,
    };
  }, [watchedServices, watchedParts]);

  const onSubmit = async (data: OSFormData) => {
    try {
      await createOS({
        ...data,
        branchId: '00000000-0000-0000-0000-000000000000', // Example branch
        parts: data.parts || [],
      });
      navigate('/service-orders');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar Ordem de Serviço');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nova Ordem de Serviço</h1>
          <p className="text-slate-500 text-lg">Preencha os detalhes para iniciar um novo trabalho.</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-2 w-12 rounded-full transition-all ${
                step >= s ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Client & Vehicle */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-indigo-600 mb-2">
                <User size={24} />
                <h2 className="text-xl font-bold text-slate-900">Cliente & Veículo</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cliente</label>
                <select 
                  {...register('clientId')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientsData?.data.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.clientId && <p className="text-xs text-red-500 font-medium">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Veículo</label>
                <select 
                  {...register('vehicleId')}
                  disabled={!selectedClientId}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Selecione o veículo...</option>
                  {vehiclesData?.data.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-xs text-red-500 font-medium">{errors.vehicleId.message}</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-indigo-600 mb-2">
                <FileText size={24} />
                <h2 className="text-xl font-bold text-slate-900">Observações</h2>
              </div>
              <textarea 
                {...register('notes')}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                placeholder="Detalhes sobre o problema relatado pelo cliente..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Services & Labor */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-indigo-600">
                <Settings size={24} />
                <h2 className="text-xl font-bold text-slate-900">Mão de Obra e Serviços</h2>
              </div>
              <button 
                type="button"
                onClick={() => appendService({ name: '', price: 0 })}
                className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar Serviço
              </button>
            </div>

            <div className="space-y-4">
              {serviceFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input 
                      {...register(`services.${index}.name`)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Descrição do serviço"
                    />
                  </div>
                  <div className="w-40">
                    <input 
                      {...register(`services.${index}.price`)}
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {errors.services && <p className="text-xs text-red-500 font-medium">{errors.services.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Parts & Review */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 text-indigo-600">
                <Package size={24} />
                <h2 className="text-xl font-bold text-slate-900">Peças do Estoque</h2>
              </div>
              <button 
                type="button"
                onClick={() => appendPart({ partId: '', quantity: 1, unitPrice: 0 })}
                className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar Peça
              </button>
            </div>

            <div className="space-y-4">
              {partFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <select 
                      {...register(`parts.${index}.partId`)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white transition-all"
                    >
                      <option value="">Selecione a peça...</option>
                      {stockData?.data.map((p: any) => (
                        <option key={p.id} value={p.partId}>{p.part.name} (Qtd: {p.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input 
                      {...register(`parts.${index}.quantity`)}
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white transition-all"
                      placeholder="Qtd"
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      {...register(`parts.${index}.unitPrice`)}
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white transition-all"
                      placeholder="R$ Unid"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removePart(index)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Serviços</span>
                  <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.services)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Peças</span>
                  <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.parts)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-2">
                  <span>Total Final</span>
                  <span className="text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.final)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-0"
          >
            <ArrowLeft size={20} /> Anterior
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              Próximo <ArrowRight size={20} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : <><Save size={20} /> Finalizar e Abrir OS</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
