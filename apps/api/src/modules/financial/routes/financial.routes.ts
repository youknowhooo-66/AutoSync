// apps/api/src/modules/financial/routes/financial.routes.ts

import { Router } from 'express';
import {
  createFinancialController,
  updateFinancialController,
  deleteFinancialController,
  listFinancialController,
} from '../index';

const financialRoutes = Router();

financialRoutes.post('/', (req, res) => createFinancialController.handle(req, res));
financialRoutes.get('/', (req, res) => listFinancialController.handle(req, res));
financialRoutes.put('/:id', (req, res) => updateFinancialController.handle(req, res));
financialRoutes.delete('/:id', (req, res) => deleteFinancialController.handle(req, res));

// Aliases for frontend
financialRoutes.post('/invoices', (req, res) => createFinancialController.handle(req, res));
financialRoutes.get('/invoices', (req, res) => listFinancialController.handle(req, res));
financialRoutes.put('/invoices/:id', (req, res) => updateFinancialController.handle(req, res));
financialRoutes.delete('/invoices/:id', (req, res) => deleteFinancialController.handle(req, res));

export { financialRoutes };
