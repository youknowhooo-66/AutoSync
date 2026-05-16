import { Router } from 'express';
import { listUsers, createUser, updateUser } from '../controllers/UserController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listUsers as any));
router.post('/', (createUser as any));
router.put('/:id', (updateUser as any));

export default router;
