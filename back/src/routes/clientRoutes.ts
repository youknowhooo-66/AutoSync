import { Router } from 'express';
import { listClients, createClient, updateClient } from '../controllers/ClientController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);

export default router;
