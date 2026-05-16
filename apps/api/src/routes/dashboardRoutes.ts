import { Router } from 'express';
import { getDashboardStats } from '../controllers/DashboardController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (getDashboardStats as any));

export default router;
