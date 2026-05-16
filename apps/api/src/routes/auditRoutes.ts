import { Router } from 'express';
import { listAuditLogs } from '../controllers/AuditController';
import { authMiddleware } from '../shared/middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (listAuditLogs as any));

export default router;
