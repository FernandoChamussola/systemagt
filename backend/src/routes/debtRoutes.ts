import { Router } from 'express';
import {
  createDebt,
  listDebts,
  getDebt,
  updateDebt,
  increaseInterest,
  markAsPaid,
  deleteDebt,
} from '../controllers/debtController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createDebt);
router.get('/', listDebts);
router.get('/:id', getDebt);
router.put('/:id', updateDebt);
router.patch('/:id/increase-interest', increaseInterest);
router.patch('/:id/mark-paid', markAsPaid);
router.delete('/:id', deleteDebt);

export default router;
