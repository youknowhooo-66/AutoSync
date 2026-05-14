import { PrismaClient, Client } from '@prisma/client';
import { AppError } from '../../../shared/errors/AppError';
import { ClientRepository } from '../repositories/ClientRepository';
import { CreateClientDTO, UpdateClientDTO } from '../dtos/ClientDTO';
import { logger } from '../../../shared/logger';

export class ClientService {
  private clientRepository: ClientRepository;

  constructor(prisma: PrismaClient) {
    this.clientRepository = new ClientRepository(prisma);
  }

  async createClient(data: CreateClientDTO): Promise<Client> {
    logger.info('Attempting to create a new client', { document: data.document });
    const existingClient = await this.clientRepository.findByDocument(data.document);
    if (existingClient) {
      logger.warn('Client with this document already exists', { document: data.document });
      throw new AppError('Client with this document already exists', 409);
    }
    const client = await this.clientRepository.create(data);
    logger.info('Client created successfully', { clientId: client.id });
    return client;
  }

  async getClientById(id: string): Promise<Client | null> {
    logger.debug('Fetching client by ID', { clientId: id });
    return this.clientRepository.findById(id);
  }

  async getAllClients(page: number = 1, limit: number = 10): Promise<Client[]> {
    logger.debug('Fetching all clients', { page, limit });
    return this.clientRepository.findAllPaginated(page, limit);
  }

  async updateClient(id: string, data: UpdateClientDTO): Promise<Client> {
    logger.info('Attempting to update client', { clientId: id, updateData: data });
    const client = await this.clientRepository.findById(id);
    if (!client) {
      logger.warn('Client not found for update', { clientId: id });
      throw new AppError('Client not found', 404);
    }
    if (data.document && data.document !== client.document) {
      const existingClient = await this.clientRepository.findByDocument(data.document);
      if (existingClient && existingClient.id !== id) {
        logger.warn('Another client with this document already exists', { clientId: id, document: data.document });
        throw new AppError('Client with this document already exists', 409);
      }
    }
    const updatedClient = await this.clientRepository.update(id, data);
    logger.info('Client updated successfully', { clientId: updatedClient.id });
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    logger.info('Attempting to delete client', { clientId: id });
    const client = await this.clientRepository.findById(id);
    if (!client) {
      logger.warn('Client not found for deletion', { clientId: id });
      throw new AppError('Client not found', 404);
    }
    await this.clientRepository.delete(id);
    logger.info('Client deleted successfully', { clientId: id });
  }
}
