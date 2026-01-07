import { Router } from 'express';
import {
  getSystemStats,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  resetUserPassword,
  getAllDebts,
  updateDebt,
  deleteDebt,
  getAllDebtors,
} from '../controllers/admin';
import { authMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/adminAuth';

const router = Router();

// Todas as rotas requerem autenticação E role de admin
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/stats', getSystemStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.patch('/users/:userId/status', toggleUserStatus);
router.post('/users/:userId/reset-password', resetUserPassword);

// Debt Management
router.get('/debts', getAllDebts);
router.put('/debts/:debtId', updateDebt);
router.delete('/debts/:debtId', deleteDebt);

// Debtor Management
router.get('/debtors', getAllDebtors);

export default router;