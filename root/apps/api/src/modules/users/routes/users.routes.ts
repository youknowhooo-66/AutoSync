// apps/api/src/modules/users/routes/users.routes.ts

import { Router } from 'express';
import { createUserController, updateUserController, deleteUserController, listUserController } from '../index';

const usersRoutes = Router();

usersRoutes.post('/', (request, response) => {
  return createUserController.handle(request, response);
});

usersRoutes.put('/:id', (request, response) => {
  return updateUserController.handle(request, response);
});

usersRoutes.delete('/:id', (request, response) => {
  return deleteUserController.handle(request, response);
});

usersRoutes.get('/', (request, response) => {
  return listUserController.handle(request, response);
});

export { usersRoutes };
