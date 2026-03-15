import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { processarNotificacoesAutomaticas, processarNotificacoesRetry } from '../services/notificationCron';

const prisma = new PrismaClient();

// Executar cron de notificações automáticas
export async function executarCronNotificacoes(req: AuthRequest, res: Response) {
  try {
    console.log(`🔧 [ADMIN] Execução manual do cron de notificações solicitada pelo admin ${req.userId}`);

    // Executar em background para não bloquear a resposta
    processarNotificacoesAutomaticas().catch(err => {
      console.error('Erro na execução manual do cron:', err);
    });

    res.json({
      message: 'Cron de notificações iniciado com sucesso',
      executadoPor: req.userId,
      iniciadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao iniciar cron de notificações:', error);
    res.status(500).json({ error: 'Erro ao iniciar cron de notificações' });
  }
}

// Executar cron de retry de notificações
export async function executarCronRetry(req: AuthRequest, res: Response) {
  try {
    console.log(`🔧 [ADMIN] Execução manual do cron de retry solicitada pelo admin ${req.userId}`);

    // Executar em background
    processarNotificacoesRetry().catch(err => {
      console.error('Erro na execução manual do cron de retry:', err);
    });

    res.json({
      message: 'Cron de retry iniciado com sucesso',
      executadoPor: req.userId,
      iniciadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao iniciar cron de retry:', error);
    res.status(500).json({ error: 'Erro ao iniciar cron de retry' });
  }
}

// Obter status dos crons e estatísticas
export async function getCronStatus(req: AuthRequest, res: Response) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Buscar estatísticas de notificações de hoje
    const [
      notificacoesHoje,
      aguardandoRetry,
      falhasHoje,
      enviadasHoje,
    ] = await Promise.all([
      prisma.notification.count({
        where: {
          criadoEm: { gte: hoje },
        },
      }),
      prisma.notification.count({
        where: {
          status: 'AGUARDANDO_RETRY',
        },
      }),
      prisma.notification.count({
        where: {
          status: 'FALHOU',
          atualizadoEm: { gte: hoje },
        },
      }),
      prisma.notification.count({
        where: {
          status: 'ENVIADO',
          enviadoEm: { gte: hoje },
        },
      }),
    ]);

    // Buscar notificações aguardando retry com detalhes
    const notificacoesAguardandoRetry = await prisma.notification.findMany({
      where: {
        status: 'AGUARDANDO_RETRY',
      },
      include: {
        devedor: {
          select: { nome: true },
        },
        usuario: {
          select: { nome: true, email: true },
        },
      },
      orderBy: {
        proximaTentativa: 'asc',
      },
      take: 20,
    });

    // Buscar últimas falhas
    const ultimasFalhas = await prisma.notification.findMany({
      where: {
        status: 'FALHOU',
      },
      include: {
        devedor: {
          select: { nome: true },
        },
        usuario: {
          select: { nome: true, email: true },
        },
      },
      orderBy: {
        atualizadoEm: 'desc',
      },
      take: 10,
    });

    // Buscar dívidas com notificação automática ativa
    const dividasComNotificacaoAuto = await prisma.debt.count({
      where: {
        ativo: true,
        notificacaoAuto: true,
        status: { not: 'PAGO' },
      },
    });

    res.json({
      crons: [
        {
          nome: 'Notificações Automáticas',
          descricao: 'Envia notificações de cobrança para dívidas com notificação automática ativada',
          horarioAgendado: '09:00 (Africa/Maputo)',
          endpoint: 'notificacoes',
        },
        {
          nome: 'Retry de Notificações',
          descricao: 'Tenta reenviar notificações que falharam anteriormente',
          horarioAgendado: 'A cada 10 minutos',
          endpoint: 'retry',
        },
      ],
      estatisticas: {
        notificacoesHoje,
        enviadasHoje,
        aguardandoRetry,
        falhasHoje,
        dividasComNotificacaoAuto,
      },
      notificacoesAguardandoRetry: notificacoesAguardandoRetry.map(n => ({
        id: n.id,
        devedor: n.devedor?.nome || 'N/A',
        usuario: n.usuario?.nome || 'N/A',
        tentativas: n.tentativas,
        proximaTentativa: n.proximaTentativa,
        erro: n.erroMensagem,
      })),
      ultimasFalhas: ultimasFalhas.map(n => ({
        id: n.id,
        devedor: n.devedor?.nome || 'N/A',
        usuario: n.usuario?.nome || 'N/A',
        tentativas: n.tentativas,
        erro: n.erroMensagem,
        atualizadoEm: n.atualizadoEm,
      })),
    });
  } catch (error) {
    console.error('Erro ao obter status dos crons:', error);
    res.status(500).json({ error: 'Erro ao obter status dos crons' });
  }
}

// Forçar retry de uma notificação específica
export async function forcarRetryNotificacao(req: AuthRequest, res: Response) {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Resetar para retry imediato
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'AGUARDANDO_RETRY',
        proximaTentativa: new Date(),
        tentativas: Math.max(0, notification.tentativas - 3), // Dar mais 3 tentativas
      },
    });

    res.json({
      message: 'Notificação agendada para retry imediato',
      notificationId,
    });
  } catch (error) {
    console.error('Erro ao forçar retry:', error);
    res.status(500).json({ error: 'Erro ao forçar retry' });
  }
}

// Limpar notificações antigas com falha
export async function limparNotificacoesFalhas(req: AuthRequest, res: Response) {
  try {
    const diasAtras = parseInt(req.query.dias as string) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);

    const resultado = await prisma.notification.deleteMany({
      where: {
        status: 'FALHOU',
        atualizadoEm: { lt: dataLimite },
      },
    });

    res.json({
      message: `${resultado.count} notificações com falha removidas`,
      diasAtras,
      removidas: resultado.count,
    });
  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    res.status(500).json({ error: 'Erro ao limpar notificações' });
  }
}
