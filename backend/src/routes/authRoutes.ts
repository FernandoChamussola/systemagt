import { Router } from 'express';
import {
  register,
  login,
  me,
  logout,
  requestPasswordReset,
  verifyResetCode,
  resetPassword
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

// Password recovery routes (public - no auth required)
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
