import { Router } from 'express';
import {
  listNoticesForUser,
  countUnreadNotices,
  markNoticeAsRead,
  markAllNoticesAsRead,
} from '../controllers/systemNoticeController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar avisos para o usuário
router.get('/', listNoticesForUser);

// Contar avisos não lidos
router.get('/unread-count', countUnreadNotices);

// Marcar um aviso como lido
router.post('/:id/read', markNoticeAsRead);

// Marcar todos os avisos como lidos
router.post('/read-all', markAllNoticesAsRead);

export default router;
