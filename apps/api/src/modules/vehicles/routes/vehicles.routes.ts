// apps/api/src/modules/vehicles/routes/vehicles.routes.ts

import { Router } from 'express';
import {
  createVehicleController,
  updateVehicleController,
  deleteVehicleController,
  listVehicleController,
} from '../index';

import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const vehiclesRoutes = Router();

vehiclesRoutes.post('/', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => createVehicleController.handle(req, res));
vehiclesRoutes.get('/', rbacMiddleware(Permission.CUSTOMER_VIEW), (req, res) => listVehicleController.handle(req, res));
vehiclesRoutes.put('/:id', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => updateVehicleController.handle(req, res));
vehiclesRoutes.delete('/:id', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => deleteVehicleController.handle(req, res));

export { vehiclesRoutes };
