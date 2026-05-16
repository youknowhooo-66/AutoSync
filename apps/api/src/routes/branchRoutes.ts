import { Router } from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/BranchController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listBranches as any));
router.post('/', (createBranch as any));
router.put('/:id', (updateBranch as any));

export default router;
