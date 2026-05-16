// apps/api/src/modules/users/routes/users.routes.ts

import { Router } from 'express';
import {
  createUserController,
  updateUserController,
  deleteUserController,
  listUserController,
} from '../index';

const usersRoutes = Router();

usersRoutes.post('/', (req, res) => createUserController.handle(req, res));
usersRoutes.get('/', (req, res) => listUserController.handle(req, res));
usersRoutes.put('/:id', (req, res) => updateUserController.handle(req, res));
usersRoutes.delete('/:id', (req, res) => deleteUserController.handle(req, res));

export { usersRoutes };
