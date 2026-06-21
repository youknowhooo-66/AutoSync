// apps/api/src/modules/clients/index.ts

import { PrismaClientRepository } from './repositories/PrismaClientRepository';
import { CreateClientService } from './services/CreateClientService';
import { UpdateClientService } from './services/UpdateClientService';
import { DeleteClientService } from './services/DeleteClientService';
import { ListClientService } from './services/ListClientService';
import { CreateClientController } from './controllers/CreateClientController';
import { UpdateClientController } from './controllers/UpdateClientController';
import { DeleteClientController } from './controllers/DeleteClientController';
import { ListClientController } from './controllers/ListClientController';
import { PrismaClient } from "@prisma/client";

// Repositories
const prismaClientRepository = new PrismaClientRepository();

// Services
const createClientService = new CreateClientService(prismaClientRepository);
const updateClientService = new UpdateClientService(prismaClientRepository);
const deleteClientService = new DeleteClientService(prismaClientRepository);
const listClientService = new ListClientService(prismaClientRepository);

// Controllers
const createClientController = new CreateClientController(createClientService);
const updateClientController = new UpdateClientController(updateClientService);
const deleteClientController = new DeleteClientController(deleteClientService);
const listClientController = new ListClientController(listClientService);

export {
  createClientController,
  updateClientController,
  deleteClientController,
  listClientController,
};
