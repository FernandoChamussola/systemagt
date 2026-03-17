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
  getAccessLogs,
  getEmailStatus,
  sendEmailToUsers,
  sendEmailToAllUsers,
} from '../controllers/admin';
import {
  executarCronNotificacoes,
  executarCronRetry,
  getCronStatus,
  forcarRetryNotificacao,
  limparNotificacoesFalhas,
} from '../controllers/cronController';
import {
  listAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/systemNoticeController';
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

// System Notices Management
router.get('/notices', listAllNotices);
router.post('/notices', createNotice);
router.put('/notices/:id', updateNotice);
router.delete('/notices/:id', deleteNotice);

// Access Logs
router.get('/access-logs', getAccessLogs);

// Cron Management
router.get('/crons/status', getCronStatus);
router.post('/crons/notificacoes', executarCronNotificacoes);
router.post('/crons/retry', executarCronRetry);
router.post('/crons/retry/:notificationId', forcarRetryNotificacao);
router.delete('/crons/falhas', limparNotificacoesFalhas);

// Email Management
router.get('/email/status', getEmailStatus);
router.post('/email/send', sendEmailToUsers);
router.post('/email/send-all', sendEmailToAllUsers);

export default router;