// apps/api/src/modules/clients/services/ListClientService.ts

import { IClientRepository, Client } from '../repositories/IClientRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute(companyId: string): Promise<Client[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const clients = await this.clientRepository.findManyByCompany(companyId);

    return clients;
  }
}
