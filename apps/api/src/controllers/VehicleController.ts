import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import { logger } from "../shared/logger";

export const listVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany(({
          include: { client: true },
          orderBy: { model: 'asc' }
        } as unknown as Parameters<typeof prisma.vehicle.findMany>[0]));
    res.json(vehicles);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar veículos.' });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { plate, model, brand, year, chassis, mileage, engine, clientId } = req.body;

    if (!plate || !model || !brand || !year || !clientId) {
      return res.status(400).json({ message: 'Placa, modelo, marca, ano e cliente são obrigatórios.' });
    }

    const vehicle = await prisma.vehicle.create(({
          data: {
            plate, model, brand, year: parseInt(year), chassis, mileage: parseInt(mileage), engine, clientId
          }
        } as unknown as Parameters<typeof prisma.vehicle.create>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'CREATE', 'VEHICLE', vehicle.id, null, vehicle, req.ip);
    }

    res.status(201).json({ message: 'Veículo cadastrado com sucesso.', vehicle });
  } catch (error: unknown) {
  if (error instanceof Error) {
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Esta placa já está cadastrada.' });
    }
    res.status(500).json({ message: 'Erro ao criar veículo.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;
    const data = req.body;

    const oldVehicle = await prisma.vehicle.findUnique({ where: { id } });

    const vehicle = await prisma.vehicle.update(({
          where: { id },
          data: {
            ...data,
            year: data.year ? parseInt(data.year) : undefined,
            mileage: data.mileage ? parseInt(data.mileage) : undefined,
          }
        } as unknown as Parameters<typeof prisma.vehicle.update>[0]));

    if (req.user) {
      await createAuditLog(req.user.id, 'UPDATE', 'VEHICLE', id, oldVehicle, vehicle, req.ip);
    }

    res.json({ message: 'Veículo atualizado com sucesso.', vehicle });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao atualizar veículo.' });
  }
};
