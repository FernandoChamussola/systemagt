import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  gerarRelatorioDividas,
  gerarRelatorioPagamentos,
  gerarRelatorioDevedores,
  gerarRelatorioCompleto,
} from '../controllers/reportController';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de relatórios
router.get('/dividas', gerarRelatorioDividas);
router.get('/pagamentos', gerarRelatorioPagamentos);
router.get('/devedores', gerarRelatorioDevedores);
router.get('/completo', gerarRelatorioCompleto);

export default router;
