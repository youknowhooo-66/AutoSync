import { Request, Response } from 'express';
import { RequestApprovalUseCase } from '../useCases/RequestApprovalUseCase';
import { ApproveServiceOrderUseCase } from '../useCases/ApproveServiceOrderUseCase';
import { RejectServiceOrderUseCase } from '../useCases/RejectServiceOrderUseCase';
import { InvalidateApprovalUseCase } from '../useCases/InvalidateApprovalUseCase';
import { rejectApprovalSchema, invalidateApprovalSchema } from '../validators/approvalSchemas';
import { prismaClient } from '../../../shared/database/prismaClient';

export class ServiceOrderApprovalController {
  async show(req: Request, res: Response) {
    const id = req.params.id as string;
    const companyId = req.user.companyId as string;

    const approval = await prismaClient.serviceOrderApproval.findFirst({
      where: { serviceOrderId: id, companyId },
      orderBy: { version: 'desc' }
    });

    return res.json({ success: true, data: approval });
  }

  async request(req: Request, res: Response) {
    const id = req.params.id as string;
    const companyId = req.user.companyId as string;
    const userId = req.user.id as string;

    const useCase = new RequestApprovalUseCase();
    const approval = await useCase.execute(id, companyId, userId);

    return res.json({ success: true, data: approval });
  }

  async approve(req: Request, res: Response) {
    const id = req.params.id as string;
    const companyId = req.user.companyId as string;
    const userId = req.user.id as string;
    const { approvalId } = req.body;

    if (!approvalId) {
      return res.status(400).json({ message: 'approvalId é obrigatório' });
    }

    const useCase = new ApproveServiceOrderUseCase();
    const approval = await useCase.execute(approvalId, id, companyId, userId);

    return res.json({ success: true, data: approval });
  }

  async reject(req: Request, res: Response) {
    const id = req.params.id as string;
    const companyId = req.user.companyId as string;
    const userId = req.user.id as string;
    const { approvalId, reason } = req.body;

    if (!approvalId) {
      return res.status(400).json({ message: 'approvalId é obrigatório' });
    }

    rejectApprovalSchema.parse({ reason });

    const useCase = new RejectServiceOrderUseCase();
    const approval = await useCase.execute(approvalId, id, companyId, userId, reason);

    return res.json({ success: true, data: approval });
  }

  async invalidate(req: Request, res: Response) {
    const id = req.params.id as string;
    const companyId = req.user.companyId as string;
    const userId = req.user.id as string;
    const { approvalId, reason } = req.body;

    if (!approvalId) {
      return res.status(400).json({ message: 'approvalId é obrigatório' });
    }

    invalidateApprovalSchema.parse({ reason });

    const useCase = new InvalidateApprovalUseCase();
    const approval = await useCase.execute(approvalId, id, companyId, userId, reason);

    return res.json({ success: true, data: approval });
  }
}
