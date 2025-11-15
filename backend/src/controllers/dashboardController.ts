import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

function calcularJuros(valorInicial: number, taxaJuros: number): number {
  const jurosAcumulado = valorInicial * (taxaJuros / 100);
  return valorInicial + jurosAcumulado;
}

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    // 1. Total de devedores ativos
    const totalDevedores = await prisma.debtor.count({
      where: {
        usuarioId: userId,
        ativo: true,
      },
    });

    // 2. Buscar todas as dívidas ativas
    const dividasAtivas = await prisma.debt.findMany({
      where: {
        usuarioId: userId,
        ativo: true,
      },
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
    });

    // 3. Calcular estatísticas financeiras
    let valorTotalEmprestado = 0;
    let valorTotalAReceber = 0;
    let valorEmAtraso = 0;
    const hoje = new Date();

    dividasAtivas.forEach((divida) => {
      const valorComJuros = calcularJuros(divida.valorInicial, divida.taxaJuros);

      // Calcular total pago
      const totalPago = divida.pagamentos.reduce((sum: number, payment: any) => sum + payment.valor, 0);
      const valorRestante = valorComJuros - totalPago;

      valorTotalEmprestado += divida.valorInicial;

      // Apenas contar dívidas não pagas
      if (divida.status !== 'PAGO') {
        valorTotalAReceber += valorRestante;

        // Se estiver atrasada
        if (hoje > divida.dataVencimento && divida.status === 'ATRASADO') {
          valorEmAtraso += valorRestante;
        }
      }
    });

    // 4. Número de dívidas ativas (não pagas)
    const dividasAtivasCount = dividasAtivas.filter((d) => d.status !== 'PAGO').length;

    // 5. Dívidas próximas ao vencimento (próximos 7 dias)
    const seteDiasDepois = new Date();
    seteDiasDepois.setDate(hoje.getDate() + 7);

    const dividasProximasVencimento = await prisma.debt.findMany({
      where: {
        usuarioId: userId,
        ativo: true,
        status: { not: 'PAGO' },
        dataVencimento: {
          gte: hoje,
          lte: seteDiasDepois,
        },
      },
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

    // 6. Top 5 dívidas atrasadas
    const dividasAtrasadas = await prisma.debt.findMany({
      where: {
        usuarioId: userId,
        ativo: true,
        status: 'ATRASADO',
      },
      include: {
        devedor: true,
        pagamentos: {
          where: { ativo: true },
        },
      },
      orderBy: {
        dataVencimento: 'asc',
      },
      take: 5,
    });

    // Formatar dívidas próximas ao vencimento
    const dividasProximasFormatadas = dividasProximasVencimento.map((divida) => {
      const valorComJuros = calcularJuros(divida.valorInicial, divida.taxaJuros);
      const totalPago = divida.pagamentos.reduce((sum: number, payment: any) => sum + payment.valor, 0);
      const valorRestante = valorComJuros - totalPago;

      return {
        id: divida.id,
        devedorNome: divida.devedor.nome,
        devedorTelefone: divida.devedor.telefone,
        valorInicial: divida.valorInicial,
        valorTotal: valorComJuros,
        valorRestante,
        dataVencimento: divida.dataVencimento,
        diasParaVencer: Math.ceil((divida.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
        status: divida.status,
      };
    });

    // Formatar dívidas atrasadas
    const dividasAtrasadasFormatadas = dividasAtrasadas.map((divida) => {
      const valorComJuros = calcularJuros(divida.valorInicial, divida.taxaJuros);
      const totalPago = divida.pagamentos.reduce((sum: number, payment: any) => sum + payment.valor, 0);
      const valorRestante = valorComJuros - totalPago;

      return {
        id: divida.id,
        devedorNome: divida.devedor.nome,
        devedorTelefone: divida.devedor.telefone,
        valorInicial: divida.valorInicial,
        valorTotal: valorComJuros,
        valorRestante,
        dataVencimento: divida.dataVencimento,
        diasAtrasado: Math.ceil((hoje.getTime() - divida.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)),
        status: divida.status,
      };
    });

    // Estatísticas por status para gráfico
    const estatisticasPorStatus = {
      pendentes: dividasAtivas.filter((d) => d.status === 'PENDENTE').length,
      atrasadas: dividasAtivas.filter((d) => d.status === 'ATRASADO').length,
      pagas: dividasAtivas.filter((d) => d.status === 'PAGO').length,
    };

    res.json({
      resumo: {
        totalDevedores,
        totalEmprestado: valorTotalEmprestado,
        totalAReceber: valorTotalAReceber,
        valorEmAtraso: valorEmAtraso,
        dividasAtivas: dividasAtivasCount,
      },
      dividasProximasVencimento: dividasProximasFormatadas,
      dividasAtrasadas: dividasAtrasadasFormatadas,
      estatisticasPorStatus,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
  }
}
