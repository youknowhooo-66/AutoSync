// apps/api/src/modules/users/routes/users.routes.ts

import { Router } from 'express';
import {
  createUserController,
  updateUserController,
  deleteUserController,
  listUserController,
} from '../index';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const usersRoutes = Router();

// The list feeds the technician pickers on service orders, so it follows SO access.
usersRoutes.get('/', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), (req, res) => listUserController.handle(req, res));
usersRoutes.post('/', rbacMiddleware(Permission.USER_MANAGE), (req, res) => createUserController.handle(req, res));
usersRoutes.put('/:id', rbacMiddleware(Permission.USER_MANAGE), (req, res) => updateUserController.handle(req, res));
usersRoutes.delete('/:id', rbacMiddleware(Permission.USER_MANAGE), (req, res) => deleteUserController.handle(req, res));

export { usersRoutes };
