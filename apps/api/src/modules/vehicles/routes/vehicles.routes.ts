// apps/api/src/modules/vehicles/routes/vehicles.routes.ts

import { Router } from 'express';
import {
  createVehicleController,
  updateVehicleController,
  deleteVehicleController,
  listVehicleController,
} from '../index';

const vehiclesRoutes = Router();

vehiclesRoutes.post('/', (req, res) => createVehicleController.handle(req, res));
vehiclesRoutes.get('/', (req, res) => listVehicleController.handle(req, res));
vehiclesRoutes.put('/:id', (req, res) => updateVehicleController.handle(req, res));
vehiclesRoutes.delete('/:id', (req, res) => deleteVehicleController.handle(req, res));

export { vehiclesRoutes };
