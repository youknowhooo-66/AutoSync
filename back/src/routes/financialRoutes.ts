import { Router } from 'express';
import { listFinancialRecords, createFinancialRecord, payRecord } from '../controllers/FinancialController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listFinancialRecords);
router.post('/', createFinancialRecord);
router.patch('/:id/pay', payRecord);

export default router;
