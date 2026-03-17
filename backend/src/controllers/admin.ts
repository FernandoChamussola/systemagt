import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

interface ExecuteCodeRequest {
  code: string;
  operation: 'query' | 'mutation' | 'raw';
}

/**
 * Super Admin Code Executor
 * ATENÇÃO: Esta função bypassa todas as verificações de segurança
 * Deve ser usada APENAS por super admins para resolver problemas críticos
 */
export const executeSuperAdminCode = async (req: Request, res: Response) => {
  try {
    const { code, operation } = req.body as ExecuteCodeRequest;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código não fornecido'
      });
    }

    // Log da operação para auditoria
    console.log('=== SUPER ADMIN OPERATION ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IP:', req.ip);
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Operation:', operation);
    console.log('Code:', code);
    console.log('============================');

    let result;
    const startTime = Date.now();

    switch (operation) {
      case 'query':
        // Executa queries de leitura
        result = await executeCode(code, 'query');
        break;

      case 'mutation':
        // Executa operações de escrita
        result = await executeCode(code, 'mutation');
        break;

      case 'raw':
        // Executa SQL raw direto no banco
        result = await prisma.$queryRawUnsafe(code);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Operação inválida. Use: query, mutation ou raw'
        });
    }

    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: result,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Super Admin Execution Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Executa código Prisma dinamicamente
 */
async function executeCode(code: string, type: 'query' | 'mutation') {
  // Cria um contexto seguro com acesso ao Prisma
  const context = {
    prisma,
    // Helpers úteis
    now: new Date(),
    uuid: () => crypto.randomUUID(),
  };

  try {
    // Cria uma função assíncrona a partir do código fornecido
    const asyncFunction = new Function(
      'prisma',
      'now',
      'uuid',
      `
      return (async () => {
        ${code}
      })();
      `
    );

    // Executa a função com o contexto
    const result = await asyncFunction(
      context.prisma,
      context.now,
      context.uuid
    );

    return result;
  } catch (error: any) {
    throw new Error(`Erro ao executar código: ${error.message}`);
  }
}

/**
 * Exemplos de uso via requisição POST:
 * 
 * 1. Query - Buscar todos os usuários:
 * {
 *   "operation": "query",
 *   "code": "return await prisma.user.findMany();"
 * }
 * 
 * 2. Query - Buscar usuário específico:
 * {
 *   "operation": "query",
 *   "code": "return await prisma.user.findUnique({ where: { email: 'user@example.com' } });"
 * }
 * 
 * 3. Mutation - Atualizar status de dívida:
 * {
 *   "operation": "mutation",
 *   "code": "return await prisma.debt.update({ where: { id: 'debt-id-aqui' }, data: { status: 'PAGO' } });"
 * }
 * 
 * 4. Mutation - Corrigir valor de dívida:
 * {
 *   "operation": "mutation",
 *   "code": "return await prisma.debt.updateMany({ where: { status: 'PENDENTE' }, data: { valorAtual: 0 } });"
 * }
 * 
 * 5. Raw SQL - Query customizada:
 * {
 *   "operation": "raw",
 *   "code": "SELECT * FROM users WHERE email LIKE '%@example.com' LIMIT 10;"
 * }
 * 
 * 6. Raw SQL - Update complexo:
 * {
 *   "operation": "raw",
 *   "code": "UPDATE debts SET valor_atual = valor_inicial * 1.1 WHERE status = 'ATRASADO';"
 * }
 * 
 * 7. Operação complexa com múltiplas queries:
 * {
 *   "operation": "mutation",
 *   "code": "const debtor = await prisma.debtor.findFirst({ where: { telefone: '123456789' } }); if (debtor) { return await prisma.debt.updateMany({ where: { devedorId: debtor.id }, data: { ativo: false } }); }"
 * }
 */

/**
 * IMPORTANTE: Adicione esta rota com proteção de super admin:
 *
 * router.post('/super-admin/execute',
 *   authenticateSuperAdmin,  // Middleware que verifica se é super admin
 *   executeSuperAdminCode
 * );
 */

// ============================================
// FUNÇÕES DE ADMIN NORMAL (GESTÃO DO SISTEMA)
// ============================================

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  enviarMensagemAdmin,
  enviarEmail,
  isEmailConfigured,
  testarConexaoEmail,
} from '../services/emailService';

/**
 * Dashboard Admin - Estatísticas do sistema
 */
