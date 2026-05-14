import { PrismaClient, Client } from '@prisma/client';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';

export class ClientRepository extends BaseRepository<Client> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'client');
  }

  async findByDocument(document: string): Promise<Client | null> {
    return this.model.findUnique({ where: { document } });
  }

  async findAllPaginated(page: number, limit: number): Promise<Client[]> {
    return this.model.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
