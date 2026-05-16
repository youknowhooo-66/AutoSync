import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../modules/clients/services/ClientService';
import { createClientSchema, updateClientSchema } from '../modules/clients/dtos/ClientDTO';
import { logger } from "../shared/logger";
import { PrismaClient } from "@prisma/client";

// import { createAuditLog } from './AuditController'; // Manter para referência, mas remover por enquanto

const prisma = new PrismaClient();
const clientService = new ClientService(prisma);

export class ClientController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createClientSchema.parse(req.body);
      const client = await clientService.createClient(validatedData);
      // Implementar log de auditoria se necessário
      // if (req.user) {
      //   await createAuditLog(req.user.id, 'CREATE', 'CLIENT', client.id, null, client, req.ip);
      // }
      res.status(201).json(client);
    } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const clients = await clientService.getAllClients(page, limit);
      res.json(clients);
    } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateClientSchema.parse(req.body);
      const client = await clientService.updateClient(id, validatedData);
      // Implementar log de auditoria se necessário
      // if (req.user) {
      //   await createAuditLog(req.user.id, 'UPDATE', 'CLIENT', client.id, oldClient, client, req.ip);
      // }
      res.json(client);
    } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await clientService.deleteClient(id);
      // Implementar log de auditoria se necessário
      // if (req.user) {
      //   await createAuditLog(req.user.id, 'DELETE', 'CLIENT', id, client, null, req.ip);
      // }
      res.status(204).send();
    } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });    }
  }
  }
}

export { PrismaClient } from "@prisma/client";
