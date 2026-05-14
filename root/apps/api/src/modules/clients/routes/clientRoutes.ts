import { Router } from 'express';
import { CreateClientController } from '../controllers/CreateClientController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const clientRoutes = Router();

const createClientController = new CreateClientController();

clientRoutes.use(authMiddleware);

clientRoutes.post('/', createClientController.handle.bind(createClientController));

export { clientRoutes };
