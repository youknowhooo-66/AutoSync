import { Router } from 'express';
import { listAuditLogs } from '../controllers/AuditController';
const router = Router();

router.get('/', (listAuditLogs as any));

export default router;
