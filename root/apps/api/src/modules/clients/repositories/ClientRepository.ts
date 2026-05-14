import { prismaClient } from '../../../shared/database/prismaClient';
import { CreateClientDTO } from '../dtos/CreateClientDTO';

class ClientRepository {
  async findByDocument(companyId: string, document: string) {
    return prismaClient.client.findUnique({
      where: {
        companyId_document: {
          companyId,
          document,
        },
      },
    });
  }

  async create(companyId: string, data: CreateClientDTO) {
    return prismaClient.client.create({
      data: {
        ...data,
        companyId,
      },
    });
  }
}

export { ClientRepository };
