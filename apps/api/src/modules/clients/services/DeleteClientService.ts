// apps/api/src/modules/clients/services/DeleteClientService.ts

import { IClientRepository } from '../repositories/IClientRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteClientService {
  constructor(private clientRepository: IClientRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const clientExists = await this.clientRepository.findById(id, companyId);

    if (!clientExists) {
      throw new AppError('Client not found.', 404);
    }

    await this.clientRepository.delete(id, companyId);
  }
}
