// apps/api/src/modules/clients/routes/clients.routes.ts

import { Router } from 'express';
import { createClientController, updateClientController, deleteClientController, listClientController } from '../index'; // Import controllers from the factory

const clientsRoutes = Router();

clientsRoutes.post('/', (request, response) => {
  return createClientController.handle(request, response);
});

clientsRoutes.put('/:id', (request, response) => {
  return updateClientController.handle(request, response);
});

clientsRoutes.delete('/:id', (request, response) => {
  return deleteClientController.handle(request, response);
});

clientsRoutes.get('/', (request, response) => {
  return listClientController.handle(request, response);
});

export { clientsRoutes };
