import { Router } from 'express';
import { createDebtor, listDebtors, getDebtor, updateDebtor, deleteDebtor } from '../controllers/debtorController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createDebtor);
router.get('/', listDebtors);
router.get('/:id', getDebtor);
router.put('/:id', updateDebtor);
router.delete('/:id', deleteDebtor);

export default router;
