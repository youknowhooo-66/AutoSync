import { Router } from 'express';
import { listAuditLogs } from '../controllers/AuditController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listAuditLogs);

export default router;
