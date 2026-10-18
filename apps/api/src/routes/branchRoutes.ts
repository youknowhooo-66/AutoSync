import { Router } from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/BranchController';
import { rbacMiddleware } from '../modules/auth/middleware/rbacMiddleware';
import { Permission } from '../modules/auth/rbac/permissions';

const router = Router();

// Every screen with a branch selector reads this list, so it stays open to any signed-in user.
router.get('/', (listBranches as any));
router.post('/', rbacMiddleware(Permission.COMPANY_SETTINGS), (createBranch as any));
router.put('/:id', rbacMiddleware(Permission.COMPANY_SETTINGS), (updateBranch as any));

export default router;
