import { Router } from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/BranchController';

const router = Router();

router.get('/', (listBranches as any));
router.post('/', (createBranch as any));
router.put('/:id', (updateBranch as any));

export default router;
