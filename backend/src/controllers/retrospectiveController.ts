import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const formatMoneyValue = (value: number) => Math.round(value * 100) / 100;

function getYearRange() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    start: new Date(now.getFullYear(), 0, 1),
    end: now,
  };
}

function getDebtFinancials(debt: {
  valorInicial: number;
  valorAtual: number;
  pagamentos: Array<{ valor: number }>;
}) {
  const totalPaid = debt.pagamentos.reduce((sum, payment) => sum + payment.valor, 0);
  const capitalRecovered = Math.min(totalPaid, debt.valorInicial);
  const expectedProfit = Math.max(0, debt.valorAtual - debt.valorInicial);
  const realizedProfit = Math.min(Math.max(0, totalPaid - debt.valorInicial), expectedProfit);
  const remainingProfit = Math.max(0, expectedProfit - realizedProfit);
  const remainingAmount = Math.max(0, debt.valorAtual - totalPaid);

  return {
    totalPaid,
    capitalRecovered,
    expectedProfit,
    realizedProfit,
    remainingProfit,
    remainingAmount,
  };
}

export async function getMidYearRetrospective(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { year, start, end } = getYearRange();

    const [user, debtors, debts, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { nome: true, criadoEm: true },
      }),
      prisma.debtor.findMany({
        where: {
          usuarioId: userId,
          ativo: true,
          criadoEm: { gte: start, lte: end },
        },
        orderBy: { criadoEm: 'asc' },
      }),
      prisma.debt.findMany({
        where: {
          usuarioId: userId,
          ativo: true,
          dataEmprestimo: { gte: start, lte: end },
        },
        include: {
          devedor: true,
          pagamentos: {
            where: { ativo: true },
            orderBy: { dataPagamento: 'asc' },
          },
        },
        orderBy: { dataEmprestimo: 'asc' },
      }),
      prisma.payment.findMany({
        where: {
          ativo: true,
          dataPagamento: { gte: start, lte: end },
          divida: { usuarioId: userId },
        },
        include: {
          divida: {
            include: {
              devedor: true,
            },
          },
        },
        orderBy: { dataPagamento: 'asc' },
      }),
    ]);

    const financials = debts.map(getDebtFinancials);
    const totalLent = debts.reduce((sum, debt) => sum + debt.valorInicial, 0);
    const totalCurrent = debts.reduce((sum, debt) => sum + debt.valorAtual, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.valor, 0);
    const capitalRecovered = financials.reduce((sum, item) => sum + item.capitalRecovered, 0);
    const realizedProfit = financials.reduce((sum, item) => sum + item.realizedProfit, 0);
    const expectedProfit = financials.reduce((sum, item) => sum + item.expectedProfit, 0);
    const remainingProfit = financials.reduce((sum, item) => sum + item.remainingProfit, 0);
    const overdueAmount = debts
      .filter((debt) => debt.status === 'ATRASADO')
      .reduce((sum, debt) => sum + getDebtFinancials(debt).remainingAmount, 0);

    const firstDebt = debts[0] || null;
    const firstDebtor = debtors[0] || null;
    const biggestDebt = [...debts].sort((a, b) => b.valorInicial - a.valorInicial)[0] || null;
    const firstPayment = payments[0] || null;
    const biggestPayment = [...payments].sort((a, b) => b.valor - a.valor)[0] || null;
    const paidDebts = debts.filter((debt) => debt.status === 'PAGO');
    const pendingDebts = debts.filter((debt) => debt.status === 'PENDENTE');
    const overdueDebts = debts.filter((debt) => debt.status === 'ATRASADO');

    const months = Array.from({ length: 12 }, (_, month) => ({
      month,
      debts: 0,
      payments: 0,
      lent: 0,
      paid: 0,
    }));

    debts.forEach((debt) => {
      const month = debt.dataEmprestimo.getMonth();
      months[month].debts += 1;
      months[month].lent += debt.valorInicial;
    });

    payments.forEach((payment) => {
      const month = payment.dataPagamento.getMonth();
      months[month].payments += 1;
      months[month].paid += payment.valor;
    });

    const strongestMonth =
      months
        .slice(0, end.getMonth() + 1)
        .filter((month) => month.debts > 0 || month.payments > 0)
        .sort((a, b) => b.lent + b.paid - (a.lent + a.paid))[0] || null;

    const debtorFrequency = new Map<string, { debtor: string; debts: number }>();
    debts.forEach((debt) => {
      const debtor = debt.devedor?.nome || 'Cliente sem nome';
      const current = debtorFrequency.get(debtor) || { debtor, debts: 0 };
      current.debts += 1;
      debtorFrequency.set(debtor, current);
    });

    const frequentDebtor =
      [...debtorFrequency.values()].sort((a, b) => b.debts - a.debts)[0] || null;

    const nextDueDebt =
      debts
        .filter((debt) => debt.status !== 'PAGO' && debt.dataVencimento >= end)
        .sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime())[0] || null;

    const oldestOverdueDebt =
      overdueDebts
        .slice()
        .sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime())[0] || null;

    res.json({
      year,
      period: {
        start,
        end,
      },
      user: {
        nome: user?.nome || 'Usuário',
        criadoEm: user?.criadoEm || null,
      },
      totals: {
        debtors: debtors.length,
        debts: debts.length,
        payments: payments.length,
        totalLent: formatMoneyValue(totalLent),
        totalCurrent: formatMoneyValue(totalCurrent),
        totalPaid: formatMoneyValue(totalPaid),
        capitalRecovered: formatMoneyValue(capitalRecovered),
        realizedProfit: formatMoneyValue(realizedProfit),
        expectedProfit: formatMoneyValue(expectedProfit),
        remainingProfit: formatMoneyValue(remainingProfit),
        paidDebts: paidDebts.length,
        pendingDebts: pendingDebts.length,
        overdueDebts: overdueDebts.length,
        overdueAmount: formatMoneyValue(overdueAmount),
      },
      moments: {
        firstDebt: firstDebt
          ? {
              date: firstDebt.dataEmprestimo,
              debtor: firstDebt.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(firstDebt.valorInicial),
            }
          : null,
        firstDebtor: firstDebtor
          ? {
              date: firstDebtor.criadoEm,
              debtor: firstDebtor.nome,
            }
          : null,
        biggestDebt: biggestDebt
          ? {
              date: biggestDebt.dataEmprestimo,
              debtor: biggestDebt.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(biggestDebt.valorInicial),
            }
          : null,
        firstPayment: firstPayment
          ? {
              date: firstPayment.dataPagamento,
              debtor: firstPayment.divida.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(firstPayment.valor),
            }
          : null,
        biggestPayment: biggestPayment
          ? {
              date: biggestPayment.dataPagamento,
              debtor: biggestPayment.divida.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(biggestPayment.valor),
            }
          : null,
        strongestMonth,
        frequentDebtor,
        nextDueDebt: nextDueDebt
          ? {
              date: nextDueDebt.dataVencimento,
              debtor: nextDueDebt.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(getDebtFinancials(nextDueDebt).remainingAmount),
            }
          : null,
        oldestOverdueDebt: oldestOverdueDebt
          ? {
              date: oldestOverdueDebt.dataVencimento,
              debtor: oldestOverdueDebt.devedor?.nome || 'Cliente sem nome',
              amount: formatMoneyValue(getDebtFinancials(oldestOverdueDebt).remainingAmount),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar retrospectiva de meio do ano:', error);
    res.status(500).json({ error: 'Erro ao gerar retrospectiva de meio do ano' });
  }
}
