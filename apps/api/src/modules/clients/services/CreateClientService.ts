// apps/api/src/modules/clients/services/CreateClientService.ts

import { IClientRepository, Client } from '../repositories/IClientRepository';
import { CreateClientDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute(data: CreateClientDTO): Promise<Client> {
    const { companyId, name } = data;

    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const clientExists = await this.clientRepository.findByName(name, companyId);

    if (clientExists) {
      throw new AppError('Client with this name already exists for this company.', 409);
    }

    const client = await this.clientRepository.create(data);

    return client;
  }
}
