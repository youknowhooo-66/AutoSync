import { Router } from 'express';
import { login } from '../controllers/AuthController';

const router = Router();

router.post('/login', (login as any));

export default router;
