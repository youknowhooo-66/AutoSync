// apps/api/src/modules/stock/routes/stock.routes.ts

import { Router } from 'express';
import {
  createStockController,
  updateStockController,
  deleteStockController,
  listStockController,
} from '../index';

const stockRoutes = Router();

stockRoutes.post('/', (req, res) => createStockController.handle(req, res));
stockRoutes.get('/', (req, res) => listStockController.handle(req, res));
stockRoutes.put('/:id', (req, res) => updateStockController.handle(req, res));
stockRoutes.delete('/:id', (req, res) => deleteStockController.handle(req, res));

export { stockRoutes };
