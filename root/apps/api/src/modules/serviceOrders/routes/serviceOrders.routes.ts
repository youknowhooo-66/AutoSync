// apps/api/src/modules/serviceOrders/routes/serviceOrders.routes.ts

import { Router } from 'express';
import {
  createServiceOrderController,
  updateServiceOrderController,
  deleteServiceOrderController,
  listServiceOrderController,
} from '../index';

const serviceOrdersRoutes = Router();

serviceOrdersRoutes.post('/', (req, res) => createServiceOrderController.handle(req, res));
serviceOrdersRoutes.get('/', (req, res) => listServiceOrderController.handle(req, res));
serviceOrdersRoutes.put('/:id', (req, res) => updateServiceOrderController.handle(req, res));
serviceOrdersRoutes.delete('/:id', (req, res) => deleteServiceOrderController.handle(req, res));

export { serviceOrdersRoutes };
