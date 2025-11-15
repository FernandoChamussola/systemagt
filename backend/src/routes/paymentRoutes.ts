import { Router } from 'express';
import {
  createPayment,
  listPayments,
  getPayment,
  deletePayment,
} from '../controllers/paymentController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createPayment);
router.get('/', listPayments);
router.get('/:id', getPayment);
router.delete('/:id', deletePayment);

export default router;
