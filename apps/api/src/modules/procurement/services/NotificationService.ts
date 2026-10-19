import { Prisma, Role } from '@prisma/client';
import { prismaClient as defaultPrisma } from '../../../shared/database/prismaClient';

export type CreateNotificationInput = {
  companyId: string;
  recipientId: string;
  type: string;
  title: string;
  message?: string;
  entityType: 'PurchaseRequest' | 'ServiceOrder';
  entityId: string;
};

export class NotificationService {
  constructor(private prisma: typeof defaultPrisma = defaultPrisma) {}

  async notifyUser(input: CreateNotificationInput, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.notification.create({
      data: {
        companyId: input.companyId,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }

  async notifyUsers(inputs: CreateNotificationInput[], tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    if (inputs.length === 0) return;
    return client.notification.createMany({
      data: inputs.map((input) => ({
        companyId: input.companyId,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
      })),
    });
  }

  async notifyRoles(
    companyId: string,
    branchId: string,
    roles: Role[],
    notificationData: Omit<CreateNotificationInput, 'companyId' | 'recipientId'>,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    const users = await client.user.findMany({
      where: {
        companyId,
        branchId,
        active: true,
        role: { in: roles },
      },
      select: { id: true },
    });

    const inputs: CreateNotificationInput[] = users.map((u) => ({
      ...notificationData,
      companyId,
      recipientId: u.id,
    }));

    return this.notifyUsers(inputs, tx);
  }
}
