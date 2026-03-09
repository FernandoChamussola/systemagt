import { Response } from 'express';
import { PrismaClient, SystemNoticePriority } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// ============ ADMIN FUNCTIONS ============

// Listar todos os avisos (admin)
export async function listAllNotices(req: AuthRequest, res: Response) {
  try {
    const { ativo, prioridade } = req.query;

    const where: any = {};
    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }
    if (prioridade) {
      where.prioridade = prioridade as SystemNoticePriority;
    }

    const notices = await prisma.systemNotice.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: {
          select: { leituras: true }
        }
      }
    });

    // Contar total de usuários para calcular percentual de leitura
    const totalUsers = await prisma.user.count({
      where: { role: 'USER', isActive: true }
    });

    const noticesWithStats = notices.map(notice => ({
      ...notice,
      totalLeituras: notice._count.leituras,
      totalUsuarios: totalUsers,
      percentualLeitura: totalUsers > 0
        ? Math.round((notice._count.leituras / totalUsers) * 100)
        : 0
    }));

    res.json({ notices: noticesWithStats });
  } catch (error) {
    console.error('Erro ao listar avisos:', error);
    res.status(500).json({ error: 'Erro ao listar avisos' });
  }
}

// Criar novo aviso (admin)
export async function createNotice(req: AuthRequest, res: Response) {
  try {
    const { titulo, conteudo, prioridade } = req.body;

    if (!titulo || !conteudo) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }

    const notice = await prisma.systemNotice.create({
      data: {
        titulo,
        conteudo,
        prioridade: prioridade || 'NORMAL',
      }
    });

    res.status(201).json({ notice });
  } catch (error) {
    console.error('Erro ao criar aviso:', error);
    res.status(500).json({ error: 'Erro ao criar aviso' });
  }
}

// Atualizar aviso (admin)
export async function updateNotice(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { titulo, conteudo, prioridade, ativo } = req.body;

    const notice = await prisma.systemNotice.findUnique({
      where: { id }
    });

    if (!notice) {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }

    const updatedNotice = await prisma.systemNotice.update({
      where: { id },
      data: {
        titulo: titulo !== undefined ? titulo : notice.titulo,
        conteudo: conteudo !== undefined ? conteudo : notice.conteudo,
        prioridade: prioridade !== undefined ? prioridade : notice.prioridade,
        ativo: ativo !== undefined ? ativo : notice.ativo,
      }
    });

    res.json({ notice: updatedNotice });
  } catch (error) {
    console.error('Erro ao atualizar aviso:', error);
    res.status(500).json({ error: 'Erro ao atualizar aviso' });
  }
}

// Deletar aviso (admin)
export async function deleteNotice(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const notice = await prisma.systemNotice.findUnique({
      where: { id }
    });

    if (!notice) {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }

    await prisma.systemNotice.delete({
      where: { id }
    });

    res.json({ message: 'Aviso removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar aviso:', error);
    res.status(500).json({ error: 'Erro ao deletar aviso' });
  }
}

// ============ USER FUNCTIONS ============

// Listar avisos para usuário (apenas ativos)
export async function listNoticesForUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const notices = await prisma.systemNotice.findMany({
      where: { ativo: true },
      orderBy: [
        { prioridade: 'desc' },
        { criadoEm: 'desc' }
      ],
      include: {
        leituras: {
          where: { usuarioId: userId },
          select: { lidoEm: true }
        }
      }
    });

    const noticesWithReadStatus = notices.map(notice => ({
      id: notice.id,
      titulo: notice.titulo,
      conteudo: notice.conteudo,
      prioridade: notice.prioridade,
      criadoEm: notice.criadoEm,
      lido: notice.leituras.length > 0,
      lidoEm: notice.leituras[0]?.lidoEm || null
    }));

    res.json({ notices: noticesWithReadStatus });
  } catch (error) {
    console.error('Erro ao listar avisos:', error);
    res.status(500).json({ error: 'Erro ao listar avisos' });
  }
}

// Contar avisos não lidos
export async function countUnreadNotices(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Total de avisos ativos
    const totalNotices = await prisma.systemNotice.count({
      where: { ativo: true }
    });

    // Avisos lidos pelo usuário
    const readNotices = await prisma.systemNoticeRead.count({
      where: {
        usuarioId: userId,
        aviso: { ativo: true }
      }
    });

    const unreadCount = totalNotices - readNotices;

    res.json({ unreadCount: Math.max(0, unreadCount) });
  } catch (error) {
    console.error('Erro ao contar avisos:', error);
    res.status(500).json({ error: 'Erro ao contar avisos' });
  }
}

// Marcar aviso como lido
export async function markNoticeAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notice = await prisma.systemNotice.findUnique({
      where: { id }
    });

    if (!notice) {
      return res.status(404).json({ error: 'Aviso não encontrado' });
    }

    // Usar upsert para evitar duplicatas
    await prisma.systemNoticeRead.upsert({
      where: {
        avisoId_usuarioId: {
          avisoId: id,
          usuarioId: userId
        }
      },
      update: {
        lidoEm: new Date()
      },
      create: {
        avisoId: id,
        usuarioId: userId
      }
    });

    res.json({ message: 'Aviso marcado como lido' });
  } catch (error) {
    console.error('Erro ao marcar aviso como lido:', error);
    res.status(500).json({ error: 'Erro ao marcar aviso como lido' });
  }
}

// Marcar todos os avisos como lidos
export async function markAllNoticesAsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Buscar todos os avisos ativos que o usuário ainda não leu
    const unreadNotices = await prisma.systemNotice.findMany({
      where: {
        ativo: true,
        leituras: {
          none: { usuarioId: userId }
        }
      },
      select: { id: true }
    });

    // Criar registros de leitura para todos
    if (unreadNotices.length > 0) {
      await prisma.systemNoticeRead.createMany({
        data: unreadNotices.map(notice => ({
          avisoId: notice.id,
          usuarioId: userId
        })),
        skipDuplicates: true
      });
    }

    res.json({ message: 'Todos os avisos marcados como lidos', count: unreadNotices.length });
  } catch (error) {
    console.error('Erro ao marcar avisos como lidos:', error);
    res.status(500).json({ error: 'Erro ao marcar avisos como lidos' });
  }
}
