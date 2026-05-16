import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { authMiddleware } from '../shared/middlewares/authMiddleware';

const router = Router();
const clientController = new ClientController();

router.use(authMiddleware);

router.post('/', clientController.create);
router.get('/', clientController.index);
router.get('/:id', clientController.show);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

export default router;
