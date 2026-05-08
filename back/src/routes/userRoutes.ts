import { Router } from 'express';
import { listUsers, createUser, updateUser } from '../controllers/UserController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

export default router;
