// apps/api/src/modules/serviceOrders/index.ts

import { PrismaServiceOrderRepository } from './repositories/PrismaServiceOrderRepository';
import { CreateServiceOrderService } from './services/CreateServiceOrderService';
import { UpdateServiceOrderService } from './services/UpdateServiceOrderService';
import { DeleteServiceOrderService } from './services/DeleteServiceOrderService';
import { ListServiceOrderService } from './services/ListServiceOrderService';
import { CreateServiceOrderController } from './controllers/CreateServiceOrderController';
import { UpdateServiceOrderController } from './controllers/UpdateServiceOrderController';
import { DeleteServiceOrderController } from './controllers/DeleteServiceOrderController';
import { ListServiceOrderController } from './controllers/ListServiceOrderController';

// Repositories
const prismaServiceOrderRepository = new PrismaServiceOrderRepository();

// Services
const createServiceOrderService = new CreateServiceOrderService();
const updateServiceOrderService = new UpdateServiceOrderService(prismaServiceOrderRepository);
const deleteServiceOrderService = new DeleteServiceOrderService(prismaServiceOrderRepository);
const listServiceOrderService = new ListServiceOrderService(prismaServiceOrderRepository);

// Controllers
const createServiceOrderController = new CreateServiceOrderController(createServiceOrderService);
const updateServiceOrderController = new UpdateServiceOrderController(updateServiceOrderService);
const deleteServiceOrderController = new DeleteServiceOrderController(deleteServiceOrderService);
const listServiceOrderController = new ListServiceOrderController(listServiceOrderService);

export {
  createServiceOrderController,
  updateServiceOrderController,
  deleteServiceOrderController,
  listServiceOrderController,
};
