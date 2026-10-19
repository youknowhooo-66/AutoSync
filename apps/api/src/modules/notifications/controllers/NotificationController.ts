import { Request, Response } from 'express';
import { prismaClient as prisma } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';

export class NotificationController {
  async list(req: Request, res: Response): Promise<Response> {
    const companyId = req.user.companyId;
    const recipientId = req.user.id;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where: any = { companyId, recipientId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { companyId, recipientId, readAt: null },
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  }

  async markAsRead(req: Request, res: Response): Promise<Response> {
    const companyId = req.user.companyId;
    const recipientId = req.user.id;
    const id = req.params.id as string;

    const notification = await prisma.notification.findFirst({
      where: { id, companyId, recipientId },
    });

    if (!notification) {
      throw new AppError('Notificação não encontrada ou não pertence ao usuário.', 404);
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });

    return res.status(200).json({ success: true, data: updated });
  }

  async markAllAsRead(req: Request, res: Response): Promise<Response> {
    const companyId = req.user.companyId;
    const recipientId = req.user.id;

    await prisma.notification.updateMany({
      where: { companyId, recipientId, readAt: null },
      data: { readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'Todas as notificações foram marcadas como lidas.' });
  }
}