export async function getSystemStats(req: AuthRequest, res: Response) {
  try {
    // Total de usuários
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });

    // Total de dívidas e valores
    const totalDebts = await prisma.debt.count();
    const debtsStats = await prisma.debt.aggregate({
      _sum: { valorInicial: true, valorAtual: true },
      _count: true,
    });

    // Dívidas por status
    const debtsByStatus = await prisma.debt.groupBy({
      by: ['status'],
      _count: true,
    });

    // Notificações (taxa de sucesso)
    const notifications = await prisma.notification.groupBy({
      by: ['status'],
      _count: true,
    });

    // Crescimento (últimos 12 meses)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userGrowth = await prisma.user.groupBy({
      by: ['criadoEm'],
      _count: true,
      where: { criadoEm: { gte: twelveMonthsAgo } },
    });

    res.json({
      users: { total: totalUsers, active: activeUsers },
      debts: {
        total: totalDebts,
        totalLent: debtsStats._sum.valorInicial || 0,
        totalReceivable: debtsStats._sum.valorAtual || 0,
        byStatus: debtsByStatus,
      },
      notifications: {
        total: notifications.reduce((sum, n) => sum + n._count, 0),
        byStatus: notifications,
      },
      growth: userGrowth,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}

/**
 * Listar todos os usuários
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          role: true,
          isActive: true,
          criadoEm: true,
          _count: {
            select: {
              dividas: true,
              devedores: true,
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
}

/**
 * Detalhes de um usuário específico
 */
export async function getUserDetails(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        isActive: true,
        criadoEm: true,
        dividas: {
          select: {
            id: true,
            valorInicial: true,
            valorAtual: true,
            status: true,
            dataVencimento: true,
            devedor: { select: { nome: true } },
          },
        },
        devedores: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            _count: { select: { dividas: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Calcular estatísticas
    const stats = {
      totalDebts: user.dividas.length,
      totalLent: user.dividas.reduce((sum, d) => sum + d.valorInicial, 0),
      totalReceivable: user.dividas.reduce((sum, d) => sum + d.valorAtual, 0),
      overdue: user.dividas.filter(d => d.status === 'ATRASADO').length,
    };

    res.json({ user, stats });
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
  }
}

/**
 * Ativar/Desativar usuário
 */
export async function toggleUserStatus(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, nome: true, email: true, isActive: true },
    });

    res.json({ message: 'Status atualizado', user });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
}

/**
 * Resetar senha de usuário
 */
export async function resetUserPassword(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { novaSenha } = req.body;

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { senha: senhaHash },
    });

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
}

/**
 * Listar todas as dívidas do sistema
 */
