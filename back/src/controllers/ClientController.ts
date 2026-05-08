import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';

export const listClients = async (req: AuthRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: { vehicles: true },
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar clientes.' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const { name, document, phone, whatsapp, address, email } = req.body;

    if (!name || !document) {
      return res.status(400).json({ message: 'Nome e CPF/CNPJ são obrigatórios.' });
    }

    const client = await prisma.client.create({
      data: { name, document, phone, whatsapp, address, email }
    });

    if (req.user) {
      await createAuditLog(
        req.user.id,
        'CREATE',
        'CLIENT',
        client.id,
        null,
        client,
        req.ip
      );
    }

    res.status(201).json({ message: 'Cliente cadastrado com sucesso.', client });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este documento já está cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar cliente.' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const oldClient = await prisma.client.findUnique({ where: { id } });

    const client = await prisma.client.update({
      where: { id },
      data
    });

    if (req.user) {
      await createAuditLog(
        req.user.id,
        'UPDATE',
        'CLIENT',
        client.id,
        oldClient,
        client,
        req.ip
      );
    }

    res.json({ message: 'Cliente atualizado com sucesso.', client });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar cliente.' });
  }
};
