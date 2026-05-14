import { Router } from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/BranchController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);

export default router;
