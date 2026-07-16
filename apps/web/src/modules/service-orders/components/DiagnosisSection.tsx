import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterDiagnosis } from '../hooks/useDiagnosis';
import { Button } from '@/components/ui/button';
import { ClipboardList, Edit, Save, AlertCircle } from 'lucide-react';
import { RoleGuard } from '@/modules/auth/components/RoleGuard';

const schema = z.object({
  description: z.string().min(5, 'O diagnóstico deve ter pelo menos 5 caracteres').max(1000, 'O diagnóstico é muito longo'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  serviceOrderId: string;
  notes: string | null;
  status: string;
}

export function DiagnosisSection({ serviceOrderId, notes, status }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const registerMutation = useRegisterDiagnosis(serviceOrderId);

  // Parse notes
  const delimiter = '[DIAGNÓSTICO TÉCNICO]';
  const parts = notes ? notes.split(delimiter) : [];
  const openingNotes = parts[0]?.trim() || '';
  const currentDiagnosis = parts[1]?.trim() || '';

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: currentDiagnosis,
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data.description, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const isEditable = status === 'OPEN' || status === 'IN_PROGRESS';

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Diagnóstico Técnico
        </h3>
        {isEditable && !isEditing && (
          <RoleGuard action="os.edit">
            <Button
              id="edit-diagnosis-btn"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary"
              onClick={() => {
                reset({ description: currentDiagnosis });
                setIsEditing(true);
              }}
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              {currentDiagnosis ? 'Editar' : 'Registrar'}
            </Button>
          </RoleGuard>
        )}
      </div>

      {openingNotes && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg flex flex-col gap-1 border border-border/20">
          <span className="font-semibold uppercase tracking-wider text-[9px] text-muted-foreground/75">Observações de Abertura (Reclamação do Cliente)</span>
          <p className="whitespace-pre-wrap">{openingNotes}</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1.5">
            <textarea
              id="diagnosis-description-input"
              placeholder="Descreva a avaliação técnica detalhada do veículo..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none dark:bg-input/30"
              {...register('description')}
            />
            {errors.description && (
              <span className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.description.message}
              </span>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              id="cancel-diagnosis-btn"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              id="save-diagnosis-btn"
              type="submit"
              size="sm"
              disabled={registerMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Diagnóstico
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-sm">
          {currentDiagnosis ? (
            <div className="p-4 rounded-lg bg-background border border-border/50 whitespace-pre-wrap text-card-foreground">
              {currentDiagnosis}
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs block text-center py-2">
              Nenhum diagnóstico técnico registrado ainda.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
