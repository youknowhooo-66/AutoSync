import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { NotificationService } from '../services/NotificationService';
import { CreatePartRequestUseCase, ActorContext } from '../useCases/CreatePartRequestUseCase';
import { StartProgressUseCase } from '../useCases/StartProgressUseCase';
import { RegisterPurchaseUseCase } from '../useCases/RegisterPurchaseUseCase';
import { ReceivePartUseCase } from '../useCases/ReceivePartUseCase';
import { InstallPartUseCase } from '../useCases/InstallPartUseCase';
import { CancelPartRequestUseCase } from '../useCases/CancelPartRequestUseCase';
import { ListPartRequestsUseCase } from '../useCases/ListPartRequestsUseCase';
import { GetPartRequestUseCase } from '../useCases/GetPartRequestUseCase';
import { SuggestCodeUseCase } from '../useCases/SuggestCodeUseCase';
import { PrismaPurchaseRequestRepository as PrismaRepo } from '../repositories/PrismaPurchaseRequestRepository';

// The branch comes from authMiddleware, which validates x-branch-id against the
// database (branch ∈ company; non-ADMIN users are pinned to their own branch).
// Never read the raw header here.
function getActiveBranchId(req: Request): string {
  const activeBranchId = req.branchId;

  if (!activeBranchId) {
    throw new AppError('Filial ativa não informada.', 400);
  }

  return activeBranchId;
}

function getActorContext(req: Request): ActorContext {
  const branchId = getActiveBranchId(req);

  return {
    userId: req.user.id,
    companyId: req.user.companyId,
    branchId,
    role: req.user.role,
  };
}

export class ProcurementController {
  async create(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new CreatePartRequestUseCase(repository, notificationService);

    const actor = getActorContext(req);

    const result = await useCase.execute(
      {
        serviceOrderId: req.body.serviceOrderId,
        provisionalName: req.body.provisionalName,
        requestedQuantity: req.body.requestedQuantity,
        mechanicNotes: req.body.mechanicNotes,
        priority: req.body.priority,
        expectedDeliveryAt: req.body.expectedDeliveryAt,
      },
      actor
    );

    return res.status(201).json({ success: true, data: result });
  }

  async list(req: Request, res: Response): Promise<Response> {
    const useCase = new ListPartRequestsUseCase();
    const actor = getActorContext(req);

    const result = await useCase.execute(
      {
        serviceOrderId: req.query.serviceOrderId,
        status: req.query.status,
      },
      actor
    );

    return res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const useCase = new GetPartRequestUseCase();
    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(id, actor);
    return res.status(200).json({ success: true, data: result });
  }

  async suggestCode(req: Request, res: Response): Promise<Response> {
    const useCase = new SuggestCodeUseCase();
    const actor = getActorContext(req);
    const id = req.params.id as string;

    const suggestedCode = await useCase.execute(id, actor);
    return res.status(200).json({ success: true, data: { suggestedCode } });
  }

  async start(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new StartProgressUseCase(repository, notificationService);

    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(id, actor);
    return res.status(200).json({ success: true, data: result });
  }

  async purchase(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new RegisterPurchaseUseCase(repository, notificationService);

    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(
      {
        purchaseRequestId: id,
        definitiveName: req.body.definitiveName || req.body.provisionalName,
        suggestedInternalCode: req.body.suggestedInternalCode,
        brand: req.body.brand,
        purchasedQuantity: req.body.purchasedQuantity,
        unitPrice: req.body.unitPrice,
        supplierId: req.body.supplierId,
        purchaseOrderRef: req.body.purchaseOrderRef,
        expectedDeliveryAt: req.body.expectedDeliveryAt,
        financialNote: req.body.financialNote,
      },
      actor
    );

    return res.status(200).json({ success: true, data: result });
  }

  async receive(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new ReceivePartUseCase(repository, notificationService);

    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(
      {
        purchaseRequestId: id,
        partName: req.body.partName || req.body.definitiveName,
        internalCode: req.body.internalCode,
        brand: req.body.brand,
        receivedQuantity: req.body.receivedQuantity,
        unitPrice: req.body.unitPrice,
      },
      actor
    );

    return res.status(200).json({ success: true, data: result });
  }

  async install(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new InstallPartUseCase(repository, notificationService);

    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(
      {
        purchaseRequestId: id,
        installedQuantity: req.body.installedQuantity,
      },
      actor
    );

    return res.status(200).json({ success: true, data: result });
  }

  async cancel(req: Request, res: Response): Promise<Response> {
    const repository = new PrismaRepo();
    const notificationService = new NotificationService();
    const useCase = new CancelPartRequestUseCase(repository, notificationService);

    const actor = getActorContext(req);
    const id = req.params.id as string;

    const result = await useCase.execute(
      {
        purchaseRequestId: id,
        cancelReason: req.body.cancelReason,
      },
      actor
    );

    return res.status(200).json({ success: true, data: result });
  }
}
