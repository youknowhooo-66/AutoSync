import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

interface IRequest {
  serviceOrderId: string;
  companyId: string;
  description: string;
}

export class RegisterDiagnosisUseCase {
  async execute({ serviceOrderId, companyId, description }: IRequest) {
    if (!description || description.trim() === '') {
      throw new AppError('Description is required.', 400);
    }

    return await prismaClient.$transaction(async (tx) => {
      // 1. Fetch Service Order
      const os = await tx.serviceOrder.findFirst({
        where: {
          id: serviceOrderId,
          companyId,
        },
      });

      if (!os) {
        throw new AppError('Service Order not found.', 404);
      }

      // 2. Validate status: must be OPEN or IN_PROGRESS
      if (os.status !== 'OPEN' && os.status !== 'IN_PROGRESS') {
        throw new AppError('Service Order status does not allow diagnosis.', 400);
      }

      // 3. Construct updated notes, preserving opening notes
      let openingNotes = os.notes || '';
      const diagIndex = openingNotes.indexOf('[DIAGNÓSTICO TÉCNICO]');
      if (diagIndex !== -1) {
        openingNotes = openingNotes.substring(0, diagIndex).trim();
      }

      const updatedNotes = openingNotes
        ? `${openingNotes}\n\n[DIAGNÓSTICO TÉCNICO]\n${description}`
        : `[DIAGNÓSTICO TÉCNICO]\n${description}`;

      // 4. Update status (OPEN -> IN_PROGRESS)
      const nextStatus = os.status === 'OPEN' ? 'IN_PROGRESS' : os.status;

      const updatedOS = await tx.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          notes: updatedNotes,
          status: nextStatus,
        },
      });

      return {
        serviceOrderId: updatedOS.id,
        description,
        status: updatedOS.status,
        updatedAt: updatedOS.updatedAt,
      };
    });
  }
}
