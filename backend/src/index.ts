import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import debtorRoutes from './routes/debtorRoutes';
import debtRoutes from './routes/debtRoutes';
import paymentRoutes from './routes/paymentRoutes';
import collateralRoutes from './routes/collateralRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/admin';
import systemNoticeRoutes from './routes/systemNoticeRoutes';
import { iniciarCronNotificacoes } from './services/notificationCron';
import { iniciarCronStatusDividas } from './services/debtStatusCron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS melhorada para resolver problema de preflight
app.use(cors({
  origin: true, // Permite qualquer origem (ou especifique domínios específicos)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // Cache preflight por 24h
}));

// Middleware para tratar OPTIONS globalmente
app.options('*', cors());

app.use(express.json());

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API de Gestão de Devedores' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debtors', debtorRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/collaterals', collateralRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system-notices', systemNoticeRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  // Iniciar cron jobs
  iniciarCronNotificacoes();
  iniciarCronStatusDividas();
});
