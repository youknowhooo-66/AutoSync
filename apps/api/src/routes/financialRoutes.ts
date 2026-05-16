import { Router } from 'express';
import { listFinancialRecords, createFinancialRecord, payRecord } from '../controllers/FinancialController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listFinancialRecords as any));
router.post('/', (createFinancialRecord as any));
router.patch('/:id/pay', (payRecord as any));

export default router;
