import { Router } from 'express';
import {
  listNotifications,
  sendManualNotification,
  deleteNotification,
} from '../controllers/notificationController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.post('/send-manual/:debtId', sendManualNotification);
router.delete('/:id', deleteNotification);

export default router;
