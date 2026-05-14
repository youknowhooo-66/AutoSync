// apps/api/src/modules/stock/index.ts

import { PrismaStockRepository } from './repositories/PrismaStockRepository';

import { CreateStockService } from './services/CreateStockService';
import { UpdateStockService } from './services/UpdateStockService';
import { DeleteStockService } from './services/DeleteStockService';
import { ListStockService } from './services/ListStockService';

import { CreateStockController } from './controllers/CreateStockController';
import { UpdateStockController } from './controllers/UpdateStockController';
import { DeleteStockController } from './controllers/DeleteStockController';
import { ListStockController } from './controllers/ListStockController';

// Repositories
const prismaStockRepository = new PrismaStockRepository();

// Services
const createStockService = new CreateStockService(prismaStockRepository);
const updateStockService = new UpdateStockService(prismaStockRepository);
const deleteStockService = new DeleteStockService(prismaStockRepository);
const listStockService = new ListStockService(prismaStockRepository);

// Controllers
const createStockController = new CreateStockController(createStockService);
const updateStockController = new UpdateStockController(updateStockService);
const deleteStockController = new DeleteStockController(deleteStockService);
const listStockController = new ListStockController(listStockService);

export {
  createStockController,
  updateStockController,
  deleteStockController,
  listStockController,
};
