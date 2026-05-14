// apps/api/src/modules/vehicles/routes/vehicles.routes.ts

import { Router } from 'express';
import { createVehicleController, updateVehicleController, deleteVehicleController, listVehicleController } from '../index';

const vehiclesRoutes = Router();

vehiclesRoutes.post('/', (request, response) => {
  return createVehicleController.handle(request, response);
});

vehiclesRoutes.put('/:id', (request, response) => {
  return updateVehicleController.handle(request, response);
});

vehiclesRoutes.delete('/:id', (request, response) => {
  return deleteVehicleController.handle(request, response);
});

vehiclesRoutes.get('/', (request, response) => {
  return listVehicleController.handle(request, response);
});

export { vehiclesRoutes };
