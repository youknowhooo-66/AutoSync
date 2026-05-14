// apps/api/src/modules/clients/routes/clients.routes.ts

import { Router } from 'express';
import {
  createClientController,
  updateClientController,
  deleteClientController,
  listClientController,
} from '../index';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const clientsRoutes = Router();

clientsRoutes.use(authMiddleware);

clientsRoutes.post('/', (req, res) => createClientController.handle(req, res));
clientsRoutes.get('/', (req, res) => listClientController.handle(req, res));
clientsRoutes.put('/:id', (req, res) => updateClientController.handle(req, res));
clientsRoutes.delete('/:id', (req, res) => deleteClientController.handle(req, res));

export { clientsRoutes };
