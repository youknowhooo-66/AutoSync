// apps/api/src/modules/clients/routes/clients.routes.ts

import { Router } from 'express';
import {
  createClientController,
  updateClientController,
  deleteClientController,
  listClientController,
} from '../index';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const clientsRoutes = Router();

clientsRoutes.post('/', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => createClientController.handle(req, res));
clientsRoutes.get('/', rbacMiddleware(Permission.CUSTOMER_VIEW), (req, res) => listClientController.handle(req, res));
clientsRoutes.put('/:id', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => updateClientController.handle(req, res));
clientsRoutes.delete('/:id', rbacMiddleware(Permission.CUSTOMER_MANAGE), (req, res) => deleteClientController.handle(req, res));

export { clientsRoutes };