export async function getAllDebts(req: AuthRequest, res: Response) {
  try {
    const { page = 1, limit = 50, status, userId } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (userId) {
      where.usuarioId = userId;
    }

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          usuario: { select: { nome: true, email: true } },
          devedor: { select: { nome: true, telefone: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.debt.count({ where }),
    ]);

    res.json({ debts, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Erro ao listar dívidas:', error);
    res.status(500).json({ error: 'Erro ao listar dívidas' });
  }
}

/**
 * Atualizar dívida
 */
export async function updateDebt(req: AuthRequest, res: Response) {
  try {
    const { debtId } = req.params;
    const data = req.body;

    const debt = await prisma.debt.update({
      where: { id: debtId },
      data,
    });

    res.json({ message: 'Dívida atualizada', debt });
  } catch (error) {
    console.error('Erro ao atualizar dívida:', error);
    res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
}

/**
 * Deletar dívida
 */
export async function deleteDebt(req: AuthRequest, res: Response) {
  try {
    const { debtId } = req.params;

    await prisma.debt.delete({
      where: { id: debtId },
    });

    res.json({ message: 'Dívida deletada' });
  } catch (error) {
    console.error('Erro ao deletar dívida:', error);
    res.status(500).json({ error: 'Erro ao deletar dívida' });
  }
}

/**
 * Listar todos os devedores do sistema
 */
export async function getAllDebtors(req: AuthRequest, res: Response) {
  try {
    const { page = 1, limit = 50 } = req.query;

    const [debtors, total] = await Promise.all([
      prisma.debtor.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          usuario: { select: { nome: true, email: true } },
          _count: { select: { dividas: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.debtor.count(),
    ]);

    res.json({ debtors, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Erro ao listar devedores:', error);
    res.status(500).json({ error: 'Erro ao listar devedores' });
  }
}

/**
 * Listar logs de acesso ao sistema
 */
export async function getAccessLogs(req: AuthRequest, res: Response) {
  try {
    const { page = 1, limit = 50, userId, success, action } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (success !== undefined && success !== '') {
      where.success = success === 'true';
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.accessLog.count({ where }),
    ]);

    // Estatísticas rápidas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Promise.all([
      prisma.accessLog.count({ where: { criadoEm: { gte: today } } }),
      prisma.accessLog.count({ where: { success: true, criadoEm: { gte: today } } }),
      prisma.accessLog.count({ where: { success: false, criadoEm: { gte: today } } }),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      stats: {
        todayTotal: stats[0],
        todaySuccess: stats[1],
        todayFailed: stats[2],
      },
    });
  } catch (error) {
    console.error('Erro ao listar logs de acesso:', error);
    res.status(500).json({ error: 'Erro ao listar logs de acesso' });
  }
}

// ============================================
// FUNÇÕES DE EMAIL ADMIN
// ============================================

const sendEmailSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Selecione pelo menos um usuário'),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória'),
});

/**
 * Verificar status do serviço de email
 */
export async function getEmailStatus(req: AuthRequest, res: Response) {
  try {
    const configured = isEmailConfigured();

    if (!configured) {
      return res.json({
        configured: false,
        connected: false,
        message: 'Serviço de email não configurado. Configure EMAIL_USER e EMAIL_APP_PASSWORD.',
      });
    }

    const conexao = await testarConexaoEmail();

    res.json({
      configured: true,
      connected: conexao.sucesso,
      message: conexao.sucesso ? 'Conexão com servidor de email OK' : conexao.erro,
    });
  } catch (error) {
    console.error('Erro ao verificar status do email:', error);
    res.status(500).json({ error: 'Erro ao verificar status do email' });
  }
}

/**
 * Enviar email para usuários selecionados
 */
export async function sendEmailToUsers(req: AuthRequest, res: Response) {
  try {
    const { userIds, assunto, mensagem } = sendEmailSchema.parse(req.body);

    if (!isEmailConfigured()) {
      return res.status(503).json({
        error: 'Serviço de email não configurado',
      });
    }

    // Buscar usuários
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Nenhum usuário encontrado',
      });
    }

    // Enviar emails
    const resultados: Array<{
      userId: string;
      email: string;
      sucesso: boolean;
      erro?: string;
    }> = [];

    for (const user of users) {
      const resultado = await enviarMensagemAdmin(
        user.email,
        user.nome,
        assunto,
        mensagem
      );

      resultados.push({
        userId: user.id,
        email: user.email,
        sucesso: resultado.sucesso,
        erro: resultado.erro,
      });
    }

    const enviados = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    res.json({
      message: `Emails processados: ${enviados} enviados, ${falhas} falhas`,
      total: users.length,
      enviados,
      falhas,
      detalhes: resultados,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao enviar emails:', error);
    res.status(500).json({ error: 'Erro ao enviar emails' });
  }
}

/**
 * Enviar email para todos os usuários ativos
 */
export async function sendEmailToAllUsers(req: AuthRequest, res: Response) {
  try {
    const { assunto, mensagem } = z
      .object({
        assunto: z.string().min(1, 'Assunto é obrigatório'),
        mensagem: z.string().min(1, 'Mensagem é obrigatória'),
      })
      .parse(req.body);

    if (!isEmailConfigured()) {
      return res.status(503).json({
        error: 'Serviço de email não configurado',
      });
    }

    // Buscar todos os usuários ativos
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Nenhum usuário ativo encontrado',
      });
    }

    // Enviar emails em lotes para evitar sobrecarga
    const resultados: Array<{
      userId: string;
      email: string;
      sucesso: boolean;
      erro?: string;
    }> = [];

    for (const user of users) {
      const resultado = await enviarMensagemAdmin(
        user.email,
        user.nome,
        assunto,
        mensagem
      );

      resultados.push({
        userId: user.id,
        email: user.email,
        sucesso: resultado.sucesso,
        erro: resultado.erro,
      });

      // Pequeno delay para não sobrecarregar o SMTP
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const enviados = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    res.json({
      message: `Emails processados: ${enviados} enviados, ${falhas} falhas`,
      total: users.length,
      enviados,
      falhas,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao enviar emails:', error);
    res.status(500).json({ error: 'Erro ao enviar emails' });
  }
}