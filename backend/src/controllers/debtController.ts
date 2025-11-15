import { Response } from 'express';
import { PrismaClient, DebtStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const debtSchema = z.object({
  devedorId: z.string().uuid('ID de devedor inválido'),
  valorInicial: z.number().positive('Valor inicial deve ser positivo'),
  taxaJuros: z.number().min(0, 'Taxa de juros não pode ser negativa'),
  dataVencimento: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data de vencimento inválida',
  }),
  notificacaoAuto: z.boolean().optional(),
  periodicidadeNotificacao: z.number().int().positive().optional(),
});

function calcularJuros(valorInicial: number, taxaJuros: number, dataEmprestimo: Date): number {
  // Juros simples fixo: valor = valorInicial + (valorInicial * taxa/100)
  // Exemplo: 100 MT com 50% = 100 + (100 * 0.5) = 150 MT
  const jurosAcumulado = valorInicial * (taxaJuros / 100);
  return valorInicial + jurosAcumulado;
}

function determinarStatus(dataVencimento: Date, status: DebtStatus): DebtStatus {
  if (status === 'PAGO') return 'PAGO';

  const hoje = new Date();
  if (hoje > dataVencimento) {
    return 'ATRASADO';
  }

  return 'PENDENTE';
}

export async function createDebt(req: AuthRequest, res: Response) {
  try {
    const data = debtSchema.parse(req.body);

    // Verificar se devedor pertence ao usuário
    const debtor = await prisma.debtor.findFirst({
      where: {
        id: data.devedorId,
        usuarioId: req.userId!,
        ativo: true,
      },
    });

    if (!debtor) {
      return res.status(404).json({ error: 'Devedor não encontrado' });
    }

    const dataVencimento = new Date(data.dataVencimento);
    const valorAtual = data.valorInicial;

    const debt = await prisma.debt.create({
      data: {
        usuarioId: req.userId!,
        devedorId: data.devedorId,
        valorInicial: data.valorInicial,
        valorAtual,
        taxaJuros: data.taxaJuros,
        dataVencimento,
        notificacaoAuto: data.notificacaoAuto || false,
        periodicidadeNotificacao: data.periodicidadeNotificacao,
      },
      include: {
        devedor: true,
      },
    });

    return res.status(201).json({ debt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar dívida:', error);
    return res.status(500).json({ error: 'Erro ao criar dívida' });
  }
}

export async function listDebts(req: AuthRequest, res: Response) {
  try {
    const { status, devedorId } = req.query;

    const where: any = {
      ativo: true,
      devedor: {
        usuarioId: req.userId!,
      },
    };

    if (status) {
      where.status = status;
    }

    if (devedorId) {
      where.devedorId = devedorId;
    }

    let debts = await prisma.debt.findMany({
      where,
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    // Atualizar valores e status
    debts = debts.map((debt) => {
      const valorAtualizado = calcularJuros(debt.valorInicial, debt.taxaJuros, debt.dataEmprestimo);
      const statusAtualizado = determinarStatus(debt.dataVencimento, debt.status);

      return {
        ...debt,
        valorAtual: valorAtualizado,
        status: statusAtualizado,
      };
    });

    // Atualizar no banco (async, sem aguardar)
    debts.forEach(async (debt) => {
      await prisma.debt.update({
        where: { id: debt.id },
        data: {
          valorAtual: debt.valorAtual,
          status: debt.status,
        },
      });
    });

    return res.json({ debts });
  } catch (error) {
    console.error('Erro ao listar dívidas:', error);
    return res.status(500).json({ error: 'Erro ao listar dívidas' });
  }
}

export async function getDebt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        devedor: {
          usuarioId: req.userId!,
        },
      },
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
          orderBy: {
            dataPagamento: 'desc',
          },
        },
        garantias: {
          where: { ativo: true },
          orderBy: {
            criadoEm: 'desc',
          },
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    // Atualizar valor e status
    const valorAtualizado = calcularJuros(debt.valorInicial, debt.taxaJuros, debt.dataEmprestimo);
    const statusAtualizado = determinarStatus(debt.dataVencimento, debt.status);

    const debtAtualizada = {
      ...debt,
      valorAtual: valorAtualizado,
      status: statusAtualizado,
    };

    // Atualizar no banco
    await prisma.debt.update({
      where: { id: debt.id },
      data: {
        valorAtual: valorAtualizado,
        status: statusAtualizado,
      },
    });

    return res.json({ debt: debtAtualizada });
  } catch (error) {
    console.error('Erro ao buscar dívida:', error);
    return res.status(500).json({ error: 'Erro ao buscar dívida' });
  }
}

export async function updateDebt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = debtSchema.parse(req.body);

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const dataVencimento = new Date(data.dataVencimento);

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        devedorId: data.devedorId,
        valorInicial: data.valorInicial,
        taxaJuros: data.taxaJuros,
        dataVencimento,
        notificacaoAuto: data.notificacaoAuto || false,
        periodicidadeNotificacao: data.periodicidadeNotificacao,
      },
      include: {
        devedor: true,
      },
    });

    return res.json({ debt: updatedDebt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao atualizar dívida:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
}

export async function increaseInterest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { novoJuros } = req.body;

    if (!novoJuros || novoJuros <= 0) {
      return res.status(400).json({ error: 'Novo juros deve ser maior que zero' });
    }

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        taxaJuros: novoJuros,
      },
      include: {
        devedor: true,
      },
    });

    return res.json({ debt: updatedDebt });
  } catch (error) {
    console.error('Erro ao aumentar juros:', error);
    return res.status(500).json({ error: 'Erro ao aumentar juros' });
  }
}

export async function markAsPaid(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        status: 'PAGO',
        valorAtual: 0,
      },
      include: {
        devedor: true,
      },
    });

    return res.json({ debt: updatedDebt });
  } catch (error) {
    console.error('Erro ao marcar como paga:', error);
    return res.status(500).json({ error: 'Erro ao marcar como paga' });
  }
}

export async function deleteDebt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    await prisma.debt.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({ message: 'Dívida removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover dívida:', error);
    return res.status(500).json({ error: 'Erro ao remover dívida' });
  }
}
