// apps/api/src/modules/serviceOrders/routes/serviceOrders.routes.ts

import { Router } from 'express';
import { createServiceOrderController, updateServiceOrderController, deleteServiceOrderController, listServiceOrderController } from '../index';

const serviceOrdersRoutes = Router();

serviceOrdersRoutes.post('/', (request, response) => {
  return createServiceOrderController.handle(request, response);
});

serviceOrdersRoutes.put('/:id', (request, response) => {
  return updateServiceOrderController.handle(request, response);
});

serviceOrdersRoutes.delete('/:id', (request, response) => {
  return deleteServiceOrderController.handle(request, response);
});

serviceOrdersRoutes.get('/', (request, response) => {
  return listServiceOrderController.handle(request, response);
});

export { serviceOrdersRoutes };
