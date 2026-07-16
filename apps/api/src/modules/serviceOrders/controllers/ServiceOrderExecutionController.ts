import { Request, Response } from 'express';
import { GetServiceOrderExecutionUseCase } from '../useCases/GetServiceOrderExecutionUseCase';
import { AssignTechnicianToServiceUseCase } from '../useCases/AssignTechnicianToServiceUseCase';
import { StartServiceExecutionUseCase } from '../useCases/StartServiceExecutionUseCase';
import { PauseServiceExecutionUseCase } from '../useCases/PauseServiceExecutionUseCase';
import { ResumeServiceExecutionUseCase } from '../useCases/ResumeServiceExecutionUseCase';
import { CompleteServiceExecutionUseCase } from '../useCases/CompleteServiceExecutionUseCase';

export class ServiceOrderExecutionController {
  async index(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const companyId = req.user.companyId as string;

    const useCase = new GetServiceOrderExecutionUseCase();
    const result = await useCase.execute(serviceOrderId, companyId);
    return res.json({ success: true, data: result });
  }

  async assign(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const serviceId = req.params.serviceId as string;
    const companyId = req.user.companyId as string;
    const assignedById = req.user.id as string;
    const { technicianId } = req.body || {};

    if (!technicianId) {
      return res.status(400).json({ message: 'technicianId é obrigatório' });
    }

    const useCase = new AssignTechnicianToServiceUseCase();
    const result = await useCase.execute(serviceOrderId, serviceId, companyId, technicianId, assignedById);
    return res.json({ success: true, data: result });
  }

  async start(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const serviceId = req.params.serviceId as string;
    const companyId = req.user.companyId as string;
    const startedById = req.user.id as string;
    const userRole = req.user.role as string;

    const useCase = new StartServiceExecutionUseCase();
    const result = await useCase.execute(serviceOrderId, serviceId, companyId, startedById, userRole);
    return res.json({ success: true, data: result });
  }

  async pause(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const serviceId = req.params.serviceId as string;
    const companyId = req.user.companyId as string;
    const pausedById = req.user.id as string;
    const userRole = req.user.role as string;
    const { reason } = req.body || {};

    const useCase = new PauseServiceExecutionUseCase();
    const result = await useCase.execute(serviceOrderId, serviceId, companyId, pausedById, userRole, reason);
    return res.json({ success: true, data: result });
  }

  async resume(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const serviceId = req.params.serviceId as string;
    const companyId = req.user.companyId as string;
    const resumedById = req.user.id as string;
    const userRole = req.user.role as string;

    const useCase = new ResumeServiceExecutionUseCase();
    const result = await useCase.execute(serviceOrderId, serviceId, companyId, resumedById, userRole);
    return res.json({ success: true, data: result });
  }

  async complete(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId as string;
    const serviceId = req.params.serviceId as string;
    const companyId = req.user.companyId as string;
    const completedById = req.user.id as string;
    const userRole = req.user.role as string;
    const { notes } = req.body || {};

    const useCase = new CompleteServiceExecutionUseCase();
    const result = await useCase.execute(serviceOrderId, serviceId, companyId, completedById, userRole, notes);
    return res.json({ success: true, data: result });
  }
}
