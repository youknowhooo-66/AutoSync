import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const getOSById = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const os = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
        mechanic: true,
        branch: true,
        parts: { include: { part: true } },
        services: true,
      }
    });
    if (!os) return res.status(404).json({ message: 'OS não encontrada.' });
    res.json(os);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao buscar OS.' });
  }
};

export const listOS = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    const osList = await prisma.serviceOrder.findMany(({
          where: branchId ? { branchId: String(branchId) } : {},
          include: {
            client: true,
            vehicle: true,
            mechanic: true,
            branch: true
          },
          orderBy: { number: 'desc' }
        } as unknown as Parameters<typeof prisma.serviceOrder.findMany>[0]));
    res.json(osList);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar ordens de serviço.' });
  }
};

export const createOS = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, vehicleId, mechanicId, branchId, notes } = req.body;

    if (!clientId || !vehicleId || !branchId) {
      return res.status(400).json({ message: 'Cliente, veículo e filial são obrigatórios.' });
    }

    const os = await prisma.serviceOrder.create(({
          data: {
            clientId,
            vehicleId,
            mechanicId,
            branchId,
            notes,
            status: 'OPEN'
          }
        } as unknown as Parameters<typeof prisma.serviceOrder.create>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'OS', os.id, null, os, req.ip);
    }

    res.status(201).json({ message: 'Ordem de Serviço aberta com sucesso.', os });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao abrir ordem de serviço.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const addItemsToOS = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { parts, services } = req.body;

    const updatedOS = await prisma.$transaction(async (tx) => {
      // Add services
      if (services && services.length > 0) {
        await tx.oSService.createMany({
          data: services.map((s: any) => ({
            serviceOrderId: id,
            name: s.name,
            price: s.price
          }))
        });
      }

      // Add parts and deduct stock
      if (parts && parts.length > 0) {
        for (const p of parts) {
          await tx.oSPart.create({
            data: {
              serviceOrderId: id,
              partId: p.partId,
              quantity: p.quantity,
              unitPrice: p.unitPrice
            }
          });

          // Deduct stock from the branch of the OS
          const os = await tx.serviceOrder.findUnique({ where: { id } });
          if (os) {
            await tx.stock.update({
              where: { partId_branchId: { partId: p.partId, branchId: os.branchId } },
              data: { quantity: { decrement: p.quantity } }
            });

            // Log movement
            await tx.inventoryMovement.create({
              data: {
                partId: p.partId,
                branchId: os.branchId,
                userId: req.user?.id || '',
                type: 'OUT',
                quantity: p.quantity,
                reason: `Uso na OS #${os.number}`
              }
            });
          }
        }
      }

      // Recalculate totals
      const allParts = await tx.oSPart.findMany({ where: { serviceOrderId: id } });
      const allServices = await tx.oSService.findMany({ where: { serviceOrderId: id } });

      const totalParts = allParts.reduce((acc, p) => acc + (Number(p.unitPrice) * p.quantity), 0);
      const totalServices = allServices.reduce((acc, s) => acc + Number(s.price), 0);
      const finalValue = totalParts + totalServices;

      const result = await tx.serviceOrder.update({
        where: { id },
        data: {
          totalParts,
          totalServices,
          finalValue
        },
        include: { parts: true, services: true }
      });

      return result;
    });

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'OS_ITEMS', id, null, { parts, services }, req.ip);
    }

    res.json({ message: 'Itens adicionados com sucesso.', os: updatedOS });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao adicionar itens à OS.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const updateOSStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const { status } = req.body;

    const oldOS = await prisma.serviceOrder.findUnique({ where: { id } });

    const os = await prisma.serviceOrder.update(({
          where: { id },
          data: { status },
          include: { client: true, vehicle: true }
        } as unknown as Parameters<typeof prisma.serviceOrder.update>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE_STATUS', 'OS', id, oldOS?.status, status, req.ip);
    }

    // When OS is finished, auto-create a financial receivable record
    if (status === 'FINISHED' && Number(os.finalValue) > 0) {
      await prisma.financialRecord.create(({
              data: {
                branchId: os.branchId,
                type: 'RECEIVABLE',
                category: 'Ordem de Serviço',
                description: `OS #${os.number} — ${os.client.name} — ${os.vehicle.model}`,
                amount: os.finalValue,
                dueDate: new Date(),
                status: 'PENDING',
              }
            } as unknown as Parameters<typeof prisma.financialRecord.create>[0]));
    }

    res.json({ message: 'Status da OS atualizado com sucesso.', os });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Erro ao atualizar status da OS:', error);
    res.status(500).json({ message: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) || 'Erro ao atualizar status da OS.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const getTopServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.oSService.groupBy({
      by: ['name'],
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    res.json(services.map(s => ({
      name: s.name,
      count: s._count.id,
      totalRevenue: Number(s._sum.price || 0)
    })));
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao buscar serviços mais realizados.' });
  }
};
