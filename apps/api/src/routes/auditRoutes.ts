import { Router } from 'express';
import { listAuditLogs } from '../controllers/AuditController';
import { rbacMiddleware } from '../modules/auth/middleware/rbacMiddleware';
import { Permission } from '../modules/auth/rbac/permissions';

const router = Router();

router.get('/', rbacMiddleware(Permission.AUDIT_VIEW), (listAuditLogs as any));

export default router;
