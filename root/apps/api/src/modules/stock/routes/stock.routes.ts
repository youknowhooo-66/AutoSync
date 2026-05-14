// apps/api/src/modules/stock/routes/stock.routes.ts

import { Router } from 'express';
import { createStockController, updateStockController, deleteStockController, listStockController } from '../index';

const stockRoutes = Router();

stockRoutes.post('/', (request, response) => {
  return createStockController.handle(request, response);
});

stockRoutes.put('/:id', (request, response) => {
  return updateStockController.handle(request, response);
});

stockRoutes.delete('/:id', (request, response) => {
  return deleteStockController.handle(request, response);
});

stockRoutes.get('/', (request, response) => {
  return listStockController.handle(request, response);
});

export { stockRoutes };
