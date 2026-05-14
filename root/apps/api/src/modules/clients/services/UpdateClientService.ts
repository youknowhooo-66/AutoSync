// apps/api/src/modules/clients/services/UpdateClientService.ts

import { IClientRepository, Client } from '../repositories/IClientRepository';
import { UpdateClientDTO } from '../dtos/UpdateClientDTO';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute({ id, companyId, name, email, phone, document, address, city, state, zipCode }: UpdateClientDTO): Promise<Client> {
    if (!id || !companyId) {
      throw new AppError('Client ID and Company ID are required.');
    }

    const client = await this.clientRepository.findById(id, companyId);

    if (!client) {
      throw new AppError('Client not found.', 404);
    }

    if (name && name !== client.name) {
      const clientExists = await this.clientRepository.findByName(name, companyId);
      if (clientExists && clientExists.id !== id) {
        throw new AppError('Client with this name already exists for this company.', 409);
      }
    }

    const updatedClient = await this.clientRepository.update({
      id,
      companyId,
      name: name || client.name,
      email: email || client.email,
      phone: phone || client.phone,
      document: document || client.document,
      address: address || client.address,
      city: city || client.city,
      state: state || client.state,
      zipCode: zipCode || client.zipCode,
    });

    return updatedClient;
  }
}
