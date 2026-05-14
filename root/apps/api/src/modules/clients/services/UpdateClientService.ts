// apps/api/src/modules/clients/services/UpdateClientService.ts

import { IClientRepository, Client } from '../repositories/IClientRepository';
import { UpdateClientDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute(data: UpdateClientDTO): Promise<Client> {
    const { id, companyId } = data;

    const clientExists = await this.clientRepository.findById(id, companyId);

    if (!clientExists) {
      throw new AppError('Client not found.', 404);
    }

    const client = await this.clientRepository.update(data);

    return client;
  }
}
