import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const paymentSchema = z.object({
  dividaId: z.string().uuid('ID de dívida inválido'),
  valor: z.number().positive('Valor deve ser positivo'),
  dataPagamento: z.string().optional(),
  descricao: z.string().optional(),
});

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const data = paymentSchema.parse(req.body);

    // Verificar se a dívida pertence ao usuário
    const debt = await prisma.debt.findFirst({
      where: {
        id: data.dividaId,
        ativo: true,
        devedor: {
          usuarioId: req.userId!,
        },
      },
      include: {
        pagamentos: {
          where: { ativo: true },
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    // Calcular total já pago
    const totalPago = debt.pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const valorRestante = debt.valorAtual - totalPago;

    // Validar se o pagamento não excede o valor restante
    if (data.valor > valorRestante) {
      return res.status(400).json({
        error: `Valor do pagamento (${data.valor} MT) excede o valor restante (${valorRestante.toFixed(2)} MT)`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        dividaId: data.dividaId,
        valor: data.valor,
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : new Date(),
        descricao: data.descricao,
      },
    });

    // Calcular novo total pago
    const novoTotalPago = totalPago + data.valor;
    const novoValorRestante = debt.valorAtual - novoTotalPago;

    // Se quitou completamente, marcar como PAGO
    if (novoValorRestante <= 0.01) {
      await prisma.debt.update({
        where: { id: debt.id },
        data: { status: 'PAGO' },
      });
    }

    return res.status(201).json({ payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Erro ao criar pagamento:', error);
    return res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
}

export async function listPayments(req: AuthRequest, res: Response) {
  try {
    const { dividaId } = req.query;

    if (!dividaId) {
      return res.status(400).json({ error: 'ID da dívida é obrigatório' });
    }

    // Verificar se a dívida pertence ao usuário
    const debt = await prisma.debt.findFirst({
      where: {
        id: dividaId as string,
        devedor: {
          usuarioId: req.userId!,
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const payments = await prisma.payment.findMany({
      where: {
        dividaId: dividaId as string,
        ativo: true,
      },
      orderBy: {
        dataPagamento: 'desc',
      },
    });

    return res.json({ payments });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    return res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
}

export async function getPayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        ativo: true,
        divida: {
          devedor: {
            usuarioId: req.userId!,
          },
        },
      },
      include: {
        divida: {
          include: {
            devedor: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    return res.json({ payment });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return res.status(500).json({ error: 'Erro ao buscar pagamento' });
  }
}

export async function deletePayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        ativo: true,
        divida: {
          devedor: {
            usuarioId: req.userId!,
          },
        },
      },
      include: {
        divida: {
          include: {
            pagamentos: {
              where: { ativo: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Soft delete
    await prisma.payment.update({
      where: { id },
      data: { ativo: false },
    });

    // Recalcular status da dívida
    const totalPago = payment.divida.pagamentos
      .filter((p) => p.id !== id) // Excluir o pagamento deletado
      .reduce((sum, p) => sum + p.valor, 0);

    const valorRestante = payment.divida.valorAtual - totalPago;

    // Se ainda tem valor a pagar e estava PAGO, voltar para PENDENTE/ATRASADO
    if (valorRestante > 0.01 && payment.divida.status === 'PAGO') {
      const hoje = new Date();
      const novoStatus = hoje > payment.divida.dataVencimento ? 'ATRASADO' : 'PENDENTE';

      await prisma.debt.update({
        where: { id: payment.divida.id },
        data: { status: novoStatus },
      });
    }

    return res.json({ message: 'Pagamento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    return res.status(500).json({ error: 'Erro ao deletar pagamento' });
  }
}
