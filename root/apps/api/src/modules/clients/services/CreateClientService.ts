// apps/api/src/modules/clients/services/CreateClientService.ts

import { IClientRepository, Client } from '../repositories/IClientRepository';
import { CreateClientDTO } from '../dtos/CreateClientDTO';
import { AppError } from '../../../shared/errors/AppError';

export class CreateClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute({ companyId, name, email, phone, document, address, city, state, zipCode }: CreateClientDTO): Promise<Client> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const clientExists = await this.clientRepository.findByName(name, companyId);

    if (clientExists) {
      throw new AppError('Client with this name already exists for this company.', 409);
    }

    const client = await this.clientRepository.create({
      companyId,
      name,
      email,
      phone,
      document,
      address,
      city,
      state,
      zipCode,
    });

    return client;
  }
}
