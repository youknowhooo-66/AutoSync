// apps/api/src/modules/vehicles/index.ts

import { PrismaVehicleRepository } from './repositories/PrismaVehicleRepository';

import { CreateVehicleService } from './services/CreateVehicleService';
import { UpdateVehicleService } from './services/UpdateVehicleService';
import { DeleteVehicleService } from './services/DeleteVehicleService';
import { ListVehicleService } from './services/ListVehicleService';

import { CreateVehicleController } from './controllers/CreateVehicleController';
import { UpdateVehicleController } from './controllers/UpdateVehicleController';
import { DeleteVehicleController } from './controllers/DeleteVehicleController';
import { ListVehicleController } from './controllers/ListVehicleController';

// Repositories
const prismaVehicleRepository = new PrismaVehicleRepository();

// Services
const createVehicleService = new CreateVehicleService(prismaVehicleRepository);
const updateVehicleService = new UpdateVehicleService(prismaVehicleRepository);
const deleteVehicleService = new DeleteVehicleService(prismaVehicleRepository);
const listVehicleService = new ListVehicleService(prismaVehicleRepository);

// Controllers
const createVehicleController = new CreateVehicleController(createVehicleService);
const updateVehicleController = new UpdateVehicleController(updateVehicleService);
const deleteVehicleController = new DeleteVehicleController(deleteVehicleService);
const listVehicleController = new ListVehicleController(listVehicleService);

export {
  createVehicleController,
  updateVehicleController,
  deleteVehicleController,
  listVehicleController,
};
