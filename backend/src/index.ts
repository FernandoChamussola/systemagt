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
import { iniciarCronNotificacoes } from './services/notificationCron';
import { iniciarCronStatusDividas } from './services/debtStatusCron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configurado para permitir todas as origens
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
}));

// Body parser com limite aumentado para uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API de Gestão de Devedores' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debtors', debtorRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/collaterals', collateralRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  // Iniciar cron jobs
  iniciarCronNotificacoes();
  iniciarCronStatusDividas();
});
